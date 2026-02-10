/**
 * Dashboard Statistiche Mensili
 * Visualizza KPI e grafici performance
 */

import { useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { trpc } from "@/lib/trpc";

export function StatisticsDashboard() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: stats, isLoading } = trpc.statistics.monthly.useQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const monthNames = [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ];

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}>
        <Text style={{ fontSize: 16, color: "#666" }}>Nessuna statistica disponibile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#0066CC", padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>
          📊 Statistiche Mensili
        </Text>

        {/* Month Selector */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 16 }}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={{
              padding: 8,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>←</Text>
          </TouchableOpacity>

          <Text style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: "bold", color: "#fff" }}>
            {monthNames[selectedMonth - 1]} {selectedYear}
          </Text>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={{
              padding: 8,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Cards */}
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Total Appointments */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#0066CC",
            }}
          >
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Appuntamenti Totali</Text>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#0066CC" }}>
              {stats.totalAppointments}
            </Text>
            {stats.comparisonWithPreviousMonth.appointmentsDiff !== 0 && (
              <Text
                style={{
                  fontSize: 12,
                  color:
                    stats.comparisonWithPreviousMonth.appointmentsDiff > 0 ? "#00CC66" : "#CC0000",
                  marginTop: 4,
                }}
              >
                {stats.comparisonWithPreviousMonth.appointmentsDiff > 0 ? "+" : ""}
                {stats.comparisonWithPreviousMonth.appointmentsDiff} vs mese scorso
              </Text>
            )}
          </View>

          {/* Completion Rate */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#00CC66",
            }}
          >
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Tasso Completamento</Text>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#00CC66" }}>
              {stats.completionRate}%
            </Text>
            {stats.comparisonWithPreviousMonth.completionRateDiff !== 0 && (
              <Text
                style={{
                  fontSize: 12,
                  color:
                    stats.comparisonWithPreviousMonth.completionRateDiff > 0 ? "#00CC66" : "#CC0000",
                  marginTop: 4,
                }}
              >
                {stats.comparisonWithPreviousMonth.completionRateDiff > 0 ? "+" : ""}
                {stats.comparisonWithPreviousMonth.completionRateDiff}% vs mese scorso
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* Total Customers */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#FFA500",
            }}
          >
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Clienti Serviti</Text>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FFA500" }}>
              {stats.totalCustomers}
            </Text>
          </View>

          {/* Average Duration */}
          <View
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#9333EA",
            }}
          >
            <Text style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>Durata Media</Text>
            <Text style={{ fontSize: 32, fontWeight: "bold", color: "#9333EA" }}>
              {stats.averageDuration}
              <Text style={{ fontSize: 16 }}> min</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Technicians Performance */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>
          Performance per Tecnico
        </Text>

        {stats.appointmentsByTechnician.map((tech) => (
          <View
            key={tech.technicianId}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>{tech.technicianName}</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0066CC" }}>
                {tech.count} appuntamenti
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={{ height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: `${tech.count > 0 ? (tech.completed / tech.count) * 100 : 0}%`,
                  backgroundColor: "#00CC66",
                }}
              />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <Text style={{ fontSize: 14, color: "#666" }}>
                Completati: {tech.completed}/{tech.count}
              </Text>
              <Text style={{ fontSize: 14, color: "#00CC66", fontWeight: "600" }}>
                {tech.count > 0 ? Math.round((tech.completed / tech.count) * 100) : 0}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
