import React, { useState, useEffect } from "react";
import { trpc, trpcClient } from "@/lib/trpc";
import { Appointment, Customer, Technician } from "@/drizzle/schema";
import { AppointmentFormWeb } from "./appointment-form-web";

interface AppointmentWithDetails extends Appointment {
  customer: Customer | null;
  technician: Technician | null;
}

interface WeeklyCalendarWebProps {
  onAppointmentMove?: (appointmentId: number, newDate: Date) => void;
}

export function WeeklyCalendarWeb({ onAppointmentMove }: WeeklyCalendarWebProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [draggedAppointmentId, setDraggedAppointmentId] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteValue, setNoteValue] = useState<string>("");
  const [selectedTechnicianIds, setSelectedTechnicianIds] = useState<number[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appointmentId: number } | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTechnicianId, setExportTechnicianId] = useState<number | null>(null);
  const [exportDate, setExportDate] = useState<Date>(new Date());
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSlotDate, setCreateSlotDate] = useState<Date | null>(null);
  const [createSlotTechnicianId, setCreateSlotTechnicianId] = useState<number | null>(null);

  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery({
    startDate: currentWeekStart,
    endDate: weekEnd,
  });

  const { data: technicians } = trpc.technicians.list.useQuery();

  // Filtra appuntamenti (ora hanno già customer e technician dal JOIN)
  const appointmentsWithDetails = React.useMemo(() => {
    if (!appointments) return [];
    
    let filtered = appointments
      // Filtra appuntamenti cancellati (non mostrarli nel calendario)
      .filter(apt => apt.status !== 'cancelled');
    
    // Applica filtro tecnici se selezionati
    if (selectedTechnicianIds.length > 0) {
      filtered = filtered.filter(apt => selectedTechnicianIds.includes(apt.technicianId));
    }
    
    return filtered;
  }, [appointments, selectedTechnicianIds]);

  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      refetch();
      showToast("Appuntamento spostato con successo!");
    },
    onError: (error) => {
      showToast("Errore nello spostamento: " + error.message, true);
    },
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; error: boolean } | null>(null);

  const showToast = (text: string, error = false) => {
    setToastMessage({ text, error });
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const handleNoteClick = (e: React.MouseEvent, apt: AppointmentWithDetails) => {
    e.stopPropagation();
    setEditingNoteId(apt.id);
    setNoteValue(apt.notes || "");
  };
  
  const handleNoteSave = (appointmentId: number) => {
    updateAppointmentMutation.mutate({
      id: appointmentId,
      notes: noteValue,
    });
    setEditingNoteId(null);
    showToast("Note salvate!");
  };
  
  const handleNoteCancel = () => {
    setEditingNoteId(null);
    setNoteValue("");
  };
  
  const handleTechnicianToggle = (technicianId: number) => {
    setSelectedTechnicianIds(prev => {
      if (prev.includes(technicianId)) {
        return prev.filter(id => id !== technicianId);
      } else {
        return [...prev, technicianId];
      }
    });
  };
  
  const handleSelectAllTechnicians = () => {
    setSelectedTechnicianIds([]);
  };
  
  const handleContextMenu = (e: React.MouseEvent, appointmentId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, appointmentId });
  };
  
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  const handleStatusChange = (status: "completed" | "in_progress" | "cancelled") => {
    if (!contextMenu) return;
    
    if (status === "cancelled") {
      if (!confirm("Sei sicuro di voler cancellare questo appuntamento?")) {
        handleCloseContextMenu();
        return;
      }
    }
    
    updateAppointmentMutation.mutate({
      id: contextMenu.appointmentId,
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    });
    
    showToast(
      status === "completed" ? "Appuntamento completato!" :
      status === "in_progress" ? "Appuntamento in corso" :
      "Appuntamento cancellato"
    );
    
    handleCloseContextMenu();
  };
  
  // Chiudi menu contestuale quando si clicca fuori
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => handleCloseContextMenu();
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);
  
  const handleExportPDF = async () => {
    if (!exportTechnicianId) {
      alert("Seleziona un tecnico");
      return;
    }
    setShowExportModal(false);
    
    try {
      showToast("Generazione PDF in corso...");
      
      // Usa tRPC per esportare il PDF
      const result = await trpcClient.appointments.exportDailyPDF.query({
        technicianId: exportTechnicianId,
        date: exportDate,
      });
      
      if (result?.html) {
        // Crea blob e download
        const blob = new Blob([result.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dateStr = exportDate.toISOString().split("T")[0];
        const techName = technicians?.find(t => t.id === exportTechnicianId);
        a.download = `planning_${techName?.firstName}_${dateStr}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast("Planning esportato!");
      } else {
        showToast("Errore: PDF non generato", true);
      }
    } catch (error) {
      console.error('Export PDF error:', error);
      showToast("Errore durante l'esportazione", true);
    }
  };

  // Festività italiane fisse
  const italianHolidays = [
    { month: 0, day: 1 },   // Capodanno
    { month: 0, day: 6 },   // Epifania
    { month: 3, day: 25 },  // Festa della Liberazione
    { month: 4, day: 1 },   // Festa del Lavoro
    { month: 5, day: 2 },   // Festa della Repubblica
    { month: 7, day: 15 },  // Ferragosto
    { month: 10, day: 1 },  // Ognissanti
    { month: 11, day: 8 },  // Immacolata Concezione
    { month: 11, day: 25 }, // Natale
    { month: 11, day: 26 }, // Santo Stefano
  ];
  
  const isHoliday = (date: Date) => {
    // Domenica
    if (date.getDay() === 0) return true;
    
    // Festività fisse
    const month = date.getMonth();
    const day = date.getDate();
    return italianHolidays.some(h => h.month === month && h.day === day);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const workHours = Array.from({ length: 11 }, (_, i) => i + 8);

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

  const handleDrop = (e: DragEvent<HTMLDivElement>, dayIndex: number, hour: number) => {
    e.preventDefault();
    const appointmentId = parseInt(e.dataTransfer.getData("appointmentId"));
    
    if (!appointmentId) return;

    const appointment = appointmentsWithDetails.find((a) => a.id === appointmentId);
    if (!appointment) return;

    // Calcola nuova data
    const newDate = new Date(weekDays[dayIndex]);
    newDate.setHours(hour, 0, 0, 0);

    // Verifica sovrapposizioni
    const hasOverlap = appointmentsWithDetails.some((apt) => {
      if (apt.id === appointmentId) return false;
      if (apt.technicianId !== appointment.technicianId) return false;
      
      const aptDate = new Date(apt.scheduledDate);
      const aptEnd = new Date(aptDate);
      aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);
      
      const newEnd = new Date(newDate);
      newEnd.setMinutes(newEnd.getMinutes() + appointment.duration);
      
      return (
        (newDate >= aptDate && newDate < aptEnd) ||
        (newEnd > aptDate && newEnd <= aptEnd) ||
        (newDate <= aptDate && newEnd >= aptEnd)
      );
    });

    if (hasOverlap) {
      showToast("Impossibile spostare: il tecnico ha già un appuntamento in questo orario", true);
      setDraggedAppointmentId(null);
      setHoveredSlot(null);
      return;
    }

    // Aggiorna appuntamento
    updateAppointmentMutation.mutate({
      id: appointmentId,
      scheduledDate: newDate,
    });

    setDraggedAppointmentId(null);
    setHoveredSlot(null);

    if (onAppointmentMove) {
      onAppointmentMove(appointmentId, newDate);
    }
  };

  const handleDragEnd = () => {
    setDraggedAppointmentId(null);
    setHoveredSlot(null);
  };

  const getAppointmentsForSlot = (dayIndex: number, hour: number) => {
    return appointmentsWithDetails.filter((apt) => {
      const aptDate = new Date(apt.scheduledDate);
      const slotDate = weekDays[dayIndex];
      return (
        aptDate.getDate() === slotDate.getDate() &&
        aptDate.getMonth() === slotDate.getMonth() &&
        aptDate.getFullYear() === slotDate.getFullYear() &&
        aptDate.getHours() === hour
      );
    });
  };

  // Colori distintivi per ogni tecnico
  const getTechnicianColor = (technicianId: number) => {
    const colors = [
      "#3B82F6", // Blu
      "#10B981", // Verde
      "#F59E0B", // Arancione
      "#8B5CF6", // Viola
      "#EF4444", // Rosso
      "#06B6D4", // Cyan
      "#EC4899", // Rosa
      "#14B8A6", // Teal
    ];
    return colors[(technicianId - 1) % colors.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#00CC66";
      case "in_progress":
        return "#0066CC";
      case "cancelled":
        return "#CC0000";
      default:
        return "#666666";
    }
  };
  
  // Usa colore tecnico se appuntamento è scheduled, altrimenti colore stato
  const getAppointmentColor = (apt: AppointmentWithDetails) => {
    if (apt.status === "scheduled") {
      return getTechnicianColor(apt.technicianId);
    }
    return getStatusColor(apt.status);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div>Caricamento calendario...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#fff" }}>      {/* Technician Filter */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: "#f5f5f5",
        borderBottom: "1px solid #E5E7EB",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#666" }}>Filtra per tecnico:</span>
        <button
          onClick={handleSelectAllTechnicians}
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
      
      {/* Header with Week Navigation */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        borderBottom: "1px solid #E5E7EB",
      }}>
        <button
          onClick={handlePreviousWeek}
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

        <div style={{ fontSize: "18px", fontWeight: "bold" }}>
          {currentWeekStart.toLocaleDateString("it-IT", { day: "numeric", month: "long" })} -{" "}
          {weekEnd.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </div>

        <button
          onClick={handleNextWeek}
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
        
        <button
          onClick={() => setShowExportModal(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#00CC66",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          💾 Esporta PDF
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{
                position: "sticky",
                top: 0,
                left: 0,
                zIndex: 3,
                width: "60px",
                backgroundColor: "#f5f5f5",
                borderRight: "1px solid #E5E7EB",
                borderBottom: "1px solid #E5E7EB",
              }} />
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
                    borderBottom: "1px solid #E5E7EB",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "12px", color: holiday ? "#CC0000" : "#666", marginBottom: "4px" }}>
                    {day.toLocaleDateString("it-IT", { weekday: "short" })}
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {day.getDate()}
                  </div>
                </th>
              );
              })}
            </tr>
          </thead>
          <tbody>
            {workHours.map((hour) => (
              <tr key={hour}>
                <td style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 1,
                  width: "60px",
                  padding: "8px",
                  backgroundColor: "#f5f5f5",
                  borderRight: "1px solid #E5E7EB",
                  borderBottom: "1px solid #E5E7EB",
                  textAlign: "center",
                  fontSize: "14px",
                  color: "#666",
                }}>
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
                        cursor: slotAppointments.length === 0 ? "pointer" : "default",
                      }}
                      onDragOver={(e) => handleDragOver(e, slotKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayIndex, hour)}
                      onClick={() => {
                        if (slotAppointments.length === 0) {
                          const slotDate = new Date(day);
                          slotDate.setHours(hour, 0, 0, 0);
                          setCreateSlotDate(slotDate);
                          setCreateSlotTechnicianId(selectedTechnicianIds.length === 1 ? selectedTechnicianIds[0] : null);
                          setShowCreateModal(true);
                        }
                      }}
                    >
                      {slotAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, apt.id)}
                          onDragEnd={handleDragEnd}
                          onContextMenu={(e) => handleContextMenu(e, apt.id)}
                          onClick={() => {
                            setSelectedAppointmentId(apt.id);
                            setShowDetailModal(true);
                          }}
                          style={{
                            padding: "8px",
                            marginBottom: "4px",
                            borderRadius: "4px",
                            backgroundColor: getAppointmentColor(apt) + "20",
                            borderLeft: `3px solid ${getAppointmentColor(apt)}`,
                            cursor: "move",
                            opacity: draggedAppointmentId === apt.id ? 0.5 : 1,
                          }}
                        >
                          {/* Orario */}
                          <div style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: getAppointmentColor(apt),
                            marginBottom: "4px",
                          }}>
                            {new Date(apt.scheduledDate).toLocaleTimeString("it-IT", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} ({apt.duration} min)
                          </div>
                          
                          {/* Nome Cliente + Città */}
                          <div style={{
                            fontSize: "13px",
                            fontWeight: "bold",
                            marginBottom: "3px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {apt.customer
                              ? `${apt.customer.firstName} ${apt.customer.lastName}`
                              : "Cliente"}
                          </div>
                          
                          {/* Città Cliente */}
                          {apt.customer?.city && (
                            <div style={{
                              fontSize: "10px",
                              color: "#666",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              📍 {apt.customer.city}
                            </div>
                          )}
                          
                          {/* Tecnico */}
                          <div style={{
                            fontSize: "10px",
                            color: "#666",
                            marginBottom: "2px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            👨‍🔧 {apt.technician
                              ? `${apt.technician.firstName} ${apt.technician.lastName}`
                              : "Tecnico"}
                          </div>
                          
                          {/* Tipo Servizio */}
                          {apt.serviceType && (
                            <div style={{
                              fontSize: "10px",
                              color: "#666",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                              🛠️ {apt.serviceType}
                            </div>
                          )}
                          
                          {/* Note Section */}
                          {editingNoteId === apt.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              onDragStart={(e) => e.preventDefault()}
                              style={{
                                marginTop: "6px",
                                padding: "4px",
                                backgroundColor: "#fff",
                                borderRadius: "4px",
                                border: "1px solid #0066CC",
                              }}
                            >
                              <input
                                type="text"
                                value={noteValue}
                                onChange={(e) => setNoteValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleNoteSave(apt.id);
                                  } else if (e.key === "Escape") {
                                    handleNoteCancel();
                                  }
                                }}
                                placeholder="Aggiungi note..."
                                maxLength={100}
                                autoFocus
                                style={{
                                  width: "100%",
                                  fontSize: "10px",
                                  padding: "2px 4px",
                                  border: "none",
                                  outline: "none",
                                  backgroundColor: "transparent",
                                }}
                              />
                              <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                                <button
                                  onClick={() => handleNoteSave(apt.id)}
                                  style={{
                                    flex: 1,
                                    fontSize: "9px",
                                    padding: "2px 4px",
                                    backgroundColor: "#00CC66",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Salva
                                </button>
                                <button
                                  onClick={handleNoteCancel}
                                  style={{
                                    flex: 1,
                                    fontSize: "9px",
                                    padding: "2px 4px",
                                    backgroundColor: "#f5f5f5",
                                    color: "#666",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Annulla
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={(e) => handleNoteClick(e, apt)}
                              title={apt.notes || "Click per aggiungere note"}
                              style={{
                                marginTop: "6px",
                                padding: "4px",
                                fontSize: "10px",
                                color: apt.notes ? "#333" : "#999",
                                backgroundColor: apt.notes ? "#FFF9E6" : "#f5f5f5",
                                borderRadius: "3px",
                                cursor: "text",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontStyle: apt.notes ? "normal" : "italic",
                              }}
                            >
                              {apt.notes ? (
                                <>📝 {apt.notes}</>
                              ) : (
                                "+ Aggiungi note..."
                              )}
                            </div>
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

      {/* Legend */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "12px",
        borderTop: "1px solid #E5E7EB",
        backgroundColor: "#f5f5f5",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#666666" }} />
          <span style={{ fontSize: "12px", color: "#666" }}>In attesa</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#0066CC" }} />
          <span style={{ fontSize: "12px", color: "#666" }}>In corso</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#00CC66" }} />
          <span style={{ fontSize: "12px", color: "#666" }}>Completato</span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 2000,
            minWidth: "180px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleStatusChange("completed")}
            style={{
              width: "100%",
              padding: "12px 16px",
              textAlign: "left",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              borderBottom: "1px solid #E5E7EB",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ✅ Segna come completato
          </button>
          <button
            onClick={() => handleStatusChange("in_progress")}
            style={{
              width: "100%",
              padding: "12px 16px",
              textAlign: "left",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              borderBottom: "1px solid #E5E7EB",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            🔄 Segna in corso
          </button>
          <button
            onClick={() => handleStatusChange("cancelled")}
            style={{
              width: "100%",
              padding: "12px 16px",
              textAlign: "left",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              color: "#CC0000",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#FFF0F0"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            ❌ Cancella appuntamento
          </button>
        </div>
      )}
      
      {/* Export PDF Modal */}
      {showExportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "24px",
              minWidth: "400px",
              maxWidth: "500px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "20px" }}>
              💾 Esporta Planning Giornaliero
            </h3>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Seleziona Tecnico:
              </label>
              <select
                value={exportTechnicianId || ""}
                onChange={(e) => setExportTechnicianId(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                <option value="">-- Scegli tecnico --</option>
                {technicians?.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                Seleziona Data:
              </label>
              <input
                type="date"
                value={exportDate.toISOString().split("T")[0]}
                onChange={(e) => {
                  const dateStr = e.target.value;
                  if (dateStr) {
                    // Crea data a mezzanotte locale per evitare shift timezone
                    const [y, m, d] = dateStr.split('-');
                    setExportDate(new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0));
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleExportPDF}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#00CC66",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                Esporta
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Appointment Detail Modal */}
      {showDetailModal && selectedAppointmentId && (() => {
        const apt = appointmentsWithDetails.find(a => a.id === selectedAppointmentId);
        if (!apt) return null;
        
        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3000,
            }}
            onClick={() => setShowDetailModal(false)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                maxWidth: "600px",
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>Dettaglio Appuntamento</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Appointment Info */}
              <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: getAppointmentColor(apt) + "10", borderRadius: "8px", borderLeft: `4px solid ${getAppointmentColor(apt)}` }}>
                <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>
                  {new Date(apt.scheduledDate).toLocaleDateString("it-IT", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  🕒 {new Date(apt.scheduledDate).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - Durata: {apt.duration} minuti
                </div>
                {apt.serviceType && (
                  <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                    🛠️ Servizio: {apt.serviceType}
                  </div>
                )}
              </div>
              
              {/* Customer Info */}
              {apt.customer && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>👤 Cliente</h3>
                  <div style={{ padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                    <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>
                      {apt.customer.firstName} {apt.customer.lastName}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                      📞 <a href={`tel:${apt.customer.phone}`} style={{ color: "#0066CC", textDecoration: "none" }}>{apt.customer.phone}</a>
                    </div>
                    {apt.customer.email && (
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                        ✉️ <a href={`mailto:${apt.customer.email}`} style={{ color: "#0066CC", textDecoration: "none" }}>{apt.customer.email}</a>
                      </div>
                    )}
                    <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
                      📍 {apt.customer.address}, {apt.customer.city}
                    </div>
                    {apt.customer.notes && (
                      <div style={{ fontSize: "14px", color: "#666", marginTop: "12px", padding: "12px", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #E5E7EB" }}>
                        <strong>Note cliente:</strong><br/>
                        {apt.customer.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Technician Info */}
              {apt.technician && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>👨‍🔧 Tecnico Assegnato</h3>
                  <div style={{ padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
                      {apt.technician.firstName} {apt.technician.lastName}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      📞 {apt.technician.phone}
                    </div>
                    {apt.technician.vehiclePlate && (
                      <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                        🚗 {apt.technician.vehicleModel} - {apt.technician.vehiclePlate}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Appointment Notes */}
              {apt.notes && (
                <div style={{ marginBottom: "20px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>📝 Note Appuntamento</h3>
                  <div style={{ padding: "16px", backgroundColor: "#FFF9E6", borderRadius: "8px", border: "1px solid #FFE066" }}>
                    {apt.notes}
                  </div>
                </div>
              )}
              
              {/* Status */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>Stato</h3>
                <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: "20px", backgroundColor: getStatusColor(apt.status) + "20", color: getStatusColor(apt.status), fontWeight: "600" }}>
                  {apt.status === "completed" && "✅ Completato"}
                  {apt.status === "in_progress" && "🔄 In corso"}
                  {apt.status === "cancelled" && "❌ Cancellato"}
                  {apt.status === "scheduled" && "📅 Programmato"}
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#0066CC",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        );
      })()}
      
      {/* Create Appointment Modal */}
      {showCreateModal && createSlotDate && (
        <AppointmentFormWeb
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateSlotDate(null);
            setCreateSlotTechnicianId(null);
          }}
          onSave={() => {
            refetch();
            setShowCreateModal(false);
            setCreateSlotDate(null);
            setCreateSlotTechnicianId(null);
            showToast("Appuntamento creato con successo!");
          }}
          initialDate={createSlotDate}
          initialTechnicianId={createSlotTechnicianId}
        />
      )}
      
      {toastMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "12px 24px",
          borderRadius: "8px",
          backgroundColor: toastMessage.error ? "#CC0000" : "#00CC66",
          color: "#fff",
          fontWeight: "600",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
}
