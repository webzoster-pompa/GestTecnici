import { CronJob } from "cron";
import { getDb } from "./db";
import { appointments, customers, whatsappTemplates } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Cron job per invio automatico promemoria WhatsApp 48h prima appuntamento
 * Esecuzione: ogni giorno alle 9:00
 */
export function startWhatsAppReminderCron() {
  const job = new CronJob(
    "0 9 * * *", // Ogni giorno alle 9:00
    async () => {
      console.log("[WhatsApp Reminder Cron] Avvio invio promemoria...");
      
      try {
        await sendWhatsAppReminders();
        console.log("[WhatsApp Reminder Cron] Invio completato");
      } catch (error) {
        console.error("[WhatsApp Reminder Cron] Errore:", error);
      }
    },
    null,
    true, // Start immediately
    "Europe/Rome" // Timezone italiano
  );

  console.log("[WhatsApp Reminder Cron] Job avviato - esecuzione ogni giorno alle 9:00");
  return job;
}

async function sendWhatsAppReminders() {
  const db = await getDb();
  if (!db) {
    console.error("[WhatsApp Reminder] Database non disponibile");
    return;
  }

  // Calcola range 48h (2 giorni esatti da ora)
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in48hPlus1h = new Date(in48h.getTime() + 60 * 60 * 1000); // +1h tolleranza

  console.log(`[WhatsApp Reminder] Cerco appuntamenti tra ${in48h.toISOString()} e ${in48hPlus1h.toISOString()}`);

  // Query appuntamenti da notificare
  const appointmentsToNotify = await db
    .select({
      appointment: appointments,
      customer: customers,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(
      and(
        eq(appointments.sendWhatsAppReminder, true),
        eq(appointments.whatsappReminderSent, false),
        gte(appointments.scheduledDate, in48h),
        lte(appointments.scheduledDate, in48hPlus1h)
      )
    );

  console.log(`[WhatsApp Reminder] Trovati ${appointmentsToNotify.length} appuntamenti da notificare`);

  for (const { appointment, customer } of appointmentsToNotify) {
    try {
      // Recupera template WhatsApp se specificato
      const appointmentDate = new Date(appointment.scheduledDate);
      const customerName = `${customer.firstName} ${customer.lastName}`;
      let messageText = `Gentile ${customerName}, le ricordiamo l'appuntamento del ${appointmentDate.toLocaleDateString("it-IT")} alle ${appointmentDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}. Grazie.`;

      if (appointment.whatsappTemplateId) {
        const template = await db
          .select()
          .from(whatsappTemplates)
          .where(eq(whatsappTemplates.id, appointment.whatsappTemplateId))
          .limit(1);

        if (template.length > 0) {
          messageText = template[0].message
            .replace("{nome_cliente}", customerName)
            .replace("{data}", appointmentDate.toLocaleDateString("it-IT"))
            .replace("{ora}", appointmentDate.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }));
        }
      }

      // Invia messaggio WhatsApp (integrazione da implementare)
      const success = await sendWhatsAppMessage(customer.phone, messageText);

      if (success) {
        // Aggiorna flag invio
        await db
          .update(appointments)
          .set({
            whatsappReminderSent: true,
            whatsappReminderSentAt: new Date(),
          })
          .where(eq(appointments.id, appointment.id));

        console.log(`[WhatsApp Reminder] ✅ Inviato a ${customerName} (${customer.phone})`);
      } else {
        console.error(`[WhatsApp Reminder] ❌ Fallito invio a ${customerName} (${customer.phone})`);
      }
    } catch (error) {
      const customerNameErr = `${customer.firstName} ${customer.lastName}`;
      console.error(`[WhatsApp Reminder] Errore invio a ${customerNameErr}:`, error);
    }
  }
}

/**
 * Funzione per invio messaggio WhatsApp
 * TODO: Integrare con servizio WhatsApp Business API o provider terzo (Twilio, MessageBird, etc.)
 */
async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  // Placeholder: implementare integrazione WhatsApp reale
  console.log(`[WhatsApp] Invio a ${phoneNumber}: ${message}`);
  
  // Simulazione invio (rimuovere in produzione)
  return true;
  
  // Esempio integrazione Twilio:
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken = process.env.TWILIO_AUTH_TOKEN;
  // const client = require('twilio')(accountSid, authToken);
  // 
  // try {
  //   await client.messages.create({
  //     from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
  //     to: `whatsapp:${phoneNumber}`,
  //     body: message
  //   });
  //   return true;
  // } catch (error) {
  //   console.error('Errore Twilio:', error);
  //   return false;
  // }
}
