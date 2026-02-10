import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Linking, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { SignatureCapture } from "@/components/signature-capture";
import { DailyRouteMap } from "@/components/daily-route-map";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { Appointment, Customer } from "@/drizzle/schema";

interface AppointmentWithCustomer extends Appointment {
  customer?: Customer;
}

export function TechnicianCalendar({ technicianId }: { technicianId: number }) {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSignature, setShowSignature] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showRouteMap, setShowRouteMap] = useState(false);
  
  // Get today's appointments
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  const { data: appointments, isLoading, refetch } = trpc.appointments.getByTechnician.useQuery({
    technicianId,
    startDate: startOfDay,
    endDate: endOfDay,
  });
  
  // Get customer details for each appointment
  const [appointmentsWithCustomers, setAppointmentsWithCustomers] = useState<AppointmentWithCustomer[]>([]);
  
  // Simplified: just show appointments without customer details for now
  // In production, you'd use a JOIN query or batch fetch
  useEffect(() => {
    if (appointments) {
      setAppointmentsWithCustomers(appointments);
    }
  }, [appointments]);
  
  // Auto-refresh timer every minute for in-progress appointments
  useEffect(() => {
    const hasInProgress = appointmentsWithCustomers.some(apt => apt.status === "in_progress");
    if (!hasInProgress) return;
    
    const interval = setInterval(() => {
      // Force re-render to update timer display
      setAppointmentsWithCustomers([...appointmentsWithCustomers]);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [appointmentsWithCustomers]);
  
  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const handleMarkCompleted = (appointmentId: number) => {
    setSelectedAppointmentId(appointmentId);
    setShowPaymentModal(true);
  };
  
  const handlePaymentSubmit = async (paymentMethod: "cash" | "pos" | "transfer" | "unpaid") => {
    if (!selectedAppointmentId) return;
    
    const now = new Date();
    const appointment = appointmentsWithCustomers.find(a => a.id === selectedAppointmentId);
    
    // Calculate actualDuration if checkInTime exists
    let actualDuration: number | undefined;
    if (appointment?.checkInTime) {
      const checkIn = new Date(appointment.checkInTime);
      const diffMs = now.getTime() - checkIn.getTime();
      actualDuration = Math.round(diffMs / (1000 * 60)); // Convert to minutes
    }
    
    // Get GPS location for check-out
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        updateAppointmentMutation.mutate({
          id: selectedAppointmentId,
          status: "completed",
          completedAt: now,
          checkOutTime: now,
          checkOutLatitude: location.coords.latitude.toString(),
          checkOutLongitude: location.coords.longitude.toString(),
          actualDuration,
          paymentMethod,
          paymentAmount: paymentAmount ? parseFloat(paymentAmount) : undefined,
          invoiceStatus: paymentMethod !== "unpaid" ? "pending" : undefined,
        });
      } else {
        // No GPS permission, save without location
        updateAppointmentMutation.mutate({
          id: selectedAppointmentId,
          status: "completed",
          completedAt: now,
          checkOutTime: now,
          actualDuration,
          paymentMethod,
          paymentAmount: paymentAmount ? parseFloat(paymentAmount) : undefined,
          invoiceStatus: paymentMethod !== "unpaid" ? "pending" : undefined,
        });
      }
    } catch (error) {
      console.error("[Tecnico] Errore GPS check-out:", error);
      // Save without location on error
      updateAppointmentMutation.mutate({
        id: selectedAppointmentId,
        status: "completed",
        completedAt: now,
        checkOutTime: now,
        actualDuration,
        paymentMethod,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : undefined,
        invoiceStatus: paymentMethod !== "unpaid" ? "pending" : undefined,
      });
    }
    
    setShowPaymentModal(false);
    setPaymentAmount("");
    setSelectedAppointmentId(null);
  };
  
  const handleNavigate = (address: string, city: string) => {
    const fullAddress = `${address}, ${city}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    Linking.openURL(url);
  };
  
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "In attesa";
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
  
  const renderAppointment = ({ item }: { item: AppointmentWithCustomer }) => {
    const appointmentTime = new Date(item.scheduledDate);
    
    return (
      <View className="bg-surface rounded-2xl p-4 mb-3 border border-border">
        {/* Header with time and status */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-foreground">
            {appointmentTime.toLocaleTimeString("it-IT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: getStatusColor(item.status) }}
          >
            <Text className="text-white text-xs font-semibold">
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        
        {/* Customer info */}
        {item.customer && (
          <>
            <Text className="text-xl font-bold mb-1" style={{ color: "#000000" }}>
              {item.customer.firstName} {item.customer.lastName}
            </Text>
            
            <TouchableOpacity
              className="flex-row items-center mb-2"
              onPress={() => handleNavigate(item.customer!.address, item.customer!.city)}
            >
              <Text className="text-base" style={{ color: "#000000" }}>
                📍 {item.customer.address}, {item.customer.city}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center mb-3"
              onPress={() => handleCall(item.customer!.phone)}
            >
              <Text className="text-base" style={{ color: "#000000" }}>
                📞 {item.customer.phone}
              </Text>
            </TouchableOpacity>
          </>
        )}
        
        {/* Service type and notes */}
        {item.serviceType && (
          <Text className="text-sm mb-1" style={{ color: "#4B5563" }}>
            Tipo: {item.serviceType}
          </Text>
        )}
        
        {item.notes && (
          <Text className="text-sm mb-3" style={{ color: "#4B5563" }}>
            Note: {item.notes}
          </Text>
        )}
        
        {/* Actions */}
        {item.status === "scheduled" && (
          <View className="gap-2">
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg p-3"
                onPress={() => handleNavigate(item.customer!.address, item.customer!.city)}
              >
                <Text className="text-white text-center font-semibold">
                  📍 Naviga
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-warning rounded-lg p-3"
                onPress={async () => {
                  console.log("[Tecnico] Sono arrivato dal cliente, ID:", item.id);
                  const now = new Date();
                  
                  // Get GPS location
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                      updateAppointmentMutation.mutate({
                        id: item.id,
                        status: "in_progress",
                        checkInTime: now,
                        checkInLatitude: location.coords.latitude.toString(),
                        checkInLongitude: location.coords.longitude.toString(),
                      });
                    } else {
                      // No GPS permission, save without location
                      updateAppointmentMutation.mutate({
                        id: item.id,
                        status: "in_progress",
                        checkInTime: now,
                      });
                    }
                  } catch (error) {
                    console.error("[Tecnico] Errore GPS check-in:", error);
                    // Save without location on error
                    updateAppointmentMutation.mutate({
                      id: item.id,
                      status: "in_progress",
                      checkInTime: now,
                    });
                  }
                }}
              >
                <Text className="text-white text-center font-semibold">
                  👋 Sono arrivato
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              className="bg-success rounded-lg p-3"
              onPress={() => handleMarkCompleted(item.id)}
            >
              <Text className="text-white text-center font-semibold">
                ✅ Completato
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* In Progress */}
        {item.status === "in_progress" && (
          <View className="gap-2">
            <View className="bg-warning rounded-lg p-3 mb-2">
              <Text className="text-white text-center font-semibold">
                🔧 Intervento in corso...
              </Text>
              {item.checkInTime && (() => {
                const checkIn = new Date(item.checkInTime);
                const now = new Date();
                const durationMs = now.getTime() - checkIn.getTime();
                const minutes = Math.floor(durationMs / 60000);
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
                return (
                  <Text className="text-white text-center text-sm mt-1">
                    {`⏱️ Tempo effettivo: ${timeStr}`}
                  </Text>
                );
              })()}
            </View>
            
            <TouchableOpacity
              className="bg-success rounded-lg p-3"
              onPress={() => handleMarkCompleted(item.id)}
            >
              <Text className="text-white text-center font-semibold">
                ✅ Completato
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Signature button for completed appointments */}
        {item.status === "completed" && !item.signatureUrl && (
          <TouchableOpacity
            className="bg-primary rounded-lg p-3"
            onPress={() => {
              setSelectedAppointmentId(item.id);
              setShowSignature(true);
            }}
          >
            <Text className="text-white text-center font-semibold">
              ✍️ Richiedi Firma Cliente
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Signature saved indicator */}
        {item.signatureUrl && (
          <View className="bg-success rounded-lg p-3">
            <Text className="text-white text-center font-semibold">
              ✅ Firmato il {item.signedAt ? new Date(item.signedAt).toLocaleDateString("it-IT") : ""}
            </Text>
          </View>
        )}
      </View>
    );
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
      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-foreground text-xl font-bold mb-4">
              Come ha pagato il cliente?
            </Text>
            
            {/* Payment Amount Input */}
            <View className="mb-4">
              <Text className="text-foreground text-sm mb-2">Importo (opzionale)</Text>
              <TextInput
                className="bg-white border border-border rounded-lg p-3"
                placeholder="Es. 150.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                style={{ color: "#000000", fontSize: 16 }}
              />
            </View>
            
            {/* Payment Method Buttons */}
            <View className="gap-3">
              <TouchableOpacity
                className="bg-success rounded-lg p-4 flex-row items-center justify-center"
                onPress={() => handlePaymentSubmit("cash")}
              >
                <Text className="text-white text-lg font-semibold">💵 Contanti</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-primary rounded-lg p-4 flex-row items-center justify-center"
                onPress={() => handlePaymentSubmit("pos")}
              >
                <Text className="text-white text-lg font-semibold">💳 POS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-blue-500 rounded-lg p-4 flex-row items-center justify-center"
                onPress={() => handlePaymentSubmit("transfer")}
              >
                <Text className="text-white text-lg font-semibold">🏦 Bonifico</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-warning rounded-lg p-4 flex-row items-center justify-center"
                onPress={() => handlePaymentSubmit("unpaid")}
              >
                <Text className="text-white text-lg font-semibold">⏳ Non Pagato</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-surface border border-border rounded-lg p-4"
                onPress={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                }}
              >
                <Text className="text-foreground text-center font-semibold">Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Signature Modal */}
      {selectedAppointmentId && (
        <SignatureCapture
          appointmentId={selectedAppointmentId}
          visible={showSignature}
          onClose={() => {
            setShowSignature(false);
            setSelectedAppointmentId(null);
          }}
          onSaved={() => {
            refetch();
          }}
        />
      )}
      {/* Header */}
      <View className="bg-primary p-4">
        <Text className="text-white text-2xl font-bold">
          {selectedDate.toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </Text>
        <Text className="text-white text-base">
          {appointmentsWithCustomers.length} appuntamenti
        </Text>
      </View>
      
      {/* Appointments list */}
      {appointmentsWithCustomers.length > 0 ? (
        <FlatList
          data={appointmentsWithCustomers}
          renderItem={renderAppointment}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-muted text-center text-lg">
            Nessun appuntamento per oggi
          </Text>
        </View>
      )}
    </View>
  );
}
