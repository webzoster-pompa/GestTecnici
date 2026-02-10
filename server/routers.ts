import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { getDb } from "./db";
import { and, eq, ne, isNotNull, desc } from "drizzle-orm";
import { appointments, calls, customers } from "../drizzle/schema";
import { proposeOptimalSlots, geocodeAddress } from "./route-optimizer";
import { sendAppointmentNotifications } from "./notifications";
import { parseExcelFile, importCustomersFromExcel, generateExcelTemplate } from "./excel-import";
import { generateDailyPlanningPDF } from "./pdf-export";
import { getMonthlyStatistics, getTechnicianStatistics } from "./statistics";
import { generateCustomerHistoryPDF } from "./pdf-history-export";
import { generateFullDataExport } from "./excel-export";
import { generateCallsExport } from "./calls-export";
import { generateMonthlyReportHTML, sendMonthlyReport } from "./monthly-report";
import { createSelectiveBackup, backupAndDeleteCustomers } from "./selective-backup";
import { getActiveTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, replaceTemplateVariables, sendWhatsAppReminder } from "./whatsapp-templates";

export const appRouter = router({
  // WhatsApp Templates API
  whatsapp: router({
    getTemplates: publicProcedure.query(async () => {
      return getActiveTemplates();
    }),
    
    getTemplate: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getTemplateById(input.id);
      }),
    
    createTemplate: publicProcedure
      .input(z.object({
        name: z.string(),
        message: z.string(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return createTemplate(input);
      }),
    
    updateTemplate: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        message: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateTemplate(id, data);
        return { success: true };
      }),
    
    deleteTemplate: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTemplate(input.id);
        return { success: true };
      }),
    
    getPendingNotifications: publicProcedure
      .query(async () => {
        // TODO: Implementare query per appuntamenti con notifiche da inviare
        return [];
      }),
    
    sendTest: publicProcedure
      .input(z.object({ phone: z.string() }))
      .mutation(async ({ input }) => {
        // TODO: Implementare invio test WhatsApp
        console.log(`Test WhatsApp inviato a ${input.phone}`);
        return { success: true };
      }),
    
    saveConfig: publicProcedure
      .input(z.object({
        businessNumber: z.string(),
        apiKey: z.string(),
        enabled: z.boolean(),
        hoursBeforeReminder: z.number(),
      }))
      .mutation(async ({ input }) => {
        // TODO: Salvare configurazione WhatsApp nel database
        console.log("Configurazione WhatsApp salvata:", input);
        return { success: true };
      }),
  }),
  
  // Statistics API
  statistics: router({
    monthly: publicProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return getMonthlyStatistics(input.year, input.month);
      }),
    
    byTechnician: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ input }) => {
        return getTechnicianStatistics(input.technicianId, input.year, input.month);
      }),
    
    exportHistoryPDF: publicProcedure
      .input(z.object({
        customerId: z.number(),
      }))
      .query(async ({ input }) => {
        const html = await generateCustomerHistoryPDF(input.customerId);
        return { html };
      }),
    
    exportFullData: publicProcedure
      .query(async () => {
        const buffer = await generateFullDataExport();
        const base64 = buffer.toString("base64");
        return { data: base64 };
      }),
    
    monthlyReport: publicProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(),
      }))
      .query(async ({ input }) => {
        const html = await generateMonthlyReportHTML(input.year, input.month);
        return { html };
      }),
    
    selectiveBackup: publicProcedure
      .input(z.object({
        customerIds: z.array(z.number()),
        backupPath: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createSelectiveBackup(input.customerIds, input.backupPath);
      }),
    
    backupAndDelete: publicProcedure
      .input(z.object({
        customerIds: z.array(z.number()),
        backupPath: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await backupAndDeleteCustomers(input.customerIds, input.backupPath);
      }),
  }),
  
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Customers API
  customers: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(({ input }) => {
        return db.getAllCustomers(input?.limit, input?.offset);
      }),
    
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(({ input }) => {
        return db.searchCustomers(input.query);
      }),
    
    searchByPhone: publicProcedure
      .input(z.object({ phone: z.string() }))
      .query(({ input }) => {
        return db.searchCustomerByPhone(input.phone);
      }),
    
    checkDuplicate: publicProcedure
      .input(z.object({ phone: z.string(), email: z.string().optional() }))
      .query(({ input }) => {
        return db.checkDuplicateCustomer(input.phone, input.email);
      }),
    
    checkDuplicateByAddress: publicProcedure
      .input(z.object({ city: z.string(), address: z.string() }))
      .mutation(async ({ input }) => {
        console.log('[BACKEND] checkDuplicateByAddress chiamato');
        console.log('[BACKEND] city:', input.city);
        console.log('[BACKEND] address:', input.address);
        const result = await db.checkDuplicateByAddress(input.city, input.address);
        console.log('[BACKEND] result:', result);
        console.log('[BACKEND] result length:', result?.length || 0);
        return result;
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getCustomerById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        phone: z.string().min(1).max(20),
        email: z.string().optional().refine((val) => !val || val.includes('@'), {
          message: "Email non valida",
        }),
        address: z.string().min(1),
        city: z.string().min(1).max(100),
        postalCode: z.string().max(10).optional(),
        notes: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Se l'utente ha fornito coordinate manuali, usale; altrimenti geocodifica
        let finalLat = input.latitude?.toString();
        let finalLon = input.longitude?.toString();
        
        if (!finalLat || !finalLon) {
          // Geocodifica indirizzo solo se coordinate non fornite
          const coords = await geocodeAddress(`${input.address}, ${input.city}`);
          finalLat = coords?.lat.toString();
          finalLon = coords?.lon.toString();
        }
        
        const id = await db.createCustomer({
          ...input,
          latitude: finalLat,
          longitude: finalLon,
        });
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        phone: z.string().min(1).max(20).optional(),
        email: z.string().optional().refine((val) => !val || val.includes('@'), {
          message: "Email non valida",
        }),
        address: z.string().min(1).optional(),
        city: z.string().min(1).max(100).optional(),
        postalCode: z.string().max(10).optional(),
        province: z.string().max(2).optional(),
        zone: z.string().max(50).optional(),
        taxCode: z.string().max(16).optional(),
        vatNumber: z.string().max(20).optional(),
        iban: z.string().max(34).optional(),
        pec: z.string().optional(),
        sdiCode: z.string().max(7).optional(),
        referent: z.string().max(100).optional(),
        notes: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...inputData } = input;
        let data: any = { ...inputData };
        
        // Se l'utente ha fornito coordinate manuali, usale
        if (data.latitude !== undefined && data.longitude !== undefined) {
          data.latitude = data.latitude.toString();
          data.longitude = data.longitude.toString();
        }
        // Altrimenti, se indirizzo o città sono stati modificati, ricalcola coordinate
        else if (data.address || data.city) {
          const customer = await db.getCustomerById(id);
          if (customer) {
            const address = data.address || customer.address;
            const city = data.city || customer.city;
            const coords = await geocodeAddress(`${address}, ${city}`);
            if (coords) {
              data.latitude = coords.lat.toString();
              data.longitude = coords.lon.toString();
            }
          }
        }
        
        await db.updateCustomer(id, data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCustomer(input.id);
        return { success: true };
      }),
  }),

  // Technicians API
  technicians: router({
    list: publicProcedure.query(() => {
      return db.getAllTechnicians();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getTechnicianById(input.id);
      }),
    
    getByUserId: protectedProcedure.query(({ ctx }) => {
      return db.getTechnicianByUserId(ctx.user.id);
    }),
    
    create: publicProcedure
      .input(z.object({
        userId: z.number(),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        phone: z.string().min(1).max(20),
        email: z.string().optional().refine((val) => !val || val.includes('@'), {
          message: "Email non valida",
        }),
        skills: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTechnician(input);
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        phone: z.string().min(1).max(20).optional(),
        email: z.string().optional().refine((val) => !val || val.includes('@'), {
          message: "Email non valida",
        }),
        isActive: z.boolean().optional(),
        skills: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTechnician(id, data);
        return { success: true };
      }),
    
    updatePushToken: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        pushToken: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.updateTechnicianPushToken(input.technicianId, input.pushToken);
        return { success: true };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Simplified login - in production use proper password hashing
        const technicians = await db.getAllTechnicians();
        const technician = technicians.find(
          (t) => t.email?.toLowerCase() === input.email.toLowerCase()
        );
        
        if (technician) {
          return { success: true, technicianId: technician.id };
        }
        
        return { success: false, technicianId: null };
      }),
  }),

   // Excel import
  excel: router({
    parseFile: publicProcedure
      .input(z.object({
        fileBase64: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const rows = parseExcelFile(buffer);
        return { rows, count: rows.length };
      }),
    
    importCustomers: publicProcedure
      .input(z.object({
        fileBase64: z.string(),
        geocode: z.boolean().default(false),
        skipDuplicates: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const rows = parseExcelFile(buffer);
        const result = await importCustomersFromExcel(rows, {
          geocode: input.geocode,
          skipDuplicates: input.skipDuplicates,
        });
        return result;
      }),
    
    downloadTemplate: publicProcedure
      .query(() => {
        const buffer = generateExcelTemplate();
        return {
          base64: buffer.toString("base64"),
          filename: "template_clienti.xlsx",
        };
      }),
  }),

  // Appointments
  appointments: router({
    list: publicProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ input }) => {
        const appointments = await db.getAllAppointments(input?.startDate, input?.endDate);
        return appointments;
      }),
    
    getByTechnician: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(({ input }) => {
        return db.getAppointmentsByTechnician(
          input.technicianId,
          input.startDate,
          input.endDate
        );
      }),
    
    getByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(({ input }) => {
        return db.getAppointmentsByCustomer(input.customerId);
      }),
    
    getCustomerHistory: publicProcedure
      .input(z.object({
        customerId: z.number(),
        limit: z.number().optional().default(50),
        period: z.enum(["all", "last_month", "last_3_months", "last_year"]).optional().default("all"),
      }))
      .query(async ({ input }) => {
        let startDate: Date | undefined;
        const now = new Date();
        
        switch (input.period) {
          case "last_month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case "last_3_months":
            startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case "last_year":
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default:
            startDate = undefined;
        }
        
        // Recupera tutti gli appuntamenti del cliente
        let appointments = await db.getAppointmentsByCustomer(input.customerId);
        console.log(`[getCustomerHistory] Retrieved ${appointments.length} appointments for customer ${input.customerId}`);
        appointments.forEach((a, idx) => {
          console.log(`[getCustomerHistory] Appointment ${idx}:`, { id: a.id, idType: typeof a.id, invoiceNumber: a.invoiceNumber, invoiceStatus: a.invoiceStatus });
        });
        
        // Filtra per periodo se specificato
        if (startDate) {
          appointments = appointments.filter(apt => 
            new Date(apt.scheduledDate) >= startDate
          );
        }
        
        // Limita risultati
        return appointments.slice(0, input.limit);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getAppointmentById(input.id);
      }),
    
    getCustomerIdByAppointmentId: publicProcedure
      .input(z.object({ appointmentId: z.number() }))
      .query(async ({ input }) => {
        const appointment = await db.getAppointmentById(input.appointmentId);
        if (!appointment) {
          console.log(`[getCustomerIdByAppointmentId] Appointment ${input.appointmentId} not found`);
          return null;
        }
        console.log(`[getCustomerIdByAppointmentId] Appointment ${input.appointmentId} has customerId: ${appointment.customerId}`);
        return { appointmentId: appointment.id, customerId: appointment.customerId };
      }),
    
    create: publicProcedure
      .input(z.object({
        customerId: z.number(),
        technicianId: z.number(),
        scheduledDate: z.date(),
        duration: z.number().default(60),
        serviceType: z.string().max(100).optional(),
        notes: z.string().optional(),
        whatsappEnabled: z.boolean().optional(),
        whatsappTemplateId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        
        // Validazione sovrapposizioni
        const appointmentStart = new Date(input.scheduledDate);
        const appointmentEnd = new Date(appointmentStart);
        appointmentEnd.setMinutes(appointmentEnd.getMinutes() + input.duration);
        
        // Recupera tutti gli appuntamenti del tecnico per quel giorno
        const dayStart = new Date(appointmentStart);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(appointmentStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const existingAppointments = await db.getAppointmentsByTechnician(
          input.technicianId,
          dayStart,
          dayEnd
        );
        
        // Controlla sovrapposizioni
        for (const existing of existingAppointments) {
          const existingStart = new Date(existing.scheduledDate);
          const existingEnd = new Date(existingStart);
          existingEnd.setMinutes(existingEnd.getMinutes() + existing.duration);
          
          // Verifica se c'è sovrapposizione
          if (
            (appointmentStart >= existingStart && appointmentStart < existingEnd) ||
            (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
            (appointmentStart <= existingStart && appointmentEnd >= existingEnd)
          ) {
            throw new Error(
              `Sovrapposizione rilevata: il tecnico ha già un appuntamento alle ${existingStart.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
            );
          }
        }
        
        const id = await db.createAppointment(input);
        
        // Aggiorna stato chiamate aperte del cliente a "appointment_scheduled"
        const dbInstance = await getDb();
        await dbInstance
          .update(calls)
          .set({ 
            status: "appointment_scheduled",
            appointmentDate: input.scheduledDate,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(calls.customerId, input.customerId),
              ne(calls.status, "appointment_scheduled"),
              ne(calls.status, "completed")
            )
          );
        
        // Send notifications
        const appointment = await db.getAppointmentById(id);
        const customer = await db.getCustomerById(input.customerId);
        
        if (appointment && customer) {
          await sendAppointmentNotifications(appointment, customer);
        }
        
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        scheduledDate: z.date().optional(),
        duration: z.number().optional(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
        serviceType: z.string().max(100).optional(),
        notes: z.string().optional(),
        signatureUrl: z.string().optional(),
        signedAt: z.date().optional(),
        completedAt: z.date().optional(),
        confirmed: z.boolean().optional(),
        technicianId: z.number().optional(),
        // Timer fields
        checkInTime: z.date().optional(),
        checkInLatitude: z.string().optional(),
        checkInLongitude: z.string().optional(),
        checkOutTime: z.date().optional(),
        checkOutLatitude: z.string().optional(),
        checkOutLongitude: z.string().optional(),
        actualDuration: z.number().optional(),
        // Work details fields
        workDescription: z.string().optional(),
        laborPrice: z.number().optional(),
        partsPrice: z.number().optional(),
        partsCode: z.string().optional(),
        ivaRate: z.number().optional(),
        totalPrice: z.number().optional(),
        // Payment fields
        paymentMethod: z.enum(["cash", "pos", "transfer", "unpaid"]).optional(),
        paymentAmount: z.number().optional(),
        invoiceStatus: z.enum(["pending", "invoiced", "issued", "sent"]).optional(),
        invoiceNumber: z.string().optional(),
        invoicedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Force TypeScript to accept new fields (checkInTime, checkOutTime, actualDuration, paymentMethod, paymentAmount, invoiceStatus, invoiceNumber, invoicedAt)
        await db.updateAppointment(id, data as any);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAppointment(input.id);
        return { success: true };
      }),
    
    // Route optimization - propone 3 slot ottimali
    // Export PDF planning giornaliero
    exportDailyPDF: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        date: z.date(),
      }))
      .query(async ({ input }) => {
        const technician = await db.getTechnicianById(input.technicianId);
        if (!technician) {
          throw new Error("Technician not found");
        }
        
        // Recupera appuntamenti del giorno
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);
        
        const appointments = await db.getAppointmentsByTechnician(
          input.technicianId,
          startOfDay,
          endOfDay
        );
        
        // Arricchisci con dati clienti
        const appointmentsWithCustomers = await Promise.all(
          appointments.map(async (apt) => {
            const customer = await db.getCustomerById(apt.customerId);
            return {
              ...apt,
              customer: customer ? {
                firstName: customer.firstName,
                lastName: customer.lastName,
                address: customer.address,
                city: customer.city,
                phone: customer.phone,
                notes: customer.notes,
              } : {
                firstName: "Cliente",
                lastName: "Sconosciuto",
                address: "N/D",
                city: "N/D",
                phone: "N/D",
                notes: null,
              },
            };
          })
        );
        
        // Ordina per orario
        appointmentsWithCustomers.sort((a, b) => 
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
        
        const technicianName = `${technician.firstName} ${technician.lastName}`;
        const htmlContent = generateDailyPlanningPDF(
          technicianName,
          input.date,
          appointmentsWithCustomers
        );
        
        return { html: htmlContent };
      }),
    
    proposeSlots: publicProcedure
      .input(z.object({
        customerId: z.number(),
        preferredDate: z.date().optional(),
        duration: z.number().default(60),
        technicianId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        try {
          console.log('[proposeSlots] Starting for customer:', input.customerId);
          
          // Recupera dati cliente per coordinate
          const customer = await db.getCustomerById(input.customerId);
          if (!customer) {
            throw new Error("Customer not found");
          }
          console.log('[proposeSlots] Customer found:', customer.firstName, customer.lastName);
          
          // Se non ha coordinate, geocodifica
          let lat = customer.latitude ? Number(customer.latitude) : null;
          let lon = customer.longitude ? Number(customer.longitude) : null;
          console.log('[proposeSlots] Coordinates:', lat, lon);
          
          if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
            console.log('[proposeSlots] Geocoding address:', `${customer.address}, ${customer.city}`);
            const coords = await geocodeAddress(`${customer.address}, ${customer.city}`);
            if (coords) {
              lat = coords.lat;
              lon = coords.lon;
              // Aggiorna database
              await db.updateCustomer(customer.id, {
                latitude: lat.toString(),
                longitude: lon.toString(),
              });
              console.log('[proposeSlots] Geocoded:', lat, lon);
            } else {
              // Se geocoding fallisce, usa coordinate di default (centro Italia)
              // Gli slot saranno proposti ma senza ottimizzazione distanze
              console.warn('[proposeSlots] Geocoding failed, using default coordinates');
              lat = 42.0; // Latitudine centro Italia
              lon = 12.0; // Longitudine centro Italia
            }
          }
          
          // Recupera tecnici attivi
          let technicians = await db.getAllTechnicians();
          
          // Filtra per tecnico specifico se richiesto
          if (input.technicianId) {
            technicians = technicians.filter(t => t.id === input.technicianId);
            console.log('[proposeSlots] Filtered to technician:', input.technicianId);
          }
          
          console.log('[proposeSlots] Technicians found:', technicians.length);
          
          if (technicians.length === 0) {
            throw new Error('No technicians available');
          }
          
          // Calcola slot ottimali
          console.log('[proposeSlots] Calculating optimal slots...');
          const slots = await proposeOptimalSlots(
            lat,
            lon,
            technicians,
            input.preferredDate,
            input.duration
          );
          
          console.log('[proposeSlots] Slots found:', slots.length);
          return slots;
        } catch (error) {
          console.error('[proposeSlots] Error:', error);
          throw error;
        }
      }),
    
    listByTechnician: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input }) => {
        const start = new Date(input.startDate);
        const end = new Date(input.endDate);
        console.log('[listByTechnician] ===== DEBUG START =====');
        console.log('[listByTechnician] Tecnico:', input.technicianId);
        console.log('[listByTechnician] Start:', input.startDate, '→', start.toISOString());
        console.log('[listByTechnician] End:', input.endDate, '→', end.toISOString());
        const appointments = await db.getAppointmentsByTechnician(input.technicianId, start, end);
        console.log('[listByTechnician] Appuntamenti trovati:', appointments.length);
        if (appointments.length > 0) {
          console.log('[listByTechnician] Primo appuntamento:', {
            id: appointments[0].id,
            date: appointments[0].scheduledDate,
            customer: appointments[0].customerId
          });
        }
        console.log('[listByTechnician] ===== DEBUG END =====');
        
        // Arricchisci con dati clienti
        const appointmentsWithCustomers = await Promise.all(
          appointments.map(async (apt) => {
            const customer = await db.getCustomerById(apt.customerId);
            return {
              ...apt,
              customer: customer || null,
            };
          })
        );
        
        return appointmentsWithCustomers;
      }),
    
    checkIn: publicProcedure
      .input(z.object({
        appointmentId: z.number(),
        latitude: z.number(),
        longitude: z.number(),
      }))
      .mutation(async ({ input }) => {
        // TODO: Salvare check-in nel database con GPS e timestamp
        await db.updateAppointment(input.appointmentId, {
          status: 'in_progress',
          checkInTime: new Date(),
          checkInLatitude: input.latitude.toString(),
          checkInLongitude: input.longitude.toString(),
        });
        return { success: true };
      }),
    
    checkOut: publicProcedure
      .input(z.object({
        appointmentId: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        duration: z.number(),
        notes: z.string().optional(),
        photos: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // TODO: Salvare check-out nel database con GPS, durata e note
        await db.updateAppointment(input.appointmentId, {
          status: 'completed',
          checkOutTime: new Date(),
          checkOutLatitude: input.latitude.toString(),
          checkOutLongitude: input.longitude.toString(),
          actualDuration: input.duration,
          notes: input.notes,
        });
        
        // TODO: Salvare foto nel database
        if (input.photos && input.photos.length > 0) {
          for (const photo of input.photos) {
            await db.createDocument({
              customerId: 0, // TODO: Recuperare customerId dall'appuntamento
              appointmentId: input.appointmentId,
              type: 'photo',
              filename: `intervento_${input.appointmentId}_${Date.now()}.jpg`,
              fileUrl: photo,
            });
          }
        }
        
        return { success: true };
      }),
    
    complete: publicProcedure
      .input(z.object({
        appointmentId: z.number(),
        notes: z.string().optional(),
        photos: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // TODO: Completare intervento senza check-out (per interventi già iniziati)
        await db.updateAppointment(input.appointmentId, {
          status: 'completed',
          notes: input.notes,
        });
        
        // TODO: Salvare foto nel database
        if (input.photos && input.photos.length > 0) {
          for (const photo of input.photos) {
            await db.createDocument({
              customerId: 0, // TODO: Recuperare customerId dall'appuntamento
              appointmentId: input.appointmentId,
              type: 'photo',
              filename: `intervento_${input.appointmentId}_${Date.now()}.jpg`,
              fileUrl: photo,
            });
          }
        }
        
        return { success: true };
      }),
    
    getPendingInvoices: publicProcedure
      .query(async () => {
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new Error("Database not available");
        
        const result = await drizzleDb
          .select({
            id: appointments.id,
            customerId: appointments.customerId,
            technicianId: appointments.technicianId,
            status: appointments.status,
            completedAt: appointments.completedAt,
            paymentMethod: appointments.paymentMethod,
            workDescription: appointments.workDescription,
            laborPrice: appointments.laborPrice,
            partsPrice: appointments.partsPrice,
            partsCode: appointments.partsCode,
            ivaRate: appointments.ivaRate,
            totalPrice: appointments.totalPrice,
            invoiceStatus: appointments.invoiceStatus,
            invoiceNumber: appointments.invoiceNumber,
            invoicedAt: appointments.invoicedAt,
          })
          .from(appointments)
          .where(
            and(
              eq(appointments.status, "completed"),
              eq(appointments.invoiceStatus, "pending"),
              isNotNull(appointments.paymentMethod)
            )
          )
          .orderBy(desc(appointments.completedAt));
        
        // Arricchisci con dati cliente e tecnico
        console.log('[getPendingInvoices] Raw result from DB:', result.map(r => ({ id: r.id, totalPrice: r.totalPrice, laborPrice: r.laborPrice })));
        
        const enriched = await Promise.all(
          result.map(async (apt) => {
            const customer = await db.getCustomerById(apt.customerId);
            const technician = await db.getTechnicianById(apt.technicianId);
            return {
              ...apt,
              customer,
              technician,
            };
          })
        );
        
        console.log('[getPendingInvoices] Enriched result:', enriched.map(e => ({ id: e.id, totalPrice: e.totalPrice })));
        return enriched;
      }),
  }),

  // Notifications API
  notifications: router({
    getByAppointment: publicProcedure
      .input(z.object({ appointmentId: z.number() }))
      .query(({ input }) => {
        return db.getNotificationsByAppointment(input.appointmentId);
      }),
    
    create: publicProcedure
      .input(z.object({
        appointmentId: z.number(),
        type: z.enum(["email", "whatsapp", "push"]),
        recipient: z.string().min(1).max(320),
        subject: z.string().max(255).optional(),
        message: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createNotification(input);
        return { id };
      }),
  }),

  // Absences API - Gestione assenze tecnici (ferie, malattia, permessi)
  absences: router({
    list: publicProcedure
      .input(z.object({
        technicianId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        if (input.technicianId) {
          return db.getAbsencesByTechnician(input.technicianId, input.startDate, input.endDate);
        }
        return db.getAllAbsences(input.startDate, input.endDate);
      }),
    
    create: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        date: z.date(),
        reason: z.enum(["ferie", "malattia", "permesso"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAbsence(input);
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        reason: z.enum(["ferie", "malattia", "permesso"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAbsence(id, data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAbsence(input.id);
        return { success: true };
      }),
  }),

  // Equipments API
  equipments: router({
    listByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return db.getEquipmentsByCustomer(input.customerId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getEquipmentById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        customerId: z.number(),
        type: z.string().max(100),
        brand: z.string().max(100).optional(),
        model: z.string().max(100).optional(),
        serialNumber: z.string().max(100).optional(),
        installationDate: z.date().optional(),
        warrantyExpiry: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createEquipment(input);
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        type: z.string().max(100).optional(),
        brand: z.string().max(100).optional(),
        model: z.string().max(100).optional(),
        serialNumber: z.string().max(100).optional(),
        installationDate: z.date().optional(),
        warrantyExpiry: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEquipment(id, data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEquipment(input.id);
        return { success: true };
      }),
  }),



  // Contracts API
  contracts: router({
    listByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return db.getContractsByCustomer(input.customerId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getContractById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        customerId: z.number(),
        contractNumber: z.string().max(50),
        type: z.string().max(100),
        startDate: z.date(),
        endDate: z.date(),
        renewalDate: z.date().optional(),
        status: z.enum(["active", "expiring", "expired", "cancelled"]).default("active"),
        amount: z.string().optional(), // decimal as string
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createContract(input);
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        type: z.string().max(100).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        renewalDate: z.date().optional(),
        status: z.enum(["active", "expiring", "expired", "cancelled"]).optional(),
        amount: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateContract(id, data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContract(input.id);
        return { success: true };
      }),
  }),

  // Maintenance Books (Libretti Impianto) routes
  maintenanceBooks: router({
    listByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return db.getMaintenanceBooksByCustomer(input.customerId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getMaintenanceBookById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        customerId: z.number(),
        equipmentId: z.number().optional(),
        bookNumber: z.string().max(100),
        issueDate: z.date(),
        lastCheckDate: z.date().optional(),
        nextCheckDate: z.date(),
        status: z.enum(["ok", "expiring", "expired"]).default("ok"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMaintenanceBook(input);
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        equipmentId: z.number().optional(),
        bookNumber: z.string().max(100).optional(),
        issueDate: z.date().optional(),
        lastCheckDate: z.date().optional(),
        nextCheckDate: z.date().optional(),
        status: z.enum(["ok", "expiring", "expired"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateMaintenanceBook(id, data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMaintenanceBook(input.id);
        return { success: true };
      }),
    
    updateStatuses: publicProcedure
      .mutation(async () => {
        await db.updateMaintenanceBookStatuses();
        return { success: true };
      }),
  }),

  // Quotes (Preventivi) routes
  quotes: router({
    listByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return db.getQuotesByCustomer(input.customerId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getQuoteById(input.id);
      }),
    
    getWithItems: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getQuoteWithItems(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        customerId: z.number(),
        quoteNumber: z.string().max(50),
        date: z.date(),
        validUntil: z.date(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
        subtotal: z.string(), // decimal as string
        taxRate: z.string().default("22.00"),
        taxAmount: z.string(),
        totalAmount: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createQuote(input);
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        quoteNumber: z.string().max(50).optional(),
        date: z.date().optional(),
        validUntil: z.date().optional(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
        subtotal: z.string().optional(),
        taxRate: z.string().optional(),
        taxAmount: z.string().optional(),
        totalAmount: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateQuote(id, data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteQuote(input.id);
        return { success: true };
      }),
    
    // Quote Items
    createItem: publicProcedure
      .input(z.object({
        quoteId: z.number(),
        description: z.string().max(255),
        quantity: z.string().default("1.00"),
        unitPrice: z.string(),
        totalPrice: z.string(),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createQuoteItem(input);
        return { id };
      }),
    
    updateItem: publicProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().max(255).optional(),
        quantity: z.string().optional(),
        unitPrice: z.string().optional(),
        totalPrice: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateQuoteItem(id, data);
        return { success: true };
      }),
    
    deleteItem: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteQuoteItem(input.id);
        return { success: true };
      }),
  }),

  // Documents routes
  documents: router({
    listByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentsByCustomer(input.customerId);
      }),
    
    listByAppointment: publicProcedure
      .input(z.object({ appointmentId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentsByAppointment(input.appointmentId);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentById(input.id);
      }),
    
    create: publicProcedure
      .input(z.object({
        customerId: z.number(),
        appointmentId: z.number().optional(),
        type: z.enum(["photo", "certificate", "contract", "other"]),
        filename: z.string().max(255),
        fileUrl: z.string().max(500),
        fileSize: z.number().optional(),
        mimeType: z.string().max(100).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createDocument(input);
        return { id };
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["photo", "certificate", "contract", "other"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDocument(id, data);
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocument(input.id);
        return { success: true };
      }),
  }),

  // Time Entries API - Timbrature giornaliere
  timeEntries: router({
    // Configurazione sede
    getOfficeLocation: publicProcedure.query(() => {
      return {
        latitude: 45.7801155,
        longitude: 11.7564534,
        address: "Via Andrea Palladio 2, Romano d'Ezzelino",
        radiusMeters: 50,
      };
    }),

    // Crea timbratura con validazione GPS
    create: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        type: z.enum(["start_day", "start_break", "end_break", "end_day"]),
        latitude: z.number(),
        longitude: z.number(),
        remoteReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const officeLocation = {
          latitude: 45.7801155,
          longitude: 11.7564534,
        };
        const radiusMeters = 50;

        // Calcola distanza usando formula Haversine
        const R = 6371e3; // Raggio Terra in metri
        const φ1 = (officeLocation.latitude * Math.PI) / 180;
        const φ2 = (input.latitude * Math.PI) / 180;
        const Δφ = ((input.latitude - officeLocation.latitude) * Math.PI) / 180;
        const Δλ = ((input.longitude - officeLocation.longitude) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        const isRemote = distance > radiusMeters;

        // Se è remota, richiedi nota obbligatoria
        if (isRemote && !input.remoteReason) {
          throw new Error(
            `Timbratura fuori sede (${Math.round(distance)}m dalla sede). Inserisci il motivo.`
          );
        }

        // Crea timbratura
        const now = new Date();
        const id = await db.createTimeEntry({
          technicianId: input.technicianId,
          date: now,
          type: input.type,
          timestamp: now,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          isRemote,
          remoteReason: input.remoteReason || null,
        });

        return { id, distance: Math.round(distance), isRemote };
      }),

    // Lista timbrature giornaliere per tecnico
    listByTechnicianAndDate: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        date: z.date(),
      }))
      .query(async ({ input }) => {
        return db.getTimeEntriesByTechnicianAndDate(
          input.technicianId,
          input.date
        );
      }),

    // Report giornaliero con ore totali
    getDailyReport: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        date: z.date(),
      }))
      .query(async ({ input }) => {
        const entries = await db.getTimeEntriesByTechnicianAndDate(
          input.technicianId,
          input.date
        );

        // Calcola ore lavorate
        let startDay: Date | null = null;
        let endDay: Date | null = null;
        let breakStart: Date | null = null;
        let breakEnd: Date | null = null;
        let totalBreakMinutes = 0;

        for (const entry of entries) {
          if (entry.type === "start_day") startDay = entry.timestamp;
          if (entry.type === "end_day") endDay = entry.timestamp;
          if (entry.type === "start_break") breakStart = entry.timestamp;
          if (entry.type === "end_break") {
            breakEnd = entry.timestamp;
            if (breakStart) {
              totalBreakMinutes +=
                (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
              breakStart = null;
            }
          }
        }

        let totalMinutes = 0;
        let workedMinutes = 0;

        if (startDay && endDay) {
          totalMinutes = (endDay.getTime() - startDay.getTime()) / (1000 * 60);
          workedMinutes = totalMinutes - totalBreakMinutes;
        }

        return {
          entries,
          totalMinutes: Math.round(totalMinutes),
          workedMinutes: Math.round(workedMinutes),
          breakMinutes: Math.round(totalBreakMinutes),
          totalHours: (workedMinutes / 60).toFixed(2),
        };
      }),

    // Lista timbrature tempo reale (tutte le timbrature di oggi)
    listToday: publicProcedure.query(async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return db.getAllTimeEntriesToday(today);
    }),

    // Cancella timbratura
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTimeEntry(input.id);
        return { success: true };
      }),

    // Esporta report PDF giornaliero
    exportPDF: publicProcedure
      .input(z.object({
        technicianId: z.number(),
        date: z.date(),
      }))
      .query(async ({ input }) => {
        const { generateTimesheetHTML } = await import("./pdf-timesheet-export");
        
        // Recupera timbrature
        const entries = await db.getTimeEntriesByTechnicianAndDate(
          input.technicianId,
          input.date
        );
        
        // Calcola report
        let startDay: Date | null = null;
        let endDay: Date | null = null;
        let breakStart: Date | null = null;
        let breakEnd: Date | null = null;
        let totalBreakMinutes = 0;

        for (const entry of entries) {
          if (entry.type === "start_day") startDay = entry.timestamp;
          if (entry.type === "end_day") endDay = entry.timestamp;
          if (entry.type === "start_break") breakStart = entry.timestamp;
          if (entry.type === "end_break") {
            breakEnd = entry.timestamp;
            if (breakStart) {
              totalBreakMinutes +=
                (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
              breakStart = null;
            }
          }
        }

        let totalMinutes = 0;
        let workedMinutes = 0;

        if (startDay && endDay) {
          totalMinutes = (endDay.getTime() - startDay.getTime()) / (1000 * 60);
          workedMinutes = totalMinutes - totalBreakMinutes;
        }

        const report = {
          totalMinutes: Math.round(totalMinutes),
          workedMinutes: Math.round(workedMinutes),
          breakMinutes: Math.round(totalBreakMinutes),
          totalHours: (workedMinutes / 60).toFixed(2),
        };
        
        // Recupera tecnico
        const technician = await db.getTechnicianById(input.technicianId);
        if (!technician) {
          throw new Error("Tecnico non trovato");
        }

        // Genera HTML
        const html = generateTimesheetHTML(
          technician,
          input.date,
          entries,
          report
        );

        return { html };
      }),
  }),
  
  // Calls API - Gestione chiamate in arrivo
  calls: router({
    list: publicProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new Error("Database not initialized");
        const allCalls = await db.select().from(calls).orderBy(desc(calls.callDate));
        return allCalls;
      }),
    
    create: publicProcedure
      .input(z.object({
        customerId: z.number().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string(),
        customerAddress: z.string().optional(),
        customerCity: z.string().optional(),
        customerPostalCode: z.string().optional(),
        customerZone: z.string().optional(),
        devices: z.string().optional(),
        callType: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        technicianId: z.number().optional(),
        status: z.enum(["waiting_parts", "info_only", "completed", "appointment_scheduled"]).default("info_only"),
        appointmentDate: z.date().optional(),
        callDate: z.date(),
        userId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not initialized");
        
        console.log("[calls.create] Input ricevuto:", JSON.stringify(input, null, 2));
        
        try {
          // Drizzle gestisce automaticamente la conversione Date -> MySQL datetime
          const result = await db.insert(calls).values(input as any);
          console.log("[calls.create] Successo! ID:", result[0].insertId);
          return { id: result[0].insertId };
        } catch (error) {
          console.error("[calls.create] Errore database:", error);
          throw error;
        }
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        customerId: z.number().optional(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerAddress: z.string().optional(),
        customerCity: z.string().optional(),
        customerPostalCode: z.string().optional(),
        customerZone: z.string().optional(),
        devices: z.string().optional(),
        callType: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        technicianId: z.number().optional(),
        status: z.enum(["waiting_parts", "info_only", "completed", "appointment_scheduled"]).optional(),
        appointmentDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not initialized");
        const { id, ...data } = input;
        await db.update(calls).set(data).where(eq(calls.id, id));
        return { success: true };
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not initialized");
        await db.delete(calls).where(eq(calls.id, input.id));
        return { success: true };
      }),
    
    searchCustomerByPhone: publicProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not initialized");
        const customer = await db.select().from(customers).where(eq(customers.phone, input.phone)).limit(1);
        return customer[0] || null;
      }),
    
    searchCustomerByName: publicProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchCustomerByName(input.searchTerm);
      }),
    
    exportFiltered: publicProcedure
      .input(z.object({
        statusFilter: z.string().optional(),
        searchQuery: z.string().optional(),
        cityFilter: z.string().optional(),
        technicianFilter: z.union([z.number(), z.literal("all")]).optional(),
        showOpenOnly: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        const buffer = await generateCallsExport(input);
        return {
          base64: buffer.toString("base64"),
          filename: `Chiamate_${new Date().toISOString().split("T")[0]}.xlsx`,
        };
      }),
    
    deleteMultiple: publicProcedure
      .input(z.object({
        callIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not initialized");
        
        // Cancella tutte le chiamate selezionate
        for (const callId of input.callIds) {
          await db.delete(calls).where(eq(calls.id, callId));
        }
        
        return { success: true, deletedCount: input.callIds.length };
      }),
  }),

  // Payments API - Pagamenti clienti
  payments: router({
    create: publicProcedure
      .input(z.object({
        customerId: z.number(),
        appointmentId: z.number().optional(),
        amount: z.string(), // decimal stored as string
        paymentMethod: z.enum(["cash", "card", "bank_transfer", "other"]),
        paymentDate: z.string(), // ISO string date
        notes: z.string().optional(),
        technicianId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        // Convert ISO string to Date for database
        const paymentData = {
          ...input,
          paymentDate: new Date(input.paymentDate),
        };
        const id = await db.createPayment(paymentData);
        return { id };
      }),

    getByCustomer: publicProcedure
      .input(z.object({ customerId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentsByCustomer(input.customerId);
      }),

    getByAppointment: publicProcedure
      .input(z.object({ appointmentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPaymentsByAppointment(input.appointmentId);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePayment(input.id);
        return { success: true };
      }),
  }),

  // Intervention Types API - Tipi intervento personalizzabili
  interventionTypes: router({
    getAll: publicProcedure
      .query(async () => {
        return await db.getAllInterventionTypes();
      }),

    create: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(200),
      }))
      .mutation(async ({ input }) => {
        await db.createInterventionType(input);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInterventionType(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
