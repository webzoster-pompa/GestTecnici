"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

interface ContractsListProps {
  customerId: number;
}

const statusLabels = {
  active: "Attivo",
  expiring: "In scadenza",
  expired: "Scaduto",
  cancelled: "Cancellato",
};

const statusColors = {
  active: "bg-green-100 text-green-800",
  expiring: "bg-yellow-100 text-yellow-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function ContractsList({ customerId }: ContractsListProps) {
  const { data: contracts, isLoading, refetch } = trpc.contracts.listByCustomer.useQuery({ customerId });
  const createMutation = trpc.contracts.create.useMutation();
  const updateMutation = trpc.contracts.update.useMutation();
  const deleteMutation = trpc.contracts.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    contractNumber: "",
    type: "",
    startDate: "",
    endDate: "",
    renewalDate: "",
    status: "active" as "active" | "expiring" | "expired" | "cancelled",
    amount: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      contractNumber: "",
      type: "",
      startDate: "",
      endDate: "",
      renewalDate: "",
      status: "active",
      amount: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (contract: any) => {
    setFormData({
      contractNumber: contract.contractNumber || "",
      type: contract.type || "",
      startDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : "",
      endDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : "",
      renewalDate: contract.renewalDate ? new Date(contract.renewalDate).toISOString().split('T')[0] : "",
      status: contract.status,
      amount: contract.amount || "",
      notes: contract.notes || "",
    });
    setEditingId(contract.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        customerId,
        contractNumber: formData.contractNumber,
        type: formData.type,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        renewalDate: formData.renewalDate ? new Date(formData.renewalDate) : undefined,
        status: formData.status,
        amount: formData.amount || undefined,
        notes: formData.notes || undefined,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        alert("Contratto aggiornato con successo!");
      } else {
        await createMutation.mutateAsync(data);
        alert("Contratto creato con successo!");
      }
      await refetch();
      resetForm();
    } catch (error) {
      alert("Errore durante il salvataggio del contratto");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo contratto?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      alert("Contratto eliminato con successo");
      await refetch();
    } catch (error) {
      alert("Errore durante l'eliminazione del contratto");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Caricamento...</div>;
  }

  const activeContracts = contracts?.filter(c => c.status === "active" || c.status === "expiring") || [];
  const expiredContracts = contracts?.filter(c => c.status === "expired" || c.status === "cancelled") || [];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Contratti Manutenzione</h3>
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-semibold text-green-600">{activeContracts.length}</span> attivi ·{" "}
            <span className="font-semibold text-gray-600">{expiredContracts.length}</span> scaduti/cancellati
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showForm ? "Annulla" : "+ Nuovo Contratto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">
            {editingId ? "Modifica Contratto" : "Nuovo Contratto"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero Contratto *</label>
              <input
                type="text"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                required
                placeholder="es. MANT-2024-001"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                placeholder="es. Manutenzione Ordinaria"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Rinnovo</label>
              <input
                type="date"
                value={formData.renewalDate}
                onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stato</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="active">Attivo</option>
                <option value="expiring">In scadenza</option>
                <option value="expired">Scaduto</option>
                <option value="cancelled">Cancellato</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Importo (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="es. 500.00"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Dettagli del contratto..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 text-sm"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </form>
      )}

      {contracts && contracts.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-8">
          Nessun contratto registrato. Clicca "+ Nuovo Contratto" per aggiungerne uno.
        </div>
      )}

      <div className="space-y-3">
        {contracts?.map((contract) => {
          const endDate = new Date(contract.endDate);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div
              key={contract.id}
              className={`p-4 border rounded hover:shadow-md transition-shadow ${
                contract.status === "active" || contract.status === "expiring"
                  ? "bg-white border-gray-200"
                  : "bg-gray-50 border-gray-300"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-semibold text-gray-800">{contract.contractNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[contract.status]}`}>
                      {statusLabels[contract.status]}
                    </span>
                    {contract.status === "expiring" && daysUntilExpiry > 0 && (
                      <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800 font-semibold">
                        {daysUntilExpiry} giorni
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">{contract.type}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Inizio:</span>{" "}
                      {new Date(contract.startDate).toLocaleDateString('it-IT')}
                    </div>
                    <div>
                      <span className="font-medium">Fine:</span>{" "}
                      {new Date(contract.endDate).toLocaleDateString('it-IT')}
                    </div>
                    {contract.renewalDate && (
                      <div>
                        <span className="font-medium">Rinnovo:</span>{" "}
                        {new Date(contract.renewalDate).toLocaleDateString('it-IT')}
                      </div>
                    )}
                    {contract.amount && (
                      <div>
                        <span className="font-medium">Importo:</span> €{parseFloat(contract.amount).toFixed(2)}
                      </div>
                    )}
                  </div>
                  {contract.notes && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      {contract.notes}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(contract)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(contract.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
