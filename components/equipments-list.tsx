"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

interface EquipmentsListProps {
  customerId: number;
}

export function EquipmentsList({ customerId }: EquipmentsListProps) {
  const { data: equipments, isLoading, refetch } = trpc.equipments.listByCustomer.useQuery({ customerId });
  const createMutation = trpc.equipments.create.useMutation();
  const updateMutation = trpc.equipments.update.useMutation();
  const deleteMutation = trpc.equipments.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    type: "",
    brand: "",
    model: "",
    serialNumber: "",
    installationDate: "",
    warrantyExpiry: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      type: "",
      brand: "",
      model: "",
      serialNumber: "",
      installationDate: "",
      warrantyExpiry: "",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (equipment: any) => {
    setFormData({
      type: equipment.type || "",
      brand: equipment.brand || "",
      model: equipment.model || "",
      serialNumber: equipment.serialNumber || "",
      installationDate: equipment.installationDate ? new Date(equipment.installationDate).toISOString().split('T')[0] : "",
      warrantyExpiry: equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry).toISOString().split('T')[0] : "",
      notes: equipment.notes || "",
    });
    setEditingId(equipment.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        customerId,
        type: formData.type,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        serialNumber: formData.serialNumber || undefined,
        installationDate: formData.installationDate ? new Date(formData.installationDate) : undefined,
        warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined,
        notes: formData.notes || undefined,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        alert("Apparecchio aggiornato con successo!");
      } else {
        await createMutation.mutateAsync(data);
        alert("Apparecchio aggiunto con successo!");
      }
      await refetch();
      resetForm();
    } catch (error) {
      alert("Errore durante il salvataggio dell'apparecchio");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo apparecchio?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      alert("Apparecchio eliminato con successo");
      await refetch();
    } catch (error) {
      alert("Errore durante l'eliminazione dell'apparecchio");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Caricamento...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Apparecchi Installati</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          {showForm ? "Annulla" : "+ Nuovo Apparecchio"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="font-semibold text-gray-700 mb-3">
            {editingId ? "Modifica Apparecchio" : "Nuovo Apparecchio"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                placeholder="es. Caldaia, Condizionatore"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="es. Vaillant, Daikin"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modello</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricola</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Installazione</label>
              <input
                type="date"
                value={formData.installationDate}
                onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scadenza Garanzia</label>
              <input
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
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

      {equipments && equipments.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-8">
          Nessun apparecchio registrato. Clicca "+ Nuovo Apparecchio" per aggiungerne uno.
        </div>
      )}

      <div className="space-y-3">
        {equipments?.map((equipment) => (
          <div key={equipment.id} className="p-4 bg-white border border-gray-200 rounded hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-semibold text-gray-800">{equipment.type}</span>
                  {equipment.brand && (
                    <span className="text-sm text-gray-600">- {equipment.brand}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  {equipment.model && (
                    <div>
                      <span className="font-medium">Modello:</span> {equipment.model}
                    </div>
                  )}
                  {equipment.serialNumber && (
                    <div>
                      <span className="font-medium">Matricola:</span> {equipment.serialNumber}
                    </div>
                  )}
                  {equipment.installationDate && (
                    <div>
                      <span className="font-medium">Installato:</span>{" "}
                      {new Date(equipment.installationDate).toLocaleDateString('it-IT')}
                    </div>
                  )}
                  {equipment.warrantyExpiry && (
                    <div>
                      <span className="font-medium">Garanzia:</span>{" "}
                      {new Date(equipment.warrantyExpiry).toLocaleDateString('it-IT')}
                      {new Date(equipment.warrantyExpiry) < new Date() && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">SCADUTA</span>
                      )}
                    </div>
                  )}
                </div>
                {equipment.notes && (
                  <div className="mt-2 text-sm text-gray-600 italic">
                    {equipment.notes}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(equipment)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(equipment.id)}
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
