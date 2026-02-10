import { CronJob } from "cron";
import nodemailer from "nodemailer";

// Configurazione email (da personalizzare con credenziali reali)
const emailConfig = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "your-email@gmail.com",
    pass: process.env.SMTP_PASS || "your-app-password",
  },
};

const transporter = nodemailer.createTransport(emailConfig);

// Funzione per generare PDF timbrature mensili
async function generateMonthlyPDFs() {
  try {
    console.log("[Monthly Export] Inizio esportazione PDF mensile...");

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // TODO: Implementare fetch tecnici dal database
    // Per ora usa array vuoto come placeholder
    const technicians: any[] = [];

    for (const tech of technicians) {
      console.log(`[Monthly Export] Generazione PDF per ${tech.firstName} ${tech.lastName}...`);

      // TODO: Implementare generazione PDF
      const pdfResult = { html: "<h1>PDF Placeholder</h1>" };

      // Salva PDF su server (opzionale)
      const fs = require("fs");
      const path = require("path");
      const exportDir = path.join(process.cwd(), "exports", "timbrature");
      
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filename = `timbrature_${tech.firstName}_${tech.lastName}_${lastMonth.getFullYear()}_${String(lastMonth.getMonth() + 1).padStart(2, "0")}.html`;
      const filepath = path.join(exportDir, filename);
      
      fs.writeFileSync(filepath, pdfResult.html);
      console.log(`[Monthly Export] PDF salvato: ${filepath}`);

      // Invia email con PDF allegato
      const emailTo = process.env.TIMBRATURE_EMAIL_TO || tech.email || "admin@example.com";
      
      await transporter.sendMail({
        from: emailConfig.auth.user,
        to: emailTo,
        subject: `Timbrature ${tech.firstName} ${tech.lastName} - ${lastMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}`,
        text: `In allegato il report delle timbrature del mese di ${lastMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })} per ${tech.firstName} ${tech.lastName}.`,
        html: `
          <h2>Report Timbrature Mensili</h2>
          <p>Gentile ${tech.firstName} ${tech.lastName},</p>
          <p>In allegato trovi il report delle timbrature del mese di <strong>${lastMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}</strong>.</p>
          <p>Cordiali saluti,<br>Sistema Gestione Appuntamenti</p>
        `,
        attachments: [
          {
            filename: filename,
            content: pdfResult.html,
            contentType: "text/html",
          },
        ],
      });

      console.log(`[Monthly Export] Email inviata a ${emailTo}`);
    }

    console.log("[Monthly Export] Esportazione mensile completata!");
  } catch (error) {
    console.error("[Monthly Export] Errore durante esportazione:", error);
  }
}

// Schedula job: ultimo giorno del mese alle 23:59
// Formato cron: secondi minuti ore giorno-mese mese giorno-settimana
// "0 59 23 L * *" = alle 23:59 dell'ultimo giorno del mese
// Nota: "L" non è supportato da tutti i cron, usiamo alternativa
export function startMonthlyExportJob() {
  // Esegui alle 23:59 del giorno 28 di ogni mese (approssimazione ultimo giorno)
  const job = new CronJob(
    "0 59 23 28 * *", // Ogni 28 del mese alle 23:59
    generateMonthlyPDFs,
    null,
    true,
    "Europe/Rome"
  );

  console.log("[Monthly Export] Job schedulato: esportazione PDF ultimo giorno mese alle 23:59");
  
  return job;
}
