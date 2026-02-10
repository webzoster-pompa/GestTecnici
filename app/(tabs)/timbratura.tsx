import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpcClient } from "@/lib/trpc";
import * as Location from "expo-location";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TimeEntryType = "start_day" | "start_break" | "end_break" | "end_day";

interface TimeEntry {
  id: number;
  technicianId: number;
  date: Date;
  type: TimeEntryType;
  timestamp: Date;
  latitude: string | null;
  longitude: string | null;
  isRemote: boolean;
  remoteReason: string | null;
}

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
}

export default function TimbraturaScreen() {
  const colors = useColors();
  const [technicianId, setTechnicianId] = useState<number | null>(null);
  const [technicianName, setTechnicianName] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRemoteModal, setShowRemoteModal] = useState(false);
  const [remoteReason, setRemoteReason] = useState("");
  const [pendingType, setPendingType] = useState<TimeEntryType | null>(null);
  const [currentState, setCurrentState] = useState<"not_started" | "working" | "on_break" | "finished">("not_started");
  const [elapsedTime, setElapsedTime] = useState(0);

  // Carica lista tecnici
  const loadTechnicians = async () => {
    try {
      const techs = await trpcClient.technicians.list.query();
      setTechnicians(techs as Technician[]);
    } catch (error) {
      console.error("Errore caricamento tecnici:", error);
    }
  };

  // Carica sessione salvata
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

  // Login tecnico
  const handleLogin = async () => {
    if (!selectedTechId) {
      Alert.alert("Errore", "Seleziona un tecnico");
      return;
    }
    const tech = technicians.find(t => t.id === selectedTechId);
    if (tech) {
      try {
        await AsyncStorage.setItem("technicianId", tech.id.toString());
        await AsyncStorage.setItem("technicianName", `${tech.firstName} ${tech.lastName}`);
        setTechnicianId(tech.id);
        setTechnicianName(`${tech.firstName} ${tech.lastName}`);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Errore salvataggio sessione:", error);
      }
    }
  };

  // Logout tecnico
  const handleLogout = async () => {
    Alert.alert(
      "Conferma Logout",
      "Sei sicuro di voler uscire?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Esci",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("technicianId");
              await AsyncStorage.removeItem("technicianName");
              setTechnicianId(null);
              setTechnicianName("");
              setIsLoggedIn(false);
              setTodayEntries([]);
              setCurrentState("not_started");
            } catch (error) {
              console.error("Errore logout:", error);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadTechnicians();
    loadSession();
  }, []);

  // Carica timbrature di oggi
  const loadTodayEntries = async () => {
    try {
      const entries = await trpcClient.timeEntries.listByTechnicianAndDate.query({
        technicianId,
        date: new Date(),
      });
      setTodayEntries(entries as TimeEntry[]);
      
      // Determina stato corrente
      const hasStartDay = entries.some((e) => e.type === "start_day");
      const hasEndDay = entries.some((e) => e.type === "end_day");
      const hasStartBreak = entries.some((e) => e.type === "start_break");
      const hasEndBreak = entries.some((e) => e.type === "end_break");
      
      if (hasEndDay) {
        setCurrentState("finished");
      } else if (hasStartBreak && !hasEndBreak) {
        setCurrentState("on_break");
      } else if (hasStartDay) {
        setCurrentState("working");
      } else {
        setCurrentState("not_started");
      }
    } catch (error) {
      console.error("Errore caricamento timbrature:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn && technicianId) {
      loadTodayEntries();
      const interval = setInterval(loadTodayEntries, 30000); // Aggiorna ogni 30s
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, technicianId]);

  // Calcola tempo trascorso
  useEffect(() => {
    const interval = setInterval(() => {
      const startDay = todayEntries.find((e) => e.type === "start_day");
      if (startDay && currentState !== "finished") {
        const now = new Date().getTime();
        const start = new Date(startDay.timestamp).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [todayEntries, currentState]);

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResetTimbrature = async () => {
    Alert.alert(
      "Conferma Reset",
      "Sei sicuro di voler cancellare tutte le timbrature di oggi? Questa azione non può essere annullata.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Cancella tutte le timbrature di oggi
              for (const entry of todayEntries) {
                await trpcClient.timeEntries.delete.mutate({ id: entry.id });
              }
              
              // Ricarica timbrature
              await loadTodayEntries();
              Alert.alert("Successo", "Timbrature cancellate. Ora puoi testare nuovamente il flusso completo!");
            } catch (error) {
              console.error("Errore reset timbrature:", error);
              Alert.alert("Errore", "Impossibile cancellare le timbrature.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleTimbratura = async (type: TimeEntryType) => {
    console.log("[Timbratura] Inizio timbratura tipo:", type);
    setLoading(true);
    try {
      // Richiedi permesso GPS
      console.log("[Timbratura] Richiedo permesso GPS...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log("[Timbratura] Permesso GPS:", status);
      if (status !== "granted") {
        console.error("[Timbratura] Permesso GPS negato");
        Alert.alert(
          "Permesso GPS Negato",
          "Per registrare la timbratura è necessario concedere il permesso di accesso alla posizione. Vai nelle impostazioni dell'app e abilita la localizzazione."
        );
        setLoading(false);
        return;
      }

      // Ottieni posizione corrente
      console.log("[Timbratura] Ottengo posizione GPS...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;
      console.log("[Timbratura] Posizione ottenuta:", { latitude, longitude });

      try {
        // Invia timbratura
        console.log("[Timbratura] Invio richiesta API...");
        const result = await trpcClient.timeEntries.create.mutate({
          technicianId,
          type,
          latitude,
          longitude,
          remoteReason: remoteReason || undefined,
        });
        console.log("[Timbratura] Risposta API:", result);

        Alert.alert(
          "Timbratura registrata",
          result.isRemote
            ? `Timbratura fuori sede registrata (${result.distance}m dalla sede)`
            : "Timbratura in sede registrata"
        );

        // Ricarica timbrature
        await loadTodayEntries();
        setRemoteReason("");
        setShowRemoteModal(false);
        setPendingType(null);
      } catch (error: any) {
        // Se errore per timbratura remota senza nota
        console.error("[Timbratura] Errore API:", error);
        if (error.message && error.message.includes("fuori sede")) {
          console.log("[Timbratura] Richiesta nota per timbratura remota");
          setPendingType(type);
          setShowRemoteModal(true);
        } else {
          console.error("[Timbratura] Errore generico:", error.message);
          Alert.alert(
            "Errore Timbratura",
            error.message || "Errore durante la registrazione della timbratura. Verifica la connessione internet e riprova."
          );
        }
      }
    } catch (error: any) {
      console.error("[Timbratura] Errore GPS:", error);
      Alert.alert(
        "Errore GPS",
        "Impossibile ottenere la posizione GPS. Verifica che il GPS sia attivo e che l'app abbia i permessi necessari."
      );
    } finally {
      setLoading(false);
      console.log("[Timbratura] Fine processo timbratura");
    }
  };

  const handleRemoteConfirm = () => {
    if (!remoteReason.trim()) {
      Alert.alert("Attenzione", "Inserisci il motivo della timbratura fuori sede");
      return;
    }
    if (pendingType) {
      handleTimbratura(pendingType);
    }
  };

  // Schermata Login
  if (!isLoggedIn) {
    return (
      <ScreenContainer className="p-6">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
              👤 Login Tecnico
            </Text>
            <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center" }}>
              Seleziona il tuo nome per accedere alla timbratura
            </Text>
          </View>

          <View style={{ gap: 12, marginBottom: 32 }}>
            {technicians.map((tech) => (
              <TouchableOpacity
                key={tech.id}
                style={{
                  backgroundColor: selectedTechId === tech.id ? colors.primary : colors.surface,
                  borderWidth: 2,
                  borderColor: selectedTechId === tech.id ? colors.primary : colors.border,
                  borderRadius: 12,
                  padding: 20,
                  alignItems: "center",
                }}
                onPress={() => setSelectedTechId(tech.id)}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: selectedTechId === tech.id ? "#fff" : colors.foreground,
                  }}
                >
                  {tech.firstName} {tech.lastName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 18,
              alignItems: "center",
              opacity: selectedTechId ? 1 : 0.5,
            }}
            onPress={handleLogin}
            disabled={!selectedTechId}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#fff" }}>
              Accedi
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="items-center mb-8">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 8 }}>
            <View style={{ flex: 1 }} />
            <Text className="text-3xl font-bold text-foreground">Timbratura</Text>
            <TouchableOpacity
              onPress={handleLogout}
              style={{ flex: 1, alignItems: "flex-end" }}
            >
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>Esci</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 16, color: colors.success, fontWeight: "600", marginBottom: 4 }}>
            👤 {technicianName}
          </Text>
          <Text className="text-base text-muted">
            {new Date().toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Stato corrente */}
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-2">Stato Corrente</Text>
          <View className="flex-row items-center justify-between">
            <View>
              {currentState === "not_started" && (
                <Text className="text-2xl font-bold text-muted">Non iniziato</Text>
              )}
              {currentState === "working" && (
                <>
                  <Text className="text-2xl font-bold" style={{ color: colors.success }}>
                    Al lavoro
                  </Text>
                  <Text className="text-base text-muted mt-1">
                    Tempo trascorso: {formatElapsedTime(elapsedTime)}
                  </Text>
                </>
              )}
              {currentState === "on_break" && (
                <>
                  <Text className="text-2xl font-bold" style={{ color: colors.warning }}>
                    In pausa
                  </Text>
                  <Text className="text-base text-muted mt-1">
                    Dalle{" "}
                    {todayEntries
                      .find((e) => e.type === "start_break")
                      ?.timestamp.toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </Text>
                </>
              )}
              {currentState === "finished" && (
                <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                  Giornata terminata
                </Text>
              )}
            </View>
            <View
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor:
                  currentState === "working"
                    ? colors.success
                    : currentState === "on_break"
                      ? colors.warning
                      : currentState === "finished"
                        ? colors.primary
                        : colors.muted,
              }}
            />
          </View>
        </View>

        {/* Pulsanti timbratura */}
        <View className="gap-4">
          {/* Inizio giornata */}
          {currentState === "not_started" && (
            <TouchableOpacity
              onPress={() => handleTimbratura("start_day")}
              disabled={loading}
              className="rounded-2xl p-6 items-center"
              style={{ backgroundColor: colors.success }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text className="text-2xl font-bold text-white mb-1">🌅 Inizio Giornata</Text>
                  <Text className="text-sm text-white opacity-80">Timbra l'arrivo</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Pausa pranzo */}
          {currentState === "working" && (
            <>
              <TouchableOpacity
                onPress={() => handleTimbratura("start_break")}
                disabled={loading}
                className="rounded-2xl p-6 items-center"
                style={{ backgroundColor: colors.warning }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-2xl font-bold text-white mb-1">☕ Inizio Pausa</Text>
                    <Text className="text-sm text-white opacity-80">Pausa pranzo o break</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTimbratura("end_day")}
                disabled={loading}
                className="rounded-2xl p-6 items-center"
                style={{ backgroundColor: colors.error }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-2xl font-bold text-white mb-1">🏁 Fine Giornata</Text>
                    <Text className="text-sm text-white opacity-80">Termina il turno</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Ripresa lavoro */}
          {currentState === "on_break" && (
            <>
              <TouchableOpacity
                onPress={() => handleTimbratura("end_break")}
                disabled={loading}
                className="rounded-2xl p-6 items-center"
                style={{ backgroundColor: colors.success }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-2xl font-bold text-white mb-1">▶️ Riprendi Lavoro</Text>
                    <Text className="text-sm text-white opacity-80">Fine pausa</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleTimbratura("end_day")}
                disabled={loading}
                className="rounded-2xl p-6 items-center"
                style={{ backgroundColor: colors.error }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-2xl font-bold text-white mb-1">🏁 Fine Giornata</Text>
                    <Text className="text-sm text-white opacity-80">Termina il turno</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Giornata terminata */}
          {currentState === "finished" && (
            <>
              <View className="rounded-2xl p-6 items-center bg-surface border border-border">
                <Text className="text-xl font-bold text-foreground mb-2">
                  ✅ Giornata completata
                </Text>
                <Text className="text-sm text-muted text-center">
                  Hai terminato il turno di oggi. Buon riposo!
                </Text>
              </View>
              
              {/* Pulsante Reset per test */}
              <TouchableOpacity
                onPress={handleResetTimbrature}
                disabled={loading}
                className="rounded-2xl p-4 items-center border-2"
                style={{ borderColor: colors.error, backgroundColor: 'transparent' }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.error} />
                ) : (
                  <>
                    <Text className="text-lg font-bold" style={{ color: colors.error }}>
                      🔄 Reset Timbrature Oggi
                    </Text>
                    <Text className="text-xs opacity-60" style={{ color: colors.error }}>
                      Solo per test - Cancella tutte le timbrature di oggi
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Storico timbrature di oggi */}
        {todayEntries.length > 0 && (
          <View className="mt-8">
            <Text className="text-lg font-semibold text-foreground mb-4">Timbrature di oggi</Text>
            {todayEntries.map((entry) => (
              <View
                key={entry.id}
                className="bg-surface rounded-xl p-4 mb-2 border border-border flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-base font-semibold text-foreground">
                    {entry.type === "start_day" && "🌅 Inizio giornata"}
                    {entry.type === "start_break" && "☕ Inizio pausa"}
                    {entry.type === "end_break" && "▶️ Fine pausa"}
                    {entry.type === "end_day" && "🏁 Fine giornata"}
                  </Text>
                  <Text className="text-sm text-muted mt-1">
                    {new Date(entry.timestamp).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  {entry.isRemote && (
                    <Text className="text-xs text-warning mt-1">
                      📍 Fuori sede: {entry.remoteReason}
                    </Text>
                  )}
                </View>
                <View
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: entry.isRemote ? colors.warning : colors.success,
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Modal nota timbratura remota */}
      <Modal visible={showRemoteModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-background rounded-2xl p-6 w-full max-w-md">
            <Text className="text-xl font-bold text-foreground mb-4">
              Timbratura fuori sede
            </Text>
            <Text className="text-base text-muted mb-4">
              Sei fuori dalla sede. Inserisci il motivo della timbratura remota:
            </Text>
            <TextInput
              value={remoteReason}
              onChangeText={setRemoteReason}
              placeholder="Es: Intervento presso cliente, trasferta, ecc."
              className="bg-surface border border-border rounded-xl p-4 text-foreground mb-6"
              multiline
              numberOfLines={3}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowRemoteModal(false);
                  setRemoteReason("");
                  setPendingType(null);
                }}
                className="flex-1 bg-surface rounded-xl p-4 items-center"
              >
                <Text className="text-base font-semibold text-foreground">Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRemoteConfirm}
                className="flex-1 rounded-xl p-4 items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-base font-semibold text-white">Conferma</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
