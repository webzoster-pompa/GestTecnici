/**
 * Schermata Login Tecnici
 * Autentica il tecnico e salva la sessione
 */

import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

interface TechnicianLoginProps {
  onLoginSuccess: (technicianId: number) => void;
}

export function TechnicianLogin({ onLoginSuccess }: TechnicianLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.technicians.login.useMutation({});

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Errore", "Inserisci email e password");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.success && result.technicianId) {
        // Salva sessione
        await AsyncStorage.setItem("technicianId", result.technicianId.toString());
        await AsyncStorage.setItem("technicianEmail", email);

        onLoginSuccess(result.technicianId);
      } else {
        Alert.alert("Errore", "Credenziali non valide");
      }
    } catch (error) {
      Alert.alert("Errore", "Impossibile effettuare il login");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0066CC", justifyContent: "center", padding: 24 }}>
      {/* Logo/Header */}
      <View style={{ alignItems: "center", marginBottom: 48 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔧</Text>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>
          Gestione Tecnici
        </Text>
        <Text style={{ fontSize: 16, color: "#fff", opacity: 0.9 }}>
          Accedi con le tue credenziali
        </Text>
      </View>

      {/* Login Form */}
      <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
          Email
        </Text>
        <TextInput
          style={{
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            marginBottom: 16,
          }}
          placeholder="tecnico@esempio.it"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
          Password
        </Text>
        <TextInput
          style={{
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            marginBottom: 24,
          }}
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TouchableOpacity
          style={{
            backgroundColor: "#0066CC",
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
          }}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Accedi</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={{ alignItems: "center", marginTop: 32 }}>
        <Text style={{ fontSize: 12, color: "#fff", opacity: 0.7 }}>
          Contatta l'amministratore per assistenza
        </Text>
      </View>
    </View>
  );
}
