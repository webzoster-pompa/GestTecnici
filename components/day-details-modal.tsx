import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

interface DayDetailsModalProps {
  visible: boolean;
  date: Date | null;
  onClose: () => void;
  onAppointmentClick?: (customerId: number, customerName: string) => void;
}

export function DayDetailsModal({ visible, date, onClose, onAppointmentClick }: DayDetailsModalProps) {
  const colors = useColors();
  
  // Calcola date solo se date è definita, altrimenti usa valori di default
  const dayStart = date ? new Date(date) : new Date();
  if (date) dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = date ? new Date(date) : new Date();
  if (date) dayEnd.setHours(23, 59, 59, 999);
  
  // Hooks devono essere chiamati sempre, non condizionalmente
  const { data: appointments, isLoading } = trpc.appointments.list.useQuery({
    startDate: dayStart,
    endDate: dayEnd,
  }, {
    enabled: visible && !!date, // Disabilita query se date è null
  });
  
  const { data: customers, isLoading: isLoadingCustomers } = trpc.customers.list.useQuery(undefined, {
    enabled: visible, // Carica solo quando modal è visibile
  });
  const { data: technicians, isLoading: isLoadingTechnicians } = trpc.technicians.list.useQuery(undefined, {
    enabled: visible, // Carica solo quando modal è visibile
  });
  
  // Ora possiamo fare return condizionale DOPO tutti gli hooks
  if (!date) return null;
  
  // DEBUG: Log per verificare dati caricati
  console.log('[DayDetailsModal] customers:', customers?.length || 0, 'items');
  console.log('[DayDetailsModal] technicians:', technicians?.length || 0, 'items');
  console.log('[DayDetailsModal] appointments:', appointments?.length || 0, 'items');
  if (appointments && appointments.length > 0) {
    console.log('[DayDetailsModal] First appointment customerId:', appointments[0].customerId);
    console.log('[DayDetailsModal] Customer exists?', customers?.find(c => c.id === appointments[0].customerId) ? 'YES' : 'NO');
  }
  
  const getCustomerName = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Cliente sconosciuto";
  };
  
  const getCustomerCity = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.city || "";
  };
  
  const getCustomerAddress = (customerId: number) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.address || "";
  };
  
  const getTechnicianName = (technicianId: number) => {
    const tech = technicians?.find(t => t.id === technicianId);
    return tech ? `${tech.firstName} ${tech.lastName}` : "Tecnico sconosciuto";
  };
  
  const getTechnicianColor = (technicianId: number) => {
    const colors = ["#22C55E", "#3B82F6", "#F59E0B"]; // Verde, Blu, Arancione
    return colors[(technicianId - 1) % colors.length];
  };
  
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("it-IT", { 
      weekday: "long", 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  };
  
  const sortedAppointments = appointments?.sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ 
          flex: 1, 
          backgroundColor: "rgba(0,0,0,0.5)", 
          justifyContent: "center", 
          alignItems: "center",
          padding: 20,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: colors.background,
            borderRadius: 16,
            padding: 24,
            width: Platform.OS === "web" ? 600 : "100%",
            maxHeight: "80%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: "bold", 
              color: colors.foreground,
              textTransform: "capitalize",
              marginBottom: 4,
            }}>
              {formatDate(date)}
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted }}>
              {sortedAppointments?.length || 0} {sortedAppointments?.length === 1 ? "appuntamento" : "appuntamenti"}
            </Text>
          </View>
          
          {/* Appointments List */}
          {isLoading || isLoadingCustomers || isLoadingTechnicians ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.muted, fontSize: 14 }}>
                Caricamento dati...
              </Text>
            </View>
          ) : sortedAppointments && sortedAppointments.length > 0 ? (
            <ScrollView style={{ maxHeight: 400 }}>
              {sortedAppointments.map((apt, index) => {
                const techColor = getTechnicianColor(apt.technicianId);
                const endTime = new Date(apt.scheduledDate);
                endTime.setMinutes(endTime.getMinutes() + apt.duration);
                
                return (
                  <TouchableOpacity
                    key={apt.id}
                    onPress={() => {
                      if (onAppointmentClick) {
                        const customerName = getCustomerName(apt.customerId);
                        onAppointmentClick(apt.customerId, customerName);
                        onClose();
                      }
                    }}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: techColor,
                    }}
                  >
                    {/* Time */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ 
                        backgroundColor: techColor + "20", 
                        paddingHorizontal: 12, 
                        paddingVertical: 6, 
                        borderRadius: 8,
                      }}>
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: techColor }}>
                          {formatTime(apt.scheduledDate)} - {formatTime(endTime)}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, color: colors.muted, marginLeft: 8 }}>
                        ({apt.duration} min)
                      </Text>
                    </View>
                    
                    {/* Customer */}
                    <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                      {getCustomerName(apt.customerId)}
                    </Text>
                    
                    {/* City and Address */}
                    {(getCustomerCity(apt.customerId) || getCustomerAddress(apt.customerId)) && (
                      <View style={{ marginBottom: 8 }}>
                        {getCustomerCity(apt.customerId) && (
                          <Text style={{ fontSize: 14, color: colors.muted }}>
                            📍 {getCustomerCity(apt.customerId)}
                          </Text>
                        )}
                        {getCustomerAddress(apt.customerId) && (
                          <Text style={{ fontSize: 14, color: colors.muted }}>
                            🏠 {getCustomerAddress(apt.customerId)}
                          </Text>
                        )}
                      </View>
                    )}
                    
                    {/* Technician */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <View style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: 4, 
                        backgroundColor: techColor,
                        marginRight: 8,
                      }} />
                      <Text style={{ fontSize: 14, color: colors.muted }}>
                        Tecnico: {getTechnicianName(apt.technicianId)}
                      </Text>
                    </View>
                    
                    {/* Service Type */}
                    {apt.serviceType && (
                      <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
                        Tipo: {apt.serviceType}
                      </Text>
                    )}
                    
                    {/* Notes */}
                    {apt.notes && (
                      <Text style={{ fontSize: 14, color: colors.muted, fontStyle: "italic" }}>
                        Note: {apt.notes}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center" }}>
                Nessun appuntamento per questo giorno
              </Text>
            </View>
          )}
          
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              Chiudi
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
