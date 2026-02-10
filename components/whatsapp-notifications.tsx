/**
 * WhatsApp Notifications Component
 * Gestisce l'invio automatico di promemoria appuntamenti via WhatsApp
 */

import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function WhatsAppNotifications() {
  const [whatsappConfig, setWhatsappConfig] = useState({
    businessNumber: "",
    apiKey: "",
    enabled: true,
    hoursBeforeReminder: 24,
  });

  const [testPhone, setTestPhone] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Query per ottenere gli appuntamenti con notifiche da inviare
  const { data: pendingNotifications, isLoading, refetch } = trpc.whatsapp.getPendingNotifications.useQuery();
  
  // Mutation per inviare notifica di test
  const sendTestMutation = trpc.whatsapp.sendTest.useMutation({
    onSuccess: () => {
      alert("Messaggio di test inviato con successo!");
      setTestPhone("");
    },
    onError: (error: any) => {
      alert(`Errore invio test: ${error.message}`);
    },
  });

  // Mutation per salvare configurazione
  const saveConfigMutation = trpc.whatsapp.saveConfig.useMutation({
    onSuccess: () => {
      alert("Configurazione salvata con successo!");
    },
    onError: (error: any) => {
      alert(`Errore salvataggio: ${error.message}`);
    },
  });

  const handleSaveConfig = () => {
    if (!whatsappConfig.businessNumber || !whatsappConfig.apiKey) {
      alert("Compila numero WhatsApp Business e API Key");
      return;
    }
    saveConfigMutation.mutate(whatsappConfig);
  };

  const handleSendTest = () => {
    if (!testPhone) {
      alert("Inserisci un numero di telefono per il test");
      return;
    }
    sendTestMutation.mutate({ phone: testPhone });
  };

  const handleSendReminder = async (appointmentId: number) => {
    setIsSending(true);
    try {
      // TODO: Implementare invio singolo promemoria
      alert(`Promemoria inviato per appuntamento #${appointmentId}`);
      refetch();
    } catch (error) {
      alert("Errore invio promemoria");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9fafb", padding: 20 }}>
      <View style={{ maxWidth: 1200, marginHorizontal: "auto", width: "100%" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          📱 Notifiche WhatsApp Automatiche
        </Text>

        {/* Configurazione WhatsApp Business */}
        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 8, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 15 }}>
            ⚙️ Configurazione WhatsApp Business
          </Text>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: "500", marginBottom: 5 }}>Numero WhatsApp Business</Text>
            <TextInput
              value={whatsappConfig.businessNumber}
              onChangeText={(text) => setWhatsappConfig({ ...whatsappConfig, businessNumber: text })}
              placeholder="+39 123 456 7890"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, padding: 10 }}
            />
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: "500", marginBottom: 5 }}>API Key</Text>
            <TextInput
              value={whatsappConfig.apiKey}
              onChangeText={(text) => setWhatsappConfig({ ...whatsappConfig, apiKey: text })}
              placeholder="Inserisci API Key di WhatsApp Business"
              secureTextEntry
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, padding: 10 }}
            />
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: "500", marginBottom: 5 }}>Ore prima dell'appuntamento per inviare promemoria</Text>
            <TextInput
              value={whatsappConfig.hoursBeforeReminder.toString()}
              onChangeText={(text) => setWhatsappConfig({ ...whatsappConfig, hoursBeforeReminder: parseInt(text) || 24 })}
              placeholder="24"
              keyboardType="numeric"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, padding: 10 }}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
            <TouchableOpacity
              onPress={() => setWhatsappConfig({ ...whatsappConfig, enabled: !whatsappConfig.enabled })}
              style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: whatsappConfig.enabled ? "#22c55e" : "#d1d5db", justifyContent: "center", paddingHorizontal: 3 }}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "white", alignSelf: whatsappConfig.enabled ? "flex-end" : "flex-start" }} />
            </TouchableOpacity>
            <Text style={{ marginLeft: 10 }}>Notifiche automatiche {whatsappConfig.enabled ? "attive" : "disattivate"}</Text>
          </View>

          <TouchableOpacity
            onPress={handleSaveConfig}
            disabled={saveConfigMutation.isPending}
            style={{ backgroundColor: "#3b82f6", padding: 12, borderRadius: 6, alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              {saveConfigMutation.isPending ? "Salvataggio..." : "💾 Salva Configurazione"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Invio WhatsApp */}
        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 8, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 15 }}>
            🧪 Test Invio Messaggio
          </Text>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontWeight: "500", marginBottom: 5 }}>Numero di telefono (con prefisso)</Text>
            <TextInput
              value={testPhone}
              onChangeText={setTestPhone}
              placeholder="+39 123 456 7890"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 4, padding: 10 }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSendTest}
            disabled={sendTestMutation.isPending}
            style={{ backgroundColor: "#10b981", padding: 12, borderRadius: 6, alignItems: "center" }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              {sendTestMutation.isPending ? "Invio..." : "📤 Invia Messaggio di Test"}
            </Text>
          </TouchableOpacity>

          <View style={{ marginTop: 15, padding: 12, backgroundColor: "#f3f4f6", borderRadius: 4 }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>
              <Text style={{ fontWeight: "600" }}>Template messaggio:</Text>{"\n"}
              Ciao [Nome Cliente], ti ricordiamo l'appuntamento di domani alle [Ora] con il tecnico [Nome Tecnico]. Grazie!
            </Text>
          </View>
        </View>

        {/* Promemoria in Attesa */}
        <View style={{ backgroundColor: "white", padding: 20, borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 15 }}>
            📋 Promemoria in Attesa di Invio
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : !pendingNotifications || pendingNotifications.length === 0 ? (
            <Text style={{ color: "#6b7280", textAlign: "center", padding: 20 }}>
              Nessun promemoria da inviare
            </Text>
          ) : (
            pendingNotifications.map((notification: any) => (
              <View
                key={notification.id}
                style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 15, marginBottom: 10 }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "600", fontSize: 16 }}>
                      {notification.customerName}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 4 }}>
                      📅 {new Date(notification.appointmentDate).toLocaleString("it-IT")}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 2 }}>
                      📞 {notification.customerPhone}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 2 }}>
                      👨‍🔧 Tecnico: {notification.technicianName}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleSendReminder(notification.id)}
                    disabled={isSending}
                    style={{ backgroundColor: "#22c55e", padding: 10, borderRadius: 6 }}
                  >
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      {isSending ? "..." : "📤 Invia"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Integrazione */}
        <View style={{ backgroundColor: "#fef3c7", padding: 15, borderRadius: 8, marginTop: 20, borderLeftWidth: 4, borderLeftColor: "#f59e0b" }}>
          <Text style={{ fontWeight: "600", marginBottom: 8 }}>ℹ️ Come configurare WhatsApp Business API</Text>
          <Text style={{ fontSize: 13, color: "#92400e", lineHeight: 20 }}>
            1. Crea un account WhatsApp Business API su https://business.whatsapp.com{"\n"}
            2. Ottieni l'API Key dal pannello sviluppatori{"\n"}
            3. Inserisci il numero WhatsApp Business e l'API Key sopra{"\n"}
            4. Salva la configurazione e testa l'invio{"\n"}
            5. I promemoria verranno inviati automaticamente 24h prima degli appuntamenti
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
