import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { trpc, trpcClient } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

interface AppointmentFormModalProps {
  visible: boolean;
  onClose: () => void;
  prefilledData?: {
    date: Date;
    technicianId: number;
  };
  existingAppointment?: any; // Per modifica
  onSuccess?: () => void;
}

export function AppointmentFormModal({
  visible,
  onClose,
  prefilledData,
  existingAppointment,
  onSuccess,
}: AppointmentFormModalProps) {
  const colors = useColors();
  const utils = trpc.useUtils();

  // State form
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [interventionType, setInterventionType] = useState("Manutenzione ordinaria");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);

  // Ricerca cliente
  const searchCustomerQuery = trpc.customers.searchByPhone.useQuery(
    { phone: customerPhone },
    { enabled: customerPhone.length >= 8 }
  );

  // Pre-compilare dati se cliente trovato
  useEffect(() => {
    if (searchCustomerQuery.data) {
      const customer = searchCustomerQuery.data;
      setCustomerId(customer.id);
      setCustomerName(`${customer.firstName} ${customer.lastName}`);
      setCustomerAddress(customer.address);
      setCustomerCity(customer.city);
    } else {
      setCustomerId(null);
    }
  }, [searchCustomerQuery.data]);

  // Pre-compilare se modifica appuntamento esistente
  useEffect(() => {
    if (existingAppointment) {
      setCustomerPhone(existingAppointment.customer?.phone || "");
      setCustomerName(
        `${existingAppointment.customer?.firstName || ""} ${existingAppointment.customer?.lastName || ""}`
      );
      setCustomerAddress(existingAppointment.customer?.address || "");
      setCustomerCity(existingAppointment.customer?.city || "");
      setInterventionType(existingAppointment.interventionType || "Manutenzione ordinaria");
      setDuration(String(existingAppointment.duration || 60));
      setNotes(existingAppointment.notes || "");
      setCustomerId(existingAppointment.customerId);
    }
  }, [existingAppointment]);

  // Mutation creazione
  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      utils.appointments.getAll.invalidate();
      onSuccess?.();
      handleClose();
    },
  });

  // Mutation modifica
  const updateMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      utils.appointments.getAll.invalidate();
      onSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    // Reset form
    setCustomerPhone("");
    setCustomerName("");
    setCustomerAddress("");
    setCustomerCity("");
    setInterventionType("Manutenzione ordinaria");
    setDuration("60");
    setNotes("");
    setCustomerId(null);
    onClose();
  };

  const handleSave = async () => {
    // Validazione
    if (!customerPhone || !customerName) {
      alert("Telefono e nome cliente sono obbligatori");
      return;
    }

    if (!prefilledData && !existingAppointment) {
      alert("Errore: dati appuntamento mancanti");
      return;
    }

    let finalCustomerId = customerId;

    // Se il cliente non esiste, crealo prima
    if (!finalCustomerId) {
      const [firstName, ...lastNameParts] = customerName.trim().split(" ");
      const lastName = lastNameParts.join(" ") || "";

      try {
        const result = await trpcClient.customers.create.mutate({
          firstName,
          lastName,
          phone: customerPhone,
          address: customerAddress || "Da specificare",
          city: customerCity || "Da specificare",
        });
        finalCustomerId = result.id;
      } catch (error) {
        alert("Errore nella creazione del cliente: " + (error as Error).message);
        return;
      }
    }

    const appointmentData = {
      customerId: finalCustomerId,
      serviceType: interventionType,
      duration: parseInt(duration) || 60,
      notes: notes || undefined,
      technicianId: existingAppointment?.technicianId || prefilledData?.technicianId || 1,
      scheduledDate: existingAppointment?.scheduledDate || prefilledData?.date || new Date(),
      status: existingAppointment?.status || ("scheduled" as const),
    };

    if (existingAppointment) {
      // Modifica
      updateMutation.mutate({
        id: existingAppointment.id,
        ...appointmentData,
      });
    } else {
      // Creazione
      createMutation.mutate(appointmentData);
    }
  };

  if (!visible) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <View
      className="absolute inset-0 items-center justify-center"
      style={{ zIndex: 1000, backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <View className="bg-background rounded-lg w-full max-w-2xl mx-4" style={{ maxHeight: "90%" }}>
        <ScrollView className="p-6">
          <Text className="text-2xl font-bold text-foreground mb-6">
            {existingAppointment ? "Modifica Appuntamento" : "Nuovo Appuntamento"}
          </Text>

          {/* Data e Ora */}
          {prefilledData && (
            <View className="mb-4 p-3 bg-surface rounded-lg">
              <Text className="text-sm font-semibold text-foreground mb-1">Data e Ora:</Text>
              <Text className="text-base text-muted">
                {prefilledData.date.toLocaleDateString("it-IT", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" alle "}
                {prefilledData.date.toLocaleTimeString("it-IT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text className="text-sm text-muted mt-1">
                Tecnico: {prefilledData.technicianId === 1 ? "Luca Corsi" : "Denis Corsi"}
              </Text>
            </View>
          )}

          {/* Telefono Cliente */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Telefono Cliente *{" "}
              {searchCustomerQuery.isLoading && <Text className="text-muted">(Ricerca...)</Text>}
            </Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-background"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="3331234567"
              keyboardType="phone-pad"
            />
            {searchCustomerQuery.data && (
              <Text className="text-sm text-success mt-1">
                ✓ Cliente trovato: {searchCustomerQuery.data.firstName}{" "}
                {searchCustomerQuery.data.lastName}
              </Text>
            )}
          </View>

          {/* Nome Cliente */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Nome Cliente *</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-background"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Mario Rossi"
            />
          </View>

          {/* Indirizzo */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Indirizzo</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-background"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="Via Roma 123"
            />
          </View>

          {/* Città */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Città</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-background"
              value={customerCity}
              onChangeText={setCustomerCity}
              placeholder="Milano"
            />
          </View>

          {/* Tipo Intervento */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Tipo Intervento</Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                "Manutenzione ordinaria",
                "Riparazione",
                "Installazione",
                "Sopralluogo",
                "Controllo",
              ].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`px-4 py-2 rounded-lg border ${
                    interventionType === type
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setInterventionType(type)}
                >
                  <Text
                    className={`text-sm ${
                      interventionType === type ? "text-white font-semibold" : "text-foreground"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Durata Prevista */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Durata Prevista (minuti)
            </Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-background"
              value={duration}
              onChangeText={setDuration}
              placeholder="60"
              keyboardType="numeric"
            />
          </View>

          {/* Note */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">Note</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 text-foreground bg-background"
              value={notes}
              onChangeText={setNotes}
              placeholder="Note aggiuntive..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Pulsanti */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-surface py-3 rounded-lg items-center"
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text className="text-foreground font-semibold">Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-primary py-3 rounded-lg items-center"
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">
                  {existingAppointment ? "Salva Modifiche" : "Crea Appuntamento"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
