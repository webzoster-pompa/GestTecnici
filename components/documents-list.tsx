"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";

interface DocumentsListProps {
  customerId: number;
}

export function DocumentsList({ customerId }: DocumentsListProps) {
  const { data: documents, isLoading, refetch } = trpc.documents.listByCustomer.useQuery({ customerId });
  const createMutation = trpc.documents.create.useMutation();
  const updateMutation = trpc.documents.update.useMutation();
  const deleteMutation = trpc.documents.delete.useMutation();

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: "photo" as "photo" | "certificate" | "contract" | "other",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    
    try {
      // Converti file in base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // In un'app reale, qui caricheresti il file su S3 o storage
        // Per ora simuliamo salvando il base64 (non consigliato in produzione)
        const fileUrl = base64; // In produzione: await uploadToS3(selectedFile)
        
        await createMutation.mutateAsync({
          customerId,
          type: formData.type,
          filename: selectedFile.name,
          fileUrl: fileUrl,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          notes: formData.notes || undefined,
        });
        
        setFormData({ type: "photo", notes: "" });
        setSelectedFile(null);
        setShowUpload(false);
        setUploading(false);
        refetch();
      };
      
      reader.onerror = () => {
        setUploading(false);
        alert("Errore durante la lettura del file");
      };
    } catch (error) {
      console.error("Errore upload documento:", error);
      alert("Errore durante l'upload del documento");
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo documento?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error("Errore eliminazione documento:", error);
      alert("Errore durante l'eliminazione del documento");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "photo": return "📷";
      case "certificate": return "📜";
      case "contract": return "📄";
      default: return "📎";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "photo": return "Foto";
      case "certificate": return "Certificato";
      case "contract": return "Contratto";
      default: return "Altro";
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocuments = documents?.filter(doc => 
    filterType === "all" || doc.type === filterType
  );

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500">Caricamento documenti...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">📁 Documenti</h3>
        <button
          onClick={() => {
            setShowUpload(!showUpload);
            setFormData({ type: "photo", notes: "" });
            setSelectedFile(null);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
        >
          {showUpload ? "✖ Annulla" : "⬆️ Carica Documento"}
        </button>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1 text-sm rounded ${filterType === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          Tutti ({documents?.length || 0})
        </button>
        <button
          onClick={() => setFilterType("photo")}
          className={`px-3 py-1 text-sm rounded ${filterType === "photo" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          📷 Foto ({documents?.filter(d => d.type === "photo").length || 0})
        </button>
        <button
          onClick={() => setFilterType("certificate")}
          className={`px-3 py-1 text-sm rounded ${filterType === "certificate" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          📜 Certificati ({documents?.filter(d => d.type === "certificate").length || 0})
        </button>
        <button
          onClick={() => setFilterType("contract")}
          className={`px-3 py-1 text-sm rounded ${filterType === "contract" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          📄 Contratti ({documents?.filter(d => d.type === "contract").length || 0})
        </button>
        <button
          onClick={() => setFilterType("other")}
          className={`px-3 py-1 text-sm rounded ${filterType === "other" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          📎 Altro ({documents?.filter(d => d.type === "other").length || 0})
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">Carica Nuovo Documento</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="photo">📷 Foto Intervento</option>
                <option value="certificate">📜 Certificato</option>
                <option value="contract">📄 Contratto Firmato</option>
                <option value="other">📎 Altro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
              <input
                type="file"
                onChange={handleFileSelect}
                required
                accept="image/*,.pdf,.doc,.docx"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {selectedFile && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium">File selezionato:</span> {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Descrizione o note sul documento..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {uploading ? "⏳ Caricamento..." : "⬆️ Carica Documento"}
            </button>
          </div>
        </form>
      )}

      {filteredDocuments && filteredDocuments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">📁 Nessun documento caricato</p>
          <p className="text-sm mt-2">Carica il primo documento per questo cliente</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredDocuments?.map((doc) => (
            <div key={doc.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="text-4xl">{getTypeIcon(doc.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                      {getTypeLabel(doc.type)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{doc.filename}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {formatFileSize(doc.fileSize ?? undefined)} • {new Date(doc.uploadDate).toLocaleDateString('it-IT')}
              </p>
                  {doc.notes && (
                    <p className="text-xs text-gray-600 mt-2 italic">{doc.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <a
                  href={doc.fileUrl}
                  download={doc.filename}
                  className="flex-1 px-3 py-1 text-sm text-center bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  ⬇️ Scarica
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
