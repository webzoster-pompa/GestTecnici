import { View, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Appointment, Customer, Technician } from "@/drizzle/schema";

interface AppointmentWithDetails extends Appointment {
  customer?: Customer;
  technician?: Technician;
}

interface MonthViewProps {
  currentDate: Date;
  appointments: AppointmentWithDetails[];
  onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, appointments, onDayClick }: MonthViewProps) {
  const colors = useColors();

  // Calcola primo giorno del mese
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Calcola lunedì della prima settimana (può essere nel mese precedente)
  const firstMonday = new Date(firstDayOfMonth);
  const dayOfWeek = firstDayOfMonth.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  firstMonday.setDate(firstDayOfMonth.getDate() + diff);

  // Genera array di 35 giorni (5 settimane × 7 giorni)
  const days: Date[] = [];
  for (let i = 0; i < 35; i++) {
    const day = new Date(firstMonday);
    day.setDate(firstMonday.getDate() + i);
    days.push(day);
  }

  // Conta appuntamenti per giorno
  const getAppointmentsCount = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.scheduledDate);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    }).length;
  };

  // Verifica se è il giorno corrente
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Verifica se è nel mese corrente
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <View className="flex-1 p-4">
      {/* Header mese */}
      <View className="mb-4">
        <Text className="text-2xl font-bold text-foreground text-center">
          {currentDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
        </Text>
      </View>

      {/* Header giorni settimana */}
      <View className="flex-row mb-2">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
          <View key={day} className="flex-1 items-center">
            <Text className="text-sm font-semibold text-muted">{day}</Text>
          </View>
        ))}
      </View>

      {/* Griglia giorni (5 righe × 7 colonne) */}
      {[0, 1, 2, 3, 4].map((weekIndex) => (
        <View key={weekIndex} className="flex-row mb-1">
          {days.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, dayIndex) => {
            const count = getAppointmentsCount(day);
            const today = isToday(day);
            const currentMonth = isCurrentMonth(day);

            return (
              <TouchableOpacity
                key={dayIndex}
                className="flex-1 aspect-square p-2 border border-border rounded-lg mr-1"
                style={{
                  backgroundColor: today
                    ? colors.primary + "20"
                    : colors.background,
                  opacity: currentMonth ? 1 : 0.4,
                }}
                onPress={() => onDayClick(day)}
              >
                <Text
                  className={`text-sm font-bold ${
                    today ? "text-primary" : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </Text>
                {count > 0 && (
                  <View
                    className="mt-1 px-2 py-1 rounded-full items-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-xs font-bold text-white">{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
