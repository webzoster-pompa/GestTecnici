import { ScrollView, Text, View, TouchableOpacity, Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { OperatorDashboard } from "@/components/operator-dashboard";
import { TechnicianCalendar } from "@/components/technician-calendar";
import { TechnicianLogin } from "@/components/technician-login";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

/**
 * Home Screen - NativeWind Example
 *
 * This template uses NativeWind (Tailwind CSS for React Native).
 * You can use familiar Tailwind classes directly in className props.
 *
 * Key patterns:
 * - Use `className` instead of `style` for most styling
 * - Theme colors: use tokens directly (bg-background, text-foreground, bg-primary, etc.); no dark: prefix needed
 * - Responsive: standard Tailwind breakpoints work on web
 * - Custom colors defined in tailwind.config.js
 */
import React from "react";

export default function HomeScreen() {
  const [technicianId, setTechnicianId] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Check saved session
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const savedId = await AsyncStorage.getItem("technicianId");
      if (savedId) {
        setTechnicianId(parseInt(savedId, 10));
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("technicianId");
    await AsyncStorage.removeItem("technicianEmail");
    setTechnicianId(null);
  };

  // Mostra sempre dashboard operatore (senza login) per test
  // TODO: Riattivare autenticazione in produzione
  return <OperatorDashboard />;
}
