import { View, Text, TouchableOpacity, Linking, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

interface DailyRouteMapProps {
  technicianId: number;
  date: Date;
}

interface RouteStats {
  totalDistance: number; // km
  totalTime: number; // minuti
  appointments: Array<{
    id: number;
    time: string;
    customer: string;
    address: string;
    city: string;
    lat?: number;
    lng?: number;
  }>;
}

export function DailyRouteMap({ technicianId, date }: DailyRouteMapProps) {
  const colors = useColors();
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: appointments, isLoading: isLoadingAppointments } = trpc.appointments.getByTechnician.useQuery({
    technicianId,
    startDate: new Date(date.setHours(0, 0, 0, 0)),
    endDate: new Date(date.setHours(23, 59, 59, 999)),
  });

  useEffect(() => {
    if (!appointments || appointments.length === 0) {
      setIsLoading(false);
      return;
    }

    // Calcola statistiche percorso
    calculateRouteStats();
  }, [appointments]);

  const calculateRouteStats = async () => {
    if (!appointments || appointments.length === 0) return;

    // Ordina appuntamenti per orario
    const sortedAppointments = [...appointments].sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );

    // Prepara dati per la mappa
    const routeData = sortedAppointments.map((apt) => ({
      id: apt.id,
      time: new Date(apt.scheduledDate).toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      customer: apt.customer?.name || "Cliente sconosciuto",
      address: apt.customer?.address || "",
      city: apt.customer?.city || "",
    }));

    // Stima distanza totale (semplificata - in produzione usare Google Maps Distance Matrix API)
    const totalDistance = (sortedAppointments.length - 1) * 15; // 15km medi tra appuntamenti
    const totalTime = (sortedAppointments.length - 1) * 20; // 20min medi tra appuntamenti

    setRouteStats({
      totalDistance,
      totalTime,
      appointments: routeData,
    });
    setIsLoading(false);
  };

  const openInGoogleMaps = () => {
    if (!routeStats || routeStats.appointments.length === 0) return;

    // Crea URL per Google Maps con waypoints
    const waypoints = routeStats.appointments
      .map((apt) => encodeURIComponent(`${apt.address}, ${apt.city}`))
      .join("/");

    const url = `https://www.google.com/maps/dir/${waypoints}`;
    Linking.openURL(url);
  };

  if (isLoadingAppointments || isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-2 text-muted">Caricamento percorso...</Text>
      </View>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-muted">Nessun appuntamento per oggi</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      {/* Header con statistiche */}
      <View className="bg-surface rounded-lg p-4 mb-4">
        <Text className="text-xl font-bold text-foreground mb-3">
          📍 Percorso Giornaliero
        </Text>
        
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">
              {routeStats?.appointments.length || 0}
            </Text>
            <Text className="text-sm text-muted">Appuntamenti</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">
              ~{routeStats?.totalDistance || 0} km
            </Text>
            <Text className="text-sm text-muted">Distanza totale</Text>
          </View>
          
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">
              ~{routeStats?.totalTime || 0} min
            </Text>
            <Text className="text-sm text-muted">Tempo viaggio</Text>
          </View>
        </View>
      </View>

      {/* Pulsante Apri in Google Maps */}
      <TouchableOpacity
        className="bg-primary rounded-lg p-4 mb-4"
        onPress={openInGoogleMaps}
      >
        <Text className="text-white text-center font-semibold text-lg">
          🗺️ Apri Percorso in Google Maps
        </Text>
      </TouchableOpacity>

      {/* Lista appuntamenti ordinati */}
      <View className="bg-surface rounded-lg p-4">
        <Text className="text-lg font-bold text-foreground mb-3">
          Ordine Visite
        </Text>
        
        {routeStats?.appointments.map((apt, index) => (
          <View
            key={apt.id}
            className="flex-row items-start mb-4 pb-4 border-b border-border"
          >
            {/* Numero tappa */}
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
              <Text className="text-white font-bold">{index + 1}</Text>
            </View>
            
            {/* Dettagli appuntamento */}
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {apt.time} - {apt.customer}
              </Text>
              <Text className="text-sm text-muted mt-1">
                📍 {apt.address}, {apt.city}
              </Text>
              
              {/* Pulsante Naviga */}
              <TouchableOpacity
                className="mt-2 bg-primary rounded-lg px-3 py-2 self-start"
                onPress={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${apt.address}, ${apt.city}`
                  )}`;
                  Linking.openURL(url);
                }}
              >
                <Text className="text-white text-sm font-semibold">
                  🧭 Naviga
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
