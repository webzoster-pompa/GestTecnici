"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

interface CallsListProps {
  customerId: number;
}

const outcomeLabels = {
  answered: "Risposto",
  no_answer: "Non risposto",
  busy: "Occupato",
  follow_up: "Follow-up richiesto",
};

const outcomeColors = {
  answered: "bg-green-100 text-green-800",
  no_answer: "bg-red-100 text-red-800",
  busy: "bg-yellow-100 text-yellow-800",
  follow_up: "bg-blue-100 text-blue-800",
};

export function CallsList({ customerId }: CallsListProps) {
  const { data: calls, isLoading, refetch } = trpc.calls.listByCustomer.useQuery({ customerId });
  const createMutation = trpc.calls.create.useMutation();
  const updateMutation = trpc.calls.update.useMutation();
  const deleteMutation = trpc.calls.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    callDate: new Date().toISOString().slice(0, 16), // datetime-local format
    duration: "",
    outcome: "answered" as "answered" | "no_answer" | "busy" | "follow_up",
    notes: "",
    followUpDate: "",
    isOpen: true,
  });

  const resetForm = () => {
    setFormData({
      callDate: new Date().toISOString().slice(0, 16),
      duration: "",
      outcome: "answered",
      notes: "",
      followUpDate: "",
      isOpen: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (call: any) => {
    setFormData({
      callDate: new Date(call.callDate).toISOString().slice(0, 16),
      duration: call.duration ? String(call.duration) : "",
      outcome: call.outcome,
      notes: call.notes || "",
      followUpDate: call.followUpDate ? new Date(call.followUpDate).toISOString().split('T')[0] : "",
      isOpen: call.isOpen,
    });
    setEditingId(call.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        customerId,
        callDate: new Date(formData.callDate),
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        outcome: formData.outcome,
        notes: formData.notes || undefined,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : undefined,
        isOpen: formData.isOpen,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        alert("Chiamata aggiornata con successo!");
      } else {
        await createMutation.mutateAsync(data);
        alert("Chiamata registrata con successo!");
      }
      await refetch();
      resetForm();
    } catch (error) {
      alert("Errore durante il salvataggio della chiamata");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa chiamata?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      alert("Chiamata eliminata con successo");
      await refetch();
    } catch (error) {
      alert("Errore durante l'eliminazione della chiamata");
      console.error(error);
    }
  };

  const toggleStatus = async (call: any) => {
    try {
      await updateMutation.mutateAsync({
        id: call.id,
        isOpen: !call.isOpen,
      });
      await refetch();
    } catch (error) {
      alert("Errore durante l'aggiornamento dello stato");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Caricamento...</div>;
  }

  const openCalls = calls?.filter(c => c.isOpen) || [];
  const closedCalls = calls?.filter(c => !c.isOpen) || [];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Log Chiamate</h3>
          <div className="text-sm text-gray-600 mt-1">
            <span className="font-semibold text-blue-600">{openCalls.length}</span> aperte ·{" "}
            <span className="font-semibold text-gray-600">{closedCalls.length}</span> chiuse
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showForm ? "Annulla" : "+ Nuova Chiamata"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">
            {editingId ? "Modifica Chiamata" : "Registra Nuova Chiamata"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data e Ora *</label>
              <input
                type="datetime-local"
                value={formData.callDate}
                onChange={(e) => setFormData({ ...formData, callDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durata (secondi)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="es. 120"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Esito *</label>
              <select
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="answered">Risposto</option>
                <option value="no_answer">Non risposto</option>
                <option value="busy">Occupato</option>
                <option value="follow_up">Follow-up richiesto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Follow-up</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Dettagli della chiamata..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isOpen}
                  onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Chiamata aperta (richiede azione)</span>
              </label>
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

      {calls && calls.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-8">
          Nessuna chiamata registrata. Clicca "+ Nuova Chiamata" per aggiungerne una.
        </div>
      )}

      <div className="space-y-3">
        {calls?.map((call) => (
          <div
            key={call.id}
            className={`p-4 border rounded hover:shadow-md transition-shadow ${
              call.isOpen ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {new Date(call.callDate).toLocaleString('it-IT')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${outcomeColors[call.outcome]}`}>
                    {outcomeLabels[call.outcome]}
                  </span>
                  {call.isOpen && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-semibold">
                      APERTA
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {call.duration && (
                    <div>
                      <span className="font-medium">Durata:</span> {Math.floor(call.duration / 60)}m {call.duration % 60}s
                    </div>
                  )}
                  {call.followUpDate && (
                    <div>
                      <span className="font-medium">Follow-up:</span>{" "}
                      {new Date(call.followUpDate).toLocaleDateString('it-IT')}
                    </div>
                  )}
                  {call.notes && (
                    <div className="mt-2 italic">{call.notes}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => toggleStatus(call)}
                  className={`px-3 py-1 rounded text-sm ${
                    call.isOpen
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
                  title={call.isOpen ? "Chiudi chiamata" : "Riapri chiamata"}
                >
                  {call.isOpen ? "✓" : "↻"}
                </button>
                <button
                  onClick={() => handleEdit(call)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(call.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
