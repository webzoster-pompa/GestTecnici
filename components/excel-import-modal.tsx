import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface ExcelImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ExcelImportModal({ onClose, onSuccess }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [geocode, setGeocode] = useState(false);

  const parseFileMutation = trpc.excel.parseFile.useMutation();
  const importMutation = trpc.excel.importCustomers.useMutation();
  const downloadTemplateMutation = trpc.excel.downloadTemplate.useQuery();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      alert("Per favore seleziona un file Excel (.xlsx o .xls)");
      return;
    }

    setFile(selectedFile);
    setImportResult(null);

    // Parse file per preview
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1];
        
        const result = await parseFileMutation.mutateAsync({
          fileBase64: base64Data,
        });
        
        setPreview(result);
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      alert("Errore nella lettura del file: " + error.message);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(",")[1];
        
        const result = await importMutation.mutateAsync({
          fileBase64: base64Data,
          geocode,
          skipDuplicates: true,
        });
        
        setImportResult(result);
        setIsUploading(false);

        if (result.success > 0) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 3000);
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert("Errore nell'importazione: " + error.message);
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!downloadTemplateMutation.data) return;

    const { base64, filename } = downloadTemplateMutation.data;
    const blob = new Blob(
      [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
      { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "32px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
          Importa Clienti da Excel
        </h2>

        {/* Istruzioni */}
        <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
          <p style={{ fontSize: "14px", marginBottom: "8px" }}>
            <strong>Formato richiesto:</strong>
          </p>
          <ul style={{ fontSize: "13px", paddingLeft: "20px", lineHeight: "1.6" }}>
            <li>ID Cliente (opzionale)</li>
            <li>Nominativo (obbligatorio)</li>
            <li>Indirizzo (obbligatorio)</li>
            <li>Città (obbligatorio)</li>
            <li>Telefono (obbligatorio)</li>
            <li>Email (opzionale)</li>
            <li>Tipo Impianto (opzionale)</li>
            <li>Ultimo Intervento (opzionale)</li>
          </ul>
        </div>

        {/* Download Template */}
        <button
          onClick={handleDownloadTemplate}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "16px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          📥 Scarica Template Excel
        </button>

        {/* File Upload */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{
              width: "100%",
              padding: "12px",
              border: "2px dashed #E5E7EB",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div style={{ marginBottom: "16px", padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
            <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
              ✅ File caricato: {preview.count} righe trovate
            </p>
            <p style={{ fontSize: "13px", color: "#666" }}>
              Prime 3 righe:
            </p>
            <pre style={{ fontSize: "11px", overflow: "auto", marginTop: "8px" }}>
              {JSON.stringify(preview.rows.slice(0, 3), null, 2)}
            </pre>
          </div>
        )}

        {/* Opzioni */}
        {file && !importResult && (
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={geocode}
                onChange={(e) => setGeocode(e.target.checked)}
              />
              <span style={{ fontSize: "14px" }}>
                Geocodifica automaticamente gli indirizzi (più lento)
              </span>
            </label>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div style={{ marginBottom: "16px", padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
            <p style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: "#00CC66" }}>
              ✅ Importazione completata!
            </p>
            <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
              <p>✅ Clienti importati con successo: <strong>{importResult.success}</strong></p>
              <p>⚠️ Righe saltate: <strong>{importResult.skipped}</strong></p>
              <p>❌ Errori: <strong>{importResult.errors.length}</strong></p>
            </div>
            
            {importResult.errors.length > 0 && (
              <details style={{ marginTop: "12px" }}>
                <summary style={{ cursor: "pointer", fontSize: "13px", color: "#CC0000" }}>
                  Mostra errori
                </summary>
                <div style={{ marginTop: "8px", maxHeight: "200px", overflow: "auto" }}>
                  {importResult.errors.slice(0, 10).map((err: any, idx: number) => (
                    <div key={idx} style={{ fontSize: "12px", marginBottom: "8px", padding: "8px", backgroundColor: "#fff", borderRadius: "4px" }}>
                      <strong>Riga {err.row}:</strong> {err.error}
                    </div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <p style={{ fontSize: "12px", color: "#666" }}>
                      ... e altri {importResult.errors.length - 10} errori
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#f5f5f5",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Chiudi
          </button>
          
          {file && !importResult && (
            <button
              onClick={handleImport}
              disabled={isUploading}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: isUploading ? "#ccc" : "#0066CC",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: isUploading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {isUploading ? "Importazione in corso..." : "Importa Clienti"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
