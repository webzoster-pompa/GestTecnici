/**
 * Statistics Module
 * Calcola statistiche mensili per dashboard
 */

import * as db from "./db";

export interface MonthlyStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  completionRate: number;
  totalCustomers: number;
  averageDuration: number;
  appointmentsByTechnician: {
    technicianId: number;
    technicianName: string;
    count: number;
    completed: number;
  }[];
  comparisonWithPreviousMonth: {
    appointmentsDiff: number;
    completionRateDiff: number;
  };
}

/**
 * Calcola statistiche per un mese specifico
 */
export async function getMonthlyStatistics(year: number, month: number): Promise<MonthlyStats> {
  // Date range per il mese corrente
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Date range per il mese precedente
  const prevStartDate = new Date(year, month - 2, 1);
  const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59, 999);

  // Recupera tutti gli appuntamenti del mese
  const appointments = await db.getAllAppointments(startDate, endDate);
  const prevAppointments = await db.getAllAppointments(prevStartDate, prevEndDate);

  // Calcoli base (escludi appuntamenti cancellati dal totale)
  const activeAppointments = appointments.filter((apt) => apt.status !== "cancelled");
  const totalAppointments = activeAppointments.length;
  const completedAppointments = appointments.filter((apt) => apt.status === "completed").length;
  const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled").length;
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

  // Calcolo durata media (solo appuntamenti attivi)
  const totalDuration = activeAppointments.reduce((sum, apt) => sum + apt.duration, 0);
  const averageDuration = totalAppointments > 0 ? Math.round(totalDuration / totalAppointments) : 0;

  // Clienti unici serviti (solo appuntamenti attivi)
  const uniqueCustomerIds = new Set(activeAppointments.map((apt) => apt.customerId));
  const totalCustomers = uniqueCustomerIds.size;

  // Statistiche per tecnico
  const technicianStats = new Map<
    number,
    { technicianId: number; technicianName: string; count: number; completed: number }
  >();

  for (const apt of activeAppointments) {
    if (!technicianStats.has(apt.technicianId)) {
      const technician = await db.getTechnicianById(apt.technicianId);
      technicianStats.set(apt.technicianId, {
        technicianId: apt.technicianId,
        technicianName: technician
          ? `${technician.firstName} ${technician.lastName}`
          : "Sconosciuto",
        count: 0,
        completed: 0,
      });
    }

    const stats = technicianStats.get(apt.technicianId)!;
    stats.count++;
    if (apt.status === "completed") {
      stats.completed++;
    }
  }

  // Confronto con mese precedente
  const prevTotalAppointments = prevAppointments.length;
  const prevCompletedAppointments = prevAppointments.filter((apt) => apt.status === "completed").length;
  const prevCompletionRate =
    prevTotalAppointments > 0 ? (prevCompletedAppointments / prevTotalAppointments) * 100 : 0;

  const appointmentsDiff = totalAppointments - prevTotalAppointments;
  const completionRateDiff = completionRate - prevCompletionRate;

  return {
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    completionRate: Math.round(completionRate * 10) / 10,
    totalCustomers,
    averageDuration,
    appointmentsByTechnician: Array.from(technicianStats.values()),
    comparisonWithPreviousMonth: {
      appointmentsDiff,
      completionRateDiff: Math.round(completionRateDiff * 10) / 10,
    },
  };
}

/**
 * Calcola statistiche per singolo tecnico
 */
export async function getTechnicianStatistics(
  technicianId: number,
  year: number,
  month: number
): Promise<{
  totalAppointments: number;
  completedAppointments: number;
  completionRate: number;
  averageDuration: number;
}> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const appointments = await db.getAppointmentsByTechnician(technicianId, startDate, endDate);

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((apt) => apt.status === "completed").length;
  const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

  const totalDuration = appointments.reduce((sum, apt) => sum + apt.duration, 0);
  const averageDuration = totalAppointments > 0 ? Math.round(totalDuration / totalAppointments) : 0;

  return {
    totalAppointments,
    completedAppointments,
    completionRate: Math.round(completionRate * 10) / 10,
    averageDuration,
  };
}
