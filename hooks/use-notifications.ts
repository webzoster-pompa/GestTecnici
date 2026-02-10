import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Appointment, Customer } from "@/drizzle/schema";

interface AppointmentWithCustomer extends Appointment {
  customer?: Customer;
}

// Configurazione notifiche
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications(appointments: AppointmentWithCustomer[]) {
  useEffect(() => {
    if (Platform.OS === "web") return; // Le notifiche non funzionano sul web

    // Richiedi permessi notifiche
    requestPermissions();

    // Schedula notifiche per appuntamenti
    if (appointments && appointments.length > 0) {
      scheduleNotifications(appointments);
    }

    return () => {
      // Cleanup: cancella tutte le notifiche quando il componente si smonta
      Notifications.cancelAllScheduledNotificationsAsync();
    };
  }, [appointments]);

  const requestPermissions = async () => {
    if (Platform.OS === "web") return; // Le notifiche push non funzionano sul web

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permessi notifiche non concessi");
      return;
    }
  };

  const scheduleNotifications = async (appointments: AppointmentWithCustomer[]) => {
    if (Platform.OS === "web") return;

    // Cancella notifiche esistenti
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();

    for (const apt of appointments) {
      const aptDate = new Date(apt.scheduledDate);
      // Notifica 30 minuti prima
      const notificationTime = new Date(aptDate.getTime() - 30 * 60 * 1000);

      // Schedula solo se la notifica è nel futuro
      if (notificationTime > now) {
        const customerName = apt.customer
          ? `${apt.customer.firstName} ${apt.customer.lastName}`
          : "Cliente";
        const address = apt.customer?.address || "Indirizzo non disponibile";
        const city = apt.customer?.city || "";

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔔 Appuntamento tra 30 minuti",
            body: `${customerName} - ${address}, ${city}`,
            data: {
              appointmentId: apt.id,
              customerId: apt.customerId,
              address: address,
              city: city,
            },
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notificationTime },
        });
      }
    }
  };

  return {
    requestPermissions,
    scheduleNotifications,
  };
}
