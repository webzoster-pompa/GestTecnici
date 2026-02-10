import { View, Text, TouchableOpacity, Linking, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import { Appointment, Customer } from "@/drizzle/schema";

interface AppointmentWithCustomer extends Appointment {
  customer?: Customer;
}

interface RouteMapProps {
  appointments: AppointmentWithCustomer[];
  technicianName: string;
}

export function TechnicianRouteMap({ appointments, technicianName }: RouteMapProps) {
  const colors = useColors();
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Filter only scheduled and in_progress appointments with customer address
  const validAppointments = appointments.filter(
    apt => (apt.status === "scheduled" || apt.status === "in_progress") && apt.customer?.address && apt.customer?.city
  );
  
  // Calculate route distance and duration (simplified - in production use Google Maps Directions API)
  useEffect(() => {
    if (validAppointments.length < 2) {
      setTotalDistance(0);
      setTotalDuration(0);
      return;
    }
    
    setIsCalculating(true);
    
    // Simplified calculation: straight-line distance * 1.3 (road factor)
    // In production, use Google Maps Directions API for accurate routes
    let distance = 0;
    for (let i = 0; i < validAppointments.length - 1; i++) {
      const apt1 = validAppointments[i];
      const apt2 = validAppointments[i + 1];
      
      if (apt1.customer?.latitude && apt1.customer?.longitude && 
          apt2.customer?.latitude && apt2.customer?.longitude) {
        const lat1 = parseFloat(apt1.customer.latitude);
        const lon1 = parseFloat(apt1.customer.longitude);
        const lat2 = parseFloat(apt2.customer.latitude);
        const lon2 = parseFloat(apt2.customer.longitude);
        
        // Haversine formula for distance
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const straightDistance = R * c;
        
        // Apply road factor (1.3x for urban areas)
        distance += straightDistance * 1.3;
      }
    }
    
    setTotalDistance(Math.round(distance * 10) / 10); // Round to 1 decimal
    setTotalDuration(Math.round(distance / 40 * 60)); // Assume 40 km/h average speed, convert to minutes
    setIsCalculating(false);
  }, [validAppointments]);
  
  const handleNavigateToNext = () => {
    // Find next appointment (scheduled or in_progress)
    const nextAppointment = validAppointments.find(apt => apt.status === "scheduled");
    
    if (nextAppointment && nextAppointment.customer) {
      const fullAddress = `${nextAppointment.customer.address}, ${nextAppointment.customer.city}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}&travelmode=driving`;
      Linking.openURL(url);
    }
  };
  
  const handleNavigateToAll = () => {
    // Build multi-stop route URL for Google Maps
    if (validAppointments.length === 0) return;
    
    const origin = validAppointments[0].customer;
    const destination = validAppointments[validAppointments.length - 1].customer;
    const waypoints = validAppointments.slice(1, -1).map(apt => 
      `${apt.customer?.address}, ${apt.customer?.city}`
    ).join("|");
    
    let url = `https://www.google.com/maps/dir/?api=1`;
    url += `&origin=${encodeURIComponent(`${origin?.address}, ${origin?.city}`)}`;
    url += `&destination=${encodeURIComponent(`${destination?.address}, ${destination?.city}`)}`;
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    url += `&travelmode=driving`;
    
    Linking.openURL(url);
  };
  
  const getAppointmentTime = (apt: AppointmentWithCustomer) => {
    const date = new Date(apt.scheduledDate);
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };
  
  if (validAppointments.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl text-muted text-center">
          📍 Nessun appuntamento programmato per oggi
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          Gli appuntamenti appariranno qui quando verranno creati
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView className="flex-1 p-4">
      {/* Header with stats */}
      <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
        <Text className="text-xl font-bold mb-3" style={{ color: "#000000" }}>
          🗺️ Percorso Giornaliero - {technicianName}
        </Text>
        
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
              {validAppointments.length}
            </Text>
            <Text className="text-sm text-muted">Appuntamenti</Text>
          </View>
          
          <View className="items-center">
            {isCalculating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
                {totalDistance}
              </Text>
            )}
            <Text className="text-sm text-muted">km totali</Text>
          </View>
          
          <View className="items-center">
            {isCalculating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
                {totalDuration}
              </Text>
            )}
            <Text className="text-sm text-muted">min viaggio</Text>
          </View>
        </View>
      </View>
      
      {/* Navigation buttons */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-lg p-4"
          onPress={handleNavigateToNext}
        >
          <Text className="text-white text-center font-semibold">
            🧭 Naviga al Prossimo
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 bg-success rounded-lg p-4"
          onPress={handleNavigateToAll}
        >
          <Text className="text-white text-center font-semibold">
            🗺️ Percorso Completo
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Appointment list with route order */}
      <Text className="text-lg font-bold mb-3" style={{ color: "#000000" }}>
        📍 Tappe del Percorso
      </Text>
      
      {validAppointments.map((apt, index) => (
        <View key={apt.id} className="mb-3">
          <View className="bg-surface rounded-2xl p-4 border border-border">
            {/* Route number and time */}
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <View 
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-white font-bold">{index + 1}</Text>
                </View>
                <Text className="text-lg font-bold" style={{ color: "#000000" }}>
                  {getAppointmentTime(apt)}
                </Text>
              </View>
              
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: apt.status === "in_progress" ? colors.warning : colors.muted }}
              >
                <Text className="text-white text-xs font-semibold">
                  {apt.status === "in_progress" ? "In corso" : "In attesa"}
                </Text>
              </View>
            </View>
            
            {/* Customer info */}
            {apt.customer && (
              <>
                <Text className="text-lg font-bold mb-1" style={{ color: "#000000" }}>
                  {apt.customer.firstName} {apt.customer.lastName}
                </Text>
                
                <Text className="text-base mb-1" style={{ color: "#4B5563" }}>
                  📍 {apt.customer.address}
                </Text>
                
                <Text className="text-base mb-2" style={{ color: "#4B5563" }}>
                  🏙️ {apt.customer.city}
                </Text>
                
                {apt.serviceType && (
                  <Text className="text-sm mb-2" style={{ color: "#6B7280" }}>
                    🔧 {apt.serviceType}
                  </Text>
                )}
              </>
            )}
            
            {/* Navigate button */}
            <TouchableOpacity
              className="bg-primary rounded-lg p-3 mt-2"
              onPress={() => {
                if (apt.customer) {
                  const fullAddress = `${apt.customer.address}, ${apt.customer.city}`;
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}&travelmode=driving`;
                  Linking.openURL(url);
                }
              }}
            >
              <Text className="text-white text-center font-semibold">
                🧭 Naviga Qui
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Distance to next stop */}
          {index < validAppointments.length - 1 && (
            <View className="flex-row items-center justify-center py-2">
              <View className="h-8 w-0.5 bg-border" />
              <Text className="text-xs text-muted mx-2">
                ↓ {Math.round((totalDistance / (validAppointments.length - 1)) * 10) / 10} km
              </Text>
              <View className="h-8 w-0.5 bg-border" />
            </View>
          )}
        </View>
      ))}
      
      {/* Info note */}
      <View className="bg-surface rounded-lg p-4 mt-2 border border-border">
        <Text className="text-sm text-muted text-center">
          💡 Le distanze sono stimate. Usa "Percorso Completo" per il percorso ottimizzato da Google Maps.
        </Text>
      </View>
    </ScrollView>
  );
}
