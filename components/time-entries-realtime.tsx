import { useState, useEffect } from "react";
import { trpcClient } from "@/lib/trpc";

interface TimeEntry {
  timeEntry: {
    id: number;
    technicianId: number;
    date: Date;
    type: "start_day" | "start_break" | "end_break" | "end_day";
    timestamp: Date;
    latitude: string | null;
    longitude: string | null;
    isRemote: boolean;
    remoteReason: string | null;
  };
  technician: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
}

export function TimeEntriesRealtime() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadEntries = async () => {
    try {
      const data = await trpcClient.timeEntries.listToday.query();
      setEntries(data as TimeEntry[]);
    } catch (error) {
      console.error("Errore caricamento timbrature:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    const interval = setInterval(loadEntries, 10000); // Aggiorna ogni 10s
    return () => clearInterval(interval);
  }, []);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "start_day":
        return "🌅 Inizio giornata";
      case "start_break":
        return "☕ Inizio pausa";
      case "end_break":
        return "▶️ Fine pausa";
      case "end_day":
        return "🏁 Fine giornata";
      default:
        return type;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case "start_day":
      case "end_break":
        return "#22C55E"; // success
      case "start_break":
        return "#F59E0B"; // warning
      case "end_day":
        return "#0a7ea4"; // primary
      default:
        return "#687076"; // muted
    }
  };

  // Calcola ore lavorate per ogni tecnico
  const calculateDailySummary = () => {
    const summary: Record<number, { name: string; workMinutes: number; breakMinutes: number }> = {};

    entries.forEach((entry) => {
      const techId = entry.timeEntry.technicianId;
      if (!summary[techId]) {
        summary[techId] = {
          name: entry.technician
            ? `${entry.technician.firstName} ${entry.technician.lastName}`
            : "Tecnico sconosciuto",
          workMinutes: 0,
          breakMinutes: 0,
        };
      }
    });

    // Calcola ore lavorate e pause per ogni tecnico
    Object.keys(summary).forEach((techIdStr) => {
      const techId = parseInt(techIdStr);
      const techEntries = entries.filter((e) => e.timeEntry.technicianId === techId);

      let startDay: Date | null = null;
      let endDay: Date | null = null;
      let startBreak: Date | null = null;
      let totalBreakMinutes = 0;

      techEntries.forEach((entry) => {
        const timestamp = new Date(entry.timeEntry.timestamp);
        switch (entry.timeEntry.type) {
          case "start_day":
            startDay = timestamp;
            break;
          case "end_day":
            endDay = timestamp;
            break;
          case "start_break":
            startBreak = timestamp;
            break;
          case "end_break":
            if (startBreak) {
              totalBreakMinutes += (timestamp.getTime() - startBreak.getTime()) / (1000 * 60);
              startBreak = null;
            }
            break;
        }
      });

      if (startDay && endDay) {
        const totalMinutes = (endDay.getTime() - startDay.getTime()) / (1000 * 60);
        summary[techId].workMinutes = totalMinutes - totalBreakMinutes;
        summary[techId].breakMinutes = totalBreakMinutes;
      }
    });

    return Object.values(summary);
  };

  const dailySummary = calculateDailySummary();

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p style={{ marginTop: "16px", color: "#687076" }}>Caricamento timbrature...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          backgroundColor: "#f5f5f5",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#11181C", marginBottom: "8px" }}>
          Nessuna timbratura oggi
        </h3>
        <p style={{ fontSize: "14px", color: "#687076" }}>
          Le timbrature dei tecnici appariranno qui in tempo reale
        </p>
      </div>
    );
  }

  const handleDelete = async (entryId: number) => {
    if (!confirm("Sei sicuro di voler eliminare questa timbratura?")) return;
    
    setDeleting(entryId);
    try {
      await trpcClient.timeEntries.delete.mutate({ id: entryId });
      await loadEntries(); // Ricarica lista
      alert("Timbratura eliminata con successo");
    } catch (error) {
      console.error("Errore eliminazione timbratura:", error);
      alert("Errore durante l'eliminazione della timbratura");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#11181C" }}>
          Timbrature Tempo Reale
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => {
              const technicianId = prompt("Inserisci ID tecnico:");
              if (!technicianId) return;
              const date = prompt("Inserisci data (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
              if (!date) return;
              
              trpcClient.timeEntries.exportPDF
                .query({
                  technicianId: parseInt(technicianId),
                  date: new Date(date + "T12:00:00"),
                })
                .then((result) => {
                  const blob = new Blob([result.html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `timbrature_${date}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                })
                .catch((error) => {
                  alert("Errore esportazione: " + error.message);
                });
            }}
            style={{
              backgroundColor: "#0a7ea4",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            📄 Esporta PDF
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#22C55E",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: "14px", color: "#687076" }}>
              Aggiornamento automatico
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {entries.map((entry) => (
          <div
            key={entry.timeEntry.id}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 6px -1px rgb(0 0 0 / 0.1)";
              e.currentTarget.style.borderColor = "#0a7ea4";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#E5E7EB";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: `${getStatusColor(entry.timeEntry.type)}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: "600",
                  color: getStatusColor(entry.timeEntry.type),
                }}
              >
                {entry.technician?.firstName?.charAt(0) || "?"}
                {entry.technician?.lastName?.charAt(0) || ""}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#11181C", margin: 0 }}>
                    {entry.technician
                      ? `${entry.technician.firstName} ${entry.technician.lastName}`
                      : "Tecnico sconosciuto"}
                  </h3>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: getStatusColor(entry.timeEntry.type),
                    }}
                  >
                    {getTypeLabel(entry.timeEntry.type)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "14px", color: "#687076" }}>
                    🕐{" "}
                    {new Date(entry.timeEntry.timestamp).toLocaleDateString("it-IT", {
                      weekday: "short",
                    })}{" "}
                    {new Date(entry.timeEntry.timestamp).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" - "}
                    {new Date(entry.timeEntry.timestamp).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {entry.timeEntry.isRemote ? (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#F59E0B",
                        backgroundColor: "#FEF3C7",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "500",
                      }}
                    >
                      📍 Fuori sede
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#22C55E",
                        backgroundColor: "#D1FAE5",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontWeight: "500",
                      }}
                    >
                      ✓ In sede
                    </span>
                  )}
                </div>

                {entry.timeEntry.isRemote && entry.timeEntry.remoteReason && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#687076",
                      marginTop: "8px",
                      marginBottom: 0,
                      fontStyle: "italic",
                    }}
                  >
                    Motivo: {entry.timeEntry.remoteReason}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: getStatusColor(entry.timeEntry.type),
                }}
              />
              <button
                onClick={() => handleDelete(entry.timeEntry.id)}
                disabled={deleting === entry.timeEntry.id}
                style={{
                  backgroundColor: deleting === entry.timeEntry.id ? "#ccc" : "#EF4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: deleting === entry.timeEntry.id ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: deleting === entry.timeEntry.id ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (deleting !== entry.timeEntry.id) {
                    e.currentTarget.style.backgroundColor = "#DC2626";
                  }
                }}
                onMouseLeave={(e) => {
                  if (deleting !== entry.timeEntry.id) {
                    e.currentTarget.style.backgroundColor = "#EF4444";
                  }
                }}
              >
                {deleting === entry.timeEntry.id ? "Eliminazione..." : "🗑️ Elimina"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Riepilogo Ore Giornaliere */}
      {dailySummary.length > 0 && dailySummary.some((s) => s.workMinutes > 0) && (
        <div style={{ marginTop: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#11181C", marginBottom: "16px" }}>
            📊 Riepilogo Ore Giornaliere
          </h3>
          <div style={{ display: "grid", gap: "12px" }}>
            {dailySummary.map((tech, index) => {
              if (tech.workMinutes === 0) return null;
              const hours = Math.floor(tech.workMinutes / 60);
              const minutes = Math.round(tech.workMinutes % 60);
              const breakHours = Math.floor(tech.breakMinutes / 60);
              const breakMinutes = Math.round(tech.breakMinutes % 60);
              const isFullDay = hours >= 8;

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#ffffff",
                    border: `2px solid ${isFullDay ? "#22C55E" : "#EF4444"}`,
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#11181C", margin: 0 }}>
                      {tech.name}
                    </h4>
                    <p style={{ fontSize: "14px", color: "#687076", margin: "4px 0 0 0" }}>
                      Pausa: {breakHours}h {breakMinutes}m
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "28px",
                        fontWeight: "700",
                        color: isFullDay ? "#22C55E" : "#EF4444",
                      }}
                    >
                      {hours}h {minutes}m
                    </div>
                    <p style={{ fontSize: "12px", color: "#687076", margin: "4px 0 0 0" }}>
                      {isFullDay ? "✓ Giornata completa" : "⚠️ Ore insufficienti"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
