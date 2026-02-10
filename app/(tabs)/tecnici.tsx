/**
 * App Mobile Tecnici - Interfaccia Semplificata
 * Mostra solo appuntamenti del giorno con pulsanti Arrivato/Finito
 */

import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, Modal, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { TechnicianRouteMap } from "@/components/technician-route-map";
import { trpc } from "@/lib/trpc";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React from "react";

export default function TecniciScreen() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [checkInTimes, setCheckInTimes] = useState<Record<number, Date>>({});
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = settimana corrente, +1 = prossima, -1 = precedente
  
  // State form pagamento
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "bank_transfer" | "other">("cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  // ID tecnico loggato (recuperato da AsyncStorage)
  const [technicianId, setTechnicianId] = useState<number | null>(null);
  const [technicianName, setTechnicianName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Carica sessione tecnico
  const loadSession = async () => {
    try {
      const savedTechId = await AsyncStorage.getItem("technicianId");
      const savedTechName = await AsyncStorage.getItem("technicianName");
      if (savedTechId && savedTechName) {
        setTechnicianId(parseInt(savedTechId));
        setTechnicianName(savedTechName);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Errore caricamento sessione:", error);
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

  // Calcola range date in base alla modalità di visualizzazione
  const today = new Date();
  let startDate: string;
  let endDate: string;
  let weekStart: Date;
  let weekEnd: Date;

  if (viewMode === "day") {
    // Solo oggi
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    startDate = start.toISOString();
    endDate = end.toISOString();
    weekStart = start;
    weekEnd = end;
  } else {
    // Settimana corrente (lunedì - domenica) + offset
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lunedì
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    // Applica offset settimana (7 giorni per settimana)
    monday.setDate(monday.getDate() + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    startDate = monday.toISOString();
    endDate = sunday.toISOString();
    weekStart = monday;
    weekEnd = sunday;
  }

  const { data: appointments, isLoading, refetch } = trpc.appointments.listByTechnician.useQuery(
    {
      technicianId: technicianId!,
      startDate,
      endDate,
    },
    {
      // Ricarica quando cambia weekOffset o viewMode
      refetchOnMount: true,
      enabled: isLoggedIn && technicianId !== null,
    }
  );

  // Query per dati cliente selezionato
  const { data: customerData } = trpc.customers.getById.useQuery(
    { id: selectedCustomerId! },
    { enabled: !!selectedCustomerId }
  );

  // Query per storico interventi cliente
  const { data: customerHistory } = trpc.appointments.getCustomerHistory.useQuery(
    { customerId: selectedCustomerId!, limit: 10, period: "all" },
    { enabled: !!selectedCustomerId }
  );

  // Query per lista pagamenti cliente
  const { data: customerPayments = [] } = trpc.payments.getByCustomer.useQuery(
    { customerId: selectedCustomerId! },
    { enabled: !!selectedCustomerId }
  );

  const utils = trpc.useUtils();

  // Mutation per check-in
  const checkInMutation = trpc.appointments.checkIn.useMutation({
    onSuccess: () => {
      Alert.alert("✓ Check-in effettuato", "Hai registrato l'arrivo dal cliente");
      refetch();
    },
    onError: (error: any) => {
      Alert.alert("Errore", `Check-in fallito: ${error.message}`);
    },
  });

  // Mutation per check-out
  const checkOutMutation = trpc.appointments.checkOut.useMutation({
    onSuccess: () => {
      Alert.alert("✓ Lavoro completato", "Intervento registrato con successo");
      setSelectedAppointmentId(null);
      // Invalida cache per aggiornare calendario PC in tempo reale
      utils.appointments.list.invalidate();
      utils.appointments.listByTechnician.invalidate();
      refetch();
    },
    onError: (error: any) => {
      Alert.alert("Errore", `Check-out fallito: ${error.message}`);
    },
  });

  // Mutation per creare pagamento
  const createPaymentMutation = trpc.payments.create.useMutation({
    onSuccess: () => {
      Alert.alert("✓ Pagamento registrato", "Il pagamento è stato salvato con successo");
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentNotes("");
      // Invalida cache per ricaricare lista pagamenti
      utils.payments.getByCustomer.invalidate();
    },
    onError: (error: any) => {
      Alert.alert("Errore", `Salvataggio fallito: ${error.message}`);
    },
  });

  const handleArrivatoCliente = async (appointmentId: number) => {
    try {
      // Richiedi permessi GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "GPS Richiesto",
          "Attiva il GPS per registrare l'arrivo dal cliente"
        );
        return;
      }

      // Ottieni posizione corrente
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Salva timestamp check-in locale
      setCheckInTimes({
        ...checkInTimes,
        [appointmentId]: new Date(),
      });
      setSelectedAppointmentId(appointmentId);

      // Invia check-in al server
      checkInMutation.mutate({
        appointmentId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (error) {
      Alert.alert("Errore GPS", "Impossibile rilevare la posizione. Riprova.");
      console.error(error);
    }
  };

  const handleFinitoLavoro = async (appointmentId: number) => {
    const checkInTime = checkInTimes[appointmentId];
    if (!checkInTime) {
      Alert.alert("Errore", "Devi prima registrare l'arrivo dal cliente");
      return;
    }

    try {
      // Ottieni posizione corrente
      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Calcola durata in minuti
      const duration = Math.floor((new Date().getTime() - checkInTime.getTime()) / 60000);

      // Invia check-out al server
      checkOutMutation.mutate({
        appointmentId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        duration,
      });

      // Rimuovi timestamp locale
      const newCheckInTimes = { ...checkInTimes };
      delete newCheckInTimes[appointmentId];
      setCheckInTimes(newCheckInTimes);
    } catch (error) {
      Alert.alert("Errore GPS", "Impossibile rilevare la posizione. Riprova.");
      console.error(error);
    }
  };

  const handleNavigateToCustomer = async (address: string, city: string) => {
    const fullAddress = `${address}, ${city}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    
    // URL Google Maps per navigazione
    const googleMapsUrl = Platform.select({
      ios: `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`,
      android: `google.navigation:q=${encodedAddress}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
    });

    // Fallback URL se Google Maps non è installato
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

    try {
      const supported = await Linking.canOpenURL(googleMapsUrl!);
      if (supported) {
        await Linking.openURL(googleMapsUrl!);
      } else {
        // Apri nel browser se Google Maps non è installato
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      Alert.alert("Errore", "Impossibile aprire Google Maps");
      console.error(error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  const getElapsedTime = (appointmentId: number) => {
    const checkInTime = checkInTimes[appointmentId];
    if (!checkInTime) return null;

    const elapsed = Math.floor((new Date().getTime() - checkInTime.getTime()) / 60000);
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Schermata Login
  if (!isLoggedIn) {
    return (
      <ScreenContainer className="p-6">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>
            📅 I Miei Appuntamenti
          </Text>
          <Text style={{ fontSize: 16, color: "#666", textAlign: "center", marginBottom: 24 }}>
            Effettua il login dalla tab "Timbratura" per vedere i tuoi appuntamenti
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#0a7ea4",
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
            onPress={() => {
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

  if (isLoading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-muted mt-4">Caricamento appuntamenti...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      {/* Header con Filtro */}
      <View className="mb-6">
        <Text className="text-3xl font-bold text-foreground mb-4">
          📅 Appuntamenti
        </Text>
        
        {/* Toggle Giorno/Settimana */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            onPress={() => setViewMode("day")}
            className={`flex-1 py-3 rounded-xl items-center ${
              viewMode === "day" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-bold ${
                viewMode === "day" ? "text-white" : "text-foreground"
              }`}
            >
              📅 Oggi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("week")}
            className={`flex-1 py-3 rounded-xl items-center ${
              viewMode === "week" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-bold ${
                viewMode === "week" ? "text-white" : "text-foreground"
              }`}
            >
              📆 Settimana
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Toggle Appuntamenti/Mappa Percorso (solo per vista Oggi) */}
        {viewMode === "day" && (
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity
              onPress={() => setShowRouteMap(false)}
              className={`flex-1 py-3 rounded-xl items-center ${
                !showRouteMap ? "bg-success" : "bg-surface"
              }`}
            >
              <Text
                className={`font-bold ${
                  !showRouteMap ? "text-white" : "text-foreground"
                }`}
              >
                📋 Appuntamenti
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowRouteMap(true)}
              className={`flex-1 py-3 rounded-xl items-center ${
                showRouteMap ? "bg-success" : "bg-surface"
              }`}
            >
              <Text
                className={`font-bold ${
                  showRouteMap ? "text-white" : "text-foreground"
                }`}
              >
                🗺️ Mappa Percorso
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigazione Settimana */}
        {viewMode === "week" && (
          <View className="flex-row items-center justify-between mt-3">
            <TouchableOpacity
              onPress={() => setWeekOffset(weekOffset - 1)}
              className="bg-surface px-4 py-2 rounded-lg"
            >
              <Text className="text-foreground font-semibold">← Prec</Text>
            </TouchableOpacity>
            
            <Text className="text-foreground font-semibold">
              {weekStart.toLocaleDateString("it-IT", {
                day: "numeric",
                month: "short",
              })}
              {" - "}
              {weekEnd.toLocaleDateString("it-IT", {
                day: "numeric",
                month: "short",
              })}
            </Text>
            
            <TouchableOpacity
              onPress={() => setWeekOffset(weekOffset + 1)}
              className="bg-surface px-4 py-2 rounded-lg"
            >
              <Text className="text-foreground font-semibold">Succ →</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {viewMode === "day" && (
          <Text className="text-muted mt-2">
            {new Date().toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        )}
      </View>

      {/* Rendering condizionale: Mappa Percorso o Lista Appuntamenti */}
      {showRouteMap && viewMode === "day" ? (
        <TechnicianRouteMap 
          appointments={appointments || []} 
          technicianName="Tecnico"
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {!appointments || appointments.length === 0 ? (
          <View className="bg-surface p-8 rounded-xl items-center">
            <Text className="text-6xl mb-4">✓</Text>
            <Text className="text-xl font-semibold text-foreground">
              Nessun appuntamento
            </Text>
            <Text className="text-muted mt-2 text-center">
              Non hai interventi programmati per oggi
            </Text>
          </View>
        ) : (
          appointments.map((apt: any) => {
            const isInProgress = checkInTimes[apt.id] !== undefined;
            const isCompleted = apt.status === "completed";

            return (
              <View
                key={apt.id}
                className={`mb-4 rounded-xl overflow-hidden ${
                  isCompleted
                    ? "bg-green-50 border-2 border-green-200"
                    : isInProgress
                    ? "bg-blue-50 border-2 border-blue-400"
                    : "bg-surface border-2 border-border"
                }`}
              >
                {/* Card Content */}
                <View className="p-4">
                  {/* Cliente e Orario */}
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCustomerId(apt.customerId);
                          setShowCustomerDetail(true);
                        }}
                      >
                        <Text className="text-xl font-bold text-foreground underline">
                          {apt.customer?.firstName} {apt.customer?.lastName} 👤
                        </Text>
                      </TouchableOpacity>
                      <Text className="text-muted mt-1">
                        📅 {new Date(apt.scheduledDate).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })} • 🕐 {formatTime(apt.scheduledDate)}
                      </Text>
                      {isCompleted && apt.actualDuration && (
                        <Text className="text-green-700 mt-1 font-semibold">
                          ⏱️ Tempo effettivo: {apt.actualDuration} min
                        </Text>
                      )}
                    </View>

                    {/* Badge Stato */}
                    {isCompleted ? (
                      <View className="bg-green-600 px-3 py-1 rounded-full">
                        <Text className="text-white font-semibold text-xs">
                          ✓ Completato
                        </Text>
                      </View>
                    ) : isInProgress ? (
                      <View className="bg-blue-600 px-3 py-1 rounded-full">
                        <Text className="text-white font-semibold text-xs">
                          ⏱ In corso
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-gray-400 px-3 py-1 rounded-full">
                        <Text className="text-white font-semibold text-xs">
                          ⏳ Da fare
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Indirizzo */}
                  <View className="bg-white rounded-lg p-3 mb-3">
                    <Text className="text-foreground font-medium">
                      📍 {apt.customer?.address}
                    </Text>
                    <Text className="text-muted text-sm mt-1">
                      {apt.customer?.city} {apt.customer?.postalCode}
                    </Text>
                  </View>

                  {/* Telefono */}
                  {apt.customer?.phone && (
                    <View className="bg-white rounded-lg p-3 mb-3">
                      <Text className="text-foreground font-medium">
                        📞 {apt.customer.phone}
                      </Text>
                    </View>
                  )}

                  {/* Tempo Trascorso (se in corso) */}
                  {isInProgress && !isCompleted && (
                    <View className="bg-blue-100 rounded-lg p-3 mb-3">
                      <Text className="text-blue-800 font-bold text-center text-lg">
                        ⏱ Tempo trascorso: {getElapsedTime(apt.id)}
                      </Text>
                    </View>
                  )}

                  {/* Pulsanti Azione */}
                  {!isCompleted && (
                    <View className="flex-row gap-2 mt-2">
                      {!isInProgress ? (
                        <>
                          <TouchableOpacity
                            onPress={() => handleArrivatoCliente(apt.id)}
                            disabled={checkInMutation.isPending}
                            className="flex-1 bg-green-600 py-4 rounded-xl items-center active:opacity-80"
                          >
                            <Text className="text-white font-bold text-base">
                              {checkInMutation.isPending ? "..." : "✓ Arrivato dal Cliente"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() =>
                              handleNavigateToCustomer(
                                apt.customer?.address || "",
                                apt.customer?.city || ""
                              )
                            }
                            className="bg-blue-600 px-4 py-4 rounded-xl items-center active:opacity-80"
                          >
                            <Text className="text-white font-bold text-xl">
                              🗺️
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleFinitoLavoro(apt.id)}
                          disabled={checkOutMutation.isPending}
                          className="flex-1 bg-red-600 py-4 rounded-xl items-center active:opacity-80"
                        >
                          <Text className="text-white font-bold text-base">
                            {checkOutMutation.isPending ? "..." : "🏁 Finito Lavoro"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        </ScrollView>
      )}

      {/* Modal Scheda Cliente */}
      <Modal
        visible={showCustomerDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomerDetail(false)}
      >
        <ScreenContainer className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground">
              📄 Scheda Cliente
            </Text>
            <TouchableOpacity
              onPress={() => setShowCustomerDetail(false)}
              className="bg-surface px-4 py-2 rounded-lg"
            >
              <Text className="text-foreground font-semibold">Chiudi</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {customerData && (
              <>
                {/* Dati Cliente */}
                <View className="bg-surface p-4 rounded-xl mb-4">
                  <Text className="text-xl font-bold text-foreground mb-3">
                    {customerData.firstName} {customerData.lastName}
                  </Text>
                  
                  <View className="gap-2">
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${customerData.phone}`)}
                      className="flex-row items-center py-2"
                    >
                      <Text className="text-foreground">📞 {customerData.phone}</Text>
                    </TouchableOpacity>
                    
                    <Text className="text-foreground">
                      📍 {customerData.address}, {customerData.city}
                    </Text>
                    
                    {customerData.email && (
                      <Text className="text-muted">✉️ {customerData.email}</Text>
                    )}
                  </View>
                </View>

                {/* Storico Interventi */}
                <View className="bg-surface p-4 rounded-xl mb-4">
                  <Text className="text-lg font-bold text-foreground mb-3">
                    📅 Storico Interventi ({customerHistory?.length || 0})
                  </Text>
                  
                  {customerHistory && customerHistory.length > 0 ? (
                    customerHistory.map((intervention: any) => (
                      <View
                        key={intervention.id}
                        className="bg-white p-3 rounded-lg mb-2 border border-border"
                      >
                        <View className="flex-row justify-between items-start mb-1">
                          <Text className="text-foreground font-semibold">
                            {new Date(intervention.scheduledDate).toLocaleDateString("it-IT", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                          <View
                            className={`px-2 py-1 rounded ${
                              intervention.status === "completed"
                                ? "bg-green-100"
                                : intervention.status === "cancelled"
                                ? "bg-red-100"
                                : "bg-blue-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                intervention.status === "completed"
                                  ? "text-green-700"
                                  : intervention.status === "cancelled"
                                  ? "text-red-700"
                                  : "text-blue-700"
                              }`}
                            >
                              {intervention.status === "completed"
                                ? "✓ Completato"
                                : intervention.status === "cancelled"
                                ? "✗ Cancellato"
                                : "⏳ Programmato"}
                            </Text>
                          </View>
                        </View>
                        
                        {intervention.serviceType && (
                          <Text className="text-muted text-sm mb-1">
                            🔧 {intervention.serviceType}
                          </Text>
                        )}
                        
                        {intervention.notes && (
                          <Text className="text-foreground text-sm">
                            📝 {intervention.notes}
                          </Text>
                        )}
                        
                        <Text className="text-muted text-xs mt-1">
                          Durata: {intervention.duration} min
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-muted text-center py-4">
                      Nessun intervento precedente
                    </Text>
                  )}
                </View>

                {/* Pagamenti */}
                <View className="bg-surface p-4 rounded-xl mb-4">
                  <Text className="text-lg font-bold text-foreground mb-3">
                    💰 Pagamenti
                  </Text>
                  
                  {/* Form Nuovo Pagamento */}
                  <View className="bg-white p-4 rounded-lg mb-3 border border-border">
                    <Text className="text-foreground font-semibold mb-2">Registra Nuovo Pagamento</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowPaymentForm(true);
                        setPaymentAmount("");
                        setPaymentMethod("cash");
                        setPaymentNotes("");
                      }}
                      className="bg-primary py-3 rounded-lg items-center active:opacity-80"
                    >
                      <Text className="text-white font-bold">+ Aggiungi Pagamento</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Lista Pagamenti */}
                  {customerPayments.length > 0 ? (
                    <>
                      {/* Totale */}
                      <View className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                        <Text className="text-green-800 font-bold text-lg text-center">
                          Totale Pagato: €{customerPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
                        </Text>
                      </View>

                      {/* Lista pagamenti */}
                      {customerPayments.map((payment: any) => (
                        <View
                          key={payment.id}
                          className="bg-white p-3 rounded-lg mb-2 border border-border"
                        >
                          <View className="flex-row justify-between items-start mb-2">
                            <View>
                              <Text className="text-foreground font-bold text-lg">
                                € {parseFloat(payment.amount).toFixed(2)}
                              </Text>
                              <Text className="text-muted text-xs">
                                {new Date(payment.paymentDate).toLocaleDateString("it-IT", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </Text>
                            </View>
                            <View
                              className={`px-3 py-1 rounded-full ${
                                payment.paymentMethod === "cash"
                                  ? "bg-green-100"
                                  : payment.paymentMethod === "card"
                                  ? "bg-blue-100"
                                  : payment.paymentMethod === "bank_transfer"
                                  ? "bg-purple-100"
                                  : "bg-red-100"
                              }`}
                            >
                              <Text
                                className={`text-xs font-semibold ${
                                  payment.paymentMethod === "cash"
                                    ? "text-green-800"
                                    : payment.paymentMethod === "card"
                                    ? "text-blue-800"
                                    : payment.paymentMethod === "bank_transfer"
                                    ? "text-purple-800"
                                    : "text-red-800"
                                }`}
                              >
                                {payment.paymentMethod === "cash"
                                  ? "💵 Contanti"
                                  : payment.paymentMethod === "card"
                                  ? "💳 POS"
                                  : payment.paymentMethod === "bank_transfer"
                                  ? "🏦 Bonifico"
                                  : "❌ Altro"}
                              </Text>
                            </View>
                          </View>
                          {payment.notes && (
                            <Text className="text-foreground text-sm mt-1">
                              📝 {payment.notes}
                            </Text>
                          )}
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text className="text-muted text-center py-4">
                      Nessun pagamento registrato
                    </Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </ScreenContainer>
      </Modal>

      {/* Modal Form Pagamento */}
      <Modal
        visible={showPaymentForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPaymentForm(false)}
      >
        <ScreenContainer className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground">
              💰 Nuovo Pagamento
            </Text>
            <TouchableOpacity
              onPress={() => setShowPaymentForm(false)}
              className="bg-surface px-4 py-2 rounded-lg"
            >
              <Text className="text-foreground font-semibold">Annulla</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Campo Importo */}
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-2">💵 Importo (€) *</Text>
              <TextInput
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Es. 50.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                className="bg-white border border-border rounded-lg px-4 py-3 text-lg"
                style={{ color: "#000000" }}
              />
            </View>

            {/* Metodo Pagamento */}
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-2">💳 Metodo Pagamento *</Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { value: "cash", label: "💵 Contanti" },
                  { value: "card", label: "💳 Carta" },
                  { value: "bank_transfer", label: "🏦 Bonifico" },
                  { value: "other", label: "❓ Altro" },
                ].map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    onPress={() => setPaymentMethod(method.value as any)}
                    className={`flex-1 min-w-[45%] py-3 rounded-lg border-2 items-center ${
                      paymentMethod === method.value
                        ? "bg-primary border-primary"
                        : "bg-white border-border"
                    }`}
                  >
                    <Text
                      className="font-semibold"
                      style={{
                        color: paymentMethod === method.value ? "#FFFFFF" : "#000000"
                      }}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note */}
            <View className="mb-4">
              <Text className="text-foreground font-semibold mb-2">📝 Note (opzionale)</Text>
              <TextInput
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                placeholder="Es. Pagato in contanti"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                className="bg-white border border-border rounded-lg px-4 py-3"
                style={{ color: "#000000" }}
              />
            </View>

            {/* Pulsante Salva */}
            <TouchableOpacity
              onPress={() => {
                // Validazione
                if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
                  Alert.alert("Errore", "Inserisci un importo valido");
                  return;
                }
                if (!selectedCustomerId) {
                  Alert.alert("Errore", "Cliente non selezionato");
                  return;
                }
                // Salvataggio
                createPaymentMutation.mutate({
                  customerId: selectedCustomerId,
                  amount: paymentAmount,
                  paymentMethod,
                  paymentDate: new Date().toISOString(),
                  notes: paymentNotes || undefined,
                  technicianId,
                });
              }}
              disabled={createPaymentMutation.isPending}
              className="bg-green-600 py-4 rounded-xl items-center active:opacity-80 mb-4"
            >
              <Text className="text-white font-bold text-lg">
                {createPaymentMutation.isPending ? "Salvataggio..." : "✓ Salva Pagamento"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
