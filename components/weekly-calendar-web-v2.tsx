import React, { useState, useEffect } from "react";
import { trpc, trpcClient } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { Appointment, Customer, Technician } from "@/drizzle/schema";
import { AppointmentFormWeb } from "./appointment-form-web";

interface AppointmentWithDetails extends Appointment {
  customer?: Customer;
  technician?: Technician;
  confirmed?: boolean; // Nuovo campo per stato confermato/non confermato
}

interface WeeklyCalendarWebV2Props {
  onCustomerClick?: (customerId: number, customerName: string) => void;
}

export function WeeklyCalendarWebV2({ onCustomerClick }: WeeklyCalendarWebV2Props) {
  const colors = useColors();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    // Calcola lunedì della settimana corrente
    // Se domenica (0), vai al lunedì successivo (+1), altrimenti torna al lunedì della settimana (1-day)
    const monday = new Date(today);
    const diff = day === 0 ? 1 : 1 - day; // Domenica = +1 (prossimo lunedì), Lunedì = 0, Martedì = -1, etc.
    monday.setDate(today.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [draggedAppointment, setDraggedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [resizingAppointment, setResizingAppointment] = useState<{ appointment: AppointmentWithDetails; startY: number; startDuration: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefilledData, setPrefilledData] = useState<{ date: Date; technicianId: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appointment: AppointmentWithDetails } | null>(null);
  const [hoveredAppointment, setHoveredAppointment] = useState<{
    appointment: Appointment;
    position: { x: number; y: number };
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState<'all' | 1 | 2>('all'); // 'all', 1 (Luca), 2 (Denis)
  const [absenceContextMenu, setAbsenceContextMenu] = useState<{ x: number; y: number; day: Date; technicianId: number } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDate, setPrintDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [printTechnicianId, setPrintTechnicianId] = useState<number>(1);

  // Festivi italiani 2026
  const italianHolidays2026 = [
    '2026-01-01', // Capodanno
    '2026-01-06', // Epifania
    '2026-04-05', // Pasqua (domenica)
    '2026-04-06', // Lunedì dell'Angelo
    '2026-04-25', // Liberazione
    '2026-05-01', // Festa del Lavoro
    '2026-06-02', // Festa della Repubblica
    '2026-08-15', // Ferragosto
    '2026-11-01', // Ognissanti
    '2026-12-08', // Immacolata
    '2026-12-25', // Natale
    '2026-12-26', // Santo Stefano
  ];

  const isNonWorkingDay = (date: Date) => {
    const day = date.getDay(); // 0 = domenica
    const dateStr = date.toISOString().split('T')[0];
    return day === 0 || italianHolidays2026.includes(dateStr);
  };

  // Chiudi menu contestuale quando si clicca fuori
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setAbsenceContextMenu(null);
    };
    if (contextMenu || absenceContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu, absenceContextMenu]);

  // Calcola fine settimana (domenica)
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch appointments per la settimana corrente
  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery({
    startDate: currentWeekStart,
    endDate: weekEnd,
  });

  // Fetch absences per la settimana corrente
  const { data: absences, refetch: refetchAbsences } = trpc.absences.list.useQuery({
    startDate: currentWeekStart,
    endDate: weekEnd,
  });

  // Gli appuntamenti arrivano già con customer e technician dal JOIN nel database
  const appointmentsWithDetails: AppointmentWithDetails[] = appointments || [];
  


  // Mutation per aggiornare appuntamento
  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Handlers per resize durata appuntamento
  const handleResizeStart = (e: React.MouseEvent, apt: AppointmentWithDetails) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingAppointment({
      appointment: apt,
      startY: e.clientY,
      startDuration: apt.duration,
    });
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingAppointment) return;
    
    const deltaY = e.clientY - resizingAppointment.startY;
    // Ogni 64px = 30 minuti (1 slot)
    const deltaMinutes = Math.round((deltaY / 64) * 30);
    const newDuration = Math.max(30, resizingAppointment.startDuration + deltaMinutes); // Minimo 30 min
    
    // Aggiorna temporaneamente la durata per feedback visivo
    // (verrà salvato nel database solo al mouseup)
    resizingAppointment.appointment.duration = newDuration;
    setResizingAppointment({ ...resizingAppointment });
  };

  const handleResizeEnd = () => {
    if (!resizingAppointment) return;
    
    // Salva la nuova durata nel database
    updateAppointmentMutation.mutate({
      id: resizingAppointment.appointment.id,
      duration: resizingAppointment.appointment.duration,
    });
    
    setResizingAppointment(null);
  };

  // Aggiungi event listeners per resize
  useEffect(() => {
    if (resizingAppointment) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingAppointment]);

  // Mutations per gestione assenze
  const createAbsenceMutation = trpc.absences.create.useMutation({
    onSuccess: () => {
      refetchAbsences();
      setAbsenceContextMenu(null);
      alert('✅ Assenza salvata con successo!');
    },
    onError: (error) => {
      console.error('[createAbsenceMutation] Error:', error);
      alert('❌ Errore nel salvataggio dell\'assenza: ' + error.message);
      setAbsenceContextMenu(null);
    },
  });

  const deleteAbsenceMutation = trpc.absences.delete.useMutation({
    onSuccess: () => {
      refetchAbsences();
    },
  });

  // Genera giorni della settimana (esclusa domenica)
  const weekDays = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i); // Lunedì (0) a Sabato (5)
    return date;
  });

  // Slot da 30 minuti (8:00 - 18:00)
  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = (i % 2) * 30;
    return { hour, minute };
  });

  // Funzione filtro ricerca
  const matchesSearch = (apt: AppointmentWithDetails) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const customerName = apt.customer
      ? `${apt.customer.firstName} ${apt.customer.lastName}`.toLowerCase()
      : '';
    const city = apt.customer?.city?.toLowerCase() || '';
    return customerName.includes(query) || city.includes(query);
  };

  // Conta appuntamenti filtrati
  const filteredCount = appointmentsWithDetails.filter(matchesSearch).length;

  // Funzione per verificare se tecnico è assente in un giorno
  const isTechnicianAbsent = (day: Date, technicianId: number) => {
    if (!absences) return false;
    const dayStr = day.toISOString().split('T')[0];
    return absences.some(abs => {
      const absDateStr = new Date(abs.date).toISOString().split('T')[0];
      return absDateStr === dayStr && abs.technicianId === technicianId;
    });
  };

  // Funzione per ottenere assenza di un tecnico in un giorno
  const getAbsence = (day: Date, technicianId: number) => {
    if (!absences) return null;
    const dayStr = day.toISOString().split('T')[0];
    return absences.find(abs => {
      const absDateStr = new Date(abs.date).toISOString().split('T')[0];
      return absDateStr === dayStr && abs.technicianId === technicianId;
    }) || null;
  };

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

  // Handler per menu contestuale assenze (click destro su header giorno)
  const handleAbsenceContextMenu = (e: React.MouseEvent, day: Date, technicianId: number) => {
    e.preventDefault();
    setAbsenceContextMenu({ x: e.clientX, y: e.clientY, day, technicianId });
  };

  // Handler per creare assenza
  const handleCreateAbsence = (reason: 'ferie' | 'malattia' | 'permesso') => {
    if (!absenceContextMenu) return;
    const dayStart = new Date(absenceContextMenu.day);
    dayStart.setHours(0, 0, 0, 0);
    createAbsenceMutation.mutate({
      technicianId: absenceContextMenu.technicianId,
      date: dayStart,
      reason,
    });
  };

  // Handler per rimuovere assenza
  const handleRemoveAbsence = (absenceId: number) => {
    if (confirm('Rimuovere questa assenza?')) {
      deleteAbsenceMutation.mutate({ id: absenceId });
    }
  };

  // Handler per generare PDF foglio giornaliero
  const handlePrintPDF = async () => {
    try {
      // Crea data in timezone locale (non UTC) per evitare problemi di fuso orario
      const [year, month, day] = printDate.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day, 12, 0, 0); // Mezzogiorno per evitare problemi timezone
      
      console.log('[STAMPA PDF] Data selezionata:', printDate);
      console.log('[STAMPA PDF] Data inviata:', selectedDate);
      console.log('[STAMPA PDF] Tecnico:', printTechnicianId);
      
      const result = await trpcClient.appointments.exportDailyPDF.query({
        technicianId: printTechnicianId,
        date: selectedDate,
      });

      // Apri PDF in nuova finestra
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(result.html);
        newWindow.document.close();
        // Aspetta caricamento e stampa
        setTimeout(() => {
          newWindow.print();
        }, 500);
      }
      setShowPrintModal(false);
    } catch (error: any) {
      alert('Errore generazione PDF: ' + error.message);
      console.error(error);
    }
  };

  // Drag & Drop HTML5 nativo
  const handleDragStart = (e: React.DragEvent, appointment: AppointmentWithDetails) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('appointmentId', appointment.id.toString());
    setDraggedAppointment(appointment);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, day: number, hour: number, minute: number, technicianId: number) => {
    e.preventDefault();
    if (!draggedAppointment) return;

    // Blocca drop se tecnico assente
    const targetDay = weekDays[day];
    if (isTechnicianAbsent(targetDay, technicianId)) {
      alert(`Impossibile spostare: il tecnico è assente in questo giorno.`);
      setDraggedAppointment(null);
      return;
    }

    // Calcola nuova data con minuti
    const newDate = new Date(targetDay);
    newDate.setHours(hour, minute, 0, 0);

    // Prepara dati aggiornamento
    const updateData: any = {
      id: draggedAppointment.id,
      scheduledDate: newDate,
    };

    // Se technicianId diverso dall'attuale, aggiorna anche il tecnico
    if (technicianId !== draggedAppointment.technicianId) {
      updateData.technicianId = technicianId;
    }


    // Aggiorna appuntamento
    updateAppointmentMutation.mutate(updateData);

    setDraggedAppointment(null);
  };

  const getAppointmentsForSlot = (dayIndex: number, hour: number, minute: number, technicianId: number) => {
    return appointmentsWithDetails.filter((apt) => {
      // Filtro ricerca
      if (!matchesSearch(apt)) return false;
      
      // Filtro tecnico
      if (technicianFilter !== 'all' && apt.technicianId !== technicianFilter) return false;
      
      const aptDate = new Date(apt.scheduledDate);
      const slotDate = weekDays[dayIndex];
      // Mostra appuntamento SOLO nello slot di inizio (non negli slot successivi)
      const dateMatch = 
        aptDate.getDate() === slotDate.getDate() &&
        aptDate.getMonth() === slotDate.getMonth() &&
        aptDate.getFullYear() === slotDate.getFullYear() &&
        aptDate.getHours() === hour &&
        aptDate.getMinutes() === minute;
      
      return dateMatch && apt.technicianId === technicianId;
    });
  };

  const getTechnicianColor = (technicianId?: number) => {
    switch (technicianId) {
      case 1: // Luca Corsi
        return "#0066CC"; // Blu
      case 2: // Denis Corsi
        return "#00AA66"; // Verde
      default:
        return colors.muted;
    }
  };

  // Mutation per eliminare appuntamento definitivamente
  const deleteAppointmentMutation = trpc.appointments.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const toggleConfirmed = (appointment: AppointmentWithDetails) => {
    // Toggle campo confirmed nel database
    updateAppointmentMutation.mutate({
      id: appointment.id,
      confirmed: !appointment.confirmed,
    });
    setContextMenu(null);
  };

  const deleteAppointment = (appointment: AppointmentWithDetails) => {
    if (window.confirm(`Eliminare definitivamente l'appuntamento con ${appointment.customer?.firstName} ${appointment.customer?.lastName}?`)) {
      deleteAppointmentMutation.mutate({ id: appointment.id });
      setContextMenu(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <span>Caricamento...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header con navigazione settimana */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '12px 8px',
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
      }}>
        <button 
          onClick={handlePreviousWeek}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            color: colors.foreground,
          }}
        >
          ← Precedente
        </button>

        <span style={{ fontSize: '18px', fontWeight: 'bold', color: colors.foreground }}>
          {currentWeekStart.toLocaleDateString("it-IT", { day: "numeric", month: "long" })} -{" "}
          {weekEnd.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setShowPrintModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0066CC',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              color: '#fff',
            }}
          >
            🖨️ Stampa
          </button>
          <button 
            onClick={handleNextWeek}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              color: colors.foreground,
            }}
          >
            Successiva →
          </button>
        </div>
      </div>

      {/* Campo ricerca rapida */}
      {/* Filtri Tecnico */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: colors.foreground }}>Tecnico:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="technician"
            checked={technicianFilter === 'all'}
            onChange={() => setTechnicianFilter('all')}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', color: colors.foreground }}>Entrambi</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="technician"
            checked={technicianFilter === 1}
            onChange={() => setTechnicianFilter(1)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', color: '#4A90E2' }}>Solo Luca</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="technician"
            checked={technicianFilter === 2}
            onChange={() => setTechnicianFilter(2)}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', color: '#4CAF50' }}>Solo Denis</span>
        </label>
      </div>

      {/* Campo Ricerca */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="🔍 Cerca per nome cliente o città..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 40px 10px 16px',
              fontSize: '15px',
              border: `2px solid ${colors.border}`,
              borderRadius: '8px',
              backgroundColor: colors.surface,
              color: colors.foreground,
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                color: colors.muted,
                padding: '4px 8px',
              }}
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <span style={{ color: colors.muted, fontSize: '14px', whiteSpace: 'nowrap' }}>
            {filteredCount} {filteredCount === 1 ? 'appuntamento' : 'appuntamenti'} {filteredCount === 1 ? 'trovato' : 'trovati'}
          </span>
        )}
      </div>

      {/* Calendario */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        WebkitOverflowScrolling: 'touch', /* Smooth scroll su iOS */
        backgroundColor: colors.background,
        position: 'relative',
      }}>
        {/* Header giorni con tecnici */}
        <div style={{ display: 'flex', flexDirection: 'row', position: 'sticky', top: 0, zIndex: 100, backgroundColor: colors.surface }}>
          {/* Colonna ore vuota */}
          <div style={{ width: '64px', borderRight: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }} />
          
          {/* Header per ogni giorno (2 colonne: Luca e Denis) */}
          {weekDays.flatMap((day, index) => [
            /* Colonna Luca Corsi */
            <div
              key={`luca-${index}`}
              onContextMenu={(e) => handleAbsenceContextMenu(e, day, 1)}
              style={{
                flex: 1,
                padding: '12px',
                borderRight: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: isNonWorkingDay(day) ? '#FFE5E5' : (isTechnicianAbsent(day, 1) ? '#FFE5E5' : colors.surface),
                textAlign: 'center',
                cursor: 'context-menu',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '14px', color: colors.muted }}>
                {day.toLocaleDateString("it-IT", { weekday: "short" })} {day.getDate()}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.foreground, marginTop: '4px' }}>
                Luca C.
              </div>
              {isTechnicianAbsent(day, 1) && (() => {
                const absence = getAbsence(day, 1);
                return (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (absence) handleRemoveAbsence(absence.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: '#FF4444',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                    title={`Click per rimuovere assenza (${absence?.reason})`}
                  >
                    ASSENTE
                  </div>
                );
              })()}
            </div>,
            /* Colonna Denis Corsi */
            <div
              key={`denis-${index}`}
              onContextMenu={(e) => handleAbsenceContextMenu(e, day, 2)}
              style={{
                flex: 1,
                padding: '12px',
                borderRight: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: isNonWorkingDay(day) ? '#FFE5E5' : (isTechnicianAbsent(day, 2) ? '#FFE5E5' : colors.surface),
                textAlign: 'center',
                cursor: 'context-menu',
                position: 'relative',
              }}
            >
              <div style={{ fontSize: '14px', color: colors.muted }}>
                {day.toLocaleDateString("it-IT", { weekday: "short" })} {day.getDate()}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.foreground, marginTop: '4px' }}>
                Denis C.
              </div>
              {isTechnicianAbsent(day, 2) && (() => {
                const absence = getAbsence(day, 2);
                return (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (absence) handleRemoveAbsence(absence.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: '#FF4444',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                    title={`Click per rimuovere assenza (${absence?.reason})`}
                  >
                    ASSENTE
                  </div>
                );
              })()}
            </div>
          ])}
        </div>

        {/* Griglia oraria con slot da 30 minuti */}
        {timeSlots.map((slot, slotIndex) => (
          <div key={slotIndex} style={{ display: 'flex', flexDirection: 'row', borderBottom: `1px solid ${colors.border}` }}>
            {/* Colonna ore */}
            <div style={{ 
              width: '64px', 
              padding: '4px', 
              borderRight: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
            }}>
              <span style={{ fontSize: '12px', color: colors.muted }}>
                {slot.hour}:{slot.minute.toString().padStart(2, '0')}
              </span>
            </div>

            {/* Slot per ogni giorno (2 colonne per tecnico) */}
            {weekDays.flatMap((day, dayIndex) => [
              /* Colonna Luca Corsi (technicianId: 1) */
              <div
                key={`luca-${dayIndex}`}
                style={{
                  flex: 1,
                  minHeight: '64px',
                  padding: '8px',
                  borderRight: `1px solid ${colors.border}`,
                  backgroundColor: isNonWorkingDay(day) || isTechnicianAbsent(day, 1) ? '#FFE5E5' : "#E6F2FF", // Rosso per domeniche/festivi/assenze, azzurro per Luca
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  // Blocca creazione se tecnico assente
                  if (isTechnicianAbsent(day, 1)) {
                    alert('Impossibile creare appuntamento: il tecnico è assente in questo giorno.');
                    return;
                  }
                  const newDate = new Date(day);
                  newDate.setHours(slot.hour, slot.minute, 0, 0);
                  setPrefilledData({ date: newDate, technicianId: 1 });
                  setShowCreateModal(true);
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dayIndex, slot.hour, slot.minute, 1)}
              >
                {getAppointmentsForSlot(dayIndex, slot.hour, slot.minute, 1).map((apt) => {
                  // Calcola altezza in base a durata: ogni 30 min = 1 slot (64px)
                  // +1 per includere il riquadro finale (es: 8:00 + 1h occupa anche 9:00)
                  const durationSlots = Math.ceil(apt.duration / 30) + 1;
                  const cardHeight = durationSlots * 64;
                  
                  
                  // Colore: verde se completato, giallo se non confermato, blu/verde se confermato
                  const cardColor = apt.status === 'completed' ? colors.success : (apt.confirmed ? getTechnicianColor(apt.technicianId) : "#FFA500");
                  
                  return (
                    <div
                      key={apt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, apt)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCustomerClick && apt.customer) {
                          onCustomerClick(apt.customer.id, `${apt.customer.firstName} ${apt.customer.lastName}`);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.pageX, y: e.pageY, appointment: apt });
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredAppointment({ appointment: apt, x: rect.right + 10, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredAppointment(null)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: `${cardHeight}px`,
                        backgroundColor: cardColor + "20",
                        borderLeft: `3px solid ${cardColor}`,
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'move',
                        zIndex: 10,
                        // Pattern righe diagonali per appuntamenti non confermati
                        backgroundImage: apt.confirmed ? 'none' : 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.foreground, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {apt.customer
                          ? `${apt.customer.firstName} ${apt.customer.lastName}`
                          : "Cliente"}
                      </div>
                      {apt.customer?.city && (
                        <div style={{ fontSize: '12px', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📍 {apt.customer.city}
                        </div>
                      )}
                      {apt.customer?.address && (
                        <div style={{ fontSize: '12px', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {apt.customer.address}
                        </div>
                      )}
                      {apt.serviceType && (
                        <div style={{ fontSize: '12px', color: colors.muted, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {apt.serviceType}
                        </div>
                      )}
                      {/* Durata appuntamento */}
                      <div style={{ fontSize: '11px', color: colors.muted, marginTop: '4px', fontWeight: 'bold' }}>
                        {apt.status === 'completed' && apt.actualDuration ? (
                          <>
                            ⏱️ {apt.actualDuration >= 60 ? `${Math.floor(apt.actualDuration / 60)}h ${apt.actualDuration % 60 > 0 ? `${apt.actualDuration % 60}min` : ''}` : `${apt.actualDuration}min`}
                            <span style={{ color: colors.success, marginLeft: '4px' }}>✓</span>
                          </>
                        ) : (
                          <>⏱️ {apt.duration >= 60 ? `${Math.floor(apt.duration / 60)}h ${apt.duration % 60 > 0 ? `${apt.duration % 60}min` : ''}` : `${apt.duration}min`}</>
                        )}
                      </div>
                      
                      {/* Maniglia resize */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, apt)}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '8px',
                          cursor: 'ns-resize',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: colors.muted,
                        }}
                      >
                        ⋮
                      </div>
                    </div>
                  );
                })}
              </div>,
              
              /* Colonna Denis Corsi (technicianId: 2) */
              <div
                key={`denis-${dayIndex}`}
                style={{
                  flex: 1,
                  minHeight: '64px',
                  padding: '8px',
                  borderRight: `1px solid ${colors.border}`,
                  backgroundColor: isNonWorkingDay(day) || isTechnicianAbsent(day, 2) ? '#FFE5E5' : "#E6FFF2", // Rosso per domeniche/festivi/assenze, verde per Denis
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  // Blocca creazione se tecnico assente
                  if (isTechnicianAbsent(day, 2)) {
                    alert('Impossibile creare appuntamento: il tecnico è assente in questo giorno.');
                    return;
                  }
                  const newDate = new Date(day);
                  newDate.setHours(slot.hour, slot.minute, 0, 0);
                  setPrefilledData({ date: newDate, technicianId: 2 });
                  setShowCreateModal(true);
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dayIndex, slot.hour, slot.minute, 2)}
              >
                {getAppointmentsForSlot(dayIndex, slot.hour, slot.minute, 2).map((apt) => {
                  // Calcola altezza in base a durata: ogni 30 min = 1 slot (64px)
                  // +1 per includere il riquadro finale (es: 8:00 + 1h occupa anche 9:00)
                  const durationSlots = Math.ceil(apt.duration / 30) + 1;
                  const cardHeight = durationSlots * 64;
                  
                  // Colore: verde se completato, grigio se non confermato, verde se confermato
                  const cardColor = apt.status === 'completed' ? colors.success : (apt.confirmed ? getTechnicianColor(apt.technicianId) : "#999999");
                  
                  return (
                    <div
                      key={apt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, apt)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onCustomerClick && apt.customer) {
                          onCustomerClick(apt.customer.id, `${apt.customer.firstName} ${apt.customer.lastName}`);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.pageX, y: e.pageY, appointment: apt });
                      }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredAppointment({ appointment: apt, x: rect.right + 10, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredAppointment(null)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: `${cardHeight}px`,
                        backgroundColor: cardColor + "20",
                        borderLeft: `3px solid ${cardColor}`,
                        borderRadius: '4px',
                        padding: '8px',
                        cursor: 'move',
                        zIndex: 10,
                        // Pattern righe diagonali per appuntamenti non confermati
                        backgroundImage: apt.confirmed ? 'none' : 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: colors.foreground, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {apt.customer
                          ? `${apt.customer.firstName} ${apt.customer.lastName}`
                          : "Cliente"}
                      </div>
                      {apt.customer?.city && (
                        <div style={{ fontSize: '12px', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📍 {apt.customer.city}
                        </div>
                      )}
                      {apt.customer?.address && (
                        <div style={{ fontSize: '12px', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {apt.customer.address}
                        </div>
                      )}
                      {apt.serviceType && (
                        <div style={{ fontSize: '12px', color: colors.muted, marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {apt.serviceType}
                        </div>
                      )}
                      {/* Durata appuntamento */}
                      <div style={{ fontSize: '11px', color: colors.muted, marginTop: '4px', fontWeight: 'bold' }}>
                        {apt.status === 'completed' && apt.actualDuration ? (
                          <>
                            ⏱️ {apt.actualDuration >= 60 ? `${Math.floor(apt.actualDuration / 60)}h ${apt.actualDuration % 60 > 0 ? `${apt.actualDuration % 60}min` : ''}` : `${apt.actualDuration}min`}
                            <span style={{ color: colors.success, marginLeft: '4px' }}>✓</span>
                          </>
                        ) : (
                          <>⏱️ {apt.duration >= 60 ? `${Math.floor(apt.duration / 60)}h ${apt.duration % 60 > 0 ? `${apt.duration % 60}min` : ''}` : `${apt.duration}min`}</>
                        )}
                      </div>
                      
                      {/* Maniglia resize */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, apt)}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '8px',
                          cursor: 'ns-resize',
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: colors.muted,
                        }}
                      >
                        ⋮
                      </div>
                    </div>
                  );
                })}
              </div>
            ])}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-around', 
        padding: '12px',
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
      }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0066CC', marginRight: '8px' }} />
          <span style={{ fontSize: '12px', color: colors.muted }}>Luca Corsi</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#00AA66', marginRight: '8px' }} />
          <span style={{ fontSize: '12px', color: colors.muted }}>Denis Corsi</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFA500', marginRight: '8px' }} />
          <span style={{ fontSize: '12px', color: colors.muted }}>Non confermato</span>
        </div>
      </div>

      {/* Modal Creazione Appuntamento */}
      {showCreateModal && prefilledData && (
        <AppointmentFormWeb
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setPrefilledData(null);
          }}
          onSave={() => {
            refetch();
            setShowCreateModal(false);
            setPrefilledData(null);
          }}
          initialDate={prefilledData.date}
          initialTechnicianId={prefilledData.technicianId}
        />
      )}

      {/* Tooltip post-it giallo */}
      {hoveredAppointment && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredAppointment.x}px`,
            top: `${hoveredAppointment.y}px`,
            backgroundColor: '#FFEB3B',
            border: '1px solid #FBC02D',
            borderRadius: '4px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            minWidth: '320px',
            maxWidth: '400px',
            fontSize: '13px',
            lineHeight: '1.6',
            pointerEvents: 'none',
          }}
        >
          {/* Cliente */}
          <div style={{ marginBottom: '12px', borderBottom: '1px solid #FBC02D', paddingBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
              Cliente: {hoveredAppointment.appointment.customer
                ? `${hoveredAppointment.appointment.customer.firstName} ${hoveredAppointment.appointment.customer.lastName}`
                : 'N/D'}
            </div>
            {hoveredAppointment.appointment.customer?.phone && (
              <div>Telefono: {hoveredAppointment.appointment.customer.phone}</div>
            )}
            {hoveredAppointment.appointment.customer?.email && (
              <div>Email: {hoveredAppointment.appointment.customer.email}</div>
            )}
            {hoveredAppointment.appointment.customer?.address && (
              <div>Indirizzo: {hoveredAppointment.appointment.customer.address}</div>
            )}
            {hoveredAppointment.appointment.customer?.city && (
              <div>Città: {hoveredAppointment.appointment.customer.city}</div>
            )}
          </div>

          {/* Note Cliente */}
          {hoveredAppointment.appointment.customer?.notes && (
            <div style={{ marginBottom: '12px', borderBottom: '1px solid #FBC02D', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Note Cliente:</div>
              <div>{hoveredAppointment.appointment.customer.notes}</div>
            </div>
          )}

          {/* Note Appuntamento */}
          {hoveredAppointment.appointment.notes && (
            <div style={{ marginBottom: '12px', borderBottom: '1px solid #FBC02D', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Note Appuntamento:</div>
              <div>{hoveredAppointment.appointment.notes}</div>
            </div>
          )}

          {/* Stato */}
          <div>
            <div style={{ fontWeight: 'bold' }}>
              Stato: {hoveredAppointment.appointment.confirmed ? 'Confermato' : 'Non confermato'}
            </div>
          </div>
        </div>
      )}

      {/* Menu contestuale */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            zIndex: 9999,
            minWidth: '180px',
            border: `1px solid ${colors.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => toggleConfirmed(contextMenu.appointment)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontWeight: '600', color: colors.foreground }}>
              {contextMenu.appointment.confirmed ? '🔄 Non Confermato' : '✅ Confermato'}
            </span>
          </div>
          <div
            onClick={() => deleteAppointment(contextMenu.appointment)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontWeight: '600', color: colors.error }}>
              🗑️ Elimina Appuntamento
            </span>
          </div>
        </div>
      )}

      {/* Menu contestuale assenze */}
      {absenceContextMenu && (
        <div
          style={{
            position: 'fixed',
            top: absenceContextMenu.y,
            left: absenceContextMenu.x,
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            zIndex: 9999,
            minWidth: '180px',
            border: `1px solid ${colors.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '8px 12px', fontWeight: 'bold', borderBottom: `1px solid ${colors.border}`, fontSize: '13px', color: colors.muted }}>
            Segna Assente
          </div>
          <div
            onClick={() => handleCreateAbsence('ferie')}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontWeight: '600', color: colors.foreground }}>
              🏝️ Ferie
            </span>
          </div>
          <div
            onClick={() => handleCreateAbsence('malattia')}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontWeight: '600', color: colors.foreground }}>
              🩺 Malattia
            </span>
          </div>
          <div
            onClick={() => handleCreateAbsence('permesso')}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surface}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <span style={{ fontWeight: '600', color: colors.foreground }}>
              📝 Permesso
            </span>
          </div>
        </div>
      )}

      {/* Modal Stampa PDF */}
      {showPrintModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowPrintModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: colors.foreground }}>
              🖨️ Stampa Foglio Giornaliero
            </h2>

            {/* Selezione Data */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px', color: colors.foreground }}>
                Data *
              </label>
              <input
                type="date"
                value={printDate}
                onChange={(e) => setPrintDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '15px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                }}
              />
            </div>

            {/* Selezione Tecnico */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '6px', color: colors.foreground }}>
                Tecnico *
              </label>
              <select
                value={printTechnicianId}
                onChange={(e) => setPrintTechnicianId(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '15px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                }}
              >
                <option value={1}>Luca Corsi</option>
                <option value={2}>Denis Corsi</option>
              </select>
            </div>

            {/* Pulsanti */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Annulla
              </button>
              <button
                onClick={handlePrintPDF}
                style={{
                  padding: '10px 20px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#fff',
                  backgroundColor: '#0066CC',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Genera PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
