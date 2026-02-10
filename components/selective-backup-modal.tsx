/**
 * Modal Backup Selettivo Clienti
 * Permette di selezionare clienti, fare backup e cancellarli definitivamente
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Platform } from "react-native";
import { trpc } from "@/lib/trpc";

interface SelectiveBackupModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SelectiveBackupModal({ visible, onClose }: SelectiveBackupModalProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [backupPath, setBackupPath] = useState("D:\\Backup_Clienti");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: customers } = trpc.customers.list.useQuery({ limit: 10000 }); // Limite alto per ottenere tutti i clienti
  const backupAndDeleteMutation = trpc.statistics.backupAndDelete.useMutation();

  const toggleCustomer = (customerId: number) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  const selectAll = () => {
    if (customers) {
      setSelectedCustomers(customers.map((c: any) => c.id));
    }
  };

  const deselectAll = () => {
    setSelectedCustomers([]);
  };

  const handleBackupAndDelete = async () => {
    if (selectedCustomers.length === 0) {
      alert("Seleziona almeno un cliente");
      return;
    }

    const confirmed = confirm(
      `ATTENZIONE: Stai per eliminare definitivamente ${selectedCustomers.length} clienti e tutti i loro appuntamenti.\n\n` +
      `Verrà creato un backup in: ${backupPath}\n\n` +
      `Questa operazione NON può essere annullata. Continuare?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const result = await backupAndDeleteMutation.mutateAsync({
        customerIds: selectedCustomers,
        backupPath,
      });

      setResult(result);
      setSelectedCustomers([]);
      
      alert(
        `Operazione completata!\n\n` +
        `Backup salvato in: ${result.backupResult.filePath}\n` +
        `Clienti eliminati: ${result.deleteResult.deletedCustomers}\n` +
        `Appuntamenti eliminati: ${result.deleteResult.deletedAppointments}`
      );
    } catch (error) {
      console.error("Backup error:", error);
      alert("Errore durante l'operazione: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 32,
          width: "90%",
          maxWidth: 800,
          maxHeight: "90%",
        }}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#333", marginBottom: 8 }}>
            🗑️ Backup e Cancellazione Clienti
          </Text>
          <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
            Seleziona i clienti da eliminare definitivamente. Verrà creato un backup Excel prima della cancellazione.
          </Text>
        </View>

        {/* Percorso Backup */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 }}>
            Percorso Backup (Disco Esterno)
          </Text>
          <TextInput
            value={backupPath}
            onChangeText={setBackupPath}
            placeholder="D:\Backup_Clienti"
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              backgroundColor: "#F9FAFB",
            }}
          />
          <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Esempio Windows: D:\Backup_Clienti | Linux/Mac: /mnt/backup/clienti
          </Text>
        </View>

        {/* Azioni Selezione */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={selectAll}
            style={{
              backgroundColor: "#0066CC",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Seleziona Tutti</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={deselectAll}
            style={{
              backgroundColor: "#6B7280",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Deseleziona Tutti</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 14, color: "#666", alignSelf: "center", marginLeft: "auto" }}>
            Selezionati: {selectedCustomers.length}
          </Text>
        </View>

        {/* Lista Clienti */}
        <ScrollView style={{ maxHeight: 400, marginBottom: 20 }}>
          {customers?.map((customer: any) => (
            <TouchableOpacity
              key={customer.id}
              onPress={() => toggleCustomer(customer.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderWidth: 1,
                borderColor: selectedCustomers.includes(customer.id) ? "#0066CC" : "#E5E7EB",
                borderRadius: 8,
                marginBottom: 8,
                backgroundColor: selectedCustomers.includes(customer.id) ? "#EFF6FF" : "#fff",
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: selectedCustomers.includes(customer.id) ? "#0066CC" : "#D1D5DB",
                  backgroundColor: selectedCustomers.includes(customer.id) ? "#0066CC" : "#fff",
                  marginRight: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {selectedCustomers.includes(customer.id) && (
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>
                  {customer.firstName} {customer.lastName}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {customer.phone} • {customer.city}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Azioni */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={onClose}
            disabled={isProcessing}
            style={{
              flex: 1,
              backgroundColor: "#F3F4F6",
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#374151", fontSize: 16, fontWeight: "600" }}>Annulla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBackupAndDelete}
            disabled={isProcessing || selectedCustomers.length === 0}
            style={{
              flex: 1,
              backgroundColor: selectedCustomers.length > 0 ? "#DC2626" : "#D1D5DB",
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              {isProcessing ? "Elaborazione..." : "Backup e Elimina"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: "#FEF2F2",
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: "#DC2626",
          }}
        >
          <Text style={{ fontSize: 12, color: "#991B1B", fontWeight: "600" }}>
            ⚠️ ATTENZIONE: L'eliminazione è DEFINITIVA e NON può essere annullata!
          </Text>
        </View>
      </View>
    </View>
  );
}
