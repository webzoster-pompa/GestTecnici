"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

interface MaintenanceBooksListProps {
  customerId: number;
}

export function MaintenanceBooksList({ customerId }: MaintenanceBooksListProps) {
  const { data: books, isLoading, refetch } = trpc.maintenanceBooks.listByCustomer.useQuery({ customerId });
  const createMutation = trpc.maintenanceBooks.create.useMutation();
  const updateMutation = trpc.maintenanceBooks.update.useMutation();
  const deleteMutation = trpc.maintenanceBooks.delete.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bookNumber: "",
    issueDate: "",
    lastCheckDate: "",
    nextCheckDate: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          bookNumber: formData.bookNumber,
          issueDate: new Date(formData.issueDate),
          lastCheckDate: formData.lastCheckDate ? new Date(formData.lastCheckDate) : undefined,
          nextCheckDate: new Date(formData.nextCheckDate),
          notes: formData.notes || undefined,
        });
      } else {
        await createMutation.mutateAsync({
          customerId,
          bookNumber: formData.bookNumber,
          issueDate: new Date(formData.issueDate),
          lastCheckDate: formData.lastCheckDate ? new Date(formData.lastCheckDate) : undefined,
          nextCheckDate: new Date(formData.nextCheckDate),
          notes: formData.notes || undefined,
        });
      }
      
      setFormData({ bookNumber: "", issueDate: "", lastCheckDate: "", nextCheckDate: "", notes: "" });
      setShowForm(false);
      setEditingId(null);
      refetch();
    } catch (error) {
      console.error("Errore salvataggio libretto:", error);
      alert("Errore durante il salvataggio del libretto");
    }
  };

  const handleEdit = (book: any) => {
    setEditingId(book.id);
    setFormData({
      bookNumber: book.bookNumber,
      issueDate: new Date(book.issueDate).toISOString().split('T')[0],
      lastCheckDate: book.lastCheckDate ? new Date(book.lastCheckDate).toISOString().split('T')[0] : "",
      nextCheckDate: new Date(book.nextCheckDate).toISOString().split('T')[0],
      notes: book.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo libretto?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error("Errore eliminazione libretto:", error);
      alert("Errore durante l'eliminazione del libretto");
    }
  };

  const getStatusBadge = (status: string, nextCheckDate: string) => {
    const daysUntilCheck = Math.ceil((new Date(nextCheckDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (status === "expired" || daysUntilCheck < 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">⚠️ Scaduto</span>;
    } else if (status === "expiring" || daysUntilCheck <= 30) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">⏰ In scadenza ({daysUntilCheck}gg)</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">✓ OK ({daysUntilCheck}gg)</span>;
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Caricamento libretti...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">📋 Libretti Impianto</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({ bookNumber: "", issueDate: "", lastCheckDate: "", nextCheckDate: "", notes: "" });
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
        >
          {showForm ? "✖ Annulla" : "+ Nuovo Libretto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">
            {editingId ? "Modifica Libretto" : "Nuovo Libretto"}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero Libretto *</label>
              <input
                type="text"
                value={formData.bookNumber}
                onChange={(e) => setFormData({ ...formData, bookNumber: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="es. LIB-2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Emissione *</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ultimo Controllo</label>
              <input
                type="date"
                value={formData.lastCheckDate}
                onChange={(e) => setFormData({ ...formData, lastCheckDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prossimo Controllo *</label>
              <input
                type="date"
                value={formData.nextCheckDate}
                onChange={(e) => setFormData({ ...formData, nextCheckDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Note aggiuntive..."
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormData({ bookNumber: "", issueDate: "", lastCheckDate: "", nextCheckDate: "", notes: "" });
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {editingId ? "💾 Salva Modifiche" : "➕ Aggiungi Libretto"}
            </button>
          </div>
        </form>
      )}

      {books && books.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">📋 Nessun libretto registrato</p>
          <p className="text-sm mt-2">Aggiungi il primo libretto impianto per questo cliente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {books?.map((book) => (
            <div key={book.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{book.bookNumber}</h4>
                    {getStatusBadge(book.status, book.nextCheckDate.toString())}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Emissione:</span> {new Date(book.issueDate).toLocaleDateString('it-IT')}
                    </div>
                    {book.lastCheckDate && (
                      <div>
                        <span className="font-medium">Ultimo controllo:</span> {new Date(book.lastCheckDate).toLocaleDateString('it-IT')}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Prossimo controllo:</span> {new Date(book.nextCheckDate.toString()).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  {book.notes && (
                    <p className="mt-2 text-sm text-gray-600 italic">{book.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(book)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    ✏️ Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
