import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { InterventionTypesStats } from "@/components/intervention-types-stats";

type Period = "week" | "month" | "year";
type StatsView = "overview" | "intervention_types";

export function StatsReport() {
  const colors = useColors();
  const [period, setPeriod] = useState<Period>("month");
  const [statsView, setStatsView] = useState<StatsView>("overview");

  // Calcola date inizio/fine in base al periodo
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { start, end: now };
  };

  const { start, end } = getDateRange();

  // Fetch appuntamenti per il periodo
  const { data: appointments } = trpc.appointments.list.useQuery({
    startDate: start,
    endDate: end,
  });

  // Fetch clienti per statistiche
  const { data: customers } = trpc.customers.list.useQuery({ limit: 1000 });

  // Calcola statistiche
  const completedAppointments = appointments?.filter(
    (apt) => apt.status === "completed"
  ).length || 0;

  const avgDuration =
    appointments && appointments.length > 0
      ? Math.round(
          appointments.reduce((sum, apt) => sum + apt.duration, 0) /
            appointments.length
        )
      : 0;

  // Top 5 clienti più frequenti
  const customerFrequency: Record<number, number> = {};
  appointments?.forEach((apt) => {
    if (apt.customerId) {
      customerFrequency[apt.customerId] =
        (customerFrequency[apt.customerId] || 0) + 1;
    }
  });

  const topCustomers = Object.entries(customerFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([customerId, count]) => {
      const customer = customers?.find((c) => c.id === parseInt(customerId));
      return {
        name: customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Cliente",
        count,
      };
    });

  // Appuntamenti per tecnico
  const lucaAppointments =
    appointments?.filter((apt) => apt.technicianId === 1).length || 0;
  const denisAppointments =
    appointments?.filter((apt) => apt.technicianId === 2).length || 0;

  // Se la vista è "intervention_types", mostra il componente dedicato
  if (statsView === "intervention_types") {
    return (
      <View style={{ flex: 1 }}>
        {/* Toggle Vista */}
        <View style={{ flexDirection: "row", gap: 8, padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => setStatsView("overview")}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: statsView === "overview" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: statsView === "overview" ? colors.primary : colors.border,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", color: statsView === "overview" ? "#fff" : colors.foreground }}>
              📊 Panoramica
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setStatsView("intervention_types")}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: statsView === "intervention_types" ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: statsView === "intervention_types" ? colors.primary : colors.border,
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "600", color: statsView === "intervention_types" ? "#fff" : colors.foreground }}>
              🔧 Tipi Intervento
            </Text>
          </TouchableOpacity>
        </View>
        
        <InterventionTypesStats />
      </View>
    );
  }
  
  return (
    <ScrollView className="flex-1 p-4">
      {/* Toggle Vista */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setStatsView("overview")}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: statsView === "overview" ? colors.primary : colors.surface,
            borderWidth: 1,
            borderColor: statsView === "overview" ? colors.primary : colors.border,
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "600", color: statsView === "overview" ? "#fff" : colors.foreground }}>
            📊 Panoramica
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setStatsView("intervention_types")}
          style={{
            flex: 1,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 8,
            backgroundColor: statsView === "intervention_types" ? colors.surface : colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "600", color: colors.foreground }}>
            🔧 Tipi Intervento
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground mb-2">
          📊 Report Statistiche
        </Text>
        <Text className="text-sm text-muted">
          Analisi appuntamenti e performance tecnici
        </Text>
      </View>

      {/* Filtro Periodo */}
      <View className="flex-row gap-2 mb-6">
        {(["week", "month", "year"] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            className={`px-4 py-2 rounded-lg border flex-1 ${
              period === p ? "border-primary" : "border-border"
            }`}
            style={{
              backgroundColor: period === p ? colors.primary + "20" : colors.background,
            }}
            onPress={() => setPeriod(p)}
          >
            <Text
              className={`text-sm font-semibold text-center ${
                period === p ? "text-primary" : "text-foreground"
              }`}
            >
              {p === "week" ? "Settimana" : p === "month" ? "Mese" : "Anno"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* KPI Cards */}
      <View className="gap-4 mb-6">
        {/* Appuntamenti Completati */}
        <View
          className="p-4 rounded-lg border border-border"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm text-muted mb-1">
            Appuntamenti Completati
          </Text>
          <Text className="text-3xl font-bold text-foreground">
            {completedAppointments}
          </Text>
          <Text className="text-xs text-muted mt-1">
            {period === "week"
              ? "Ultimi 7 giorni"
              : period === "month"
              ? "Ultimo mese"
              : "Ultimo anno"}
          </Text>
        </View>

        {/* Tempo Medio Intervento */}
        <View
          className="p-4 rounded-lg border border-border"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-sm text-muted mb-1">
            Tempo Medio Intervento
          </Text>
          <Text className="text-3xl font-bold text-foreground">
            {avgDuration} min
          </Text>
          <Text className="text-xs text-muted mt-1">
            Media durata appuntamenti
          </Text>
        </View>
      </View>

      {/* Appuntamenti per Tecnico */}
      <View className="mb-6">
        <Text className="text-lg font-bold text-foreground mb-3">
          Appuntamenti per Tecnico
        </Text>
        <View className="gap-3">
          {/* Luca */}
          <View
            className="p-4 rounded-lg border border-border"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-semibold text-foreground">
                Luca Corsi
              </Text>
              <Text className="text-xl font-bold" style={{ color: "#0066CC" }}>
                {lucaAppointments}
              </Text>
            </View>
            <View
              className="h-2 rounded-full"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-2 rounded-full"
                style={{
                  backgroundColor: "#0066CC",
                  width: `${
                    lucaAppointments + denisAppointments > 0
                      ? (lucaAppointments /
                          (lucaAppointments + denisAppointments)) *
                        100
                      : 0
                  }%`,
                }}
              />
            </View>
          </View>

          {/* Denis */}
          <View
            className="p-4 rounded-lg border border-border"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm font-semibold text-foreground">
                Denis Corsi
              </Text>
              <Text className="text-xl font-bold" style={{ color: "#00AA66" }}>
                {denisAppointments}
              </Text>
            </View>
            <View
              className="h-2 rounded-full"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-2 rounded-full"
                style={{
                  backgroundColor: "#00AA66",
                  width: `${
                    lucaAppointments + denisAppointments > 0
                      ? (denisAppointments /
                          (lucaAppointments + denisAppointments)) *
                        100
                      : 0
                  }%`,
                }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Top 5 Clienti */}
      <View className="mb-6">
        <Text className="text-lg font-bold text-foreground mb-3">
          Top 5 Clienti Più Frequenti
        </Text>
        <View className="gap-2">
          {topCustomers.length > 0 ? (
            topCustomers.map((customer, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center p-3 rounded-lg border border-border"
                style={{ backgroundColor: colors.surface }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary + "20" }}
                  >
                    <Text
                      className="text-sm font-bold"
                      style={{ color: colors.primary }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-foreground">
                    {customer.name}
                  </Text>
                </View>
                <Text className="text-sm font-bold text-muted">
                  {customer.count} interventi
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-sm text-muted text-center py-4">
              Nessun dato disponibile
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
