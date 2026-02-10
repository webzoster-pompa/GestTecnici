"use client";

import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export function InterventionTypesStats() {
  const colors = useColors();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | "all">("all");
  
  const { data: calls } = trpc.calls.list.useQuery();
  
  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  
  // Calcola statistiche tipi intervento
  const stats = useMemo(() => {
    if (!calls) return [];
    
    // Filtra per anno e mese
    const filteredCalls = calls.filter(call => {
      const callDate = new Date(call.callDate);
      const callYear = callDate.getFullYear();
      const callMonth = callDate.getMonth() + 1;
      
      if (callYear !== selectedYear) return false;
      if (selectedMonth !== "all" && callMonth !== selectedMonth) return false;
      
      return true;
    });
    
    // Raggruppa per tipo intervento
    const typeCount: Record<string, number> = {};
    filteredCalls.forEach(call => {
      const type = call.callType || "Non specificato";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    // Converti in array e ordina per count
    const statsArray = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: (count / filteredCalls.length) * 100,
    }));
    
    statsArray.sort((a, b) => b.count - a.count);
    
    return statsArray;
  }, [calls, selectedYear, selectedMonth]);
  
  const totalCalls = stats.reduce((sum, stat) => sum + stat.count, 0);
  
  // Colori per il grafico a torta
  const colors_chart = [
    "#3B82F6", // Blu
    "#10B981", // Verde
    "#F59E0B", // Arancione
    "#EF4444", // Rosso
    "#8B5CF6", // Viola
    "#EC4899", // Rosa
    "#14B8A6", // Teal
    "#F97316", // Arancione scuro
  ];
  
  const handlePreviousYear = () => setSelectedYear(selectedYear - 1);
  const handleNextYear = () => setSelectedYear(selectedYear + 1);
  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, padding: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>
          📊 Statistiche Tipi Intervento
        </Text>
        
        {/* Year Selector */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 16 }}>
          <TouchableOpacity
            onPress={handlePreviousYear}
            style={{
              padding: 8,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>←</Text>
          </TouchableOpacity>
          
          <Text style={{ flex: 1, textAlign: "center", fontSize: 20, fontWeight: "bold", color: "#fff" }}>
            {selectedYear}
          </Text>
          
          <TouchableOpacity
            onPress={handleNextYear}
            style={{
              padding: 8,
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>→</Text>
          </TouchableOpacity>
        </View>
        
        {/* Month Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
          <TouchableOpacity
            onPress={() => setSelectedMonth("all")}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: selectedMonth === "all" ? "#fff" : "rgba(255,255,255,0.2)",
              marginRight: 8,
            }}
          >
            <Text style={{ color: selectedMonth === "all" ? colors.primary : "#fff", fontWeight: "600" }}>
              Tutto l'Anno
            </Text>
          </TouchableOpacity>
          
          {monthNames.map((month, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedMonth(index + 1)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: selectedMonth === index + 1 ? "#fff" : "rgba(255,255,255,0.2)",
                marginRight: 8,
              }}
            >
              <Text style={{ color: selectedMonth === index + 1 ? colors.primary : "#fff", fontWeight: "600" }}>
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Totale Chiamate */}
      <View style={{ padding: 24 }}>
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 16, color: colors.muted, marginBottom: 8 }}>Totale Chiamate</Text>
          <Text style={{ fontSize: 48, fontWeight: "bold", color: colors.primary }}>
            {totalCalls}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            {selectedMonth === "all" ? `Anno ${selectedYear}` : `${monthNames[(selectedMonth as number) - 1]} ${selectedYear}`}
          </Text>
        </View>
        
        {/* Grafico a Barre */}
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
            Distribuzione per Tipo
          </Text>
          
          {stats.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 40 }}>
              Nessuna chiamata nel periodo selezionato
            </Text>
          ) : (
            stats.map((stat, index) => (
              <View key={index} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    {stat.type}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    {stat.count} ({stat.percentage.toFixed(1)}%)
                  </Text>
                </View>
                
                <View style={{ height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${stat.percentage}%`,
                      backgroundColor: colors_chart[index % colors_chart.length],
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Tabella Dettagliata */}
        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
            Dettaglio Tipi Intervento
          </Text>
          
          {stats.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 40 }}>
              Nessuna chiamata nel periodo selezionato
            </Text>
          ) : (
            <View>
              {/* Header */}
              <View style={{ flexDirection: "row", paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: colors.border }}>
                <Text style={{ flex: 2, fontSize: 14, fontWeight: "bold", color: colors.foreground }}>
                  Tipo Intervento
                </Text>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "bold", color: colors.foreground, textAlign: "right" }}>
                  Chiamate
                </Text>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "bold", color: colors.foreground, textAlign: "right" }}>
                  %
                </Text>
              </View>
              
              {/* Rows */}
              {stats.map((stat, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 2 }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors_chart[index % colors_chart.length],
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ fontSize: 14, color: colors.foreground }}>
                      {stat.type}
                    </Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: colors.foreground, textAlign: "right", fontWeight: "600" }}>
                    {stat.count}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 14, color: colors.muted, textAlign: "right" }}>
                    {stat.percentage.toFixed(1)}%
                  </Text>
                </View>
              ))}
              
              {/* Total */}
              <View
                style={{
                  flexDirection: "row",
                  paddingTop: 12,
                  borderTopWidth: 2,
                  borderTopColor: colors.border,
                  marginTop: 8,
                }}
              >
                <Text style={{ flex: 2, fontSize: 14, fontWeight: "bold", color: colors.foreground }}>
                  TOTALE
                </Text>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "bold", color: colors.foreground, textAlign: "right" }}>
                  {totalCalls}
                </Text>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "bold", color: colors.foreground, textAlign: "right" }}>
                  100%
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
