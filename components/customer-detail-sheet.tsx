"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl } from "@/constants/oauth";
import { EquipmentsList } from "@/components/equipments-list";
import { CallsList } from "@/components/calls-list";
import { ContractsList } from "@/components/contracts-list";
import { MaintenanceBooksList } from "@/components/maintenance-books-list";
import { QuotesList } from "@/components/quotes-list";
import { DocumentsList } from "@/components/documents-list";
import { CustomerHistory } from "@/components/customer-history";

interface CustomerDetailSheetProps {
  customerId: number;
  onClose: () => void;
}

export function CustomerDetailSheet({ customerId, onClose }: CustomerDetailSheetProps) {
  console.log('[CustomerDetailSheet] Opened with customerId:', customerId);
  const { data: customer, isLoading, refetch } = trpc.customers.getById.useQuery({ id: customerId });
  const { data: customerHistory } = trpc.appointments.getCustomerHistory.useQuery({ customerId });
  console.log('[CustomerDetailSheet] getCustomerHistory query initiated for customerId:', customerId);
  
  // Debug logging
  React.useEffect(() => {
    console.log('[CustomerDetailSheet] customerHistory:', customerHistory);
    if (customerHistory) {
      console.log('[CustomerDetailSheet] customerHistory length:', customerHistory.length);
      customerHistory.forEach((apt, idx) => {
        console.log(`[CustomerDetailSheet] Appointment ${idx}:`, { id: apt.id, invoiceStatus: apt.invoiceStatus, invoiceNumber: apt.invoiceNumber });
      });
    }
  }, [customerHistory]);
  const { data: equipments } = trpc.equipments.listByCustomer.useQuery({ customerId });
  const { data: calls } = trpc.calls.listByCustomer.useQuery({ customerId });
  const { data: contracts } = trpc.contracts.listByCustomer.useQuery({ customerId });
  const { data: maintenanceBooks } = trpc.maintenanceBooks.listByCustomer.useQuery({ customerId });
  const { data: quotes } = trpc.quotes.listByCustomer.useQuery({ customerId });
  const { data: documents } = trpc.documents.listByCustomer.useQuery({ customerId });
  const updateMutation = trpc.customers.update.useMutation();
  const deleteMutation = trpc.customers.delete.useMutation();
  
  // Conteggi per le card riepilogo
  const interventionsCount = customerHistory?.filter(apt => apt.status !== 'cancelled').length || 0;
  const lastIntervention = customerHistory && customerHistory.length > 0 ? customerHistory[0] : null;
  const equipmentsCount = equipments?.length || 0;
  const openCallsCount = calls?.filter(c => c.isOpen).length || 0;
  const closedCallsCount = calls?.filter(c => !c.isOpen).length || 0;
  const maintenanceBooksCount = maintenanceBooks?.length || 0;
  const activeContractsCount = contracts?.filter(c => c.status === 'active' || c.status === 'expiring').length || 0;
  const quotesCount = quotes?.length || 0;
  const documentsCount = documents?.length || 0;
  
  // Stato per gestire quale sezione mostrare
  const [activeSection, setActiveSection] = useState<'anagrafica' | 'interventi' | 'equipments' | 'calls' | 'books' | 'contracts' | 'quotes' | 'documents' | 'invoices'>('anagrafica');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    zone: "",
    taxCode: "",
    vatNumber: "",
    iban: "",
    pec: "",
    sdiCode: "",
    referent: "",
    notes: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  // Popola form quando i dati del cliente sono caricati
  React.useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "",
        postalCode: customer.postalCode || "",
        province: customer.province || "",
        zone: customer.zone || "",
        taxCode: customer.taxCode || "",
        vatNumber: customer.vatNumber || "",
        iban: customer.iban || "",
        pec: customer.pec || "",
        sdiCode: customer.sdiCode || "",
        referent: customer.referent || "",
        notes: customer.notes || "",
        latitude: customer.latitude !== null ? (typeof customer.latitude === 'string' ? parseFloat(customer.latitude) : customer.latitude) : undefined,
        longitude: customer.longitude !== null ? (typeof customer.longitude === 'string' ? parseFloat(customer.longitude) : customer.longitude) : undefined,
      });
    }
  }, [customer]);

  const handleDelete = async () => {
    // Verifica se ci sono chiamate associate
    const callsCount = calls?.length || 0;
    
    let confirmMessage = `Sei sicuro di voler eliminare il cliente "${customer?.firstName} ${customer?.lastName}"?`;
    
    if (callsCount > 0) {
      confirmMessage += `\n\n⚠️ ATTENZIONE: Questo cliente ha ${callsCount} chiamata/e associata/e.\nLe chiamate verranno mantenute ma il collegamento al cliente verrà rimosso.`;
    }
    
    confirmMessage += "\n\nQuesta azione NON può essere annullata!";
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      await deleteMutation.mutateAsync({ id: customerId });
      alert("Cliente eliminato con successo!");
      onClose();
    } catch (error) {
      alert("Errore durante l'eliminazione del cliente");
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: customerId,
        ...formData,
      });
      await refetch();
      setIsEditing(false);
      alert("Cliente aggiornato con successo!");
    } catch (error) {
      alert("Errore durante il salvataggio del cliente");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-lg">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-lg text-red-600">Cliente non trovato</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
          <div>
            <button onClick={onClose} className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-2">
              ← Torna ai Clienti
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              SCHEDA CLIENTE: {customer.firstName} {customer.lastName} (ID {customer.id})
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              {deleteMutation.isPending ? "🗑️ Eliminazione..." : "🗑️ Elimina Cliente"}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {isEditing ? "Annulla Modifica" : "✏️ Modifica"}
            </button>
          </div>
        </div>

        {/* Card Riepilogative */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {/* Card Interventi */}
            <div 
              onClick={() => setActiveSection('interventi')}
              className="bg-blue-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">🔧</div>
              <div className="text-xs font-semibold">Interventi</div>
              <div className="text-xl font-bold">{interventionsCount}</div>
              {lastIntervention && (
                <div className="text-xs mt-1 opacity-90">
                  Ultimo: {new Date(lastIntervention.scheduledDate).toLocaleDateString('it-IT')}
                </div>
              )}
              <button className="mt-1 text-xs bg-white text-blue-500 px-2 py-0.5 rounded hover:bg-blue-50">
                Apri
              </button>
            </div>

            {/* Card Apparecchi */}
            <div 
              onClick={() => setActiveSection('equipments')}
              className="bg-orange-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">⚙️</div>
              <div className="text-xs font-semibold">Apparecchi</div>
              <div className="text-xl font-bold">{equipmentsCount}</div>
              <button className="mt-1 text-xs bg-white text-orange-500 px-2 py-0.5 rounded hover:bg-orange-50">
                Apri
              </button>
            </div>

            {/* Card Chiamate */}
            <div 
              onClick={() => setActiveSection('calls')}
              className="bg-purple-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">📞</div>
              <div className="text-xs font-semibold">Chiamate</div>
              <div className="text-lg font-bold">{openCallsCount} / {closedCallsCount}</div>
              <div className="text-xs">Aperti / Chiusi</div>
              <button className="mt-1 text-xs bg-white text-purple-500 px-2 py-0.5 rounded hover:bg-purple-50">
                Apri
              </button>
            </div>

            {/* Card Libretti */}
            <div 
              onClick={() => setActiveSection('books')}
              className="bg-green-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xs font-semibold">Libretti Impianto</div>
              <div className="text-xl font-bold">{maintenanceBooksCount}</div>
              <button className="mt-1 text-xs bg-white text-green-500 px-2 py-0.5 rounded hover:bg-green-50">
                Apri
              </button>
            </div>

            {/* Card Contratti */}
            <div 
              onClick={() => setActiveSection('contracts')}
              className="bg-indigo-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">📄</div>
              <div className="text-xs font-semibold">Contratti</div>
              <div className="text-xl font-bold">{activeContractsCount}</div>
              <button className="mt-1 text-xs bg-white text-indigo-500 px-2 py-0.5 rounded hover:bg-indigo-50">
                Apri
              </button>
            </div>

            {/* Card Preventivi */}
            <div 
              onClick={() => setActiveSection('quotes')}
              className="bg-cyan-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xs font-semibold">Preventivi</div>
              <div className="text-xl font-bold">{quotesCount}</div>
              <button className="mt-1 text-xs bg-white text-cyan-500 px-2 py-0.5 rounded hover:bg-cyan-50">
                Apri
              </button>
            </div>

            {/* Card Documenti */}
            <div 
              onClick={() => setActiveSection('documents')}
              className="bg-orange-600 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">📁</div>
              <div className="text-xs font-semibold">Documenti</div>
              <div className="text-xl font-bold">{documentsCount}</div>
              <button className="mt-1 text-xs bg-white text-red-500 px-2 py-0.5 rounded hover:bg-red-50">
                Apri
              </button>
            </div>

            {/* Card Fatture */}
            <div 
              onClick={() => setActiveSection('invoices')}
              className="bg-red-500 text-white rounded-lg p-3 shadow hover:shadow-lg transition-shadow cursor-pointer min-w-[140px] flex-shrink-0"
            >
              <div className="text-2xl mb-1">🧾</div>
              <div className="text-xs font-semibold">Fatture</div>
              <div className="text-xl font-bold">{customerHistory?.filter(apt => apt.invoiceStatus === 'invoiced').length || 0}</div>
              <button className="mt-1 text-xs bg-white text-red-500 px-2 py-0.5 rounded hover:bg-red-50">
                Apri
              </button>
            </div>
          </div>
        </div>

        {/* Navigazione Sezioni */}
        <div className="flex gap-2 p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveSection('anagrafica')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'anagrafica'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Anagrafica
          </button>
          <button
            onClick={() => setActiveSection('interventi')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'interventi'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔧 Interventi ({interventionsCount})
          </button>
          <button
            onClick={() => setActiveSection('equipments')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'equipments'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚙️ Apparecchi ({equipmentsCount})
          </button>
          <button
            onClick={() => setActiveSection('calls')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'calls'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📞 Chiamate ({openCallsCount})
          </button>
          <button
            onClick={() => setActiveSection('contracts')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'contracts'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📄 Contratti ({activeContractsCount})
          </button>
          <button
            onClick={() => setActiveSection('books')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'books'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Libretti ({maintenanceBooksCount})
          </button>
          <button
            onClick={() => setActiveSection('quotes')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'quotes'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💰 Preventivi ({quotesCount})
          </button>
          <button
            onClick={() => setActiveSection('documents')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'documents'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 Documenti ({documentsCount})
          </button>
          <button
            onClick={() => setActiveSection('invoices')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeSection === 'invoices'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🧾 Fatture ({customerHistory?.filter(apt => apt.invoiceStatus === 'invoiced').length || 0})
          </button>
        </div>

        {/* Contenuto Sezioni */}
        {activeSection === 'anagrafica' && (
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Anagrafica</h3>

          {/* Dati Anagrafici */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Dati Anagrafici</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {!isEditing && (
                    <div className="flex gap-1">
                      <a href={`tel:${formData.phone}`} className="p-2 bg-green-500 text-white rounded hover:bg-green-600" title="Chiama">
                        📞
                      </a>
                      <a href={`https://wa.me/${formData.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-600 text-white rounded hover:bg-green-700" title="WhatsApp">
                        💬
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {!isEditing && formData.email && (
                    <a href={`mailto:${formData.email}`} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600" title="Invia Email">
                      ✉️
                    </a>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {!isEditing && formData.address && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address + ", " + formData.city)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Apri Mappa"
                    >
                      🗺️
                    </a>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Città *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  disabled={!isEditing}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CAP</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  disabled={!isEditing}
                  maxLength={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                <input
                  type="text"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referente/Amministratore</label>
                <input
                  type="text"
                  value={formData.referent}
                  onChange={(e) => setFormData({ ...formData, referent: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Dati Fiscali */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Dati Fiscali</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                <input
                  type="text"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value.toUpperCase() })}
                  disabled={!isEditing}
                  maxLength={16}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partita IVA</label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  disabled={!isEditing}
                  maxLength={11}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  disabled={!isEditing}
                  maxLength={27}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PEC</label>
                <input
                  type="email"
                  value={formData.pec}
                  onChange={(e) => setFormData({ ...formData, pec: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Destinatario (SDI)</label>
                <input
                  type="text"
                  value={formData.sdiCode}
                  onChange={(e) => setFormData({ ...formData, sdiCode: e.target.value.toUpperCase() })}
                  disabled={!isEditing}
                  maxLength={7}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Note</h4>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="Note aggiuntive sul cliente..."
            />
          </div>

          {/* Coordinate Geografiche */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">📍 Coordinate Geografiche</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitudine</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude || ""}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitudine</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude || ""}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Le coordinate vengono calcolate automaticamente dall'indirizzo. Puoi modificarle manualmente se necessario.
            </p>
          </div>

          {/* Pulsanti Azione */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                🗑️ Elimina Cliente
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                💾 {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
              </button>
            </div>
          )}
        </div>
        )}

        {activeSection === 'interventi' && customer && (
          <div className="p-6">
            <CustomerHistory 
              customerId={customerId}
              customerName={`${customer.firstName} ${customer.lastName}`}
              onClose={() => setActiveSection('anagrafica')}
            />
          </div>
        )}

        {activeSection === 'equipments' && (
          <EquipmentsList customerId={customerId} />
        )}

        {activeSection === 'calls' && (
          <CallsList customerId={customerId} />
        )}

        {activeSection === 'contracts' && (
          <ContractsList customerId={customerId} />
        )}

        {activeSection === 'books' && (
          <MaintenanceBooksList customerId={customerId} />
        )}

        {activeSection === 'quotes' && (
          <QuotesList customerId={customerId} />
        )}

        {activeSection === 'documents' && (
          <DocumentsList customerId={customerId} />
        )}

        {/* Sezione Fatture */}
        {activeSection === 'invoices' && (
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Fatture Emesse</h3>
            {console.log('customerHistory:', customerHistory), console.log('Filtered invoiced:', customerHistory?.filter(apt => apt.invoiceStatus === 'invoiced')), customerHistory && customerHistory.filter(apt => apt.invoiceStatus === 'invoiced').length > 0 ? (
              <div className="space-y-4">
                {customerHistory.filter(apt => apt.invoiceStatus === 'invoiced').map((apt) => (
                  <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">Fattura {apt.invoiceNumber}</h4>
                        <p className="text-sm text-gray-600">{new Date(apt.completedAt).toLocaleDateString('it-IT')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-800">€ {(parseFloat(apt.totalPrice?.toString() || '0')).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{apt.paymentMethod === 'cash' ? 'Contanti' : apt.paymentMethod === 'pos' ? 'POS' : apt.paymentMethod === 'transfer' ? 'Bonifico' : 'Non Pagato'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{apt.workDescription}</p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!apt.invoiceNumber) {
                          alert('Numero fattura non disponibile');
                          return;
                        }
                        try {
                          const apiUrl = `${getApiBaseUrl()}/api/invoices/${apt.id}/pdf`;
                          const response = await fetch(apiUrl);
                          if (!response.ok) {
                            alert(`Errore: ${response.statusText}`);
                            return;
                          }
                          const blob = await response.blob();
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${apt.invoiceNumber}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          alert('Errore nel download del PDF');
                        }
                      }}
                      className="text-sm bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                      Scarica PDF
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Nessuna fattura emessa</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
