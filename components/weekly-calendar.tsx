import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { Appointment, Customer, Technician } from "@/drizzle/schema";
import { AppointmentFormWeb } from "./appointment-form-web";
import { MonthView } from "./month-view";
import { useNotifications } from "@/hooks/use-notifications";

interface AppointmentWithDetails extends Appointment {
  customer?: Customer;
  technician?: Technician;
}

interface WeeklyCalendarProps {
  onAppointmentMove?: (appointmentId: number, newDate: Date) => void;
  onCustomerClick?: (customerId: number, customerName: string) => void;
}

export function WeeklyCalendar({ onAppointmentMove, onCustomerClick }: WeeklyCalendarProps) {
  const colors = useColors();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [draggedAppointment, setDraggedAppointment] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ day: number; hour: number } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prefilledData, setPrefilledData] = useState<{ date: Date; technicianId: number } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [technicianFilter, setTechnicianFilter] = useState<number | null>(null); // null = tutti, 1 = Luca, 2 = Denis
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week'); // Vista settimana o mese
  const [searchQuery, setSearchQuery] = useState(''); // Ricerca clienti
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appointment: AppointmentWithDetails } | null>(null);

  // Chiudi menu contestuale quando si clicca fuori
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Calcola fine settimana (domenica)
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Fetch appointments per la settimana corrente
  const { data: appointments, isLoading, refetch } = trpc.appointments.list.useQuery({
    startDate: currentWeekStart,
    endDate: weekEnd,
  });

  // Fetch tutti i clienti e tecnici per i dettagli
  const { data: customers } = trpc.customers.list.useQuery({ limit: 1000 });
  const { data: technicians } = trpc.technicians.list.useQuery();

  // Combina dati
  const [appointmentsWithDetails, setAppointmentsWithDetails] = useState<AppointmentWithDetails[]>([]);

  useEffect(() => {
    if (appointments && customers && technicians) {
      const combined = appointments.map((apt) => ({
        ...apt,
        customer: customers.find((c) => c.id === apt.customerId),
        technician: technicians.find((t) => t.id === apt.technicianId),
      }));
      setAppointmentsWithDetails(combined);
    }
  }, [appointments, customers, technicians]);

  // Attiva notifiche push per appuntamenti
  useNotifications(appointmentsWithDetails);

  // Mutation per aggiornare appuntamento
  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mutation per cancellare appuntamento
  const deleteMutation = trpc.appointments.delete.useMutation({
    onSuccess: () => {
      refetch();
      if (onAppointmentMove) {
        // Callback opzionale
      }
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

  // Calcola larghezza colonne: 6 giorni × 2 tecnici = 12 colonne
  // Usa flex-1 per distribuire equamente lo spazio disponibile
  // Ogni colonna si espande per riempire lo spazio

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

  const handleDragStart = (appointmentId: number) => {
    setDraggedAppointment(appointmentId);
  };

  const handleDrop = (day: number, hour: number, minute: number, technicianId?: number) => {
    if (!draggedAppointment) return;

    const appointment = appointmentsWithDetails.find((a) => a.id === draggedAppointment);
    if (!appointment) return;

    // Calcola nuova data con minuti
    const newDate = new Date(weekDays[day]);
    newDate.setHours(hour, minute, 0, 0);

    // Prepara dati aggiornamento
    const updateData: any = {
      id: draggedAppointment,
      scheduledDate: newDate,
    };

    // Se technicianId specificato e diverso dall'attuale, aggiorna anche il tecnico
    if (technicianId && technicianId !== appointment.technicianId) {
      updateData.technicianId = technicianId;
    }

    // Aggiorna appuntamento
    updateAppointmentMutation.mutate(updateData);

    setDraggedAppointment(null);
    setHoveredSlot(null);
  };

  const getAppointmentsForSlot = (dayIndex: number, hour: number, minute: number, technicianId?: number) => {
    return appointmentsWithDetails.filter((apt) => {
      const aptDate = new Date(apt.scheduledDate);
      const slotDate = weekDays[dayIndex];
      // Mostra appuntamento SOLO nello slot di inizio (non negli slot successivi)
      const dateMatch = 
        aptDate.getDate() === slotDate.getDate() &&
        aptDate.getMonth() === slotDate.getMonth() &&
        aptDate.getFullYear() === slotDate.getFullYear() &&
        aptDate.getHours() === hour &&
        aptDate.getMinutes() === minute;
      
      // Applica filtro tecnico globale se attivo
      if (technicianFilter !== null && apt.technicianId !== technicianFilter) {
        return false;
      }
      
      // Applica filtro ricerca se attivo
      if (searchQuery.trim().length > 0 && apt.customer) {
        const query = searchQuery.toLowerCase();
        const customerName = `${apt.customer.firstName} ${apt.customer.lastName}`.toLowerCase();
        const city = apt.customer.city?.toLowerCase() || '';
        const address = apt.customer.address?.toLowerCase() || '';
        const matchesSearch = customerName.includes(query) || city.includes(query) || address.includes(query);
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Se technicianId specificato, filtra anche per tecnico
      if (technicianId) {
        return dateMatch && apt.technicianId === technicianId;
      }
      return dateMatch;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.success;
      case "in_progress":
        return colors.primary;
      case "cancelled":
        return colors.error;
      default:
        return colors.muted;
    }
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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header con navigazione settimana */}
      <View className="flex-row items-center justify-between px-2 py-3 border-b border-border">
        <TouchableOpacity onPress={handlePreviousWeek} className="px-4 py-2 bg-surface rounded-lg">
          <Text className="text-foreground font-semibold">← Precedente</Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-foreground">
          {currentWeekStart.toLocaleDateString("it-IT", { day: "numeric", month: "long" })} -{" "}
          {weekEnd.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </Text>

        <TouchableOpacity onPress={handleNextWeek} className="px-4 py-2 bg-surface rounded-lg">
          <Text className="text-foreground font-semibold">Successiva →</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle Vista + Ricerca + Filtro tecnici */}
      <View className="p-4 border-b border-border gap-3">
        {/* Toggle Vista Settimana/Mese */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg border ${
              calendarView === 'week'
                ? "border-primary bg-primary"
                : "bg-background border-border"
            }`}
            onPress={() => setCalendarView('week')}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                calendarView === 'week' ? "text-white" : "text-foreground"
              }`}
            >
              📅 Settimana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg border ${
              calendarView === 'month'
                ? "border-primary bg-primary"
                : "bg-background border-border"
            }`}
            onPress={() => setCalendarView('month')}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                calendarView === 'month' ? "text-white" : "text-foreground"
              }`}
            >
              📆 Mese
            </Text>
          </TouchableOpacity>
        </View>

        {/* Barra Ricerca */}
        <View className="flex-row items-center bg-surface rounded-lg px-3 py-2 border border-border">
          <Text className="text-lg mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-sm text-foreground"
            placeholder="Cerca cliente..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-lg text-muted">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro Tecnici */}
        <View>
          <Text className="text-sm text-muted mb-2">Mostra:</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg border ${
                technicianFilter === null
                  ? "border-primary"
                  : "bg-background border-border"
              }`}
              style={{
                backgroundColor: technicianFilter === null ? colors.primary : undefined,
              }}
              onPress={() => setTechnicianFilter(null)}
            >
              <Text
                className={`text-sm font-semibold ${
                  technicianFilter === null ? "text-white" : "text-foreground"
                }`}
              >
                Tutti
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-4 py-2 rounded-lg border ${
              technicianFilter === 1
                ? "border-[#0066CC]"
                : "bg-background border-border"
            }`}
            style={{
              backgroundColor: technicianFilter === 1 ? "#0066CC" : undefined,
            }}
            onPress={() => setTechnicianFilter(1)}
          >
            <Text
              className={`text-sm font-semibold ${
                technicianFilter === 1 ? "text-white" : "text-foreground"
              }`}
            >
              Luca Corsi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-4 py-2 rounded-lg border ${
              technicianFilter === 2
                ? "border-[#00AA66]"
                : "bg-background border-border"
            }`}
            style={{
              backgroundColor: technicianFilter === 2 ? "#00AA66" : undefined,
            }}
            onPress={() => setTechnicianFilter(2)}
          >
            <Text
              className={`text-sm font-semibold ${
                technicianFilter === 2 ? "text-white" : "text-foreground"
              }`}
            >
              Denis Corsi
            </Text>
          </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Calendario */}
      <ScrollView className="flex-1">
          <View className="flex-1">
            {calendarView === 'month' ? (
              /* Vista Mensile */
              <MonthView 
                currentDate={currentWeekStart}
                appointments={appointmentsWithDetails}
                onDayClick={(date) => {
                  // Calcola lunedì della settimana del giorno cliccato
                  const day = date.getDay();
                  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(date);
                  monday.setDate(diff);
                  monday.setHours(0, 0, 0, 0);
                  setCurrentWeekStart(monday);
                  setCalendarView('week');
                }}
              />
            ) : (
              /* Vista Settimanale */
              <>
            {/* Header giorni con colonne tecnici */}
            <View className="flex-row border-b border-border">
              <View className="w-16 border-r border-border" />
              {weekDays.flatMap((day, index) => [
                /* Colonna Luca Corsi */
                <View
                  key={`luca-${index}`}
                  className="p-3 border-r border-border items-center"
                  style={{ backgroundColor: colors.surface, flex: 1 }}
                >
                  <Text className="text-sm text-muted">
                    {day.toLocaleDateString("it-IT", { weekday: "short" })} {day.getDate()}
                  </Text>
                  <Text className="text-base font-bold text-foreground mt-1">
                    Luca C.
                  </Text>
                </View>,
                /* Colonna Denis Corsi */
                <View
                  key={`denis-${index}`}
                  className="p-3 border-r border-border items-center"
                  style={{ backgroundColor: colors.surface, flex: 1 }}
                >
                  <Text className="text-sm text-muted">
                    {day.toLocaleDateString("it-IT", { weekday: "short" })} {day.getDate()}
                  </Text>
                  <Text className="text-base font-bold text-foreground mt-1">
                    Denis C.
                  </Text>
                </View>
              ])}
            </View>

            {/* Griglia oraria con slot da 30 minuti */}
            {timeSlots.map((slot, slotIndex) => (
              <View key={slotIndex} className="flex-row border-b border-border">
                {/* Colonna ore */}
                <View className="w-16 p-1 border-r border-border items-center justify-center">
                  <Text className="text-xs text-muted">
                    {slot.hour}:{slot.minute.toString().padStart(2, '0')}
                  </Text>
                </View>

                {/* Slot per ogni giorno (2 colonne per tecnico) */}
                {weekDays.flatMap((day, dayIndex) => [
                    /* Colonna Luca Corsi (technicianId: 1) */
                    <TouchableOpacity
                      key={`luca-${dayIndex}`}
                      className="min-h-16 p-2 border-r border-border"
                      style={{
                        flex: 1,
                        backgroundColor: "#E6F2FF", // Azzurro chiaro per Luca
                        position: 'relative',
                      }}
                      onPress={() => {
                        // Se c'è un appuntamento trascinato, fai drop qui
                        if (draggedAppointment) {
                          handleDrop(dayIndex, slot.hour, slot.minute, 1);
                        } else {
                          // Altrimenti crea nuovo appuntamento
                          const newDate = new Date(day);
                          newDate.setHours(slot.hour, slot.minute, 0, 0);
                          setPrefilledData({ date: newDate, technicianId: 1 });
                          setShowCreateModal(true);
                        }
                      }}
                    >
                      {getAppointmentsForSlot(dayIndex, slot.hour, slot.minute, 1).map((apt) => {
                        // Calcola altezza in base a durata: ogni 30 min = 1 slot (64px min-h-16)
                        const durationSlots = Math.ceil(apt.duration / 30);
                        const cardHeight = durationSlots * 64; // 64px per slot
                        
                        return (
                        <TouchableOpacity
                          key={apt.id}
                          className="p-2 rounded"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: cardHeight,
                            backgroundColor: getTechnicianColor(apt.technicianId) + "20",
                            borderLeftWidth: 3,
                            borderLeftColor: getTechnicianColor(apt.technicianId),
                            zIndex: 10,
                          }}
                          onPress={() => {
                            if (onCustomerClick && apt.customer) {
                              onCustomerClick(apt.customer.id, `${apt.customer.firstName} ${apt.customer.lastName}`);
                            }
                          }}
                          onLongPress={() => handleDragStart(apt.id)}
                          onContextMenu={(e: any) => {
                            e.preventDefault();
                            setContextMenu({ x: e.pageX, y: e.pageY, appointment: apt });
                          }}
                        >
                          <Text
                            className="text-sm font-bold text-foreground"
                            numberOfLines={1}
                          >
                            {apt.customer
                              ? `${apt.customer.firstName} ${apt.customer.lastName}`
                              : "Cliente"}
                          </Text>
                          {apt.customer?.city && (
                            <Text className="text-xs text-muted" numberOfLines={1}>
                              📍 {apt.customer.city}
                            </Text>
                          )}
                          {apt.customer?.address && (
                            <Text className="text-xs text-muted" numberOfLines={1}>
                              {apt.customer.address}
                            </Text>
                          )}
                          {apt.serviceType && (
                            <Text className="text-xs text-muted mt-1" numberOfLines={1}>
                              {apt.serviceType}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )})}
                    </TouchableOpacity>,
                    
                    /* Colonna Denis Corsi (technicianId: 2) */
                    <TouchableOpacity
                      key={`denis-${dayIndex}`}
                      className="min-h-16 p-2 border-r border-border"
                      style={{
                        flex: 1,
                        backgroundColor: "#E6FFF2", // Verde chiaro per Denis
                        position: 'relative',
                      }}
                      onPress={() => {
                        // Se c'è un appuntamento trascinato, fai drop qui
                        if (draggedAppointment) {
                          handleDrop(dayIndex, slot.hour, slot.minute, 2);
                        } else {
                          // Altrimenti crea nuovo appuntamento
                          const newDate = new Date(day);
                          newDate.setHours(slot.hour, slot.minute, 0, 0);
                          setPrefilledData({ date: newDate, technicianId: 2 });
                          setShowCreateModal(true);
                        }
                      }}
                    >
                      {getAppointmentsForSlot(dayIndex, slot.hour, slot.minute, 2).map((apt) => {
                        // Calcola altezza in base a durata: ogni 30 min = 1 slot (64px min-h-16)
                        const durationSlots = Math.ceil(apt.duration / 30);
                        const cardHeight = durationSlots * 64; // 64px per slot
                        
                        return (
                        <TouchableOpacity
                          key={apt.id}
                          className="p-2 rounded"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: cardHeight,
                            backgroundColor: getTechnicianColor(apt.technicianId) + "20",
                            borderLeftWidth: 3,
                            borderLeftColor: getTechnicianColor(apt.technicianId),
                            zIndex: 10,
                          }}
                          onPress={() => {
                            if (onCustomerClick && apt.customer) {
                              onCustomerClick(apt.customer.id, `${apt.customer.firstName} ${apt.customer.lastName}`);
                            }
                          }}
                          onLongPress={() => handleDragStart(apt.id)}
                          onContextMenu={(e: any) => {
                            e.preventDefault();
                            setContextMenu({ x: e.pageX, y: e.pageY, appointment: apt });
                          }}
                        >
                          <Text
                            className="text-sm font-bold text-foreground"
                            numberOfLines={1}
                          >
                            {apt.customer
                              ? `${apt.customer.firstName} ${apt.customer.lastName}`
                              : "Cliente"}
                          </Text>
                          {apt.customer?.city && (
                            <Text className="text-xs text-muted" numberOfLines={1}>
                              📍 {apt.customer.city}
                            </Text>
                          )}
                          {apt.customer?.address && (
                            <Text className="text-xs text-muted" numberOfLines={1}>
                              {apt.customer.address}
                            </Text>
                          )}
                          {apt.serviceType && (
                            <Text className="text-xs text-muted mt-1" numberOfLines={1}>
                              {apt.serviceType}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )})}
                    </TouchableOpacity>
                ])}
              </View>
            ))}
              </>
            )}
          </View>
      </ScrollView>

      {/* Legenda */}
      <View className="flex-row items-center justify-around p-3 border-t border-border bg-surface">
        <View className="flex-row items-center">
          <View
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: colors.muted }}
          />
          <Text className="text-xs text-muted">In attesa</Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: colors.primary }}
          />
          <Text className="text-xs text-muted">In corso</Text>
        </View>
        <View className="flex-row items-center">
          <View
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: colors.success }}
          />
          <Text className="text-xs text-muted">Completato</Text>
        </View>
      </View>

      {draggedAppointment && (
        <View className="absolute bottom-20 left-0 right-0 items-center">
          <View className="bg-primary px-4 py-2 rounded-full">
            <Text className="text-white font-semibold">
              Trascina per spostare l'appuntamento
            </Text>
          </View>
        </View>
      )}

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

      {/* Menu Contestuale */}
      {contextMenu && (
        <View
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
            zIndex: 9999,
            minWidth: 180,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (onCustomerClick && contextMenu.appointment.customer) {
                onCustomerClick(
                  contextMenu.appointment.customer.id,
                  `${contextMenu.appointment.customer.firstName} ${contextMenu.appointment.customer.lastName}`
                );
              }
              setContextMenu(null);
            }}
            className="px-4 py-3 border-b border-border"
          >
            <Text className="text-foreground font-semibold">👤 Apri Cliente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setSelectedAppointment(contextMenu.appointment);
              setShowEditModal(true);
              setContextMenu(null);
            }}
            className="px-4 py-3 border-b border-border"
          >
            <Text className="text-foreground font-semibold">✏️ Modifica</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (confirm(`Vuoi eliminare l'appuntamento con ${contextMenu.appointment.customer?.firstName} ${contextMenu.appointment.customer?.lastName}?`)) {
                deleteMutation.mutate({ id: contextMenu.appointment.id });
              }
              setContextMenu(null);
            }}
            className="px-4 py-3"
          >
            <Text className="text-error font-semibold">🗑️ Cancella</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
