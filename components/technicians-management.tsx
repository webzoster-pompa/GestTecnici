/**
 * Gestione Tecnici Fissi
 * Interfaccia per gestire i 3 tecnici con dati furgone
 */

import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function TechniciansManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    vehiclePlate: "",
    vehicleModel: "",
    notes: "",
  });

  const { data: technicians, isLoading, refetch } = trpc.technicians.list.useQuery();

  const createMutation = trpc.technicians.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const updateMutation = trpc.technicians.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      vehiclePlate: "",
      vehicleModel: "",
      notes: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (tech: any) => {
    setFormData({
      firstName: tech.firstName,
      lastName: tech.lastName,
      phone: tech.phone || "",
      email: tech.email || "",
      vehiclePlate: tech.vehiclePlate || "",
      vehicleModel: tech.vehicleModel || "",
      notes: tech.notes || "",
    });
    setEditingId(tech.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName) {
      alert("Nome e cognome sono obbligatori");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate({ userId: 1, ...formData });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#fff", padding: 24, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 4 }}>
              Gestione Tecnici
            </Text>
            <Text style={{ fontSize: 14, color: "#666" }}>
              Gestisci i 3 tecnici con dati furgone
            </Text>
          </View>
          
          {!showForm && (
            <TouchableOpacity
              style={{ backgroundColor: "#0066CC", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
              onPress={() => setShowForm(true)}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                + Aggiungi Tecnico
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 24 }}>
        {/* Form */}
        {showForm && (
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              {editingId ? "Modifica Tecnico" : "Nuovo Tecnico"}
            </Text>

            <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                  Nome *
                </Text>
                <TextInput
                  style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 16 }}
                  placeholder="Mario"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                  Cognome *
                </Text>
                <TextInput
                  style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 16 }}
                  placeholder="Rossi"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                  Telefono
                </Text>
                <TextInput
                  style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 16 }}
                  placeholder="333 1234567"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                  Email
                </Text>
                <TextInput
                  style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 16 }}
                  placeholder="mario@esempio.it"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                  Targa Furgone
                </Text>
                <TextInput
                  style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 16 }}
                  placeholder="AB123CD"
                  value={formData.vehiclePlate}
                  onChangeText={(text) => setFormData({ ...formData, vehiclePlate: text })}
                  autoCapitalize="characters"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                  Modello Furgone
                </Text>
                <TextInput
                  style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 16 }}
                  placeholder="Fiat Ducato"
                  value={formData.vehicleModel}
                  onChangeText={(text) => setFormData({ ...formData, vehicleModel: text })}
                />
              </View>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                Note
              </Text>
              <TextInput
                style={{ backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80 }}
                placeholder="Zone preferite, specializzazioni, ecc."
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#0066CC", padding: 14, borderRadius: 8, alignItems: "center" }}
                onPress={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                  {editingId ? "Aggiorna" : "Salva"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "#f5f5f5", padding: 14, borderRadius: 8, alignItems: "center" }}
                onPress={resetForm}
              >
                <Text style={{ color: "#666", fontSize: 16, fontWeight: "600" }}>
                  Annulla
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Technicians List */}
        {isLoading ? (
          <View style={{ alignItems: "center", padding: 40 }}>
            <ActivityIndicator size="large" color="#0066CC" />
          </View>
        ) : technicians && technicians.length > 0 ? (
          <View style={{ gap: 16 }}>
            {technicians.map((tech) => (
              <View
                key={tech.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 8 }}>
                      {tech.firstName} {tech.lastName}
                    </Text>

                    {tech.phone && (
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, color: "#666" }}>
                          📞 {tech.phone}
                        </Text>
                      </View>
                    )}

                    {tech.email && (
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, color: "#666" }}>
                          ✉️ {tech.email}
                        </Text>
                      </View>
                    )}

                    {(tech.vehiclePlate || tech.vehicleModel) && (
                      <View style={{ marginTop: 12, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 }}>
                          🚐 FURGONE
                        </Text>
                        {tech.vehiclePlate && (
                          <Text style={{ fontSize: 14, color: "#333" }}>
                            Targa: {tech.vehiclePlate}
                          </Text>
                        )}
                        {tech.vehicleModel && (
                          <Text style={{ fontSize: 14, color: "#333" }}>
                            Modello: {tech.vehicleModel}
                          </Text>
                        )}
                      </View>
                    )}

                    {tech.notes && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#666", marginBottom: 4 }}>
                          Note:
                        </Text>
                        <Text style={{ fontSize: 14, color: "#666" }}>
                          {tech.notes}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={{ backgroundColor: "#0066CC", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }}
                    onPress={() => handleEdit(tech)}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                      Modifica
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔧</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 8 }}>
              Nessun tecnico inserito
            </Text>
            <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
              Clicca su "Aggiungi Tecnico" per iniziare
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
