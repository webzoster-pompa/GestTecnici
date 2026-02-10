import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Appointment, Customer, Technician } from "@/drizzle/schema";

interface AppointmentWithDetails extends Appointment {
  customer: Customer | null;
  technician: Technician | null;
}

interface MonthlyCalendarWebProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthlyCalendarWeb({ currentDate, onDateChange }: MonthlyCalendarWebProps) {
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<number[]>([]);
  
  // Calcola primo e ultimo giorno del mese
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);

  const { data: appointments, isLoading } = trpc.appointments.list.useQuery({
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth,
  });

  const { data: technicians } = trpc.technicians.list.useQuery();

  // Calcola lunedì della prima settimana
  const firstMonday = new Date(firstDayOfMonth);
  const dayOfWeek = firstDayOfMonth.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  firstMonday.setDate(firstDayOfMonth.getDate() + diff);

  // Genera array di 35 giorni (5 settimane)
  const days: Date[] = [];
  for (let i = 0; i < 35; i++) {
    const day = new Date(firstMonday);
    day.setDate(firstMonday.getDate() + i);
    days.push(day);
  }

  // Filtra appuntamenti per giorno
  const getAppointmentsForDay = (date: Date) => {
    if (!appointments) return [];
    
    let filtered = appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledDate);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear() &&
        apt.status !== 'cancelled'
      );
    });

    // Applica filtro tecnici
    if (selectedTechnicianIds.length > 0) {
      filtered = filtered.filter(apt => selectedTechnicianIds.includes(apt.technicianId));
    }

    return filtered;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const handleTechnicianToggle = (techId: number) => {
    setSelectedTechnicianIds(prev =>
      prev.includes(techId)
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

  const getAppointmentColor = (apt: AppointmentWithDetails) => {
    if (apt.status === "completed") return "#00CC66";
    if (apt.status === "in_progress") return "#0066CC";
    return "#999999";
  };

  if (isLoading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Caricamento...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#fff" }}>
      {/* Filtro Tecnici */}
      <div style={{
        display: "flex",
        gap: "8px",
        padding: "16px",
        borderBottom: "1px solid #E5E7EB",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "14px", fontWeight: "600", marginRight: "8px", alignSelf: "center" }}>
          Mostra:
        </span>
        <button
          onClick={() => setSelectedTechnicianIds([])}
          style={{
            padding: "6px 12px",
            fontSize: "13px",
            fontWeight: selectedTechnicianIds.length === 0 ? "600" : "normal",
            backgroundColor: selectedTechnicianIds.length === 0 ? "#0066CC" : "#fff",
            color: selectedTechnicianIds.length === 0 ? "#fff" : "#666",
            border: "1px solid #E5E7EB",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Tutti
        </button>
        {technicians?.map((tech) => (
          <button
            key={tech.id}
            onClick={() => handleTechnicianToggle(tech.id)}
            style={{
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: selectedTechnicianIds.includes(tech.id) ? "600" : "normal",
              backgroundColor: selectedTechnicianIds.includes(tech.id) ? "#0066CC" : "#fff",
              color: selectedTechnicianIds.includes(tech.id) ? "#fff" : "#666",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {tech.firstName} {tech.lastName}
          </button>
        ))}
      </div>

      {/* Header con navigazione */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        borderBottom: "1px solid #E5E7EB",
      }}>
        <button
          onClick={handlePreviousMonth}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ← Precedente
        </button>

        <div style={{ fontSize: "20px", fontWeight: "bold" }}>
          {currentDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
        </div>

        <button
          onClick={handleNextMonth}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Successiva →
        </button>
      </div>

      {/* Griglia calendario */}
      <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "8px",
        }}>
          {/* Header giorni settimana */}
          {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
            <div
              key={day}
              style={{
                padding: "8px",
                textAlign: "center",
                fontWeight: "600",
                fontSize: "14px",
                color: "#666",
              }}
            >
              {day}
            </div>
          ))}

          {/* Giorni del mese */}
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day);
            const today = isToday(day);
            const currentMonth = isCurrentMonth(day);

            return (
              <div
                key={index}
                style={{
                  minHeight: "120px",
                  padding: "8px",
                  border: today ? "2px solid #0066CC" : "1px solid #E5E7EB",
                  borderRadius: "8px",
                  backgroundColor: today ? "#0066CC10" : "#fff",
                  opacity: currentMonth ? 1 : 0.5,
                }}
              >
                <div style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: today ? "#0066CC" : "#333",
                }}>
                  {day.getDate()}
                </div>

                {/* Lista appuntamenti */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      style={{
                        padding: "4px 6px",
                        borderRadius: "4px",
                        backgroundColor: getAppointmentColor(apt) + "20",
                        borderLeft: `3px solid ${getAppointmentColor(apt)}`,
                        fontSize: "11px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={`${new Date(apt.scheduledDate).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - ${apt.customer ? `${apt.customer.firstName} ${apt.customer.lastName}` : "Cliente"}`}
                    >
                      <div style={{ fontWeight: "600", color: getAppointmentColor(apt) }}>
                        {new Date(apt.scheduledDate).toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div style={{ fontSize: "10px", color: "#666" }}>
                        {apt.customer
                          ? `${apt.customer.firstName} ${apt.customer.lastName}`
                          : "Cliente"}
                      </div>
                    </div>
                  ))}
                  {dayAppointments.length > 3 && (
                    <div style={{
                      padding: "4px 6px",
                      fontSize: "10px",
                      color: "#666",
                      fontWeight: "600",
                      textAlign: "center",
                    }}>
                      +{dayAppointments.length - 3} altri
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
