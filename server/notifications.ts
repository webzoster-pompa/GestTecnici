import { Appointment, Customer } from "../drizzle/schema";
import { createNotification, updateNotification } from "./db";

// ==================== EMAIL NOTIFICATIONS ====================

/**
 * Invia email di conferma appuntamento
 * TODO: Implementare con servizio email reale (SendGrid, AWS SES, etc.)
 */
export async function sendAppointmentConfirmationEmail(
  appointment: Appointment,
  customer: Customer
): Promise<boolean> {
  const appointmentDate = new Date(appointment.scheduledDate);
  const subject = "Conferma Appuntamento";
  const message = `
Gentile ${customer.firstName} ${customer.lastName},

Confermiamo il tuo appuntamento per il giorno:

Data: ${appointmentDate.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })}
Ora: ${appointmentDate.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })}

Indirizzo: ${customer.address}, ${customer.city}

Riceverai un promemoria 24 ore prima dell'appuntamento.

Grazie per averci scelto!
  `.trim();

  try {
    // Log notification in database
    const notificationId = await createNotification({
      appointmentId: appointment.id,
      type: "email",
      recipient: customer.email || customer.phone,
      subject,
      message,
      status: "pending",
    });

    // TODO: Implement actual email sending
    console.log(`[EMAIL] Would send to ${customer.email}:`, subject);
    console.log(message);

    // Mark as sent
    await updateNotification(notificationId, {
      status: "sent",
      sentAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return false;
  }
}

/**
 * Invia email di promemoria 24h prima
 */
export async function sendAppointmentReminderEmail(
  appointment: Appointment,
  customer: Customer
): Promise<boolean> {
  const appointmentDate = new Date(appointment.scheduledDate);
  const subject = "Promemoria Appuntamento - Domani";
  const message = `
Gentile ${customer.firstName} ${customer.lastName},

Ti ricordiamo che domani hai un appuntamento:

Data: ${appointmentDate.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })}
Ora: ${appointmentDate.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })}

Indirizzo: ${customer.address}, ${customer.city}

Ti aspettiamo!
  `.trim();

  try {
    const notificationId = await createNotification({
      appointmentId: appointment.id,
      type: "email",
      recipient: customer.email || customer.phone,
      subject,
      message,
      status: "pending",
    });

    // TODO: Implement actual email sending
    console.log(`[EMAIL] Would send reminder to ${customer.email}:`, subject);

    await updateNotification(notificationId, {
      status: "sent",
      sentAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send reminder:", error);
    return false;
  }
}

// ==================== WHATSAPP NOTIFICATIONS ====================

/**
 * Invia messaggio WhatsApp di conferma appuntamento
 * TODO: Implementare con WhatsApp Business API
 */
export async function sendAppointmentConfirmationWhatsApp(
  appointment: Appointment,
  customer: Customer
): Promise<boolean> {
  const appointmentDate = new Date(appointment.scheduledDate);
  const message = `
Ciao ${customer.firstName}! 👋

Confermiamo il tuo appuntamento:

📅 ${appointmentDate.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
  })}
🕐 ${appointmentDate.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })}
📍 ${customer.address}, ${customer.city}

Ti invieremo un promemoria 24h prima.

Grazie! 🙏
  `.trim();

  try {
    const notificationId = await createNotification({
      appointmentId: appointment.id,
      type: "whatsapp",
      recipient: customer.phone,
      message,
      status: "pending",
    });

    // TODO: Implement actual WhatsApp sending
    // Options:
    // 1. WhatsApp Business API (official, requires approval)
    // 2. Twilio WhatsApp API
    // 3. Alternative services
    console.log(`[WHATSAPP] Would send to ${customer.phone}:`);
    console.log(message);

    await updateNotification(notificationId, {
      status: "sent",
      sentAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("[WHATSAPP] Failed to send:", error);
    return false;
  }
}

/**
 * Invia promemoria WhatsApp 24h prima
 */
export async function sendAppointmentReminderWhatsApp(
  appointment: Appointment,
  customer: Customer
): Promise<boolean> {
  const appointmentDate = new Date(appointment.scheduledDate);
  const message = `
Ciao ${customer.firstName}! 👋

Promemoria: domani hai un appuntamento!

📅 ${appointmentDate.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
  })}
🕐 ${appointmentDate.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  })}
📍 ${customer.address}, ${customer.city}

Ci vediamo domani! 🙏
  `.trim();

  try {
    const notificationId = await createNotification({
      appointmentId: appointment.id,
      type: "whatsapp",
      recipient: customer.phone,
      message,
      status: "pending",
    });

    console.log(`[WHATSAPP] Would send reminder to ${customer.phone}`);

    await updateNotification(notificationId, {
      status: "sent",
      sentAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("[WHATSAPP] Failed to send reminder:", error);
    return false;
  }
}

// ==================== NOTIFICATION SCHEDULER ====================

/**
 * Controlla appuntamenti e invia promemoria automatici
 * Da chiamare tramite cron job ogni ora
 */
export async function processScheduledNotifications() {
  // TODO: Implement cron job logic
  // 1. Query appointments in next 24-26 hours
  // 2. Check if reminder already sent
  // 3. Send email and WhatsApp reminders
  // 4. Query appointments in next 2-3 hours for final reminder
  
  console.log("[NOTIFICATIONS] Processing scheduled notifications...");
  
  // This would be called by a cron job or scheduler
  // For now, just a placeholder
}

/**
 * Invia tutte le notifiche per un appuntamento appena creato
 */
export async function sendAppointmentNotifications(
  appointment: Appointment,
  customer: Customer
): Promise<void> {
  // Send confirmation email
  if (customer.email) {
    await sendAppointmentConfirmationEmail(appointment, customer);
  }
  
  // Send confirmation WhatsApp
  await sendAppointmentConfirmationWhatsApp(appointment, customer);
}
