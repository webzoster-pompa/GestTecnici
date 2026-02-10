import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, TextInput, Linking, Platform, Image } from "react-native";
import { trpcClient } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

interface CustomerDetailSheetMobileProps {
  customerId: number;
  visible: boolean;
  onClose: () => void;
}

export function CustomerDetailSheetMobile({ customerId, visible, onClose }: CustomerDetailSheetMobileProps) {
  const colors = useColors();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Carica dati cliente
  const loadCustomer = async () => {
    try {
      setLoading(true);
      const data = await trpcClient.customers.getById.query({ id: customerId });
      setCustomer(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        notes: data.notes || "",
      });
    } catch (error) {
      console.error("Errore caricamento cliente:", error);
      Alert.alert("Errore", "Impossibile caricare i dati del cliente");
    } finally {
      setLoading(false);
    }
  };

  // Carica storico interventi
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await trpcClient.appointments.getCustomerHistory.query({
        customerId,
        limit: 5,
        period: "all",
      });
      setHistory(data.appointments || []);
    } catch (error) {
      console.error("Errore caricamento storico:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Carica foto interventi
  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const data = await trpcClient.documents.listByCustomer.query({ customerId });
      // Filtra solo le foto (immagini)
      const photoDocuments = data.filter((doc: any) => 
        doc.fileUrl && (doc.fileUrl.endsWith('.jpg') || doc.fileUrl.endsWith('.jpeg') || doc.fileUrl.endsWith('.png'))
      );
      setPhotos(photoDocuments);
    } catch (error) {
      console.error("Errore caricamento foto:", error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCustomer();
      loadHistory();
      loadPhotos();
    }
  }, [visible, customerId]);

  // Salva modifiche
  const handleSave = async () => {
    try {
      await trpcClient.customers.update.mutate({
        id: customerId,
        ...formData,
      });
      Alert.alert("✅ Salvato", "Cliente aggiornato con successo");
      setIsEditing(false);
      loadCustomer();
    } catch (error) {
      console.error("Errore salvataggio:", error);
      Alert.alert("Errore", "Impossibile salvare le modifiche");
    }
  };

  // Chiama cliente
  const handleCall = () => {
    if (!customer?.phone) {
      Alert.alert("Errore", "Numero di telefono non disponibile");
      return;
    }
    Linking.openURL(`tel:${customer.phone}`);
  };

  // Naviga a indirizzo
  const handleNavigate = () => {
    if (!customer?.address || !customer?.city) {
      Alert.alert("Errore", "Indirizzo non disponibile");
      return;
    }
    const fullAddress = `${customer.address}, ${customer.city}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 18, color: colors.foreground }}>Caricamento...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!customer) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 18, color: colors.error, marginBottom: 16 }}>Cliente non trovato</Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>Chiudi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ 
          backgroundColor: colors.surface, 
          paddingTop: Platform.OS === "ios" ? 50 : 20, 
          paddingBottom: 16, 
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>← Chiudi</Text>
            </TouchableOpacity>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>✏️ Modifica</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            {customer.firstName} {customer.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            ID Cliente: {customer.id}
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {isEditing ? (
            // MODALITÀ MODIFICA
            <View>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
                Modifica Dati Cliente
              </Text>

              {/* Nome */}
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Nome</Text>
              <TextInput
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="Nome"
                placeholderTextColor={colors.muted}
              />

              {/* Cognome */}
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Cognome</Text>
              <TextInput
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="Cognome"
                placeholderTextColor={colors.muted}
              />

              {/* Telefono */}
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Telefono</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="Telefono"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
              />

              {/* Email */}
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Email</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Indirizzo */}
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Indirizzo</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="Indirizzo"
                placeholderTextColor={colors.muted}
              />

              {/* Città */}
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Città</Text>
              <TextInput
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                placeholder="Città"
                placeholderTextColor={colors.muted}
              />

              {/* Note */}
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>Note</Text>
              <TextInput
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.foreground,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                placeholder="Note"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
              />

              {/* Pulsanti Salva/Annulla */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    Annulla
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={{
                    flex: 1,
                    backgroundColor: colors.success,
                    borderRadius: 12,
                    paddingVertical: 16,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    💾 Salva
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // MODALITÀ VISUALIZZAZIONE
            <View>
              {/* Pulsanti Azione */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={handleCall}
                  style={{
                    flex: 1,
                    backgroundColor: colors.success,
                    borderRadius: 12,
                    paddingVertical: 14,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    📞 Chiama
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleNavigate}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 12,
                    paddingVertical: 14,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                    🗺️ Naviga
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dati Cliente */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
                  📋 Informazioni Cliente
                </Text>

                {/* Telefono */}
                {customer.phone && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>Telefono</Text>
                    <Text style={{ fontSize: 16, color: colors.foreground }}>{customer.phone}</Text>
                  </View>
                )}

                {/* Email */}
                {customer.email && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>Email</Text>
                    <Text style={{ fontSize: 16, color: colors.foreground }}>{customer.email}</Text>
                  </View>
                )}

                {/* Indirizzo */}
                {customer.address && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>Indirizzo</Text>
                    <Text style={{ fontSize: 16, color: colors.foreground }}>
                      {customer.address}
                      {customer.city && `, ${customer.city}`}
                    </Text>
                  </View>
                )}

                {/* Note */}
                {customer.notes && (
                  <View>
                    <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>Note</Text>
                    <Text style={{ fontSize: 16, color: colors.foreground }}>{customer.notes}</Text>
                  </View>
                )}
              </View>

              {/* Storico Interventi */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
                  🔧 Storico Interventi
                </Text>

                {loadingHistory ? (
                  <Text style={{ fontSize: 14, color: colors.muted }}>Caricamento...</Text>
                ) : history.length === 0 ? (
                  <Text style={{ fontSize: 14, color: colors.muted }}>Nessun intervento registrato</Text>
                ) : (
                  <View>
                    {history.map((apt: any, index: number) => (
                      <View
                        key={apt.id}
                        style={{
                          borderBottomWidth: index < history.length - 1 ? 1 : 0,
                          borderBottomColor: colors.border,
                          paddingBottom: index < history.length - 1 ? 12 : 0,
                          marginBottom: index < history.length - 1 ? 12 : 0,
                        }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                            {new Date(apt.scheduledDate).toLocaleDateString("it-IT")}
                          </Text>
                          <Text style={{ fontSize: 14, color: colors.success, fontWeight: "600" }}>
                            {apt.actualDuration ? `${apt.actualDuration} min` : apt.duration ? `${apt.duration} min` : "--"}
                          </Text>
                        </View>
                        {apt.serviceType && (
                          <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                            📝 {apt.serviceType}
                          </Text>
                        )}
                        {apt.notes && (
                          <Text style={{ fontSize: 13, color: colors.muted, fontStyle: "italic" }}>
                            {apt.notes}
                          </Text>
                        )}
                        {apt.technician && (
                          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                            Tecnico: {apt.technician.firstName} {apt.technician.lastName}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Galleria Foto Interventi */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
                  📷 Foto Interventi
                </Text>

                {loadingPhotos ? (
                  <Text style={{ fontSize: 14, color: colors.muted }}>Caricamento...</Text>
                ) : photos.length === 0 ? (
                  <Text style={{ fontSize: 14, color: colors.muted }}>Nessuna foto disponibile</Text>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {photos.map((photo: any) => (
                      <TouchableOpacity
                        key={photo.id}
                        onPress={() => setSelectedPhoto(photo.fileUrl)}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 8,
                          overflow: "hidden",
                          backgroundColor: colors.border,
                        }}
                      >
                        <Image
                          source={{ uri: photo.fileUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Info Aggiuntive */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
                  ℹ️ Informazioni Aggiuntive
                </Text>

                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    Cliente creato il {new Date(customer.createdAt).toLocaleDateString("it-IT")}
                  </Text>
                </View>

                {customer.updatedAt && (
                  <View>
                    <Text style={{ fontSize: 14, color: colors.muted }}>
                      Ultimo aggiornamento: {new Date(customer.updatedAt).toLocaleDateString("it-IT")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>

    {/* Modal Visualizzazione Foto a Schermo Intero */}
    <Modal visible={selectedPhoto !== null} transparent animationType="fade" onRequestClose={() => setSelectedPhoto(null)}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity
          style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
          onPress={() => setSelectedPhoto(null)}
        >
          <Text style={{ fontSize: 32, color: "white", fontWeight: "bold" }}>✕</Text>
        </TouchableOpacity>
        {selectedPhoto && (
          <Image
            source={{ uri: selectedPhoto }}
            style={{ width: "90%", height: "70%" }}
            resizeMode="contain"
          />
        )}
      </View>
    </Modal>
    </>
  );
}
