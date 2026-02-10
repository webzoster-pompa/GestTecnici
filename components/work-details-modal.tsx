import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpcClient } from "@/lib/trpc";

interface WorkDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: number;
  customerName: string;
  actualDuration: number | null; // Durata effettiva in minuti
  existingDetails?: {
    workDescription: string | null;
    laborPrice: number | null;
    partsPrice: number | null;
    partsCode: string | null;
    paymentMethod: "cash" | "pos" | "transfer" | "unpaid" | null;
    ivaRate?: number | null;
  };
}

export function WorkDetailsModal({
  visible,
  onClose,
  appointmentId,
  customerName,
  actualDuration,
  existingDetails,
}: WorkDetailsModalProps) {
  const colors = useColors();
  
  const [workDescription, setWorkDescription] = useState("");
  const [laborPrice, setLaborPrice] = useState("");
  const [partsPrice, setPartsPrice] = useState("");
  const [partsCode, setPartsCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "pos" | "transfer" | "unpaid">("unpaid");
  const [ivaRate, setIvaRate] = useState<10 | 22>(22); // 10% o 22%
  const [saving, setSaving] = useState(false);

  // Carica dati esistenti quando modal si apre
  useEffect(() => {
    if (visible && existingDetails) {
      setWorkDescription(existingDetails.workDescription || "");
      setLaborPrice(existingDetails.laborPrice?.toString() || "");
      setPartsPrice(existingDetails.partsPrice?.toString() || "");
      setPartsCode(existingDetails.partsCode || "");
      setPaymentMethod(existingDetails.paymentMethod || "unpaid");
      setIvaRate((existingDetails.ivaRate as 10 | 22) || 22);
    } else if (visible && !existingDetails) {
      // Reset campi se non ci sono dati esistenti
      setWorkDescription("");
      setLaborPrice("");
      setPartsPrice("");
      setPartsCode("");
      setPaymentMethod("unpaid");
      setIvaRate(22);
    }
  }, [visible, existingDetails]);

  const handleSave = async () => {
    // Validazione
    if (!workDescription.trim()) {
      Alert.alert("Errore", "Inserisci una descrizione del lavoro svolto");
      return;
    }

    const laborPriceNum = laborPrice ? parseFloat(laborPrice) : 0;
    const partsPriceNum = partsPrice ? parseFloat(partsPrice) : 0;
    
    if (laborPriceNum === 0 && partsPriceNum === 0) {
      Alert.alert("Errore", "Inserisci almeno un prezzo (manodopera o materiali)");
      return;
    }

    if (isNaN(laborPriceNum) || isNaN(partsPriceNum)) {
      Alert.alert("Errore", "I prezzi devono essere numeri validi");
      return;
    }

    setSaving(true);
    try {
      const subtotal = laborPriceNum + partsPriceNum;
      const ivaAmount = subtotal * (ivaRate / 100);
      const totalWithIva = subtotal + ivaAmount;

      console.log("Salvando dettagli intervento:", {
        appointmentId,
        workDescription: workDescription.trim(),
        laborPrice: laborPriceNum,
        partsPrice: partsPriceNum,
        partsCode: partsCode.trim() || undefined,
        paymentMethod,
        ivaRate,
        totalPrice: totalWithIva,
      });

      const result = await trpcClient.appointments.update.mutate({
        id: appointmentId,
        workDescription: workDescription.trim(),
        laborPrice: laborPriceNum || undefined,
        partsPrice: partsPriceNum || undefined,
        partsCode: partsCode.trim() || undefined,
        paymentMethod,
        ivaRate,
        totalPrice: totalWithIva,
      });

      console.log("Risultato salvataggio:", result);

      // Mostra alert e chiudi il modal
      Alert.alert(
        "✅ Salvato",
        `Dettagli intervento salvati con successo\nTotale: € ${totalWithIva.toFixed(2)}`,
        [{ text: "OK", onPress: () => {
          console.log("Chiudendo modal dopo salvataggio");
          onClose();
        }}]
      );
      
      // Fallback: chiudi il modal dopo 1 secondo se l'alert non funziona
      setTimeout(() => {
        console.log("Fallback: chiudendo modal");
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Errore salvataggio dettagli:", error);
      Alert.alert("Errore", `Impossibile salvare i dettagli: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const subtotal = (parseFloat(laborPrice) || 0) + (parseFloat(partsPrice) || 0);
  const ivaAmount = subtotal * (ivaRate / 100);
  const totalPrice = subtotal + ivaAmount;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
                Dettagli Intervento
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                {customerName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 28, color: colors.muted }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            {/* Durata effettiva */}
            {actualDuration !== null && (
              <View
                style={{
                  backgroundColor: colors.success + "20",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.success }}>
                  ⏱️ Durata effettiva: {actualDuration} minuti
                </Text>
              </View>
            )}

            {/* Lavoro Svolto */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                Lavoro Svolto *
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
                placeholder="Descrivi il lavoro effettuato..."
                placeholderTextColor={colors.muted}
                value={workDescription}
                onChangeText={setWorkDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Prezzo Manodopera */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                Prezzo Manodopera
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginRight: 8 }}>
                  €
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  value={laborPrice}
                  onChangeText={(text) => {
                    // Accetta solo numeri e virgola/punto
                    const cleaned = text.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
                    setLaborPrice(cleaned);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              {actualDuration !== null && (
                <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                  Tempo effettivo: {actualDuration} min
                </Text>
              )}
            </View>

            {/* Prezzo Materiali/Pezzi */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                Prezzo Materiali/Pezzi
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginRight: 8 }}>
                  €
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  value={partsPrice}
                  onChangeText={(text) => {
                    // Accetta solo numeri e virgola/punto
                    const cleaned = text.replace(/[^0-9.,]/g, '').replace(/,/g, '.');
                    setPartsPrice(cleaned);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                }}
                placeholder="Codice pezzo (opzionale)"
                placeholderTextColor={colors.muted}
                value={partsCode}
                onChangeText={setPartsCode}
              />
            </View>

            {/* IVA Rate Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Aliquota IVA
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[10, 22].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    onPress={() => setIvaRate(rate as 10 | 22)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: ivaRate === rate ? colors.primary : colors.border,
                      backgroundColor: ivaRate === rate ? colors.primary + "20" : "transparent",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: ivaRate === rate ? "600" : "400",
                        color: ivaRate === rate ? colors.primary : colors.foreground,
                      }}
                    >
                      {rate}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Totale con IVA */}
            {subtotal > 0 && (
              <View
                style={{
                  backgroundColor: colors.primary + "20",
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>Subtotale:</Text>
                    <Text style={{ fontSize: 14, color: colors.muted }}>€ {subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text style={{ fontSize: 14, color: colors.muted }}>IVA {ivaRate}%:</Text>
                    <Text style={{ fontSize: 14, color: colors.muted }}>€ {ivaAmount.toFixed(2)}</Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: colors.primary, paddingTop: 8 }} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
                  Totale: € {totalPrice.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Metodo Pagamento */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
                Metodo Pagamento
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  { value: "pos", label: "POS" },
                  { value: "cash", label: "Contanti" },
                  { value: "transfer", label: "Bonifico" },
                  { value: "unpaid", label: "Non ha pagato" },
                ].map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    onPress={() => setPaymentMethod(method.value as any)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor:
                        paymentMethod === method.value ? colors.primary : colors.border,
                      backgroundColor:
                        paymentMethod === method.value ? colors.primary + "20" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: paymentMethod === method.value ? "600" : "400",
                        color:
                          paymentMethod === method.value ? colors.primary : colors.foreground,
                      }}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pulsanti */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 40 }}>
              <TouchableOpacity
                onPress={onClose}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: colors.border,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  Annulla
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  backgroundColor: saving ? colors.muted : colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                    Salva
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
