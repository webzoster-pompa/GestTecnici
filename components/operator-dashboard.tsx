import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, useWindowDimensions, ActivityIndicator } from "react-native";
import { useState, useRef, useEffect } from "react";
import { trpc, trpcClient } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { ProposedSlot } from "@/server/route-optimizer";
import { WeeklyCalendarWebV2 } from "@/components/weekly-calendar-web-v2";
import { MonthlyCalendar } from "@/components/monthly-calendar";
import { DayDetailsModal } from "@/components/day-details-modal";
import { PendingInvoicesAlert } from "@/components/pending-invoices-alert";
import { ExcelImportModal } from "@/components/excel-import-modal";
import { SelectiveBackupModal } from "@/components/selective-backup-modal";
import { CustomerHistory } from "@/components/customer-history";
import { StatisticsDashboard } from "@/components/statistics-dashboard";
import { StatsReport } from "@/components/stats-report";
import { TechniciansManagement } from "./technicians-management";
import { AdminDashboard } from "./admin-dashboard";
import { InvoicesManager } from "./invoices-manager";
import { CallsManager } from "./calls-manager";
import { CallsNotificationBadge } from "./calls-notification-badge";
import { CustomerDetailSheet } from "./customer-detail-sheet";
import { TimeEntriesRealtime } from "./time-entries-realtime";

export function OperatorDashboard() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [proposedSlots, setProposedSlots] = useState<ProposedSlot[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "invoices" | "calls" | "statistics" | "technicians" | "timbrature" | "admin">("dashboard");
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [menuButtonLayout, setMenuButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuButtonRef = useRef<View>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Slot search filters
  const [selectedTechnicianFilter, setSelectedTechnicianFilter] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  
  // Manual slot state
  const [showManualSlot, setShowManualSlot] = useState(false);
  const [manualSlot, setManualSlot] = useState({
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    time: "09:00",
    duration: 60,
    technicianId: null as number | null,
  });
  
  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    if (!showAdminMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      console.log('[MENU] Click outside detected');
      setShowAdminMenu(false);
    };
    
    // Aggiungi listener dopo un breve delay per evitare che il click di apertura lo chiuda
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAdminMenu]);
  
  // Get WhatsApp templates
  const { data: whatsappTemplates } = trpc.whatsapp.getTemplates.useQuery();
  
  // Get technicians list
  const { data: technicians } = trpc.technicians.list.useQuery();
  
  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    latitude: "",
    longitude: "",
  });

  // Search customers
  const { data: searchResults, isLoading: isSearching } = trpc.customers.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  // Create customer mutation
  const createCustomerMutation = trpc.customers.create.useMutation({
    onSuccess: (data) => {
      alert(`Cliente "${newCustomer.firstName} ${newCustomer.lastName}" creato con successo!`);
      setSelectedCustomerId(data.id);
      setShowNewCustomerForm(false);
      setNewCustomer({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        postalCode: "",
        notes: "",
        latitude: "",
        longitude: "",
      });
    },
    onError: (error) => {
      alert(`Errore durante la creazione del cliente: ${error.message}`);
      console.error("Errore creazione cliente:", error);
    },
  });

  // Propose slots mutation
  const proposeSlotsQuery = trpc.appointments.proposeSlots.useQuery(
    { 
      customerId: selectedCustomerId!, 
      duration: selectedDuration,
      technicianId: selectedTechnicianFilter ?? undefined,
    },
    { enabled: false }
  );

  // Create appointment mutation
  const createAppointmentMutation = trpc.appointments.create.useMutation({
    onSuccess: (data) => {
      console.log('[createAppointmentMutation] SUCCESS - Dati restituiti dal server:', data);
      alert("Appuntamento creato con successo! ID: " + data.id);
      setProposedSlots([]);
      setSelectedCustomerId(null);
      setSearchQuery("");
    },
    onError: (error) => {
      console.error('[createAppointmentMutation] ERROR:', error);
      alert("Errore durante la creazione dell'appuntamento: " + error.message);
    },
  });

  const handleSearchCustomer = (text: string) => {
    setSearchQuery(text);
    setSelectedCustomerId(null);
    setProposedSlots([]);
  };
  const handleSelectCustomer = (customerId: number, customerName: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerName(customerName);
    setProposedSlots([]);
  };

  const handleCreateNewCustomer = () => {
    setShowNewCustomerForm(true);
    setSearchQuery("");
  };

  const handleSubmitNewCustomer = async () => {
    // Validazione campi obbligatori
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.phone || !newCustomer.address || !newCustomer.city) {
      alert("Compila tutti i campi obbligatori: Nome, Cognome, Telefono, Indirizzo, Città");
      return;
    }
    
    // Controllo duplicati
    try {
      const duplicate = await trpcClient.customers.checkDuplicate.query({
        phone: newCustomer.phone,
        email: newCustomer.email || undefined,
      });
      
      if (duplicate) {
        const confirmCreate = confirm(
          `ATTENZIONE: Esiste già un cliente con questi dati:\n\n` +
          `Nome: ${duplicate.firstName} ${duplicate.lastName}\n` +
          `Telefono: ${duplicate.phone}\n` +
          `Email: ${duplicate.email || 'N/D'}\n\n` +
          `Vuoi comunque creare un nuovo cliente?`
        );
        
        if (!confirmCreate) {
          return;
        }
      }
    } catch (error) {
      console.error("Errore controllo duplicati:", error);
    }
    
    // Prepara i dati convertendo le coordinate in numeri se presenti
    const customerData = {
      ...newCustomer,
      latitude: newCustomer.latitude ? parseFloat(newCustomer.latitude) : undefined,
      longitude: newCustomer.longitude ? parseFloat(newCustomer.longitude) : undefined,
    };
    
    console.log("Creazione cliente:", customerData);
    createCustomerMutation.mutate(customerData);
  };

  const handleFindSlots = async () => {
    if (!selectedCustomerId) return;
    
    console.log('[handleFindSlots] Calling proposeSlots for customer:', selectedCustomerId);
    console.log('[handleFindSlots] Filters:', {
      duration: selectedDuration,
      technicianId: selectedTechnicianFilter
    });
    
    const result = await proposeSlotsQuery.refetch();
    
    console.log('[handleFindSlots] Result:', result);
    console.log('[handleFindSlots] Slots received:', result.data?.length || 0);
    
    if (result.data) {
      console.log('[handleFindSlots] Slots details:', result.data.map(s => ({
        date: s.date.toISOString(),
        technicianId: s.technicianId,
        distance: s.distanceFromPrevious
      })));
      setProposedSlots(result.data);
    }
  };

  const handleConfirmSlot = (slot: ProposedSlot) => {
    if (!selectedCustomerId) return;
    
    if (whatsappEnabled && !selectedTemplateId) {
      alert("Seleziona un template WhatsApp prima di confermare");
      return;
    }
    
    
    createAppointmentMutation.mutate({
      customerId: selectedCustomerId,
      technicianId: slot.technicianId,
      scheduledDate: slot.date,
      duration: selectedDuration,
      whatsappEnabled,
      whatsappTemplateId: selectedTemplateId ?? undefined,
    });
    
    // Reset WhatsApp fields
    setWhatsappEnabled(false);
    setSelectedTemplateId(null);
  };

  return (
    <>
    {/* Notifica Fatture in Attesa */}
    {Platform.OS === "web" && <PendingInvoicesAlert />}
    
    <View className="flex-1 bg-background">
      {/* Tab Navigation */}
      {Platform.OS === "web" && (
        <View style={{ flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", overflow: "visible" as any }}>
          <TouchableOpacity
            onPress={() => setActiveTab("dashboard")}
            style={{
              flex: 1,
              padding: 16,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === "dashboard" ? "#0066CC" : "transparent",
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "600", color: activeTab === "dashboard" ? "#0066CC" : "#666" }}>
              📋 Dashboard Operatore
            </Text>
          </TouchableOpacity>
          

          
          <TouchableOpacity
            onPress={() => setActiveTab("calendar")}
            style={{
              flex: 1,
              padding: 16,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === "calendar" ? "#0066CC" : "transparent",
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "600", color: activeTab === "calendar" ? "#0066CC" : "#666" }}>
              📅 Calendario
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab("invoices")}
            style={{
              flex: 1,
              padding: 16,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === "invoices" ? "#0066CC" : "transparent",
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "600", color: activeTab === "invoices" ? "#0066CC" : "#666" }}>
              📄 Fatture
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setActiveTab("calls")}
            style={{
              flex: 1,
              padding: 16,
              borderBottomWidth: 2,
              borderBottomColor: activeTab === "calls" ? "#0066CC" : "transparent",
              position: "relative",
            }}
          >
            <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "600", color: activeTab === "calls" ? "#0066CC" : "#666" }}>
              📞 Chiamate
            </Text>
            <CallsNotificationBadge daysThreshold={7} />
          </TouchableOpacity>
          
          
          {/* Menu Dropdown Amministrazione */}
          <View style={{ zIndex: 2000 }}>
            {Platform.OS === "web" ? (
              <button
                onClick={(e) => {
                  console.log('[MENU] Button clicked, current state:', showAdminMenu);
                  console.log('[MENU] Setting to:', !showAdminMenu);
                  setShowAdminMenu(!showAdminMenu);
                  console.log('[MENU] State should now be:', !showAdminMenu);
                }}
                style={{
                  padding: '16px 24px',
                  border: 'none',
                  borderBottom: ["statistics", "technicians", "timbrature", "admin"].includes(activeTab) ? '2px solid #0066CC' : '2px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 600,
                  color: ["statistics", "technicians", "timbrature", "admin"].includes(activeTab) ? "#0066CC" : "#666",
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                ⚙️ Menu ▾
              </button>
            ) : (
              <TouchableOpacity
                onPress={() => setShowAdminMenu(!showAdminMenu)}
                style={{
                  padding: 16,
                  paddingHorizontal: 24,
                  borderBottomWidth: 2,
                  borderBottomColor: ["statistics", "technicians", "timbrature", "admin"].includes(activeTab) ? "#0066CC" : "transparent",
                }}
              >
                <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "600", color: ["statistics", "technicians", "timbrature", "admin"].includes(activeTab) ? "#0066CC" : "#666" }}>
                  ⚙️ Menu ▾
                </Text>
              </TouchableOpacity>
            )}
            
          </View>
        </View>
      )}
      
      {/* Menu Dropdown renderizzato fuori dalle tab per evitare conflitti */}
      {showAdminMenu && Platform.OS === "web" && (
        <>
          {/* Overlay backdrop */}
          <div
            onClick={() => setShowAdminMenu(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 99999998,
            }}
          />
          {/* Menu dropdown */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: 70,
              right: 20,
              backgroundColor: "#fff",
              border: "4px solid #FF0000",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgba(0,0,0,0.8)",
              zIndex: 99999999,
              minWidth: 250,
              padding: "8px 0",
            }}
          >
            <button
              onClick={() => {
                setActiveTab("statistics");
                setShowAdminMenu(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: activeTab === "statistics" ? "#F0F9FF" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: activeTab === "statistics" ? 600 : 400,
                color: activeTab === "statistics" ? "#0066CC" : "#333",
              }}
            >
              📊 Statistiche
            </button>
            <button
              onClick={() => {
                setActiveTab("technicians");
                setShowAdminMenu(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: activeTab === "technicians" ? "#F0F9FF" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: activeTab === "technicians" ? 600 : 400,
                color: activeTab === "technicians" ? "#0066CC" : "#333",
              }}
            >
              👥 Gestione Tecnici
            </button>
            <button
              onClick={() => {
                setActiveTab("timbrature");
                setShowAdminMenu(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: activeTab === "timbrature" ? "#F0F9FF" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: activeTab === "timbrature" ? 600 : 400,
                color: activeTab === "timbrature" ? "#0066CC" : "#333",
              }}
            >
              ⏱️ Timbrature
            </button>
            <button
              onClick={() => {
                setActiveTab("admin");
                setShowAdminMenu(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: activeTab === "admin" ? "#F0F9FF" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: activeTab === "admin" ? 600 : 400,
                color: activeTab === "admin" ? "#0066CC" : "#333",
              }}
            >
              ⚙️ Amministrazione
            </button>
            
            {/* Separatore */}
            <div style={{ borderTop: "1px solid #E5E7EB", margin: "8px 0" }} />
            
            {/* Azioni amministrative */}
            <button
              onClick={() => {
                setShowImportModal(true);
                setShowAdminMenu(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: 400,
                color: "#00CC66",
              }}
            >
              📅 Importa da Excel
            </button>
            <button
              onClick={async () => {
                setShowAdminMenu(false);
                try {
                  const result = await trpcClient.statistics.exportFullData.query();
                  if (result?.data) {
                    const binary = atob(result.data);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                      bytes[i] = binary.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = result.filename || "export.xlsx";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }
                } catch (error) {
                  alert("Errore durante l'export");
                }
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: 400,
                color: "#0066CC",
              }}
            >
              📊 Esporta Tutto Excel
            </button>
            <button
              onClick={() => {
                setShowBackupModal(true);
                setShowAdminMenu(false);
              }}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: 400,
                color: "#CC0000",
              }}
            >
              🗑️ Backup e Cancella
            </button>
          </div>
        </>
      )}
      
      {/* Content */}
      {activeTab === "calendar" && Platform.OS === "web" ? (
        <View style={{ flex: 1 }}>
          {/* Toggle Vista Calendario */}
          <View style={{ flexDirection: "row", gap: 12, padding: 16, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity
              onPress={() => setCalendarView("week")}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                backgroundColor: calendarView === "week" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: calendarView === "week" ? colors.primary : colors.border,
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "600", color: calendarView === "week" ? "#fff" : colors.foreground }}>
                📅 Vista Settimanale
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCalendarView("month")}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 8,
                backgroundColor: calendarView === "month" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: calendarView === "month" ? colors.primary : colors.border,
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "600", color: calendarView === "month" ? "#fff" : colors.foreground }}>
                📆 Vista Mensile
              </Text>
            </TouchableOpacity>
          </View>
          
          {calendarView === "week" ? (
            <WeeklyCalendarWebV2 
              onCustomerClick={(customerId, customerName) => {
                setSelectedCustomerId(customerId);
                setSelectedCustomerName(customerName);
                setShowDetailSheet(true);
              }}
            />
          ) : (
            <MonthlyCalendar 
              onDayClick={(date) => {
                setSelectedCalendarDate(date);
                setShowDayDetailsModal(true);
              }}
            />
          )}
        </View>
      ) : activeTab === "statistics" && Platform.OS === "web" ? (
        <StatsReport />
      ) : activeTab === "technicians" && Platform.OS === "web" ? (
        <TechniciansManagement />
      ) : activeTab === "timbrature" && Platform.OS === "web" ? (
        <View style={{ padding: 24 }}>
          <TimeEntriesRealtime />
        </View>
      ) : activeTab === "invoices" && Platform.OS === "web" ? (
        <InvoicesManager />
      ) : activeTab === "calls" && Platform.OS === "web" ? (
        <CallsManager />
      ) : activeTab === "admin" && Platform.OS === "web" ? (
        <AdminDashboard />
      ) : (
    <View className="flex-1 flex-row">
      {/* Left Column - Customer Search/Create */}
      <View className="w-1/5 border-r border-border p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Ricerca Cliente
        </Text>
        
        {!showNewCustomerForm ? (
          <>
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Cerca per nome, telefono, email..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={handleSearchCustomer}
            />
            
            {isSearching && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
            
            {searchResults && searchResults.length > 0 && (
              <ScrollView className="mt-2 max-h-64">
                {searchResults.map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    className="p-3 border-b border-border"
                    onPress={() => handleSelectCustomer(customer.id, `${customer.firstName} ${customer.lastName}`)}
                  >
                    <Text className="text-foreground font-semibold">
                      {customer.firstName} {customer.lastName}
                    </Text>
                    <Text className="text-muted text-sm">{customer.phone}</Text>
                    <Text className="text-muted text-sm">{customer.city} - {customer.address}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              className="bg-primary rounded-lg p-3 mt-4"
              onPress={handleCreateNewCustomer}
            >
              <Text className="text-white text-center font-semibold">
                + Nuovo Cliente
              </Text>
            </TouchableOpacity>
            

            
            {selectedCustomerId && (
              <>
              {/* Filtri Ricerca Slot */}
              <View className="mt-4 mb-2">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  🔍 Filtri Ricerca Slot
                </Text>
                
                {/* Filtro Tecnico */}
                <Text className="text-xs text-muted mb-1">Tecnico (opzionale)</Text>
                <View className="bg-surface border border-border rounded-lg mb-3">
                  {Platform.OS === "web" ? (
                    <select
                      value={selectedTechnicianFilter ?? ""}
                      onChange={(e) => setSelectedTechnicianFilter(e.target.value ? Number(e.target.value) : null)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">Tutti i tecnici</option>
                      {technicians?.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.firstName} {tech.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Text className="p-3 text-foreground">Filtro tecnico non disponibile su mobile</Text>
                  )}
                </View>
                
                {/* Filtro Durata */}
                <Text className="text-xs text-muted mb-1">Durata intervento</Text>
                <View className="bg-surface border border-border rounded-lg mb-3">
                  {Platform.OS === "web" ? (
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(Number(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "none",
                        backgroundColor: "transparent",
                        fontSize: "14px",
                      }}
                    >
                      <option value="30">30 minuti</option>
                      <option value="60">60 minuti</option>
                      <option value="90">90 minuti</option>
                      <option value="120">120 minuti</option>
                      <option value="180">180 minuti</option>
                    </select>
                  ) : (
                    <Text className="p-3 text-foreground">Filtro durata non disponibile su mobile</Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                className="bg-success rounded-lg p-3 mt-2"
                onPress={handleFindSlots}
              >
                <Text className="text-white text-center font-semibold">
                  Cerca Slot Disponibili
                </Text>
              </TouchableOpacity>
              
              {Platform.OS === "web" && (
                <>
                  <TouchableOpacity
                    className="bg-warning rounded-lg p-3 mt-2"
                    onPress={() => setShowDetailSheet(true)}
                  >
                    <Text className="text-white text-center font-semibold">
                      📋 Scheda Cliente
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="bg-primary rounded-lg p-3 mt-2"
                    onPress={() => setShowHistory(true)}
                  >
                    <Text className="text-white text-center font-semibold">
                      📊 Storico Interventi
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              </>
            )}
          </>
        ) : (
          <ScrollView>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Nuovo Cliente
            </Text>
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Nome"
              placeholderTextColor={colors.muted}
              value={newCustomer.firstName}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, firstName: text })}
            />
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Cognome"
              placeholderTextColor={colors.muted}
              value={newCustomer.lastName}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, lastName: text })}
            />
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Telefono"
              placeholderTextColor={colors.muted}
              value={newCustomer.phone}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, phone: text })}
            />
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Email (opzionale)"
              placeholderTextColor={colors.muted}
              value={newCustomer.email}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, email: text })}
            />
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Indirizzo"
              placeholderTextColor={colors.muted}
              value={newCustomer.address}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, address: text })}
            />
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Città"
              placeholderTextColor={colors.muted}
              value={newCustomer.city}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, city: text })}
            />
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="CAP (opzionale)"
              placeholderTextColor={colors.muted}
              value={newCustomer.postalCode}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, postalCode: text })}
            />
            
            <TextInput
              className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
              placeholder="Note (opzionale)"
              placeholderTextColor={colors.muted}
              value={newCustomer.notes}
              onChangeText={(text) => setNewCustomer({ ...newCustomer, notes: text })}
              multiline
              numberOfLines={3}
            />
            
            <Text className="text-sm font-semibold text-foreground mt-2 mb-1">
              📍 Coordinate Geografiche (opzionali)
            </Text>
            <Text className="text-xs text-muted mb-2">
              Le coordinate vengono calcolate automaticamente dall'indirizzo. Puoi modificarle manualmente se necessario.
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                className="bg-surface border border-border rounded-lg p-3 text-foreground mb-2"
                placeholder="Latitudine (es: 45.4642)"
                placeholderTextColor={colors.muted}
                value={newCustomer.latitude}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, latitude: text })}
                keyboardType="numeric"
                style={{ flex: 1 }}
              />
              
              <TextInput
                className="bg-surface border border-border rounded-lg p-3 text-foreground mb-4"
                placeholder="Longitudine (es: 9.1900)"
                placeholderTextColor={colors.muted}
                value={newCustomer.longitude}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, longitude: text })}
                keyboardType="numeric"
                style={{ flex: 1 }}
              />
            </View>
            
            <TouchableOpacity
              className="bg-primary rounded-lg p-3 mb-2"
              onPress={handleSubmitNewCustomer}

            >
              <Text className="text-white text-center font-semibold">
                Salva Cliente
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-surface border border-border rounded-lg p-3"
              onPress={() => setShowNewCustomerForm(false)}

            >
              <Text className="text-foreground text-center">Annulla</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Center Column - Proposed Slots */}
      <View className="w-1/5 border-r border-border p-4">
        <Text className="text-2xl font-bold text-foreground mb-4">
          Slot Proposti
        </Text>
        
        {/* Cliente Selezionato Banner */}
        {selectedCustomerId && (
          <View className="bg-primary/10 border border-primary rounded-lg p-3 mb-4">
            <Text className="text-sm font-semibold text-primary mb-1">
              📍 Prenotazione per:
            </Text>
            <Text className="text-base font-bold text-foreground">
              {selectedCustomerName}
            </Text>
          </View>
        )}
        
        {proposeSlotsQuery.isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-2">Calcolo slot ottimali...</Text>
          </View>
        )}
        
        {proposedSlots.length > 0 ? (
          <ScrollView>
            {proposedSlots.map((slot, index) => (
              <View
                key={index}
                className="bg-surface border border-border rounded-lg p-4 mb-3"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-lg font-bold text-foreground">
                    Slot {index + 1}
                  </Text>
                  <View className="bg-success px-2 py-1 rounded">
                    <Text className="text-white text-xs font-semibold">
                      {slot.totalDistance.toFixed(1)} km
                    </Text>
                  </View>
                </View>
                
                <Text className="text-foreground font-semibold mb-1">
                  {slot.date.toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </Text>
                
                <Text className="text-foreground mb-1">
                  Ore {slot.date.toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                
                <Text className="text-muted mb-3">
                  Tecnico: {slot.technicianName}
                </Text>
                
                <View className="bg-background rounded p-2 mb-3">
                  <Text className={`text-sm ${slot.distanceFromPrevious > 20 || slot.distanceToNext > 20 ? 'text-red-600 font-bold' : 'text-muted'}`}>
                    Da precedente: {slot.distanceFromPrevious.toFixed(1)} km
                    {slot.distanceFromPrevious > 20 && ' ⚠️ Distanza elevata!'}
                  </Text>
                  <Text className={`text-sm ${slot.distanceFromPrevious > 20 || slot.distanceToNext > 20 ? 'text-red-600 font-bold' : 'text-muted'}`}>
                    A successivo: {slot.distanceToNext.toFixed(1)} km
                    {slot.distanceToNext > 20 && ' ⚠️ Distanza elevata!'}
                  </Text>
                </View>
                
                {/* Warning per distanza elevata */}
                {(slot.distanceFromPrevious > 20 || slot.distanceToNext > 20) && (
                  <View className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                    <Text className="text-sm text-red-700 font-semibold">
                      ⚠️ Attenzione: Distanza elevata tra appuntamenti.
                    </Text>
                    <Text className="text-xs text-red-600">
                      Considera di scegliere un altro giorno o conferma se va bene.
                    </Text>
                  </View>
                )}
                
                {/* WhatsApp Reminder Section */}
                <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center mb-2">
                    <TouchableOpacity
                      onPress={() => setWhatsappEnabled(!whatsappEnabled)}
                      className="flex-row items-center flex-1"
                    >
                      <View
                        className={`w-5 h-5 border-2 rounded mr-2 items-center justify-center ${
                          whatsappEnabled ? "bg-green-500 border-green-500" : "border-gray-400"
                        }`}
                      >
                        {whatsappEnabled && (
                          <Text className="text-white text-xs font-bold">✓</Text>
                        )}
                      </View>
                      <Text className="text-sm font-semibold text-gray-800">
                        📱 Invia promemoria WhatsApp 2 giorni prima
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {whatsappEnabled && (
                    <View className="mt-2">
                      <Text className="text-xs text-gray-600 mb-2">
                        Seleziona messaggio:
                      </Text>
                      {whatsappTemplates?.map((template) => (
                        <TouchableOpacity
                          key={template.id}
                          onPress={() => setSelectedTemplateId(template.id)}
                          className={`p-2 rounded mb-2 ${
                            selectedTemplateId === template.id
                              ? "bg-green-100 border border-green-500"
                              : "bg-white border border-gray-300"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selectedTemplateId === template.id
                                ? "text-green-800"
                                : "text-gray-700"
                            }`}
                          >
                            {template.name}
                          </Text>
                          <Text className="text-xs text-gray-500 mt-1">
                            {template.message.substring(0, 80)}...
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  className="bg-primary rounded-lg p-3"
                  onPress={() => handleConfirmSlot(slot)}
                >
                  <Text className="text-white text-center font-semibold">
                    Conferma Appuntamento
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Manual Slot */}
            {selectedCustomerId && (
              <View className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-3">
                <Text className="text-lg font-bold text-gray-800 mb-3">
                  ✏️ Inserimento Manuale
                </Text>
                
                {/* Date */}
                <Text className="text-sm font-semibold text-gray-700 mb-1">Data</Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800 mb-3"
                  value={manualSlot.date}
                  onChangeText={(text) => setManualSlot({ ...manualSlot, date: text })}
                  placeholder="YYYY-MM-DD"
                />
                
                {/* Time */}
                <Text className="text-sm font-semibold text-gray-700 mb-1">Ora</Text>
                <TextInput
                  className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800 mb-3"
                  value={manualSlot.time}
                  onChangeText={(text) => setManualSlot({ ...manualSlot, time: text })}
                  placeholder="HH:MM"
                />
                
                {/* Duration */}
                <Text className="text-sm font-semibold text-gray-700 mb-1">Durata (minuti)</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="number"
                    className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800 mb-3 w-full"
                    value={manualSlot.duration}
                    onChange={(e) => setManualSlot({ ...manualSlot, duration: parseInt(e.target.value) || 60 })}
                    placeholder="60"
                    min="1"
                    step="1"
                  />
                ) : (
                  <TextInput
                    className="bg-white border border-gray-300 rounded-lg p-3 text-gray-800 mb-3"
                    value={manualSlot.duration.toString()}
                    onChangeText={(text) => setManualSlot({ ...manualSlot, duration: parseInt(text) || 60 })}
                    keyboardType="numeric"
                    placeholder="60"
                  />
                )}
                
                {/* Technician */}
                <Text className="text-sm font-semibold text-gray-700 mb-1">Tecnico</Text>
                <View className="bg-white border border-gray-300 rounded-lg mb-3">
                  {technicians?.map((tech: any) => (
                    <TouchableOpacity
                      key={tech.id}
                      onPress={() => setManualSlot({ ...manualSlot, technicianId: tech.id })}
                      className={`p-3 border-b border-gray-200 ${
                        manualSlot.technicianId === tech.id ? "bg-blue-100" : "bg-white"
                      }`}
                    >
                      <Text className={`font-medium ${
                        manualSlot.technicianId === tech.id ? "text-blue-800" : "text-gray-800"
                      }`}>
                        {tech.firstName} {tech.lastName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity
                  className="bg-orange-500 rounded-lg p-3"
                  onPress={() => {
                    if (!manualSlot.technicianId) {
                      alert("Seleziona un tecnico");
                      return;
                    }
                    
                    const dateTime = new Date(`${manualSlot.date}T${manualSlot.time}:00`);
                    const technician = technicians?.find((t: any) => t.id === manualSlot.technicianId);
                    
                    handleConfirmSlot({
                      date: dateTime,
                      technicianId: manualSlot.technicianId,
                      technicianName: `${technician?.firstName} ${technician?.lastName}`,
                      distanceFromPrevious: 0,
                      distanceToNext: 0,
                      totalDistance: 0,
                      score: 0,
                    });
                  }}
                >
                  <Text className="text-white text-center font-semibold">
                    Conferma Appuntamento Manuale
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-center">
              Seleziona un cliente e clicca su{"\n"}
              "Cerca Slot Disponibili"
            </Text>
          </View>
        )}
      </View>

      {/* Right Column - Multi-Tech Calendar */}
      <View className="w-3/5">
        {Platform.OS === "web" ? (
          <WeeklyCalendarWebV2 
            onCustomerClick={(customerId, customerName) => {
              setSelectedCustomerId(customerId);
              setSelectedCustomerName(customerName);
              setShowDetailSheet(true);
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-center">
              Calendario disponibile solo su web
            </Text>
          </View>
        )}
      </View>
    </View>
    )}
    </View>
    
    {/* Excel Import Modal */}
    {showImportModal && Platform.OS === "web" && (
      <ExcelImportModal
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          // Ricarica lista clienti
          setSearchQuery("");
          setShowImportModal(false);
        }}
      />
    )}
    
    {/* Customer History Modal */}
    {showHistory && Platform.OS === "web" && selectedCustomerId && (
      <CustomerHistory
        customerId={selectedCustomerId}
        customerName={selectedCustomerName}
        onClose={() => setShowHistory(false)}
      />
    )}
    
    {/* Selective Backup Modal */}
    {showBackupModal && Platform.OS === "web" && (
      <SelectiveBackupModal
        visible={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />
    )}
    
    {/* Customer Detail Sheet */}
    {showDetailSheet && Platform.OS === "web" && selectedCustomerId && (
      <CustomerDetailSheet
        customerId={selectedCustomerId}
        onClose={() => setShowDetailSheet(false)}
      />
    )}
    
    {/* Day Details Modal */}
    <DayDetailsModal 
      visible={showDayDetailsModal}
      date={selectedCalendarDate}
      onClose={() => setShowDayDetailsModal(false)}
      onAppointmentClick={(customerId, customerName) => {
        // Chiudi il modal e apri la scheda del cliente
        setShowDayDetailsModal(false);
        setSelectedCustomerId(customerId);
        setSelectedCustomerName(customerName);
        setShowDetailSheet(true);
      }}
    />
    </>
  );
}
