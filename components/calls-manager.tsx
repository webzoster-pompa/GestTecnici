"use client";

import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from "react-native";
import { trpc, trpcClient } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { CustomerDetailSheet } from "@/components/customer-detail-sheet";

type CallStatus = "waiting_parts" | "info_only" | "completed" | "appointment_scheduled";
type CallStatusFilter = "all" | CallStatus;

export function CallsManager() {
  const colors = useColors();
  const [statusFilter, setStatusFilter] = useState<CallStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [technicianFilter, setTechnicianFilter] = useState<number | "all">("all");
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [showOpenOnly, setShowOpenOnly] = useState(true);
  const [selectedCallIds, setSelectedCallIds] = useState<number[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  
  const { data: calls, refetch } = trpc.calls.list.useQuery();
  const { data: technicians } = trpc.technicians.list.useQuery();
  const deleteCallsMutation = trpc.calls.deleteMultiple.useMutation();
  
  // Delete selected calls handler
  const handleDeleteSelected = async () => {
    try {
      await deleteCallsMutation.mutateAsync({ callIds: selectedCallIds });
      setSelectedCallIds([]);
      refetch();
    } catch (error) {
      console.error("Errore cancellazione chiamate:", error);
      alert("Errore durante la cancellazione delle chiamate");
    }
  };
  
  // Export Excel handler
  const handleExportExcel = async () => {
    try {
      const result = await trpcClient.calls.exportFiltered.query({
        statusFilter: statusFilter === "all" ? undefined : statusFilter,
        searchQuery: searchQuery || undefined,
        cityFilter: cityFilter || undefined,
        technicianFilter: technicianFilter === "all" ? undefined : technicianFilter,
        showOpenOnly,
      });
      
      // Download file
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.base64}`;
      link.download = result.filename;
      link.click();
    } catch (error) {
      console.error("Errore esportazione:", error);
      alert("Errore durante l'esportazione del file Excel");
    }
  };
  
  // Filtra chiamate
  const filteredCalls = calls?.filter(call => {
    // Filtro tecnico
    if (technicianFilter !== "all" && call.technicianId !== technicianFilter) {
      return false;
    }
    // Filtra per stato "appointment_scheduled" se showOpenOnly è true
    if (showOpenOnly && call.status === "appointment_scheduled") return false;
    
    // Filtra per status
    if (statusFilter !== "all" && call.status !== statusFilter) return false;
    
    // Filtra per città
    if (cityFilter && !call.customerCity?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    
    // Filtra per ricerca (nome cliente o telefono)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = call.customerName?.toLowerCase().includes(query);
      const matchesPhone = call.customerPhone?.includes(query);
      if (!matchesName && !matchesPhone) return false;
    }
    
    return true;
  }) || [];
  
  const getStatusLabel = (status: CallStatus) => {
    switch (status) {
      case "waiting_parts": return "⏳ In Attesa Pezzi";
      case "info_only": return "ℹ️ Solo Info";
      case "completed": return "✅ Concluso";
      case "appointment_scheduled": return "📅 Fissato Appuntamento";
      default: return status;
    }
  };
  
  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case "waiting_parts": return "#F59E0B";
      case "info_only": return "#3B82F6";
      case "completed": return "#22C55E";
      case "appointment_scheduled": return "#8B5CF6";
      default: return colors.muted;
    }
  };
  
  const getTechnicianName = (technicianId: number | null) => {
    if (!technicianId) return "--";
    const tech = technicians?.find(t => t.id === technicianId);
    return tech ? `${tech.firstName} ${tech.lastName}` : "--";
  };
  
  if (Platform.OS !== "web") {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-muted text-center">
          La gestione chiamate è disponibile solo su dashboard PC
        </Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-background">
      {/* Header con pulsanti */}
      <View style={{ backgroundColor: "#fff", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground }}>
            📞 Gestione Chiamate
          </Text>
          
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: showOpenOnly ? colors.primary : colors.surface,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: showOpenOnly ? colors.primary : colors.border,
              }}
              onPress={() => setShowOpenOnly(!showOpenOnly)}
            >
              <Text style={{ color: showOpenOnly ? "#fff" : colors.foreground, fontWeight: "600" }}>
                📋 Chiamate Aperte
              </Text>
            </TouchableOpacity>
                        <TouchableOpacity
              style={{
                backgroundColor: "#10B981",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
              onPress={handleExportExcel}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>📊</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>Esporta Excel</Text>
            </TouchableOpacity>
            
            {selectedCallIds.length > 0 && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#DC2626",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => {
                  if (confirm(`Vuoi eliminare ${selectedCallIds.length} chiamata/e selezionata/e?`)) {
                    handleDeleteSelected();
                  }
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>🗑️</Text>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Elimina Selezionate ({selectedCallIds.length})</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={{
                backgroundColor: colors.success,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
              onPress={() => setShowNewCallModal(true)}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>+</Text>
              <Text style={{ color: "#fff", fontWeight: "600" }}>Nuova Chiamata</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Filtri Stato */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: statusFilter === "all" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: statusFilter === "all" ? colors.primary : colors.border,
            }}
            onPress={() => setStatusFilter("all")}
          >
            <Text style={{ color: statusFilter === "all" ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 14 }}>
              🔍 Tutte ({calls?.filter(c => showOpenOnly ? c.status !== "appointment_scheduled" : true).length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: statusFilter === "waiting_parts" ? "#F59E0B" : colors.surface,
              borderWidth: 1,
              borderColor: statusFilter === "waiting_parts" ? "#F59E0B" : colors.border,
            }}
            onPress={() => setStatusFilter("waiting_parts")}
          >
            <Text style={{ color: statusFilter === "waiting_parts" ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 14 }}>
              ⏳ In Attesa Pezzi ({calls?.filter(c => c.status === "waiting_parts").length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: statusFilter === "completed" ? "#22C55E" : colors.surface,
              borderWidth: 1,
              borderColor: statusFilter === "completed" ? "#22C55E" : colors.border,
            }}
            onPress={() => setStatusFilter("completed")}
          >
            <Text style={{ color: statusFilter === "completed" ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 14 }}>
              ✅ Completate ({calls?.filter(c => c.status === "completed").length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: statusFilter === "info_only" ? "#3B82F6" : colors.surface,
              borderWidth: 1,
              borderColor: statusFilter === "info_only" ? "#3B82F6" : colors.border,
            }}
            onPress={() => setStatusFilter("info_only")}
          >
            <Text style={{ color: statusFilter === "info_only" ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 14 }}>
              ℹ️ Solo Info ({calls?.filter(c => c.status === "info_only").length || 0})
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ backgroundColor: "#F3F4F6", padding: 12, borderRadius: 8 }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 4 }}>
            Chiamate Filtrate: <Text style={{ fontWeight: "bold", color: colors.foreground }}>{filteredCalls.length}</Text>
          </Text>
        </View>
      </View>
      
      {/* Alert Chiamate in Attesa Pezzi da Troppo Tempo */}
      {(() => {
        const now = new Date();
        const thresholdMs = 7 * 24 * 60 * 60 * 1000; // 7 giorni
        const waitingCalls = filteredCalls.filter(call => {
          if (call.status !== "waiting_parts") return false;
          const callDate = new Date(call.callDate);
          const daysSinceCall = now.getTime() - callDate.getTime();
          return daysSinceCall > thresholdMs;
        });
        
        if (waitingCalls.length === 0) return null;
        
        return (
          <View style={{ backgroundColor: "#FEF2F2", borderLeftWidth: 4, borderLeftColor: "#DC2626", padding: 16, margin: 16, borderRadius: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>⚠️</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#DC2626" }}>
                {waitingCalls.length} Chiamate in Attesa da più di 7 Giorni
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: "#991B1B", marginBottom: 12 }}>
              Le seguenti chiamate sono in attesa pezzi da oltre una settimana:
            </Text>
            {waitingCalls.slice(0, 5).map(call => {
              const daysSince = Math.floor((now.getTime() - new Date(call.callDate).getTime()) / (24 * 60 * 60 * 1000));
              return (
                <TouchableOpacity 
                  key={call.id} 
                  style={{ backgroundColor: "#fff", padding: 12, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: "#FCA5A5" }}
                  onPress={() => {
                    setSelectedCall(call);
                    setShowEditModal(true);
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                    {call.customerName || "Cliente sconosciuto"} - {call.customerCity || ""}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    📞 {call.customerPhone} • 📅 {daysSince} giorni fa
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                    {call.description || "Nessuna descrizione"}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {waitingCalls.length > 5 && (
              <Text style={{ fontSize: 13, color: "#991B1B", fontStyle: "italic", marginTop: 4 }}>
                + altre {waitingCalls.length - 5} chiamate in attesa
              </Text>
            )}
          </View>
        );
      })()}
      
      {/* Filtri */}
      <View style={{ backgroundColor: "#fff", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Cerca chiamata</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
                color: colors.foreground,
              }}
              placeholder="Nome cliente o telefono..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Cerca per città</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
                color: colors.foreground,
              }}
              placeholder="Es. Romano d'Ezzelino"
              value={cityFilter}
              onChangeText={setCityFilter}
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6 }}>Filtra per tecnico</Text>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 6,
                  backgroundColor: technicianFilter === "all" ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: technicianFilter === "all" ? colors.primary : colors.border,
                }}
                onPress={() => setTechnicianFilter("all")}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: technicianFilter === "all" ? "#fff" : colors.foreground,
                    fontWeight: technicianFilter === "all" ? "600" : "400",
                  }}
                >
                  Tutti
                </Text>
              </TouchableOpacity>
              {technicians?.map((tech) => (
                <TouchableOpacity
                  key={tech.id}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 6,
                    backgroundColor: technicianFilter === tech.id ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: technicianFilter === tech.id ? colors.primary : colors.border,
                  }}
                  onPress={() => setTechnicianFilter(tech.id)}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: technicianFilter === tech.id ? "#fff" : colors.foreground,
                      fontWeight: technicianFilter === tech.id ? "600" : "400",
                    }}
                  >
                    {tech.firstName} {tech.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>Stato Chiamata</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { value: "all", label: "Tutte" },
              { value: "info_only", label: "ℹ️ Solo Info" },
              { value: "waiting_parts", label: "⏳ In Attesa Pezzi" },
              { value: "completed", label: "✅ Concluso" },
              { value: "appointment_scheduled", label: "📅 Fissato Appuntamento" },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: statusFilter === filter.value ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: statusFilter === filter.value ? colors.primary : colors.border,
                }}
                onPress={() => setStatusFilter(filter.value as CallStatusFilter)}
              >
                <Text style={{
                  color: statusFilter === filter.value ? "#fff" : colors.foreground,
                  fontWeight: "600",
                  fontSize: 13,
                }}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      
      {/* Tabella chiamate */}
      <ScrollView style={{ flex: 1 }} horizontal>
        <View style={{ minWidth: 1800 }}>
          {/* Header tabella */}
          <View style={{
            flexDirection: "row",
            backgroundColor: "#F9FAFB",
            borderBottomWidth: 2,
            borderBottomColor: "#E5E7EB",
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}>
            <Text style={{ width: 160, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Azioni</Text>
            <Text style={{ width: 130, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Data chiamata</Text>
            <Text style={{ width: 180, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Cliente</Text>
            <Text style={{ width: 150, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Apparecchi</Text>
            <Text style={{ width: 150, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Città</Text>
            <Text style={{ width: 200, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Indirizzo</Text>
            <Text style={{ width: 120, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Telefono</Text>
            <Text style={{ width: 120, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Tipo intervento</Text>
            <Text style={{ width: 200, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Descrizione</Text>
            <Text style={{ width: 150, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Note</Text>
            <Text style={{ width: 100, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Tecnico</Text>
            <Text style={{ width: 150, fontSize: 12, fontWeight: "bold", color: colors.muted }}>Stato</Text>
          </View>
          
          {/* Righe */}
          <ScrollView style={{ flex: 1 }}>
            {filteredCalls.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📞</Text>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                  Nessuna Chiamata
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center" }}>
                  Clicca "Nuova Chiamata" per registrare una chiamata in arrivo
                </Text>
              </View>
            ) : (
              filteredCalls.map((call) => (
                <View
                  key={call.id}
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#fff",
                    borderBottomWidth: 1,
                    borderBottomColor: "#E5E7EB",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: "center",
                  }}
                >
                  <View style={{ width: 160, flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TouchableOpacity
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: selectedCallIds.includes(call.id) ? colors.primary : colors.border,
                        backgroundColor: selectedCallIds.includes(call.id) ? colors.primary : "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => {
                        setSelectedCallIds(prev => 
                          prev.includes(call.id) 
                            ? prev.filter(id => id !== call.id)
                            : [...prev, call.id]
                        );
                      }}
                    >
                      {selectedCallIds.includes(call.id) && (
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>✓</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => {
                        setSelectedCall(call);
                        setShowEditModal(true);
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => {
                        if (call.customerId) {
                          setSelectedCustomerId(call.customerId);
                          setShowCustomerDetail(true);
                        } else {
                          alert("Nessun cliente associato a questa chiamata");
                        }
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>👤</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: colors.success,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => {
                        setSelectedCall(call);
                        setShowAppointmentModal(true);
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 16 }}>📅</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ width: 130, fontSize: 13, color: colors.foreground }}>
                    {new Date(call.callDate).toLocaleString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Text style={{ width: 180, fontSize: 13, color: colors.foreground, fontWeight: "600" }}>
                    {call.customerName || "--"}
                  </Text>
                  <Text style={{ width: 150, fontSize: 13, color: colors.foreground }}>
                    {call.devices || "--"}
                  </Text>
                  <Text style={{ width: 150, fontSize: 13, color: colors.foreground }}>
                    {call.customerCity || "--"}
                  </Text>
                  <Text style={{ width: 200, fontSize: 13, color: colors.foreground }}>
                    {call.customerAddress || "--"}
                  </Text>
                  <Text style={{ width: 120, fontSize: 13, color: colors.foreground }}>
                    {call.customerPhone}
                  </Text>
                  <Text style={{ width: 120, fontSize: 13, color: colors.foreground }}>
                    {call.callType || "--"}
                  </Text>
                  <Text
                    style={{ width: 200, fontSize: 12, color: colors.muted }}
                    numberOfLines={2}
                  >
                    {call.description || "--"}
                  </Text>
                  <Text
                    style={{ width: 150, fontSize: 12, color: colors.muted }}
                    numberOfLines={2}
                  >
                    {call.notes || "--"}
                  </Text>
                  <Text style={{ width: 100, fontSize: 13, color: colors.foreground }}>
                    {getTechnicianName(call.technicianId)}
                  </Text>
                  <View style={{ width: 150 }}>
                    <View
                      style={{
                        backgroundColor: getStatusColor(call.status),
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                        {getStatusLabel(call.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
      
      {/* Modal Nuova Chiamata */}
      <NewCallModal
        visible={showNewCallModal}
        onClose={() => setShowNewCallModal(false)}
        onSuccess={() => {
          setShowNewCallModal(false);
          refetch();
        }}
        technicians={technicians || []}
      />
      
      {/* Modal Fissa Appuntamento */}
      {selectedCall && (
        <AppointmentFromCallModal
          visible={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedCall(null);
          }}
          onSuccess={() => {
            setShowAppointmentModal(false);
            setSelectedCall(null);
            refetch();
          }}
          call={selectedCall}
          technicians={technicians || []}
        />
      )}
      
      {/* Modal Modifica Chiamata */}
      {selectedCall && (
        <EditCallModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCall(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedCall(null);
            refetch();
          }}
          call={selectedCall}
          technicians={technicians || []}
        />
      )}
      
      {/* Scheda Cliente */}
      {selectedCustomerId && (
        <CustomerDetailSheet
          visible={showCustomerDetail}
          customerId={selectedCustomerId}
          onClose={() => {
            setShowCustomerDetail(false);
            setSelectedCustomerId(null);
          }}
          onUpdate={() => {
            refetch();
          }}
        />
      )}
    </View>
  );
}


// Componente Modal Nuova Chiamata
interface NewCallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  technicians: any[];
}

function NewCallModal({ visible, onClose, onSuccess, technicians }: NewCallModalProps) {
  const colors = useColors();
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [zone, setZone] = useState("");
  const [devices, setDevices] = useState("");
  const [callType, setCallType] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [technicianId, setTechnicianId] = useState<number | undefined>();
  const [status, setStatus] = useState<CallStatus>("info_only");
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [nameSearchResults, setNameSearchResults] = useState<any[]>([]);
  const [showNameResults, setShowNameResults] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  
  // Dati nuovo cliente
  const [newCustomerFirstName, setNewCustomerFirstName] = useState("");
  const [newCustomerLastName, setNewCustomerLastName] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [newCustomerPostalCode, setNewCustomerPostalCode] = useState("");
  const [newCustomerZone, setNewCustomerZone] = useState("");
  const [newCustomerDevices, setNewCustomerDevices] = useState("");
  
  // Stati per controllo duplicati
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateCustomers, setDuplicateCustomers] = useState<any[]>([]);
  
  const createCallMutation = trpc.calls.create.useMutation();
  const checkDuplicateMutation = trpc.customers.checkDuplicateByAddress.useMutation();
  const interventionTypesQuery = trpc.interventionTypes.getAll.useQuery();
  const createTypeMutation = trpc.interventionTypes.create.useMutation();
  const searchCustomerQuery = trpc.calls.searchCustomerByPhone.useQuery(
    { phone },
    { enabled: phone.length >= 8 }
  );
  const searchByNameQuery = trpc.calls.searchCustomerByName.useQuery(
    { searchTerm: nameSearchTerm },
    { enabled: nameSearchTerm.length >= 2 }
  );
  
  // Debug ricerca nome
  React.useEffect(() => {
    console.log('[SEARCH NAME] Term:', nameSearchTerm);
    console.log('[SEARCH NAME] Query enabled:', nameSearchTerm.length >= 2);
    console.log('[SEARCH NAME] Results:', searchByNameQuery.data);
    console.log('[SEARCH NAME] Show dropdown:', showNameResults);
  }, [nameSearchTerm, searchByNameQuery.data, showNameResults]);
  
  // Ricerca automatica cliente quando cambia telefono
  const handlePhoneChange = (value: string) => {
    // Rimuovi tutti i caratteri non numerici (spazi, slash, trattini, ecc.)
    const cleanedPhone = value.replace(/[^0-9]/g, "");
    setPhone(cleanedPhone);
  };
  
  // Effetto per gestire stato ricerca
  React.useEffect(() => {
    setIsSearching(searchCustomerQuery.isLoading);
  }, [searchCustomerQuery.isLoading]);
  
  // Effetto per pre-compilare dati quando cliente trovato
  React.useEffect(() => {
    if (searchCustomerQuery.data) {
      // Cliente trovato → pre-compila dati
      setFoundCustomer(searchCustomerQuery.data);
      setCustomerName(`${searchCustomerQuery.data.firstName} ${searchCustomerQuery.data.lastName}`);
      setAddress(searchCustomerQuery.data.address || "");
      setCity(searchCustomerQuery.data.city || "");
      setPostalCode(searchCustomerQuery.data.postalCode || "");
      setZone(searchCustomerQuery.data.zone || "");
    } else if (phone.length >= 8 && !searchCustomerQuery.isLoading && !searchCustomerQuery.data) {
      // Cliente non trovato → reset campi (ma mantieni telefono)
      setFoundCustomer(null);
      if (customerName) setCustomerName("");
      if (address) setAddress("");
      if (city) setCity("");
      if (postalCode) setPostalCode("");
      if (zone) setZone("");
    }
  }, [searchCustomerQuery.data, searchCustomerQuery.isLoading, phone]);
  
  const createCustomerMutation = trpc.customers.create.useMutation();
  
  const handleSave = async (force = false) => {
    if (!phone) {
      alert("Inserisci il numero di telefono");
      return;
    }
    
    let customerId = foundCustomer?.id;
    
    // Se non ho trovato un cliente esistente e ho compilato i campi manualmente,
    // devo creare il cliente nel database
    if (!foundCustomer && customerName.trim()) {
      console.log('[CREA CLIENTE] Cliente non trovato, devo crearlo...');
      
      // Controllo duplicati PRIMA di creare il cliente
      if (!force && city.trim() && address.trim()) {
        console.log('[CONTROLLO DUPLICATI] Eseguo controllo prima di creare cliente...');
        try {
          const duplicates = await checkDuplicateMutation.mutateAsync({
            city: city.trim(),
            address: address.trim(),
          });
          
          console.log('[CONTROLLO DUPLICATI] Risultati:', duplicates);
          
          if (duplicates && duplicates.length > 0) {
            console.log('[CONTROLLO DUPLICATI] Duplicati trovati! Mostro alert...');
            setDuplicateCustomers(duplicates);
            setShowDuplicateAlert(true);
            return;
          } else {
            console.log('[CONTROLLO DUPLICATI] Nessun duplicato trovato');
          }
        } catch (error) {
          console.error('[CONTROLLO DUPLICATI] Errore:', error);
        }
      }
      
      // Split nome in firstName e lastName
      const nameParts = customerName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      console.log('[CREA CLIENTE] Creo nuovo cliente:', { firstName, lastName, phone, address, city });
      
      try {
        const newCustomer = await createCustomerMutation.mutateAsync({
          firstName,
          lastName,
          phone,
          address: address || undefined,
          city: city || undefined,
          postalCode: postalCode || undefined,
          zone: zone || undefined,
          devices: devices || undefined,
        });
        
        customerId = newCustomer.id;
        console.log('[CREA CLIENTE] Cliente creato con ID:', customerId);
      } catch (error) {
        console.error('[CREA CLIENTE] Errore creazione cliente:', error);
        alert("Errore durante la creazione del cliente");
        return;
      }
    }
    
    console.log('[SALVA CHIAMATA] customerId finale:', customerId);
    console.log('[SALVA CHIAMATA] customerName:', customerName);
    console.log('[SALVA CHIAMATA] address:', address);
    console.log('[SALVA CHIAMATA] city:', city);
    
    try {
      await createCallMutation.mutateAsync({
        customerId: customerId,
        customerName: customerName || undefined,
        customerPhone: phone,
        customerAddress: address || undefined,
        customerCity: city || undefined,
        customerPostalCode: postalCode || undefined,
        customerZone: zone || undefined,
        devices: devices || undefined,
        callType: callType || undefined,
        description: description || undefined,
        notes: notes || undefined,
        technicianId: technicianId || undefined,
        status,
        callDate: new Date(),
      });
      
      // Reset form
      setPhone("");
      setCustomerName("");
      setAddress("");
      setCity("");
      setPostalCode("");
      setZone("");
      setDevices("");
      setCallType("");
      setDescription("");
      setNotes("");
      setTechnicianId(undefined);
      setStatus("info_only");
      setFoundCustomer(null);
      
      onSuccess();
    } catch (error) {
      alert("Errore durante il salvataggio della chiamata");
      console.error(error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, width: 700, maxWidth: "95%", maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.foreground }}>
              ➕ Nuova Chiamata
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ maxHeight: 500 }}>
            {/* Telefono con ricerca automatica */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Telefono * {isSearching && <Text style={{ color: colors.primary }}>(Ricerca in corso...)</Text>}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: foundCustomer ? colors.success : colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  backgroundColor: foundCustomer ? "#F0FDF4" : "#fff",
                }}
                placeholder="Es. 3287632299"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
              />
              {foundCustomer && (
                <Text style={{ fontSize: 13, color: colors.success, marginTop: 4 }}>
                  ✓ Cliente trovato: {foundCustomer.firstName} {foundCustomer.lastName}
                </Text>
              )}
              {!foundCustomer && phone.length >= 8 && !searchCustomerQuery.isLoading && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
                    Cliente non trovato in database
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddCustomerForm(true);
                      // Pre-compila telefono
                      if (nameSearchTerm) {
                        const parts = nameSearchTerm.split(" ");
                        if (parts.length >= 2) {
                          setNewCustomerFirstName(parts[0]);
                          setNewCustomerLastName(parts.slice(1).join(" "));
                        } else {
                          setNewCustomerFirstName(nameSearchTerm);
                        }
                      }
                    }}
                    style={{
                      backgroundColor: colors.success,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>+</Text>
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Aggiungi Nuovo Cliente</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Nome Cliente - con ricerca */}
            <View style={{ marginBottom: 16, position: "relative" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Nome Cliente {!foundCustomer && "(o cerca per nome)"}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                }}
                placeholder={foundCustomer ? foundCustomer.firstName + " " + foundCustomer.lastName : "Inserisci nome e cognome"}
                value={foundCustomer ? `${foundCustomer.firstName} ${foundCustomer.lastName}` : customerName}
                onChangeText={(value) => {
                  if (!foundCustomer) {
                    setCustomerName(value);
                  }
                }}
                editable={!foundCustomer}
              />
              

              
              {/* Modal risultati ricerca */}
              <SearchResultsModal
                visible={showNameResults && nameSearchTerm.length >= 2}
                onClose={() => {
                  setShowNameResults(false);
                  setNameSearchTerm("");
                }}
                results={searchByNameQuery.data || []}
                isLoading={searchByNameQuery.isLoading}
                onSelectCustomer={(customer) => {
                  setFoundCustomer(customer);
                  setCustomerName(`${customer.firstName} ${customer.lastName}`);
                  setPhone(customer.phone);
                  setAddress(customer.address);
                  setCity(customer.city);
                  setPostalCode(customer.postalCode || "");
                  setZone(customer.zone || "");
                  setNameSearchTerm("");
                  setShowNameResults(false);
                }}
                onAddNewCustomer={() => {
                  setShowAddCustomerForm(true);
                  setShowNameResults(false);
                  // Pre-compila nome se disponibile
                  if (nameSearchTerm) {
                    const parts = nameSearchTerm.split(" ");
                    if (parts.length >= 2) {
                      setNewCustomerFirstName(parts[0]);
                      setNewCustomerLastName(parts.slice(1).join(" "));
                    } else {
                      setNewCustomerFirstName(nameSearchTerm);
                    }
                  }
                }}
              />
              
              {foundCustomer && (
                <TouchableOpacity
                  onPress={() => {
                    setFoundCustomer(null);
                    setCustomerName("");
                    setPhone("");
                    setAddress("");
                    setCity("");
                    setPostalCode("");
                    setZone("");
                  }}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ fontSize: 13, color: colors.primary }}>
                    ✕ Rimuovi cliente e inserisci manualmente
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Form Nuovo Cliente */}
            {showAddCustomerForm && (
              <AddCustomerForm
                phone={phone}
                nameSearchTerm={nameSearchTerm}
                onCancel={() => {
                  setShowAddCustomerForm(false);
                  setNewCustomerFirstName("");
                  setNewCustomerLastName("");
                  setNewCustomerAddress("");
                  setNewCustomerCity("");
                  setNewCustomerPostalCode("");
                  setNewCustomerZone("");
                  setNewCustomerDevices("");
                }}
                onSuccess={(customer) => {
                  setFoundCustomer(customer);
                  setCustomerName(`${customer.firstName} ${customer.lastName}`);
                  setPhone(customer.phone);
                  setAddress(customer.address);
                  setCity(customer.city);
                  setPostalCode(customer.postalCode || "");
                  setZone(customer.zone || "");
                  setShowAddCustomerForm(false);
                }}
                firstName={newCustomerFirstName}
                lastName={newCustomerLastName}
                address={newCustomerAddress}
                city={newCustomerCity}
                postalCode={newCustomerPostalCode}
                zone={newCustomerZone}
                devices={newCustomerDevices}
                onFirstNameChange={setNewCustomerFirstName}
                onLastNameChange={setNewCustomerLastName}
                onAddressChange={setNewCustomerAddress}
                onCityChange={setNewCustomerCity}
                onPostalCodeChange={setNewCustomerPostalCode}
                onZoneChange={setNewCustomerZone}
                onDevicesChange={setNewCustomerDevices}
              />
            )}
            
            {/* Indirizzo */}
            <View style={{ marginBottom: 16, display: showAddCustomerForm ? "none" : "flex" }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Indirizzo
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                }}
                placeholder="Via, numero civico"
                value={address}
                onChangeText={setAddress}
                editable={!foundCustomer}
              />
            </View>
            
            {/* Città e CAP */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  Città
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                  placeholder="Es. Romano d'Ezzelino"
                  value={city}
                  onChangeText={setCity}
                  editable={!foundCustomer}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  CAP
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                  placeholder="36060"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  keyboardType="number-pad"
                  editable={!foundCustomer}
                />
              </View>
            </View>
            
            {/* Zona */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Zona
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                }}
                placeholder="Es. Bassano est"
                value={zone}
                onChangeText={setZone}
                editable={!foundCustomer}
              />
            </View>
            
            {/* Apparecchi */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Apparecchi
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                }}
                placeholder="Es. Caldaia, Condizionatore"
                value={devices}
                onChangeText={setDevices}
              />
            </View>
            
            {/* Tipo Intervento */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Tipo Intervento
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[
                  "Manutenzione",
                  "Riparazione",
                  "Installazione",
                  "Controllo",
                  "Assistenza",
                  "Sopralluogo",
                ].map((tipo) => (
                  <TouchableOpacity
                    key={tipo}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: callType === tipo ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: callType === tipo ? colors.primary : colors.border,
                    }}
                    onPress={() => setCallType(tipo)}
                  >
                    <Text style={{ color: callType === tipo ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 14 }}>
                      {tipo}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  onPress={() => setShowNewTypeInput(!showNewTypeInput)}
                >
                  <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 14 }}>
                    ➕ Altro
                  </Text>
                </TouchableOpacity>
              </View>
              {showNewTypeInput && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      color: colors.foreground,
                    }}
                    placeholder="Inserisci tipo personalizzato"
                    value={callType}
                    onChangeText={setCallType}
                  />
                </View>
              )}
            </View>
            
            {/* Descrizione */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Descrizione Intervento
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholder="Descrivi il problema o la richiesta del cliente..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Note */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Note
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  minHeight: 60,
                  textAlignVertical: "top",
                }}
                placeholder="Note aggiuntive..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
            
            {/* Tecnico */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Tecnico Assegnato (opzionale)
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: !technicianId ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: !technicianId ? colors.primary : colors.border,
                  }}
                  onPress={() => setTechnicianId(undefined)}
                >
                  <Text style={{ color: !technicianId ? "#fff" : colors.foreground, fontWeight: "600" }}>
                    Nessuno
                  </Text>
                </TouchableOpacity>
                {technicians.map((tech) => (
                  <TouchableOpacity
                    key={tech.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: technicianId === tech.id ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: technicianId === tech.id ? colors.primary : colors.border,
                    }}
                    onPress={() => setTechnicianId(tech.id)}
                  >
                    <Text style={{ color: technicianId === tech.id ? "#fff" : colors.foreground, fontWeight: "600" }}>
                      {tech.firstName} {tech.lastName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Stato */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Stato Chiamata
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[
                  { value: "info_only", label: "ℹ️ Solo Info" },
                  { value: "waiting_parts", label: "⏳ In Attesa Pezzi" },
                  { value: "completed", label: "✅ Concluso" },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: status === s.value ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: status === s.value ? colors.primary : colors.border,
                    }}
                    onPress={() => setStatus(s.value as CallStatus)}
                  >
                    <Text style={{ color: status === s.value ? "#fff" : colors.foreground, fontWeight: "600" }}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          {/* Pulsanti */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 14,
                alignItems: "center",
              }}
              onPress={onClose}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 15 }}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.success,
                borderRadius: 8,
                padding: 14,
                alignItems: "center",
              }}
              onPress={() => handleSave(false)}
              disabled={createCallMutation.isPending}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                {createCallMutation.isPending ? "Salvataggio..." : "💾 Salva Chiamata"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Modal Alert Duplicati */}
      <Modal
        visible={showDuplicateAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDuplicateAlert(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, width: 500, maxWidth: "90%" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#DC2626", marginBottom: 12 }}>
              ⚠️ Cliente Duplicato Trovato
            </Text>
            <Text style={{ fontSize: 15, color: colors.foreground, marginBottom: 16 }}>
              Esiste già un cliente registrato allo stesso indirizzo:
            </Text>
            
            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              {duplicateCustomers.map((dup: any) => (
                <View
                  key={dup.id}
                  style={{
                    backgroundColor: "#FEF2F2",
                    borderWidth: 1,
                    borderColor: "#FCA5A5",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                    {dup.firstName} {dup.lastName}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    📞 {dup.phone}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    📍 {dup.address}, {dup.city}
                  </Text>
                </View>
              ))}
            </ScrollView>
            
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>
              Potrebbe trattarsi dello stesso nucleo familiare (es. marito/moglie). Vuoi procedere comunque con la chiamata?
            </Text>
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={() => setShowDuplicateAlert(false)}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.warning,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowDuplicateAlert(false);
                  handleSave(true);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Salva Comunque</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}


// Componente Modal Fissa Appuntamento da Chiamata
interface AppointmentFromCallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  call: any;
  technicians: any[];
}

function AppointmentFromCallModal({ visible, onClose, onSuccess, call, technicians }: AppointmentFromCallModalProps) {
  const colors = useColors();
  const [technicianId, setTechnicianId] = useState<number | undefined>(call.technicianId || undefined);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [serviceType, setServiceType] = useState(call.callType || "");
  const [notes, setNotes] = useState(call.description || "");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  
  const createAppointmentMutation = trpc.appointments.create.useMutation();
  
  const handleCreateAppointment = async () => {
    if (!call.customerId) {
      alert("Cliente non trovato. Impossibile creare appuntamento.");
      return;
    }
    
    if (!technicianId) {
      alert("Seleziona un tecnico");
      return;
    }
    
    try {
      // Combina data e ora
      const [hours, minutes] = scheduledTime.split(':');
      const appointmentDate = new Date(scheduledDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      await createAppointmentMutation.mutateAsync({
        customerId: call.customerId,
        technicianId,
        scheduledDate: appointmentDate,
        duration,
        serviceType,
        notes,
        whatsappEnabled,
      });
      
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Errore durante la creazione dell'appuntamento");
      console.error(error);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, width: 600, maxWidth: "95%", maxHeight: "90%" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.foreground }}>
              📅 Fissa Appuntamento
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.muted }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ maxHeight: 500 }}>
            {/* Info Cliente */}
            <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
                Cliente
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                📞 {call.customerPhone}
              </Text>
              {call.customerName && (
                <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 4 }}>
                  👤 {call.customerName}
                </Text>
              )}
              {call.customerAddress && (
                <Text style={{ fontSize: 14, color: colors.muted }}>
                  📍 {call.customerAddress}, {call.customerCity}
                </Text>
              )}
            </View>
            
            {/* Tecnico */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                Tecnico *
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {technicians.map((tech) => (
                  <TouchableOpacity
                    key={tech.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: technicianId === tech.id ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: technicianId === tech.id ? colors.primary : colors.border,
                    }}
                    onPress={() => setTechnicianId(tech.id)}
                  >
                    <Text style={{ color: technicianId === tech.id ? "#fff" : colors.foreground, fontWeight: "600" }}>
                      {tech.firstName} {tech.lastName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Data e Ora */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  Data *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                  placeholder="YYYY-MM-DD"
                  value={scheduledDate}
                  onChangeText={setScheduledDate}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  Ora *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: colors.foreground,
                  }}
                  placeholder="HH:MM"
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                />
              </View>
            </View>
            
            {/* Durata */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                Durata (minuti)
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[30, 60, 90, 120, 180].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: duration === d ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: duration === d ? colors.primary : colors.border,
                    }}
                    onPress={() => setDuration(d)}
                  >
                    <Text style={{ color: duration === d ? "#fff" : colors.foreground, fontWeight: "600" }}>
                      {d} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Tipo Servizio */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Tipo Servizio
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                }}
                placeholder="Es. Manutenzione, Riparazione"
                value={serviceType}
                onChangeText={setServiceType}
              />
            </View>
            
            {/* Note */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Note
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholder="Note aggiuntive..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Checkbox WhatsApp */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 12,
                backgroundColor: whatsappEnabled ? "#E8F5E9" : colors.surface,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: whatsappEnabled ? "#4CAF50" : colors.border,
              }}
              onPress={() => setWhatsappEnabled(!whatsappEnabled)}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  backgroundColor: whatsappEnabled ? "#4CAF50" : "#fff",
                  borderWidth: 2,
                  borderColor: whatsappEnabled ? "#4CAF50" : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {whatsappEnabled && (
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>✓</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                  📱 Invia conferma WhatsApp
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  Il cliente riceverà un messaggio con data, ora e tecnico assegnato
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
          
          {/* Pulsanti */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 14,
                alignItems: "center",
              }}
              onPress={onClose}
            >
              <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 15 }}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.success,
                borderRadius: 8,
                padding: 14,
                alignItems: "center",
              }}
              onPress={handleCreateAppointment}
              disabled={createAppointmentMutation.isPending}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                {createAppointmentMutation.isPending ? "Creazione..." : "✅ Crea Appuntamento"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


// Componente Modal Modifica Chiamata
interface EditCallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  call: any;
  technicians: any[];
}

function EditCallModal({ visible, onClose, onSuccess, call, technicians }: EditCallModalProps) {
  const colors = useColors();
  const [status, setStatus] = useState(call.status || "");
  const [notes, setNotes] = useState(call.notes || "");
  const [technicianId, setTechnicianId] = useState<number | undefined>(call.technicianId || undefined);
  const [description, setDescription] = useState(call.description || "");
  const [callType, setCallType] = useState(call.callType || "");
  
  const updateCallMutation = trpc.calls.update.useMutation();
  
  const handleUpdate = async () => {
    try {
      await updateCallMutation.mutateAsync({
        id: call.id,
        status,
        notes,
        technicianId,
        description,
        callType,
      });
      
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Errore durante l'aggiornamento della chiamata");
    }
  };
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground }}>
              ✏️ Modifica Chiamata
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 24, color: colors.muted }}>×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Info Cliente (readonly) */}
            <View style={{ marginBottom: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                Cliente: {call.customerName}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted }}>
                📞 {call.customerPhone}
              </Text>
              {call.customerAddress && (
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  📍 {call.customerAddress}, {call.customerCity}
                </Text>
              )}
            </View>
            
            {/* Stato */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Stato Chiamata
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[
                  { value: "waiting_parts", label: "In Attesa Pezzi", color: "#FF9800" },
                  { value: "info_only", label: "Solo Info", color: "#2196F3" },
                  { value: "completed", label: "Concluso", color: "#4CAF50" },
                  { value: "appointment_scheduled", label: "Fissato App.", color: "#9C27B0" },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 6,
                      backgroundColor: status === s.value ? s.color : colors.surface,
                      borderWidth: 1,
                      borderColor: status === s.value ? s.color : colors.border,
                    }}
                    onPress={() => setStatus(s.value)}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: status === s.value ? "#fff" : colors.foreground,
                        fontWeight: status === s.value ? "600" : "400",
                      }}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Tipo Intervento */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Tipo Intervento
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                }}
                placeholder="es. Riparazione Caldaia"
                value={callType}
                onChangeText={setCallType}
              />
            </View>
            
            {/* Descrizione */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Descrizione Problema
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                placeholder="Descrizione dettagliata..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Note */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Note
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  minHeight: 60,
                  textAlignVertical: "top",
                }}
                placeholder="Note aggiuntive..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
            
            {/* Tecnico */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                Tecnico Assegnato (opzionale)
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: !technicianId ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: !technicianId ? colors.primary : colors.border,
                  }}
                  onPress={() => setTechnicianId(undefined)}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: !technicianId ? "#fff" : colors.foreground,
                      fontWeight: !technicianId ? "600" : "400",
                    }}
                  >
                    Nessuno
                  </Text>
                </TouchableOpacity>
                {technicians.map((tech) => (
                  <TouchableOpacity
                    key={tech.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: technicianId === tech.id ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: technicianId === tech.id ? colors.primary : colors.border,
                    }}
                    onPress={() => setTechnicianId(tech.id)}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: technicianId === tech.id ? "#fff" : colors.foreground,
                        fontWeight: technicianId === tech.id ? "600" : "400",
                      }}
                    >
                      {tech.firstName} {tech.lastName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          {/* Pulsanti */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 14,
                alignItems: "center",
              }}
              onPress={onClose}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Annulla
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 8,
                padding: 14,
                alignItems: "center",
              }}
              onPress={handleUpdate}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                Salva Modifiche
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


// Modal risultati ricerca cliente per nome
function SearchResultsModal({ 
  visible, 
  onClose, 
  results, 
  isLoading, 
  onSelectCustomer,
  onAddNewCustomer
}: {
  visible: boolean;
  onClose: () => void;
  results: any[];
  isLoading: boolean;
  onSelectCustomer: (customer: any) => void;
  onAddNewCustomer?: () => void;
}) {
  const colors = useColors();
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={{ 
            backgroundColor: colors.background, 
            borderRadius: 12, 
            padding: 16, 
            width: 500, 
            maxWidth: "90%", 
            maxHeight: 400,
            borderWidth: 2,
            borderColor: colors.border,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground, marginBottom: 12 }}>
            🔍 Risultati Ricerca
          </Text>
          
          <ScrollView style={{ maxHeight: 300 }}>
            {isLoading && (
              <Text style={{ padding: 20, color: colors.muted, textAlign: "center" }}>
                Ricerca in corso...
              </Text>
            )}
            
            {!isLoading && results.length === 0 && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: colors.muted, textAlign: "center", marginBottom: 16, fontSize: 15 }}>
                  Nessun cliente trovato
                </Text>
                {onAddNewCustomer && (
                  <TouchableOpacity
                    onPress={() => {
                      onAddNewCustomer();
                      onClose();
                    }}
                    style={{
                      backgroundColor: colors.success,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>+</Text>
                    <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Aggiungi Nuovo Cliente</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {results.map((customer: any) => (
              <TouchableOpacity
                key={customer.id}
                onPress={() => {
                  onSelectCustomer(customer);
                  onClose();
                }}
                style={{
                  padding: 16,
                  marginBottom: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  {customer.firstName} {customer.lastName}
                </Text>
                <Text style={{ fontSize: 15, color: colors.muted, marginBottom: 3 }}>
                  📞 {customer.phone}
                </Text>
                <Text style={{ fontSize: 15, color: colors.muted }}>
                  📍 {customer.city}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            onPress={(e) => {
              e?.stopPropagation?.();
              onClose();
            }}
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: colors.surface,
              borderRadius: 8,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>Chiudi</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}


// Componente Form Aggiunta Nuovo Cliente
interface AddCustomerFormProps {
  phone: string;
  nameSearchTerm: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  zone: string;
  devices: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  onZoneChange: (value: string) => void;
  onDevicesChange: (value: string) => void;
  onCancel: () => void;
  onSuccess: (customer: any) => void;
}

function AddCustomerForm({
  phone,
  nameSearchTerm,
  firstName,
  lastName,
  address,
  city,
  postalCode,
  zone,
  devices,
  onFirstNameChange,
  onLastNameChange,
  onAddressChange,
  onCityChange,
  onPostalCodeChange,
  onZoneChange,
  onDevicesChange,
  onCancel,
  onSuccess,
}: AddCustomerFormProps) {
  const colors = useColors();
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [duplicateCustomers, setDuplicateCustomers] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  
  const createCustomerMutation = trpc.customers.create.useMutation();
  const checkDuplicateMutation = trpc.customers.checkDuplicateByAddress.useMutation();
  
  const handleSaveCustomer = async (force = false) => {
    // Validazione
    if (!firstName.trim()) {
      alert("Inserisci il nome del cliente");
      return;
    }
    if (!lastName.trim()) {
      alert("Inserisci il cognome del cliente");
      return;
    }
    if (!phone.trim()) {
      alert("Inserisci il numero di telefono");
      return;
    }
    if (!address.trim()) {
      alert("Inserisci l'indirizzo");
      return;
    }
    if (!city.trim()) {
      alert("Inserisci la città");
      return;
    }
    
    // Controllo duplicati solo se non forzato
    if (!force && city.trim() && address.trim()) {
      console.log('[CONTROLLO DUPLICATI FORM] Inizio controllo...');
      console.log('[CONTROLLO DUPLICATI FORM] city:', city.trim());
      console.log('[CONTROLLO DUPLICATI FORM] address:', address.trim());
      setIsCheckingDuplicate(true);
      try {
        const duplicates = await checkDuplicateMutation.mutateAsync({
          city: city.trim(),
          address: address.trim(),
        });
        
        console.log('[CONTROLLO DUPLICATI FORM] duplicates trovati:', duplicates);
        console.log('[CONTROLLO DUPLICATI FORM] numero duplicati:', duplicates?.length || 0);
        
        if (duplicates && duplicates.length > 0) {
          console.log('[CONTROLLO DUPLICATI FORM] ALERT DUPLICATI - Mostra alert');
          setDuplicateCustomers(duplicates);
          setShowDuplicateAlert(true);
          setIsCheckingDuplicate(false);
          return;
        } else {
          console.log('[CONTROLLO DUPLICATI FORM] Nessun duplicato trovato, procedo con creazione');
        }
      } catch (error) {
        console.error("Errore controllo duplicati:", error);
      }
      setIsCheckingDuplicate(false);
    }
    
    // Crea cliente
    try {
      const result = await createCustomerMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim() || undefined,
        notes: `Zona: ${zone.trim() || "Non specificata"}\nApparecchi: ${devices.trim() || "Non specificati"}`,
      });
      
      // Successo - ritorna cliente creato
      onSuccess({
        id: result.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        zone: zone.trim(),
      });
    } catch (error) {
      alert("Errore durante la creazione del cliente");
      console.error(error);
    }
  };
  
  return (
    <View style={{ backgroundColor: "#FFF9E6", borderWidth: 2, borderColor: colors.warning, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
          ➕ Nuovo Cliente
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={{ fontSize: 20, color: colors.muted }}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
        Compila tutti i campi per aggiungere un nuovo cliente al database
      </Text>
      
      {/* Nome */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
          Nome *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            color: colors.foreground,
            backgroundColor: "#fff",
          }}
          placeholder="Es. Mario"
          value={firstName}
          onChangeText={onFirstNameChange}
        />
      </View>
      
      {/* Cognome */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
          Cognome *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            color: colors.foreground,
            backgroundColor: "#fff",
          }}
          placeholder="Es. Rossi"
          value={lastName}
          onChangeText={onLastNameChange}
        />
      </View>
      
      {/* Indirizzo */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
          Indirizzo (Via, numero civico) *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            color: colors.foreground,
            backgroundColor: "#fff",
          }}
          placeholder="Es. Via Roma 123"
          value={address}
          onChangeText={onAddressChange}
        />
      </View>
      
      {/* Città e CAP */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 2 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            Città *
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 10,
              fontSize: 14,
              color: colors.foreground,
              backgroundColor: "#fff",
            }}
            placeholder="Es. Bassano del Grappa"
            value={city}
            onChangeText={onCityChange}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            CAP
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              padding: 10,
              fontSize: 14,
              color: colors.foreground,
              backgroundColor: "#fff",
            }}
            placeholder="36061"
            value={postalCode}
            onChangeText={onPostalCodeChange}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Zona */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
          Zona
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            color: colors.foreground,
            backgroundColor: "#fff",
          }}
          placeholder="Es. Bassano est"
          value={zone}
          onChangeText={onZoneChange}
        />
      </View>
      
      {/* Apparecchi */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
          Apparecchi
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 10,
            fontSize: 14,
            color: colors.foreground,
            backgroundColor: "#fff",
          }}
          placeholder="Es. Caldaia, Condizionatore"
          value={devices}
          onChangeText={onDevicesChange}
        />
      </View>
      
      {/* Pulsanti */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            alignItems: "center",
          }}
          onPress={onCancel}
        >
          <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>Annulla</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.success,
            borderRadius: 8,
            padding: 12,
            alignItems: "center",
            opacity: createCustomerMutation.isPending || isCheckingDuplicate ? 0.6 : 1,
          }}
          onPress={() => handleSaveCustomer(false)}
          disabled={createCustomerMutation.isPending || isCheckingDuplicate}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            {isCheckingDuplicate ? "Controllo..." : createCustomerMutation.isPending ? "Salvataggio..." : "💾 Salva Cliente"}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal Alert Duplicati */}
      <Modal
        visible={showDuplicateAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDuplicateAlert(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, width: 500, maxWidth: "90%" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#DC2626", marginBottom: 12 }}>
              ⚠️ Cliente Duplicato Trovato
            </Text>
            <Text style={{ fontSize: 15, color: colors.foreground, marginBottom: 16 }}>
              Esiste già un cliente registrato allo stesso indirizzo:
            </Text>
            
            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              {duplicateCustomers.map((dup: any) => (
                <View
                  key={dup.id}
                  style={{
                    backgroundColor: "#FEF2F2",
                    borderWidth: 1,
                    borderColor: "#FCA5A5",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                    {dup.firstName} {dup.lastName}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    📞 {dup.phone}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    📍 {dup.address}, {dup.city}
                  </Text>
                </View>
              ))}
            </ScrollView>
            
            <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 16 }}>
              Potrebbe trattarsi dello stesso nucleo familiare (es. marito/moglie). Vuoi procedere comunque?
            </Text>
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={() => setShowDuplicateAlert(false)}
              >
                <Text style={{ color: colors.foreground, fontWeight: "600" }}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.warning,
                  borderRadius: 8,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={() => {
                  setShowDuplicateAlert(false);
                  handleSaveCustomer(true);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Crea Comunque</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
