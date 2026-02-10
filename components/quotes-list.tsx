"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

interface QuotesListProps {
  customerId: number;
}

interface QuoteItemForm {
  description: string;
  quantity: string;
  unitPrice: string;
}

export function QuotesList({ customerId }: QuotesListProps) {
  const { data: quotes, isLoading, refetch } = trpc.quotes.listByCustomer.useQuery({ customerId });
  const createMutation = trpc.quotes.create.useMutation();
  const updateMutation = trpc.quotes.update.useMutation();
  const deleteMutation = trpc.quotes.delete.useMutation();
  const createItemMutation = trpc.quotes.createItem.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    quoteNumber: "",
    date: new Date().toISOString().split('T')[0],
    validUntil: "",
    status: "draft" as "draft" | "sent" | "accepted" | "rejected" | "expired",
    taxRate: "22.00",
    notes: "",
  });
  
  const [items, setItems] = useState<QuoteItemForm[]>([
    { description: "", quantity: "1.00", unitPrice: "0.00" }
  ]);

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);
    
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    
    return { subtotal, taxAmount, totalAmount };
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: "1.00", unitPrice: "0.00" }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof QuoteItemForm, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, taxAmount, totalAmount } = calculateTotals();
    
    try {
      const quoteId = await createMutation.mutateAsync({
        customerId,
        quoteNumber: formData.quoteNumber,
        date: new Date(formData.date),
        validUntil: new Date(formData.validUntil),
        status: formData.status,
        subtotal: subtotal.toFixed(2),
        taxRate: formData.taxRate,
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        notes: formData.notes || undefined,
      });
      
      // Crea le righe del preventivo
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const total = qty * price;
        
        await createItemMutation.mutateAsync({
          quoteId: quoteId.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: total.toFixed(2),
          sortOrder: i,
        });
      }
      
      setFormData({
        quoteNumber: "",
        date: new Date().toISOString().split('T')[0],
        validUntil: "",
        status: "draft",
        taxRate: "22.00",
        notes: "",
      });
      setItems([{ description: "", quantity: "1.00", unitPrice: "0.00" }]);
      setShowForm(false);
      refetch();
    } catch (error) {
      console.error("Errore salvataggio preventivo:", error);
      alert("Errore durante il salvataggio del preventivo");
    }
  };

  const handleUpdateStatus = async (id: number, status: "draft" | "sent" | "accepted" | "rejected" | "expired") => {
    try {
      await updateMutation.mutateAsync({ id, status });
      refetch();
    } catch (error) {
      console.error("Errore aggiornamento stato:", error);
      alert("Errore durante l'aggiornamento dello stato");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo preventivo?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error("Errore eliminazione preventivo:", error);
      alert("Errore durante l'eliminazione del preventivo");
    }
  };

  const getStatusBadge = (status: string, validUntil: string) => {
    const isExpired = new Date(validUntil) < new Date();
    
    if (status === "accepted") {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">✓ Accettato</span>;
    } else if (status === "rejected") {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">✗ Rifiutato</span>;
    } else if (status === "expired" || isExpired) {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">⏱ Scaduto</span>;
    } else if (status === "sent") {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">📧 Inviato</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">📝 Bozza</span>;
    }
  };

  const { subtotal, taxAmount, totalAmount } = calculateTotals();

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Caricamento preventivi...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">💰 Preventivi</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              quoteNumber: "",
              date: new Date().toISOString().split('T')[0],
              validUntil: "",
              status: "draft",
              taxRate: "22.00",
              notes: "",
            });
            setItems([{ description: "", quantity: "1.00", unitPrice: "0.00" }]);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
        >
          {showForm ? "✖ Annulla" : "+ Nuovo Preventivo"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Nuovo Preventivo</h4>
          
          {/* Dati Preventivo */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero Preventivo *</label>
              <input
                type="text"
                value={formData.quoteNumber}
                onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="es. PREV-2024-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valido Fino *</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Righe Preventivo */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Righe Preventivo</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Aggiungi Riga
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrizione servizio/prodotto"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Qta"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Prezzo €"
                    />
                  </div>
                  <div className="w-32 px-3 py-2 bg-gray-100 border border-gray-300 rounded text-right">
                    €{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="px-2 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totali */}
          <div className="bg-white p-4 rounded border border-gray-300 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Imponibile:</span>
              <span className="font-semibold">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1 items-center">
              <span className="text-gray-600">IVA:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                />
                <span className="text-gray-600">% = €{taxAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Totale:</span>
              <span className="text-blue-600">€{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Note */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Note aggiuntive..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              💾 Salva Preventivo
            </button>
          </div>
        </form>
      )}

      {quotes && quotes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">💰 Nessun preventivo creato</p>
          <p className="text-sm mt-2">Crea il primo preventivo per questo cliente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes?.map((quote) => (
            <div key={quote.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{quote.quoteNumber}</h4>
                    {getStatusBadge(quote.status, quote.validUntil.toString())}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-medium">Data:</span> {new Date(quote.date).toLocaleDateString('it-IT')}
                    </div>
                    <div>
                      <span className="font-medium">Valido fino:</span> {new Date(quote.validUntil.toString()).toLocaleDateString('it-IT')}
                    </div>
                    <div>
                      <span className="font-medium text-blue-600">Totale: €{parseFloat(quote.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                  {quote.notes && (
                    <p className="text-sm text-gray-600 italic">{quote.notes}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {quote.status === "draft" && (
                    <button
                      onClick={() => handleUpdateStatus(quote.id, "sent")}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      📧 Segna Inviato
                    </button>
                  )}
                  {quote.status === "sent" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(quote.id, "accepted")}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        ✓ Accetta
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(quote.id, "rejected")}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        ✗ Rifiuta
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(quote.id)}
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
