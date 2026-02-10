/**
 * Push Notifications Module
 * Gestisce invio notifiche push ai tecnici tramite Expo Push Notifications
 */

import { Expo, ExpoPushMessage } from "expo-server-sdk";

const expo = new Expo();

export interface PushNotificationData {
  appointmentId: number;
  type: "new" | "updated" | "cancelled" | "reminder";
  title: string;
  body: string;
}

/**
 * Invia notifica push a un tecnico
 */
export async function sendPushNotification(
  pushToken: string,
  data: PushNotificationData
): Promise<boolean> {
  // Verifica che il token sia valido
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} non è un token Expo valido`);
    return false;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: "default",
    title: data.title,
    body: data.body,
    data: {
      appointmentId: data.appointmentId,
      type: data.type,
    },
    badge: 1,
    priority: "high",
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Errore invio chunk notifiche:", error);
      }
    }

    // Verifica se ci sono errori nei ticket
    for (const ticket of tickets) {
      if (ticket.status === "error") {
        console.error(`Errore notifica: ${ticket.message}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Errore invio notifica push:", error);
    return false;
  }
}

/**
 * Invia notifica nuovo appuntamento
 */
export async function notifyNewAppointment(
  pushToken: string,
  appointmentId: number,
  customerName: string,
  scheduledDate: Date
): Promise<boolean> {
  const dateStr = scheduledDate.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return sendPushNotification(pushToken, {
    appointmentId,
    type: "new",
    title: "🆕 Nuovo Appuntamento",
    body: `${customerName} - ${dateStr}`,
  });
}

/**
 * Invia notifica modifica appuntamento
 */
export async function notifyAppointmentUpdated(
  pushToken: string,
  appointmentId: number,
  customerName: string,
  scheduledDate: Date
): Promise<boolean> {
  const dateStr = scheduledDate.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return sendPushNotification(pushToken, {
    appointmentId,
    type: "updated",
    title: "📝 Appuntamento Modificato",
    body: `${customerName} - Nuovo orario: ${dateStr}`,
  });
}

/**
 * Invia notifica cancellazione appuntamento
 */
export async function notifyAppointmentCancelled(
  pushToken: string,
  appointmentId: number,
  customerName: string
): Promise<boolean> {
  return sendPushNotification(pushToken, {
    appointmentId,
    type: "cancelled",
    title: "❌ Appuntamento Cancellato",
    body: `L'appuntamento con ${customerName} è stato cancellato`,
  });
}

/**
 * Invia promemoria 30 minuti prima
 */
export async function notifyAppointmentReminder(
  pushToken: string,
  appointmentId: number,
  customerName: string,
  address: string
): Promise<boolean> {
  return sendPushNotification(pushToken, {
    appointmentId,
    type: "reminder",
    title: "⏰ Promemoria Appuntamento",
    body: `Tra 30 minuti: ${customerName} - ${address}`,
  });
}
