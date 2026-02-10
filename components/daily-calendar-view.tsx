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
}

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
}

export function DailyCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const trpcClient = trpc.useContext();

  // Carica tecnici
  const { data: techData } = trpc.technicians.list.useQuery();

  useEffect(() => {
    if (techData) {
      setTechnicians(techData);
    }
  }, [techData]);

  // Carica appuntamenti del giorno
  const { data: aptData, refetch } = trpc.appointments.list.useQuery({
    startDate: new Date(currentDate.setHours(0, 0, 0, 0)),
    endDate: new Date(currentDate.setHours(23, 59, 59, 999)),
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
    // Toast placeholder
    console.log(message);
  };

  // Ore lavorative (8:00 - 18:00)
  const workHours = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  });

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentsForSlot = (technicianId: number, timeSlot: string) => {
    const [slotHour, slotMinute] = timeSlot.split(":").map(Number);
    
    return appointments.filter((apt) => {
      if (apt.technicianId !== technicianId) return false;
      
      const aptDate = new Date(apt.scheduledDate);
      const aptHour = aptDate.getHours();
      const aptMinute = aptDate.getMinutes();
      
      // Slot da 30 minuti
      const slotStart = slotHour * 60 + slotMinute;
      const slotEnd = slotStart + 30;
      const aptStart = aptHour * 60 + aptMinute;
      const aptEnd = aptStart + apt.duration;
      
      // Appuntamento si sovrappone allo slot
      return aptStart < slotEnd && aptEnd > slotStart;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "#0066CC"; // Blu - Programmato
      case "in_progress":
        return "#FFA500"; // Arancione - In corso
      case "completed":
        return "#00CC66"; // Verde - Completato
      case "cancelled":
        return "#CC0000"; // Rosso - Cancellato
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
    technicianId: number,
    timeSlot: string
  ) => {
    e.preventDefault();
    setHoveredSlot(null);
    setDraggedAppointmentId(null);

    const appointmentId = parseInt(e.dataTransfer.getData("appointmentId"));
    const appointment = appointments.find((a) => a.id === appointmentId);

    if (!appointment) return;

    const [hour, minute] = timeSlot.split(":").map(Number);
    const newDate = new Date(currentDate);
    newDate.setHours(hour, minute, 0, 0);

    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        technicianId,
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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#fff", borderRadius: "12px", padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={handlePreviousDay}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ← Precedente
          </button>
          <button
            onClick={handleToday}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0066CC",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Oggi
          </button>
          <button
            onClick={handleNextDay}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Successivo →
          </button>
        </div>

        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
          {currentDate.toLocaleDateString("it-IT", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h2>

        <div style={{ width: "200px" }} />
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

      {/* Calendar Grid */}
      <div style={{ flex: 1, overflow: "auto", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  position: "sticky",
                  top: 0,
                  left: 0,
                  zIndex: 3,
                  width: "80px",
                  backgroundColor: "#f5f5f5",
                  borderRight: "1px solid #E5E7EB",
                  borderBottom: "2px solid #E5E7EB",
                  padding: "12px 8px",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Ora
              </th>
              {technicians.map((tech) => (
                <th
                  key={tech.id}
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    minWidth: "250px",
                    padding: "12px 8px",
                    backgroundColor: "#f5f5f5",
                    borderRight: "1px solid #E5E7EB",
                    borderBottom: "2px solid #E5E7EB",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                    {tech.firstName} {tech.lastName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workHours.map((timeSlot) => (
              <tr key={timeSlot}>
                <td
                  style={{
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    width: "80px",
                    padding: "8px",
                    backgroundColor: "#f5f5f5",
                    borderRight: "1px solid #E5E7EB",
                    borderBottom: "1px solid #E5E7EB",
                    textAlign: "center",
                    fontSize: "14px",
                    color: "#666",
                    fontWeight: "600",
                  }}
                >
                  {timeSlot}
                </td>
                {technicians.map((tech) => {
                  const slotKey = `${tech.id}-${timeSlot}`;
                  const slotAppointments = getAppointmentsForSlot(tech.id, timeSlot);
                  const isHovered = hoveredSlot === slotKey;

                  return (
                    <td
                      key={tech.id}
                      style={{
                        minWidth: "250px",
                        minHeight: "60px",
                        padding: "4px",
                        borderRight: "1px solid #E5E7EB",
                        borderBottom: "1px solid #E5E7EB",
                        backgroundColor: isHovered ? "#0066CC20" : "transparent",
                        verticalAlign: "top",
                      }}
                      onDragOver={(e) => handleDragOver(e, slotKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, tech.id, timeSlot)}
                    >
                      {slotAppointments.map((apt) => {
                        const aptDate = new Date(apt.scheduledDate);
                        const isFirstSlot = aptDate.toTimeString().substring(0, 5) === timeSlot;

                        // Mostra card solo nel primo slot
                        if (!isFirstSlot) return null;

                        const slots = Math.ceil(apt.duration / 30);

                        return (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, apt.id)}
                            onDragEnd={handleDragEnd}
                            style={{
                              padding: "8px",
                              marginBottom: "4px",
                              borderRadius: "4px",
                              backgroundColor: getStatusColor(apt.status) + "20",
                              borderLeft: `4px solid ${getStatusColor(apt.status)}`,
                              cursor: "move",
                              opacity: draggedAppointmentId === apt.id ? 0.5 : 1,
                              minHeight: `${slots * 60 - 8}px`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: getStatusColor(apt.status),
                                marginBottom: "4px",
                              }}
                            >
                              {aptDate.toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              ({apt.duration} min)
                            </div>

                            {apt.customer && (
                              <>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {apt.customer.firstName} {apt.customer.lastName}
                                </div>
                                <div style={{ fontSize: "12px", color: "#666" }}>
                                  📍 {apt.customer.city}
                                </div>
                                <div style={{ fontSize: "11px", color: "#666" }}>
                                  📞 {apt.customer.phone}
                                </div>
                              </>
                            )}

                            {apt.serviceType && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  backgroundColor: "#E6F4FE",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  marginTop: "4px",
                                  display: "inline-block",
                                }}
                              >
                                {apt.serviceType}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
