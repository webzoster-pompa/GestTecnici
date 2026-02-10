/**
 * Dashboard Amministratore
 * Gestione sistema, configurazioni e monitoraggio
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator } from "react-native";
import { WhatsAppSettings } from "./whatsapp-settings";
import { trpc } from "@/lib/trpc";

type AdminTab = "overview" | "whatsapp" | "settings" | "logs";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [whatsappApiUrl, setWhatsappApiUrl] = useState("");
  const [whatsappToken, setWhatsappToken] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  
  // Fetch real statistics with refetch capability
  const { data: customers, refetch: refetchCustomers } = trpc.customers.list.useQuery({ limit: 100000 });
  const { data: technicians, refetch: refetchTechnicians } = trpc.technicians.list.useQuery();
  const { data: monthlyStats, refetch: refetchMonthlyStats } = trpc.statistics.monthly.useQuery({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  
  // Auto-refresh quando si torna sulla tab overview
  useEffect(() => {
    if (activeTab === "overview") {
      refetchCustomers();
      refetchTechnicians();
      refetchMonthlyStats();
    }
  }, [activeTab]);
  
  const totalCustomers = customers?.length || 0;
  const activeTechnicians = technicians?.filter(t => t.isActive).length || 0;
  const monthlyAppointments = monthlyStats?.totalAppointments || 0;

  const renderTabButton = (tab: AdminTab, label: string) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`px-6 py-3 border-b-2 ${
        activeTab === tab
          ? "border-primary bg-blue-50"
          : "border-transparent"
      }`}
    >
      <Text
        className={`font-semibold ${
          activeTab === tab ? "text-primary" : "text-muted"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderOverview = () => (
    <ScrollView className="flex-1 p-6">
      <Text className="text-3xl font-bold text-foreground mb-6">
        Dashboard Amministratore
      </Text>

      {/* System Stats */}
      <View className="grid grid-cols-3 gap-4 mb-6">
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-2xl font-bold text-primary mb-1">{monthlyAppointments}</Text>
          <Text className="text-sm text-muted">Appuntamenti Mese</Text>
        </View>
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-2xl font-bold text-success mb-1">{activeTechnicians}</Text>
          <Text className="text-sm text-muted">Tecnici Attivi</Text>
        </View>
        <View className="bg-surface rounded-lg p-4 border border-border">
          <Text className="text-2xl font-bold text-warning mb-1">{totalCustomers.toLocaleString()}</Text>
          <Text className="text-sm text-muted">Clienti Totali</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="bg-surface rounded-lg p-6 border border-border mb-6">
        <Text className="text-xl font-bold text-foreground mb-4">
          Azioni Rapide
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <TouchableOpacity className="bg-primary px-4 py-2 rounded">
            <Text className="text-white font-medium">Backup Database</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-green-500 px-4 py-2 rounded">
            <Text className="text-white font-medium">Test Email</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded">
            <Text className="text-white font-medium">Test WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-orange-500 px-4 py-2 rounded">
            <Text className="text-white font-medium">Report Mensile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* System Status */}
      <View className="bg-surface rounded-lg p-6 border border-border">
        <Text className="text-xl font-bold text-foreground mb-4">
          Stato Sistema
        </Text>
        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground">Database</Text>
            <View className="bg-green-100 px-3 py-1 rounded">
              <Text className="text-green-700 font-medium">✓ Online</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground">Server API</Text>
            <View className="bg-green-100 px-3 py-1 rounded">
              <Text className="text-green-700 font-medium">✓ Running</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground">WhatsApp API</Text>
            <View className="bg-yellow-100 px-3 py-1 rounded">
              <Text className="text-yellow-700 font-medium">⚠ Non Configurato</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground">Email SMTP</Text>
            <View className="bg-yellow-100 px-3 py-1 rounded">
              <Text className="text-yellow-700 font-medium">⚠ Non Configurato</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView className="flex-1 p-6">
      <Text className="text-2xl font-bold text-foreground mb-6">
        Configurazione Sistema
      </Text>

      {/* WhatsApp Business API */}
      <View className="bg-surface rounded-lg p-6 border border-border mb-6">
        <Text className="text-lg font-bold text-foreground mb-4">
          WhatsApp Business API
        </Text>
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              API URL
            </Text>
            <TextInput
              value={whatsappApiUrl}
              onChangeText={setWhatsappApiUrl}
              placeholder="https://api.whatsapp.com/send"
              className="bg-background border border-border rounded px-3 py-2 text-foreground"
            />
          </View>
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              API Token
            </Text>
            <TextInput
              value={whatsappToken}
              onChangeText={setWhatsappToken}
              placeholder="your_whatsapp_business_token"
              secureTextEntry
              className="bg-background border border-border rounded px-3 py-2 text-foreground"
            />
          </View>
          <TouchableOpacity className="bg-primary px-4 py-3 rounded">
            <Text className="text-white text-center font-semibold">
              Salva Configurazione WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Email SMTP */}
      <View className="bg-surface rounded-lg p-6 border border-border mb-6">
        <Text className="text-lg font-bold text-foreground mb-4">
          Email SMTP
        </Text>
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              SMTP Host
            </Text>
            <TextInput
              value={smtpHost}
              onChangeText={setSmtpHost}
              placeholder="smtp.gmail.com"
              className="bg-background border border-border rounded px-3 py-2 text-foreground"
            />
          </View>
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              SMTP Port
            </Text>
            <TextInput
              value={smtpPort}
              onChangeText={setSmtpPort}
              placeholder="587"
              keyboardType="numeric"
              className="bg-background border border-border rounded px-3 py-2 text-foreground"
            />
          </View>
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Username
            </Text>
            <TextInput
              value={smtpUser}
              onChangeText={setSmtpUser}
              placeholder="your-email@example.com"
              className="bg-background border border-border rounded px-3 py-2 text-foreground"
            />
          </View>
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Password
            </Text>
            <TextInput
              value={smtpPassword}
              onChangeText={setSmtpPassword}
              placeholder="your_smtp_password"
              secureTextEntry
              className="bg-background border border-border rounded px-3 py-2 text-foreground"
            />
          </View>
          <TouchableOpacity className="bg-primary px-4 py-3 rounded">
            <Text className="text-white text-center font-semibold">
              Salva Configurazione Email
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* System Settings */}
      <View className="bg-surface rounded-lg p-6 border border-border">
        <Text className="text-lg font-bold text-foreground mb-4">
          Impostazioni Generali
        </Text>
        <View className="space-y-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground">Backup Automatico</Text>
            <View className="bg-green-100 px-3 py-1 rounded">
              <Text className="text-green-700 font-medium">Attivo (2:00 AM)</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground">Report Mensile</Text>
            <View className="bg-green-100 px-3 py-1 rounded">
              <Text className="text-green-700 font-medium">Attivo (1° giorno mese)</Text>
            </View>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground">WhatsApp Reminders</Text>
            <View className="bg-green-100 px-3 py-1 rounded">
              <Text className="text-green-700 font-medium">Attivo (9:00 AM)</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderLogs = () => (
    <ScrollView className="flex-1 p-6">
      <Text className="text-2xl font-bold text-foreground mb-6">
        Log Sistema
      </Text>

      <View className="bg-surface rounded-lg p-6 border border-border">
        <View className="space-y-3">
          <View className="border-b border-border pb-3">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-sm font-medium text-foreground">
                Backup database completato
              </Text>
              <Text className="text-xs text-muted">2 ore fa</Text>
            </View>
            <Text className="text-xs text-muted">
              Backup salvato in: /backups/backup_20250128.sql.gz
            </Text>
          </View>
          
          <View className="border-b border-border pb-3">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-sm font-medium text-foreground">
                Invio promemoria WhatsApp
              </Text>
              <Text className="text-xs text-muted">3 ore fa</Text>
            </View>
            <Text className="text-xs text-muted">
              15 messaggi inviati con successo, 0 errori
            </Text>
          </View>
          
          <View className="border-b border-border pb-3">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-sm font-medium text-foreground">
                Report mensile generato
              </Text>
              <Text className="text-xs text-muted">1 giorno fa</Text>
            </View>
            <Text className="text-xs text-muted">
              Report dicembre 2024 inviato a admin@example.com
            </Text>
          </View>
          
          <View className="border-b border-border pb-3">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-sm font-medium text-error">
                Errore connessione WhatsApp API
              </Text>
              <Text className="text-xs text-muted">2 giorni fa</Text>
            </View>
            <Text className="text-xs text-muted">
              Token scaduto, configurare nuove credenziali
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Tab Navigation */}
      <View className="bg-surface border-b border-border">
        <View className="flex-row">
          {renderTabButton("overview", "Panoramica")}
          {renderTabButton("whatsapp", "Template WhatsApp")}
          {renderTabButton("settings", "Configurazione")}
          {renderTabButton("logs", "Log Sistema")}
        </View>
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "whatsapp" && <WhatsAppSettings />}
      {activeTab === "settings" && renderSettings()}
      {activeTab === "logs" && renderLogs()}
    </View>
  );
}
