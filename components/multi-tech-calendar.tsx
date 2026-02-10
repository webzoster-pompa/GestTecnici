"use client";

import { useState, useEffect, DragEvent } from "react";
import { trpc } from "@/lib/trpc";

interface Appointment {
  id: number;
  customerId: number;
  technicianId: number;
  scheduledDate: Date;
  duration: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  serviceType: string | null;
  notes: string | null;
  customer?: {
    firstName: string;
    lastName: string;
    city: string;
    phone: string;
  };
  technician?: {
    firstName: string;
    lastName: string;
  };
}

type ViewMode = "month" | "week" | "list" | "day";

interface MultiTechCalendarProps {
  onCustomerClick?: (customerId: number, customerName: string) => void;
}

export function MultiTechCalendar({ onCustomerClick }: MultiTechCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const trpcClient = trpc.useContext();

  // Carica appuntamenti della settimana
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const { data: aptData, refetch } = trpc.appointments.list.useQuery({
    startDate: currentWeekStart,
    endDate: weekEnd,
  });

  useEffect(() => {
    if (aptData) {
      setAppointments(aptData as Appointment[]);
    }
  }, [aptData]);

  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      refetch();
      showToast("Appuntamento aggiornato!");
    },
    onError: () => {
      showToast("Errore aggiornamento", true);
    },
  });

  const showToast = (message: string, isError = false) => {
    console.log(message);
  };

  // Giorni della settimana
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Ore lavorative (7:00 - 19:00)
  const workHours = Array.from({ length: 13 }, (_, i) => i + 7);

  const handlePreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const handleToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const getAppointmentsForSlot = (dayIndex: number, hour: number) => {
    const targetDate = weekDays[dayIndex];
    
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledDate);
      
      // Stesso giorno
      if (aptDate.toDateString() !== targetDate.toDateString()) return false;
      
      // Appuntamento inizia in questa ora
      return aptDate.getHours() === hour;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "#0066CC";
      case "in_progress":
        return "#FFA500";
      case "completed":
        return "#00CC66";
      case "cancelled":
        return "#CC0000";
      default:
        return "#999999";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Programmato";
      case "in_progress":
        return "In corso";
      case "completed":
        return "Completato";
      case "cancelled":
        return "Cancellato";
      default:
        return status;
    }
  };

  const getTechnicianInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, appointmentId: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("appointmentId", appointmentId.toString());
    setDraggedAppointmentId(appointmentId);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoveredSlot(slotKey);
  };

  const handleDragLeave = () => {
    setHoveredSlot(null);
  };

  const handleDrop = async (
    e: DragEvent<HTMLDivElement>,
    dayIndex: number,
    hour: number
  ) => {
    e.preventDefault();
    setHoveredSlot(null);
    setDraggedAppointmentId(null);

    const appointmentId = parseInt(e.dataTransfer.getData("appointmentId"));
    const appointment = appointments.find((a) => a.id === appointmentId);

    if (!appointment) return;

    const targetDate = weekDays[dayIndex];
    const newDate = new Date(targetDate);
    newDate.setHours(hour, 0, 0, 0);

    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        scheduledDate: newDate,
      });
    } catch (error) {
      console.error("Errore spostamento:", error);
    }
  };

  const handleDragEnd = () => {
    setDraggedAppointmentId(null);
    setHoveredSlot(null);
  };

  const isHoliday = (date: Date) => {
    if (date.getDay() === 0) return true;
    
    const italianHolidays = [
      { month: 0, day: 1 },
      { month: 0, day: 6 },
      { month: 3, day: 25 },
      { month: 4, day: 1 },
      { month: 5, day: 2 },
      { month: 7, day: 15 },
      { month: 10, day: 1 },
      { month: 11, day: 8 },
      { month: 11, day: 25 },
      { month: 11, day: 26 },
    ];
    
    const month = date.getMonth();
    const day = date.getDate();
    return italianHolidays.some(h => h.month === month && h.day === day);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#fff", borderRadius: "12px", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={handlePreviousWeek} style={{ padding: "8px 16px", backgroundColor: "#f5f5f5", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            ← Precedente
          </button>
          <button onClick={handleToday} style={{ padding: "8px 16px", backgroundColor: "#0066CC", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
            Oggi
          </button>
          <button onClick={handleNextWeek} style={{ padding: "8px 16px", backgroundColor: "#f5f5f5", border: "1px solid #E5E7EB", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}>
            Successivo →
          </button>
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
          {currentWeekStart.toLocaleDateString("it-IT", { day: "numeric", month: "numeric" })} -{" "}
          {weekEnd.toLocaleDateString("it-IT", { day: "numeric", month: "numeric", year: "numeric" })}
        </h2>

        {/* Toggle Vista */}
        <div style={{ display: "flex", gap: "5px", backgroundColor: "#f5f5f5", borderRadius: "6px", padding: "4px" }}>
          {(["month", "week", "list", "day"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                padding: "6px 12px",
                backgroundColor: viewMode === mode ? "#0066CC" : "transparent",
                color: viewMode === mode ? "#fff" : "#666",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: viewMode === mode ? "600" : "normal",
              }}
            >
              {mode === "month" ? "Mese" : mode === "week" ? "Settimana" : mode === "list" ? "Lista" : "Giorno"}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda Stati */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "15px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "6px" }}>
        {["scheduled", "in_progress", "completed", "cancelled"].map((status) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "16px", height: "16px", backgroundColor: getStatusColor(status), borderRadius: "3px" }} />
            <span style={{ fontSize: "13px", color: "#666" }}>{getStatusLabel(status)}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid - Solo vista settimana per ora */}
      {viewMode === "week" && (
        <div style={{ flex: 1, overflow: "auto", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", top: 0, left: 0, zIndex: 3, width: "60px", backgroundColor: "#f5f5f5", borderRight: "1px solid #E5E7EB", borderBottom: "2px solid #E5E7EB" }} />
                {weekDays.map((day, index) => {
                  const holiday = isHoliday(day);
                  return (
                    <th
                      key={index}
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        minWidth: "140px",
                        padding: "12px 8px",
                        backgroundColor: holiday ? "#FFE5E5" : "#f5f5f5",
                        borderRight: "1px solid #E5E7EB",
                        borderBottom: "2px solid #E5E7EB",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: holiday ? "#CC0000" : "#666", marginBottom: "4px" }}>
                        {day.toLocaleDateString("it-IT", { weekday: "short" })}
                      </div>
                      <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                        {day.getDate()}/{day.getMonth() + 1}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {workHours.map((hour) => (
                <tr key={hour}>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, width: "60px", padding: "8px", backgroundColor: "#f5f5f5", borderRight: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB", textAlign: "center", fontSize: "14px", color: "#666" }}>
                    {hour}:00
                  </td>
                  {weekDays.map((day, dayIndex) => {
                    const slotKey = `${dayIndex}-${hour}`;
                    const slotAppointments = getAppointmentsForSlot(dayIndex, hour);
                    const isHovered = hoveredSlot === slotKey;
                    const holiday = isHoliday(day);

                    return (
                      <td
                        key={dayIndex}
                        style={{
                          minWidth: "140px",
                          minHeight: "80px",
                          padding: "4px",
                          borderRight: "1px solid #E5E7EB",
                          borderBottom: "1px solid #E5E7EB",
                          backgroundColor: holiday ? "#FFE5E5" : (isHovered ? "#0066CC20" : "transparent"),
                          verticalAlign: "top",
                        }}
                        onDragOver={(e) => handleDragOver(e, slotKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, dayIndex, hour)}
                      >
                        {slotAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, apt.id)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              // Non aprire se sta trascinando
                              if (draggedAppointmentId) return;
                              if (apt.customer && onCustomerClick) {
                                onCustomerClick(
                                  apt.customerId,
                                  `${apt.customer.firstName} ${apt.customer.lastName}`
                                );
                              }
                            }}
                            style={{
                              padding: "6px",
                              marginBottom: "4px",
                              borderRadius: "4px",
                              backgroundColor: getStatusColor(apt.status) + "20",
                              borderLeft: `3px solid ${getStatusColor(apt.status)}`,
                              cursor: "pointer",
                              opacity: draggedAppointmentId === apt.id ? 0.5 : 1,
                              position: "relative",
                            }}
                          >
                            {/* Badge Tecnico */}
                            {apt.technician && (
                              <div style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                backgroundColor: getStatusColor(apt.status),
                                color: "#fff",
                                fontSize: "9px",
                                fontWeight: "bold",
                                padding: "2px 4px",
                                borderRadius: "3px",
                              }}>
                                {getTechnicianInitials(apt.technician.firstName, apt.technician.lastName)}
                              </div>
                            )}

                            <div style={{ fontSize: "11px", fontWeight: "600", color: getStatusColor(apt.status), marginBottom: "3px" }}>
                              {new Date(apt.scheduledDate).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} ({apt.duration}min)
                            </div>

                            {apt.customer && (
                              <>
                                <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "2px", paddingRight: "20px" }}>
                                  {apt.customer.firstName} {apt.customer.lastName}
                                </div>
                                <div style={{ fontSize: "10px", color: "#666" }}>
                                  📍 {apt.customer.city}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Placeholder altre viste */}
      {viewMode !== "week" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E5E7EB", borderRadius: "8px", backgroundColor: "#f5f5f5" }}>
          <p style={{ fontSize: "16px", color: "#666" }}>
            Vista {viewMode === "month" ? "Mese" : viewMode === "list" ? "Lista" : "Giorno"} in arrivo...
          </p>
        </div>
      )}
    </div>
  );
}
