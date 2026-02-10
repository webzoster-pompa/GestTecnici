import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Appointment, Customer, Technician } from "@/drizzle/schema";

interface AppointmentWithDetails extends Appointment {
  customer?: Customer;
  technician?: Technician;
}

interface CustomerHistoryProps {
  customerId: number;
  customerName: string;
  onClose: () => void;
}

export function CustomerHistory({ customerId, customerName, onClose }: CustomerHistoryProps) {
  const [period, setPeriod] = useState<"all" | "last_month" | "last_3_months" | "last_year">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exportPDFQuery = trpc.statistics.exportHistoryPDF.useQuery(
    { customerId },
    { enabled: false }
  );

  const { data: appointments, isLoading } = trpc.appointments.getCustomerHistory.useQuery({
    customerId,
    period,
    limit: 100,
  });

  const { data: technicians } = trpc.technicians.list.useQuery();

  const [appointmentsWithDetails, setAppointmentsWithDetails] = useState<AppointmentWithDetails[]>([]);

  useEffect(() => {
    if (appointments && technicians) {
      const combined = appointments.map((apt) => ({
        ...apt,
        technician: technicians.find((t) => t.id === apt.technicianId),
      }));
      setAppointmentsWithDetails(combined);
    }
  }, [appointments, technicians]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completato";
      case "in_progress":
        return "In corso";
      case "cancelled":
        return "Cancellato";
      default:
        return "In attesa";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#00CC66";
      case "in_progress":
        return "#0066CC";
      case "cancelled":
        return "#CC0000";
      default:
        return "#666666";
    }
  };

  const getPeriodLabel = (p: string) => {
    switch (p) {
      case "last_month":
        return "Ultimo mese";
      case "last_3_months":
        return "Ultimi 3 mesi";
      case "last_year":
        return "Ultimo anno";
      default:
        return "Tutti";
    }
  };

  const completedCount = appointmentsWithDetails.filter((a) => a.status === "completed").length;
  const lastAppointment = appointmentsWithDetails[0];

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
          maxWidth: "800px",
          width: "90%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
            Storico Interventi
          </h2>
          <p style={{ fontSize: "16px", color: "#666" }}>{customerName}</p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Totale Interventi</p>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#0066CC" }}>
              {appointmentsWithDetails.length}
            </p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Completati</p>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#00CC66" }}>{completedCount}</p>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Ultimo Intervento</p>
            <p style={{ fontSize: "14px", fontWeight: "600" }}>
              {lastAppointment
                ? new Date(lastAppointment.scheduledDate).toLocaleDateString("it-IT")
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Period Filter */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {(["all", "last_month", "last_3_months", "last_year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                backgroundColor: period === p ? "#0066CC" : "#fff",
                color: period === p ? "#fff" : "#666",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: period === p ? "600" : "normal",
              }}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#666" }}>
              Caricamento storico...
            </div>
          ) : appointmentsWithDetails.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "#666" }}>
              Nessun intervento trovato per questo periodo
            </div>
          ) : (
            appointmentsWithDetails.map((apt) => {
              const isExpanded = expandedId === apt.id;
              const aptDate = new Date(apt.scheduledDate);

              return (
                <div
                  key={apt.id}
                  style={{
                    marginBottom: "12px",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : apt.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                          {aptDate.toLocaleDateString("it-IT", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            backgroundColor: getStatusColor(apt.status) + "20",
                            color: getStatusColor(apt.status),
                          }}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        <span style={{ fontWeight: "600" }}>Tecnico:</span>{" "}
                        {apt.technician
                          ? `${apt.technician.firstName} ${apt.technician.lastName}`
                          : "N/A"}
                      </div>
                      {apt.serviceType && (
                        <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                          <span style={{ fontWeight: "600" }}>Servizio:</span> {apt.serviceType}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", textAlign: "right" }}>
                      <div style={{ fontWeight: "600" }}>{apt.duration} min</div>
                      <div style={{ fontSize: "12px", marginTop: "4px" }}>
                        {aptDate.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && apt.notes && (
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid #E5E7EB",
                      }}
                    >
                      <p style={{ fontSize: "12px", fontWeight: "600", color: "#666", marginBottom: "8px" }}>
                        Note:
                      </p>
                      <p style={{ fontSize: "14px", color: "#333", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                        {apt.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            onClick={async () => {
              setIsExporting(true);
              try {
                const result = await exportPDFQuery.refetch();
                if (result.data?.html) {
                  const blob = new Blob([result.data.html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Storico_${customerName.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.html`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              } catch (error) {
                console.error("Export error:", error);
                alert("Errore durante l'export PDF");
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#0066CC",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: isExporting ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            {isExporting ? "Generazione..." : "📄 Esporta PDF"}
          </button>
          
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
        </div>
      </div>
    </div>
  );
}
