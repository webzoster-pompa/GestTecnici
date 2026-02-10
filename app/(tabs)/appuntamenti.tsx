import React, { useState, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { CustomerDetailSheetMobile } from "@/components/customer-detail-sheet-mobile";
import { WorkDetailsModal } from "@/components/work-details-modal";
import { trpcClient } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

// Calcola distanza tra due coordinate GPS usando formula Haversine (in metri)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raggio della Terra in metri
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distanza in metri
}

interface Appointment {
  id: number;
  customerId: number;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  scheduledDate: Date;
  technicianId: number | null;
  interventionType: string | null;
  description: string | null;
  notes: string | null;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  actualDuration: number | null;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  checkInLatitude: string | null;
  checkInLongitude: string | null;
  customer?: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    latitude: string | null;
    longitude: string | null;
  };
}

export default function AppuntamentiScreen() {
  const colors = useColors();
  const [technicianId, setTechnicianId] = useState<number | null>(null);
  const [technicianName, setTechnicianName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today'); // Tab Oggi/Settimana
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showWorkDetailsModal, setShowWorkDetailsModal] = useState(false);

  // Carica sessione tecnico
  const loadSession = async () => {
    try {
      const savedTechId = await AsyncStorage.getItem("technicianId");
      const savedTechName = await AsyncStorage.getItem("technicianName");
      if (savedTechId && savedTechName) {
        setTechnicianId(parseInt(savedTechId));
        setTechnicianName(savedTechName);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Errore caricamento sessione:", error);
    }
  };

    // Carica appuntamenti (oggi o settimana)
  const loadTodayAppointments = async () => {
    if (!technicianId) return;
    setLoading(true);
    
    const CACHE_KEY = `appointments_${technicianId}`;
    
    try {
      // 1. Carica prima da cache (immediato)
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setAppointments(cached);
      }
      
      // 2. Poi prova a caricare dal server (aggiorna)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const allAppointments = await trpcClient.appointments.list.query();
      
      // Mappa i dati per estrarre customer info correttamente
      const mappedAppointments = allAppointments.map((apt: any) => ({
        ...apt,
        customerName: apt.customer ? `${apt.customer.firstName} ${apt.customer.lastName}` : "N/A",
        customerPhone: apt.customer?.phone || null,
        customerAddress: apt.customer?.address || null,
      }));
      
      // Filtra appuntamenti del tecnico (oggi o settimana)
      let filteredAppts;
      if (viewMode === 'today') {
        // Solo oggi
        filteredAppts = mappedAppointments.filter((apt: Appointment) => {
          const aptDate = new Date(apt.scheduledDate);
          aptDate.setHours(0, 0, 0, 0);
          return apt.technicianId === technicianId && aptDate.getTime() === today.getTime();
        });
      } else {
        // Tutta la settimana (da oggi a +7 giorni)
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        filteredAppts = mappedAppointments.filter((apt: Appointment) => {
          const aptDate = new Date(apt.scheduledDate);
          aptDate.setHours(0, 0, 0, 0);
          return apt.technicianId === technicianId && aptDate >= today && aptDate < weekEnd;
        });
      }
      const todayAppts = filteredAppts;
      
      // Ordina per orario
      todayAppts.sort((a: Appointment, b: Appointment) => 
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
      
      setAppointments(todayAppts as Appointment[]);
      
      // Salva in cache
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(todayAppts));
      setIsOnline(true);
    } catch (error) {
      console.error("Errore caricamento appuntamenti:", error);
      
      // Se fallisce, usa solo cache
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        setAppointments(cached);
        setIsOnline(false);
        Alert.alert("⚠️ Modalità Offline", "Mostrando dati salvati localmente");
      } else {
        Alert.alert("Errore", "Impossibile caricare gli appuntamenti");
      }
    } finally {
      setLoading(false);
    }
  };

  // Ricarica sessione all'avvio
  useEffect(() => {
    loadSession();
  }, []);

  // Ricarica sessione ogni volta che la tab diventa attiva
  useFocusEffect(
    React.useCallback(() => {
      loadSession();
    }, [])
  );

  useEffect(() => {
    if (isLoggedIn && technicianId) {
      loadTodayAppointments();
      const interval = setInterval(loadTodayAppointments, 60000); // Aggiorna ogni minuto
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, technicianId, viewMode]); // Ricarica quando cambia viewMode

  // Sono Arrivato
  const handleArrived = async (appointment: Appointment) => {
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      // Richiedi permessi GPS (solo su mobile)
      if (Platform.OS !== "web") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;
          } catch (locError) {
            console.error("Errore GPS:", locError);
            // Continua senza coordinate se GPS fallisce
          }
        } else {
          Alert.alert(
            "Permessi GPS",
            "Permessi GPS negati. La posizione non verrà salvata."
          );
        }
      }

      await trpcClient.appointments.update.mutate({
        id: appointment.id,
        status: "in_progress",
        checkInTime: new Date(),
        checkInLatitude: latitude ? latitude.toString() : undefined,
        checkInLongitude: longitude ? longitude.toString() : undefined,
      });
      
      // Invalida cache prima di ricaricare
      const CACHE_KEY = `appointments_${technicianId}`;
      await AsyncStorage.removeItem(CACHE_KEY);
      
      const locationMsg = latitude && longitude
        ? `\nPosizione: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        : "";
      Alert.alert("✅ Confermato", `Intervento iniziato${locationMsg}`);
      
      // Piccolo delay per assicurare che il server abbia processato l'aggiornamento
      setTimeout(() => {
        loadTodayAppointments();
      }, 500);
    } catch (error) {
      console.error("Errore aggiornamento stato:", error);
      Alert.alert("Errore", "Impossibile aggiornare lo stato");
    }
  };

  // Completato
  const handleCompleted = async (appointment: Appointment) => {
    try {
      const checkOutTime = new Date();
      console.log('[DEBUG] appointment.checkInTime:', appointment.checkInTime);
      const checkInTime = appointment.checkInTime ? new Date(appointment.checkInTime) : new Date();
      console.log('[DEBUG] checkInTime:', checkInTime);
      console.log('[DEBUG] checkOutTime:', checkOutTime);
      const actualDuration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 1000 / 60); // minuti
      console.log('[DEBUG] actualDuration calculated:', actualDuration);
      
      await trpcClient.appointments.update.mutate({
        id: appointment.id,
        status: "completed",
        checkOutTime,
        actualDuration,
        completedAt: checkOutTime,
      });
      
      // Invalida cache prima di ricaricare
      const CACHE_KEY = `appointments_${technicianId}`;
      await AsyncStorage.removeItem(CACHE_KEY);
      
      Alert.alert("✅ Completato", `Intervento completato (${actualDuration} min)`);
      
      // Piccolo delay per assicurare che il server abbia processato l'aggiornamento
      setTimeout(() => {
        loadTodayAppointments();
      }, 500);
    } catch (error) {
      console.error("Errore completamento:", error);
      Alert.alert("Errore", "Impossibile completare l'intervento");
    }
  };

  // Chiama cliente
  const handleCall = (phone: string | null) => {
    if (!phone) {
      Alert.alert("Errore", "Numero di telefono non disponibile");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  // Apri navigatore
  const handleNavigate = (address: string | null, city: string | null) => {
    if (!address) {
      Alert.alert("Errore", "Indirizzo non disponibile");
      return;
    }
    // Combina indirizzo e città per navigazione precisa
    const fullAddress = city ? `${address}, ${city}` : address;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    Linking.openURL(url);
  };

  // Schermata Login
  if (!isLoggedIn) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 16, textAlign: "center" }}>
            📅 I Miei Appuntamenti
          </Text>
          <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center", marginBottom: 24 }}>
            Effettua il login dalla tab "Timbratura" per vedere i tuoi appuntamenti
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
            onPress={() => {
              // Naviga alla tab Timbratura (gestito dal tab navigator)
              Alert.alert("Info", "Vai alla tab Timbratura per effettuare il login");
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              Vai a Timbratura
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground, marginBottom: 4 }}>
            📅 I Miei Appuntamenti
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 16, color: colors.success, fontWeight: "600" }}>
              👤 {technicianName}
            </Text>
            <View style={{ 
              marginLeft: 12, 
              paddingHorizontal: 8, 
              paddingVertical: 4, 
              borderRadius: 8, 
              backgroundColor: isOnline ? colors.success + "20" : colors.warning + "20" 
            }}>
              <Text style={{ fontSize: 12, color: isOnline ? colors.success : colors.warning, fontWeight: "600" }}>
                {isOnline ? "✅ Online" : "⚠️ Offline"}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {new Date().toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          
          {/* Tab Oggi/Settimana */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: viewMode === 'today' ? colors.primary : colors.surface,
              }}
              onPress={() => setViewMode('today')}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: "600",
                color: viewMode === 'today' ? "#fff" : colors.foreground,
                textAlign: "center",
              }}>
                📅 Oggi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: viewMode === 'week' ? colors.primary : colors.surface,
              }}
              onPress={() => setViewMode('week')}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: "600",
                color: viewMode === 'week' ? "#fff" : colors.foreground,
                textAlign: "center",
              }}>
                📆 Settimana
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: colors.muted }}>Caricamento...</Text>
          </View>
        )}

        {/* Nessun appuntamento */}
        {!loading && appointments.length === 0 && (
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              Nessun appuntamento oggi
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
              Goditi la giornata! 😊
            </Text>
          </View>
        )}

        {/* Lista Appuntamenti */}
        {!loading && appointments.map((apt, index) => {
          // Mostra separatore data nella vista settimana
          const showDateSeparator = viewMode === 'week' && (
            index === 0 || 
            new Date(appointments[index - 1].scheduledDate).toDateString() !== new Date(apt.scheduledDate).toDateString()
          );
          const isCompleted = apt.status === "completed";
          const isInProgress = apt.status === "in_progress";
          const isPending = apt.status === "scheduled";

          return (
            <React.Fragment key={apt.id}>
              {/* Separatore Data (solo vista settimana) */}
              {showDateSeparator && (
                <View style={{ marginBottom: 12, marginTop: index > 0 ? 8 : 0 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                    {new Date(apt.scheduledDate).toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                </View>
              )}
              
              <View
                style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: isCompleted ? colors.success : isInProgress ? colors.warning : colors.border,
              }}
            >
              {/* Orario e Stato */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
                  🕐 {new Date(apt.scheduledDate).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <View
                  style={{
                    backgroundColor: isCompleted ? colors.success : isInProgress ? colors.warning : colors.primary,
                    borderRadius: 8,
                    paddingVertical: 4,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>
                    {isCompleted ? "✅ Completato" : isInProgress ? "🔧 In Corso" : "📌 Programmato"}
                  </Text>
                </View>
              </View>

              {/* Cliente */}
              <View style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (isCompleted) {
                      // Se completato, apri modal dettagli intervento
                      setSelectedAppointment(apt);
                      setShowWorkDetailsModal(true);
                    } else if (apt.customer) {
                      // Altrimenti apri scheda cliente
                      setSelectedCustomerId(apt.customer.id);
                      setShowCustomerSheet(true);
                    }
                  }}
                  style={{ marginBottom: 4 }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary, marginBottom: 4, textDecorationLine: "underline" }}>
                    👤 {apt.customer ? `${apt.customer.firstName} ${apt.customer.lastName}` : "Cliente sconosciuto"}
                    {isCompleted && " 📝"}
                  </Text>
                </TouchableOpacity>
                {apt.customer?.address && (
                  <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 2 }}>
                    📍 {apt.customer.address}{apt.customer.city ? `, ${apt.customer.city}` : ""}
                  </Text>
                )}
                {apt.customer?.phone && (
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    📞 {apt.customer.phone}
                  </Text>
                )}
              </View>

              {/* Badge Distanza GPS */}
              {isInProgress && apt.checkInLatitude && apt.checkInLongitude && apt.customer?.latitude && apt.customer?.longitude && (() => {
                const distance = calculateDistance(
                  parseFloat(apt.checkInLatitude),
                  parseFloat(apt.checkInLongitude),
                  parseFloat(apt.customer.latitude),
                  parseFloat(apt.customer.longitude)
                );
                const isOnSite = distance <= 100;
                return (
                  <View style={{ marginBottom: 12, padding: 8, backgroundColor: isOnSite ? colors.success + "20" : colors.warning + "20", borderRadius: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: isOnSite ? colors.success : colors.warning }}>
                      {isOnSite ? "📍 Sei sul posto" : `⚠️ Lontano dal cliente (${Math.round(distance)}m)`}
                    </Text>
                  </View>
                );
              })()}

              {/* Intervento */}
              {apt.serviceType && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 2 }}>
                    🔧 {apt.serviceType}
                  </Text>
                </View>
              )}

              {/* Note */}
              {apt.notes && (
                <View style={{ marginBottom: 12, padding: 8, backgroundColor: colors.background, borderRadius: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    📝 {apt.notes}
                  </Text>
                </View>
              )}

              {/* Durata (se completato) */}
              {isCompleted && (apt.actualDuration !== null || apt.duration) && (
                <Text style={{ fontSize: 13, color: colors.success, fontWeight: "600", marginBottom: 12 }}>
                  ⏱️ Durata effettiva: {apt.actualDuration ?? apt.duration} minuti
                </Text>
              )}

              {/* Azioni */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                {/* Chiama */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                  onPress={() => handleCall(apt.customer?.phone)}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                    📞 Chiama
                  </Text>
                </TouchableOpacity>

                {/* Naviga */}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                  onPress={() => handleNavigate(apt.customer?.address, apt.customer?.city)}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                    🗺️ Naviga
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pulsanti Stato */}
              {!isCompleted && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  {isPending && (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: colors.success,
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                      onPress={() => handleArrived(apt)}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                        ✅ Sono Arrivato
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isInProgress && (
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: colors.success,
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                      onPress={() => handleCompleted(apt)}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                        ✅ Completato
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* Scheda Cliente Mobile */}
      <CustomerDetailSheetMobile
        customerId={selectedCustomerId || 0}
        visible={showCustomerSheet}
        onClose={() => {
          setShowCustomerSheet(false);
          setSelectedCustomerId(null);
          // Ricarica appuntamenti per aggiornare eventuali modifiche
          loadTodayAppointments();
        }}
      />

      {/* Modal Dettagli Intervento */}
      {selectedAppointment && (
        <WorkDetailsModal
          visible={showWorkDetailsModal}
          onClose={() => {
            setShowWorkDetailsModal(false);
            setSelectedAppointment(null);
            // Ricarica appuntamenti per aggiornare eventuali modifiche
            loadTodayAppointments();
          }}
          appointmentId={selectedAppointment.id}
          customerName={
            selectedAppointment.customer
              ? `${selectedAppointment.customer.firstName} ${selectedAppointment.customer.lastName}`
              : "Cliente sconosciuto"
          }
          actualDuration={selectedAppointment.actualDuration}
        />
      )}
    </ScreenContainer>
  );
}
