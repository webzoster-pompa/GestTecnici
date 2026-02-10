
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerDetailSheet } from "@/components/customer-detail-sheet";

type PaymentMethodFilter = "all" | "cash" | "pos" | "transfer" | "unpaid";
type PeriodFilter = "today" | "week" | "month" | "custom";

export function InvoicesManager() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethodFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  
  const { data: pendingInvoices, error: invoicesError, isLoading, refetch } = trpc.appointments.getPendingInvoices.useQuery();
  
  React.useEffect(() => {
    if (invoicesError) {
      console.error('[InvoicesManager] Error loading invoices:', invoicesError);
    }
    if (pendingInvoices) {
      console.log('[InvoicesManager] Loaded invoices:', pendingInvoices);
    }
  }, [pendingInvoices, invoicesError]);
  
  const updateAppointmentMutation = trpc.appointments.update.useMutation({
    onSuccess: () => {
      refetch();
      setShowInvoiceModal(false);
      setInvoiceNumber("");
    },
  });

  const handleMarkAsInvoiced = async (appointment: any) => {
    if (!invoiceNumber.trim()) {
      alert("Inserisci il numero fattura");
      return;
    }

    console.log('[InvoicesManager] Marking as invoiced:', { appointmentId: appointment.id, invoiceNumber });
    
    updateAppointmentMutation.mutate({
      id: appointment.id,
      invoiceStatus: "invoiced",
      invoiceNumber,
    }, {
      onSuccess: () => {
        console.log('[InvoicesManager] Successfully marked as invoiced');
        alert('Fattura salvata con successo!');
        setShowInvoiceModal(false);
        setInvoiceNumber("");
        setSelectedAppointment(null);
        refetch();
        // Invalidate customer history cache so it reloads with updated data
        if (selectedCustomerId) {
          queryClient.invalidateQueries({
            queryKey: [['appointments', 'getCustomerHistory'], { input: { customerId: selectedCustomerId } }]
          });
        }
      },
      onError: (error) => {
        console.error('[InvoicesManager] Error marking as invoiced:', error);
        alert('Errore nel salvataggio della fattura: ' + (error?.message || 'Errore sconosciuto'));
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Filtri */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
          Gestione Fatture
        </Text>
        
        {/* Payment Method Filter */}
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Metodo Pagamento
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {(["all", "cash", "pos", "transfer", "unpaid"] as const).map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setPaymentFilter(method)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: paymentFilter === method ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  color: paymentFilter === method ? colors.background : colors.foreground,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {method === "all" ? "Tutti" : method === "cash" ? "Contanti" : method === "pos" ? "POS" : method === "transfer" ? "Bonifico" : "Non Pagato"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period Filter */}
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
          Periodo
        </Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(["today", "week", "month", "custom"] as const).map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setPeriodFilter(period)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: periodFilter === period ? colors.primary : colors.surface,
              }}
            >
              <Text
                style={{
                  color: periodFilter === period ? colors.background : colors.foreground,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {period === "today" ? "Oggi" : period === "week" ? "Settimana" : period === "month" ? "Mese" : "Personalizzato"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {isLoading ? (
          <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: colors.muted }}>Caricamento fatture...</Text>
          </View>
        ) : pendingInvoices && pendingInvoices.length > 0 ? (
          <View style={{ gap: 12 }}>
            {pendingInvoices.map((invoice) => (
              <View
                key={invoice.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => {
                    setSelectedCustomerId(invoice.customer?.id);
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.primary, marginBottom: 4 }}>
                      {invoice.customer?.firstName} {invoice.customer?.lastName}
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 2 }}>
                      📍 {invoice.customer?.city}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
                      €{(parseFloat(invoice.totalPrice) || 0).toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      {invoice.paymentMethod === "cash" ? "Contanti" : invoice.paymentMethod === "pos" ? "POS" : invoice.paymentMethod === "transfer" ? "Bonifico" : "Non Pagato"}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>
                    Lavoro: {invoice.workDescription}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    📅 {new Date(invoice.completedAt).toLocaleDateString("it-IT")}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedAppointment(invoice);
                    setShowInvoiceModal(true);
                  }}
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.background, fontWeight: "600" }}>
                    ✓ Segna Fatturata
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ justifyContent: "center", alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: colors.muted }}>Nessuna fattura da emettere</Text>
          </View>
        )}
      </ScrollView>

      {/* Invoice Modal */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: "50%",
          }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              Numero Fattura
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors.foreground,
                marginBottom: 16,
              }}
              placeholder="Es. FAT-2024-001"
              placeholderTextColor={colors.muted}
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowInvoiceModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleMarkAsInvoiced(selectedAppointment)}
                disabled={updateAppointmentMutation.isPending}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.background, fontWeight: "600" }}>
                  {updateAppointmentMutation.isPending ? "Salvataggio..." : "Salva"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer Detail Sheet */}
      {selectedCustomerId && (
        <CustomerDetailSheet
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </View>
  );
}
