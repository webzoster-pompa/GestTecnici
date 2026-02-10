/**
 * Componente Firma Digitale Cliente
 * Permette al tecnico di far firmare il cliente su canvas touch
 */

import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator } from "react-native";
import SignatureCanvas from "react-native-signature-canvas";
import { trpc } from "@/lib/trpc";

interface SignatureCaptureProps {
  appointmentId: number;
  visible: boolean;
  onClose: () => void;
  onSaved: (signatureUrl: string) => void;
}

export function SignatureCapture({ appointmentId, visible, onClose, onSaved }: SignatureCaptureProps) {
  const [isSaving, setIsSaving] = useState(false);
  const signatureRef = useRef<any>(null);

  const updateAppointmentMutation = trpc.appointments.update.useMutation({});

  const handleSave = async (signature: string) => {
    if (!signature) {
      Alert.alert("Errore", "La firma è vuota");
      return;
    }

    setIsSaving(true);

    try {
      // Salva firma nel database
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        signatureUrl: signature, // Base64 data URL
        signedAt: new Date(),
      });

      Alert.alert("Successo", "Firma salvata correttamente");
      onSaved(signature);
      onClose();
    } catch (error) {
      Alert.alert("Errore", "Impossibile salvare la firma");
      console.error("Errore salvataggio firma:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleEmpty = () => {
    Alert.alert("Firma Vuota", "Richiedi al cliente di firmare prima di salvare");
  };

  const style = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body,html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  `;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <View
          style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            backgroundColor: "#0066CC",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>
            ✍️ Firma Cliente
          </Text>
          <Text style={{ fontSize: 14, color: "#fff", opacity: 0.9 }}>
            Richiedi al cliente di firmare con il dito nell'area sottostante
          </Text>
        </View>

        {/* Canvas Firma */}
        <View style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSave}
            onEmpty={handleEmpty}
            descriptionText=""
            clearText="Cancella"
            confirmText="Salva"
            webStyle={style}
            autoClear={false}
            backgroundColor="#ffffff"
            penColor="#000000"
          />
        </View>

        {/* Footer Buttons */}
        <View
          style={{
            flexDirection: "row",
            padding: 16,
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            backgroundColor: "#fff",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: 16,
              backgroundColor: "#f5f5f5",
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#333" }}>Annulla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClear}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: 16,
              backgroundColor: "#FFA500",
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>Cancella</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isSaving}
            style={{
              flex: 1,
              padding: 16,
              backgroundColor: "#00CC66",
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>Salva</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
