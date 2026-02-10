import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

interface MonthlyCalendarProps {
  onDayClick: (date: Date) => void;
}

export function MonthlyCalendar({ onDayClick }: MonthlyCalendarProps) {
  const colors = useColors();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<number | null>(null);
  
  // Get appointments for the current month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const { data: appointments, isLoading } = trpc.appointments.list.useQuery({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });
  
  // Get technicians for filter
  const { data: technicians } = trpc.technicians.list.useQuery();
  
  // Filter appointments by technician if selected
  const filteredAppointments = selectedTechnicianId
    ? appointments?.filter(apt => apt.technicianId === selectedTechnicianId)
    : appointments;
  
  // Calculate days in month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Adjust first day (Monday = 0, Sunday = 6)
  const firstDayAdjusted = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  // Count appointments per day
  const appointmentsByDay: Record<string, number> = {};
  filteredAppointments?.forEach((apt) => {
    const aptDate = new Date(apt.scheduledDate);
    const dayKey = `${aptDate.getFullYear()}-${aptDate.getMonth() + 1}-${aptDate.getDate()}`;
    appointmentsByDay[dayKey] = (appointmentsByDay[dayKey] || 0) + 1;
  });
  
  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get badge color based on appointment count
  const getBadgeColor = (count: number) => {
    if (count === 0) return null;
    if (count <= 2) return "#22C55E"; // Verde
    if (count <= 4) return "#F59E0B"; // Giallo/Arancione
    return "#EF4444"; // Rosso
  };
  
  // Generate calendar days
  const calendarDays: Array<{ day: number; isCurrentMonth: boolean; date: Date; count: number }> = [];
  
  // Previous month days
  for (let i = firstDayAdjusted - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    calendarDays.push({ day, isCurrentMonth: false, date, count: appointmentsByDay[dayKey] || 0 });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    calendarDays.push({ day, isCurrentMonth: true, date, count: appointmentsByDay[dayKey] || 0 });
  }
  
  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    calendarDays.push({ day, isCurrentMonth: false, date, count: appointmentsByDay[dayKey] || 0 });
  }
  
  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  const dayNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  
  const today = new Date();
  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Check if it's Sunday (non-working day)
  const isSunday = (date: Date) => {
    return date.getDay() === 0;
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      {/* Header with Technician Filter */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 8 }}
          >
            <Text style={{ fontSize: 18, color: colors.foreground }}>←</Text>
          </TouchableOpacity>
          
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={goToToday} style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 14, color: colors.primary }}>Oggi</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            onPress={goToNextMonth}
            style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 8 }}
          >
            <Text style={{ fontSize: 18, color: colors.foreground }}>→</Text>
          </TouchableOpacity>
        </View>
        
        {/* Technician Filter */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Filtra per Tecnico:
          </Text>
          {Platform.OS === "web" ? (
            <select
              value={selectedTechnicianId?.toString() || ""}
              onChange={(e) => setSelectedTechnicianId(e.target.value ? Number(e.target.value) : null)}
              style={{
                padding: 12,
                backgroundColor: colors.surface,
                color: colors.foreground,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontSize: 16,
              }}
            >
              <option value="">Tutti i tecnici</option>
              {technicians?.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.firstName} {tech.lastName}
                </option>
              ))}
            </select>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => setSelectedTechnicianId(null)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: selectedTechnicianId === null ? colors.primary : colors.surface,
                  borderRadius: 20,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: selectedTechnicianId === null ? "#fff" : colors.foreground, fontWeight: "600" }}>
                  Tutti
                </Text>
              </TouchableOpacity>
              {technicians?.map((tech) => (
                <TouchableOpacity
                  key={tech.id}
                  onPress={() => setSelectedTechnicianId(tech.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: selectedTechnicianId === tech.id ? colors.primary : colors.surface,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: selectedTechnicianId === tech.id ? "#fff" : colors.foreground, fontWeight: "600" }}>
                    {tech.firstName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        
        {/* Legend */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16, marginBottom: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#22C55E", marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: colors.muted }}>1-2 app.</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16, marginBottom: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#F59E0B", marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: colors.muted }}>3-4 app.</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#EF4444", marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: colors.muted }}>5+ app.</Text>
          </View>
        </View>
      </View>
      
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView>
          {/* Day names */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {dayNames.map((dayName, idx) => (
              <View key={dayName} style={{ flex: 1, alignItems: "center", padding: 8 }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: "600", 
                  color: idx === 6 ? "#EF4444" : colors.muted // Domenica in rosso
                }}>
                  {dayName}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Calendar grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {calendarDays.map((dayInfo, index) => {
              const badgeColor = getBadgeColor(dayInfo.count);
              const isSundayDay = isSunday(dayInfo.date);
              
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (dayInfo.isCurrentMonth) {
                      onDayClick(dayInfo.date);
                    }
                  }}
                  style={{
                    width: `${100 / 7}%`,
                    aspectRatio: 1,
                    padding: 4,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: isToday(dayInfo.date) 
                        ? colors.primary 
                        : dayInfo.isCurrentMonth 
                          ? colors.surface 
                          : colors.background,
                      borderRadius: 8,
                      borderWidth: isSundayDay && dayInfo.isCurrentMonth ? 2 : 1,
                      borderColor: isSundayDay && dayInfo.isCurrentMonth ? "#EF4444" : colors.border,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: dayInfo.isCurrentMonth ? 1 : 0.4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: isToday(dayInfo.date) ? "bold" : "normal",
                        color: isToday(dayInfo.date) 
                          ? "#fff" 
                          : isSundayDay && dayInfo.isCurrentMonth
                            ? "#EF4444"
                            : dayInfo.isCurrentMonth 
                              ? colors.foreground 
                              : colors.muted,
                      }}
                    >
                      {dayInfo.day}
                    </Text>
                    {badgeColor && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 4,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: badgeColor,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
