import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { startMonthlyExportJob } from "../jobs/monthly-export";
import { startWhatsAppReminderCron } from "../cron-whatsapp-reminders";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log(`[CORS] Request from origin: ${origin}, path: ${req.path}`);
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      console.log(`[CORS] Setting Access-Control-Allow-Origin: ${origin}`);
    } else {
      console.log(`[CORS] No origin header found`);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // REST endpoint for generating invoice PDF
  app.get("/api/invoices/:appointmentId/pdf", async (req, res) => {
    try {
      const { appointmentId } = req.params;
      console.log(`[PDF] Generating PDF for appointment: ${appointmentId}`);
      console.log(`[PDF] appointmentId type: ${typeof appointmentId}, value: "${appointmentId}"`);
      const parsedId = parseInt(appointmentId);
      console.log(`[PDF] Parsed ID: ${parsedId}, type: ${typeof parsedId}`);
      const { generateInvoicePDF } = await import("../invoice-generator");
      const { getDb } = await import("../db");
      const { appointments, customers, technicians } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const drizzleDb = await getDb();
      if (!drizzleDb) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      // Get appointment data
      console.log(`[PDF] Querying database for appointment with ID: ${parsedId}`);
      const appointment = await drizzleDb
        .select()
        .from(appointments)
        .where(eq(appointments.id, parsedId))
        .leftJoin(customers, eq(appointments.customerId, customers.id))
        .leftJoin(technicians, eq(appointments.technicianId, technicians.id))
        .limit(1);

      console.log(`[PDF] Query returned ${appointment.length} results`);
      if (appointment.length > 0) {
        console.log(`[PDF] First result:`, JSON.stringify(appointment[0], null, 2));
      }
      if (!appointment || appointment.length === 0) {
        console.error(`[PDF] Appointment not found for ID: ${appointmentId}`);
        res.status(404).json({ error: "Appointment not found" });
        return;
      }
      
      console.log(`[PDF] Appointment found:`, appointment[0].appointments);

      const apt = appointment[0];
      const invoiceData = {
        invoiceNumber: apt.appointments.invoiceNumber || `FAT-${apt.appointments.id}`,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        customer: {
          firstName: apt.customers?.firstName || "",
          lastName: apt.customers?.lastName || "",
          address: apt.customers?.address || "",
          city: apt.customers?.city || "",
          zipCode: apt.customers?.postalCode || "",
          phone: apt.customers?.phone || "",
          email: apt.customers?.email || "",
        },
        technician: {
          firstName: apt.technicians?.firstName || "",
          lastName: apt.technicians?.lastName || "",
        },
        appointment: {
          workDescription: apt.appointments.workDescription || "",
          laborPrice: parseFloat(apt.appointments.laborPrice?.toString() || "0"),
          partsPrice: parseFloat(apt.appointments.partsPrice?.toString() || "0"),
          ivaRate: apt.appointments.ivaRate || 22,
          totalPrice: parseFloat(apt.appointments.totalPrice?.toString() || "0"),
          completedAt: apt.appointments.completedAt || new Date(),
          actualDuration: apt.appointments.actualDuration || 0,
        },
        companyInfo: {
          name: "Gestione Appuntamenti Tecnici",
          address: "Via Roma 1",
          city: "Milano",
          phone: "+39 02 1234 5678",
          email: "info@example.com",
          vatNumber: "IT12345678901",
        },
      };

      console.log(`[PDF] Generating PDF with data:`, invoiceData);
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      console.log(`[PDF] PDF generated, size: ${pdfBuffer.length} bytes`);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${invoiceData.invoiceNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[PDF] Error generating invoice PDF:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate invoice PDF" });
    }
  });

  // REST endpoint for pending invoices (bypasses TRPC auth issues)
  app.get("/api/invoices/pending", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const { appointments } = await import("../../drizzle/schema");
      const { and, eq, isNotNull, desc } = await import("drizzle-orm");
      const dbModule = await import("../db");
      const db = dbModule;

      const drizzleDb = await getDb();
      if (!drizzleDb) {
        res.status(500).json({ error: "Database not available" });
        return;
      }

      const result = await drizzleDb
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.status, "completed"),
            eq(appointments.invoiceStatus, "pending"),
            isNotNull(appointments.paymentMethod)
          )
        )
        .orderBy(desc(appointments.completedAt));

      const enriched = await Promise.all(
        result.map(async (apt) => {
          const customer = await db.getCustomerById(apt.customerId);
          const technician = await db.getTechnicianById(apt.technicianId);
          return { ...apt, customer, technician };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("[REST] Error fetching pending invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    
    // Avvia job esportazione mensile PDF
    startMonthlyExportJob();
    
    // Avvia cron job promemoria WhatsApp 48h prima
    startWhatsAppReminderCron();
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
