/**
 * Genera report PDF giornaliero timbrature
 */

interface TimeEntry {
  id: number;
  technicianId: number;
  date: Date;
  type: "start_day" | "start_break" | "end_break" | "end_day";
  timestamp: Date;
  latitude: string | null;
  longitude: string | null;
  isRemote: boolean;
  remoteReason: string | null;
}

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
}

export function generateTimesheetHTML(
  technician: Technician,
  date: Date,
  entries: TimeEntry[],
  report: {
    totalMinutes: number;
    workedMinutes: number;
    breakMinutes: number;
    totalHours: string;
  }
): string {
  const dateStr = date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "start_day":
        return "Inizio giornata";
      case "start_break":
        return "Inizio pausa";
      case "end_break":
        return "Fine pausa";
      case "end_day":
        return "Fine giornata";
      default:
        return type;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Timbrature - ${technician.firstName} ${technician.lastName} - ${dateStr}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header {
      border-bottom: 3px solid #0a7ea4;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #11181C;
      font-size: 28px;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      color: #687076;
      font-size: 16px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .info-box {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #0a7ea4;
    }
    
    .info-box .label {
      color: #687076;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-box .value {
      color: #11181C;
      font-size: 20px;
      font-weight: 600;
    }
    
    .summary {
      background: #E6F4FE;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .summary h2 {
      color: #11181C;
      font-size: 20px;
      margin-bottom: 16px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-item .label {
      color: #687076;
      font-size: 13px;
      margin-bottom: 4px;
    }
    
    .summary-item .value {
      color: #0a7ea4;
      font-size: 24px;
      font-weight: 700;
    }
    
    .entries {
      margin-bottom: 30px;
    }
    
    .entries h2 {
      color: #11181C;
      font-size: 20px;
      margin-bottom: 16px;
    }
    
    .entry {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .entry-left {
      flex: 1;
    }
    
    .entry-type {
      color: #11181C;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .entry-time {
      color: #687076;
      font-size: 14px;
    }
    
    .entry-location {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .entry-location.in-sede {
      background: #D1FAE5;
      color: #22C55E;
    }
    
    .entry-location.fuori-sede {
      background: #FEF3C7;
      color: #F59E0B;
    }
    
    .entry-reason {
      color: #687076;
      font-size: 13px;
      margin-top: 8px;
      font-style: italic;
    }
    
    .entry-badge {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .badge-start {
      background: #22C55E;
    }
    
    .badge-break {
      background: #F59E0B;
    }
    
    .badge-end {
      background: #0a7ea4;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #687076;
      font-size: 12px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Report Timbrature Giornaliero</h1>
      <div class="subtitle">${dateStr}</div>
    </div>
    
    <!-- Info Grid -->
    <div class="info-grid">
      <div class="info-box">
        <div class="label">Tecnico</div>
        <div class="value">${technician.firstName} ${technician.lastName}</div>
      </div>
      <div class="info-box">
        <div class="label">Data</div>
        <div class="value">${date.toLocaleDateString("it-IT")}</div>
      </div>
    </div>
    
    <!-- Summary -->
    <div class="summary">
      <h2>Riepilogo Ore</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="label">Ore Totali</div>
          <div class="value">${report.totalHours}h</div>
        </div>
        <div class="summary-item">
          <div class="label">Ore Lavorate</div>
          <div class="value">${formatMinutes(report.workedMinutes)}</div>
        </div>
        <div class="summary-item">
          <div class="label">Pause</div>
          <div class="value">${formatMinutes(report.breakMinutes)}</div>
        </div>
      </div>
    </div>
    
    <!-- Entries -->
    <div class="entries">
      <h2>Dettaglio Timbrature</h2>
      ${entries.length === 0
        ? '<p style="text-align: center; color: #687076; padding: 40px;">Nessuna timbratura registrata</p>'
        : entries
            .map(
              (entry) => `
        <div class="entry">
          <div class="entry-left">
            <div class="entry-type">${getTypeLabel(entry.type)}</div>
            <div class="entry-time">🕐 ${formatTime(entry.timestamp)}</div>
            <div class="entry-location ${entry.isRemote ? "fuori-sede" : "in-sede"}">
              ${entry.isRemote ? "📍 Fuori sede" : "✓ In sede"}
            </div>
            ${entry.isRemote && entry.remoteReason ? `<div class="entry-reason">Motivo: ${entry.remoteReason}</div>` : ""}
          </div>
          <div class="entry-badge ${
            entry.type === "start_day" || entry.type === "end_break"
              ? "badge-start"
              : entry.type === "start_break"
                ? "badge-break"
                : "badge-end"
          }"></div>
        </div>
      `
            )
            .join("")}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      Report generato il ${new Date().toLocaleString("it-IT")}
    </div>
  </div>
</body>
</html>
  `.trim();
}
