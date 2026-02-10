/**
 * Componente Gestione Template WhatsApp
 */

import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { trpc } from "@/lib/trpc";

interface WhatsAppTemplate {
  id: number;
  name: string;
  message: string;
  isActive: boolean;
}

export function WhatsAppSettings() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const { data, refetch } = trpc.whatsapp.getTemplates.useQuery();
  const createMutation = trpc.whatsapp.createTemplate.useMutation();
  const updateMutation = trpc.whatsapp.updateTemplate.useMutation();
  const deleteMutation = trpc.whatsapp.deleteTemplate.useMutation();

  useEffect(() => {
    if (data) {
      setTemplates(data);
    }
  }, [data]);

  const handleEdit = (template: WhatsAppTemplate) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditMessage(template.message);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      await updateMutation.mutateAsync({
        id: editingId,
        name: editName,
        message: editMessage,
      });

      Alert.alert("Successo", "Template aggiornato!");
      setEditingId(null);
      refetch();
    } catch (error) {
      Alert.alert("Errore", "Impossibile aggiornare il template");
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Conferma",
      "Vuoi eliminare questo template?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({ id });
              Alert.alert("Successo", "Template eliminato!");
              refetch();
            } catch (error) {
              Alert.alert("Errore", "Impossibile eliminare il template");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background p-6">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground mb-2">
          Template Messaggi WhatsApp
        </Text>
        <Text className="text-sm text-muted">
          Gestisci i 5 messaggi personalizzabili per i promemoria automatici 2 giorni prima dell'appuntamento.
        </Text>
        <Text className="text-sm text-muted mt-2">
          Variabili disponibili: {"{"}{"{"} cliente {"}"}{"}"}, {"{"}{"{"} data {"}"}{"}"}, {"{"}{"{"} ora {"}"}{"}"}, {"{"}{"{"} tecnico {"}"}{"}"}
        </Text>
      </View>

      {templates.map((template) => (
        <View
          key={template.id}
          className="bg-surface rounded-lg p-4 mb-4 border border-border"
        >
          {editingId === template.id ? (
            <>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Nome template"
                className="bg-background border border-border rounded px-3 py-2 text-foreground mb-3"
              />
              <TextInput
                value={editMessage}
                onChangeText={setEditMessage}
                placeholder="Messaggio"
                multiline
                numberOfLines={5}
                className="bg-background border border-border rounded px-3 py-2 text-foreground mb-3"
                style={{ minHeight: 120 }}
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleSave}
                  className="flex-1 bg-primary rounded px-4 py-3"
                >
                  <Text className="text-white text-center font-semibold">
                    Salva
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEditingId(null)}
                  className="flex-1 bg-gray-300 rounded px-4 py-3"
                >
                  <Text className="text-gray-700 text-center font-semibold">
                    Annulla
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-lg font-semibold text-foreground flex-1">
                  {template.name}
                </Text>
                <View
                  className={`px-2 py-1 rounded ${
                    template.isActive ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      template.isActive ? "text-green-700" : "text-gray-500"
                    }`}
                  >
                    {template.isActive ? "Attivo" : "Disattivo"}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-muted mb-3">{template.message}</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleEdit(template)}
                  className="flex-1 bg-blue-500 rounded px-4 py-2"
                >
                  <Text className="text-white text-center font-medium">
                    Modifica
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(template.id)}
                  className="flex-1 bg-red-500 rounded px-4 py-2"
                >
                  <Text className="text-white text-center font-medium">
                    Elimina
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}

      <View className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-sm text-yellow-800 font-medium mb-2">
          ℹ️ Come funziona
        </Text>
        <Text className="text-sm text-yellow-700">
          • Quando crei un appuntamento, spunta "Invia promemoria WhatsApp"{"\n"}
          • Seleziona uno dei 5 template personalizzabili{"\n"}
          • Il sistema invierà automaticamente il messaggio 2 giorni prima{"\n"}
          • Le variabili verranno sostituite con i dati reali dell'appuntamento
        </Text>
      </View>
    </ScrollView>
  );
}
