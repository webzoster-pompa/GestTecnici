/**
 * PDF Export Module
 * Genera PDF planning giornaliero per tecnici con lista appuntamenti
 */

interface AppointmentForPDF {
  id: number;
  scheduledDate: Date;
  duration: number;
  status: string;
  serviceType: string | null;
  notes: string | null;
  customer: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    phone: string;
    notes: string | null;
  };
}

export function generateDailyPlanningPDF(
  technicianName: string,
  date: Date,
  appointments: AppointmentForPDF[]
): string {
  const dateStr = date.toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Header
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Planning ${technicianName} - ${dateStr}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 10mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 15mm 10mm;
      color: #333;
      max-width: 210mm;
      min-height: 297mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0066CC;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .header h1 {
      color: #0066CC;
      margin: 0 0 5px 0;
      font-size: 22px;
    }
    .header .date {
      font-size: 14px;
      color: #666;
    }
    .summary {
      background-color: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 12px;
    }
    .summary-item {
      display: inline-block;
      margin-right: 20px;
      font-weight: bold;
    }
    .appointment {
      border: 1px solid #E5E7EB;
      border-left: 3px solid #0066CC;
      padding: 8px 10px;
      margin-bottom: 8px;
      border-radius: 3px;
      page-break-inside: avoid;
    }
    .appointment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .time {
      font-size: 15px;
      font-weight: bold;
      color: #0066CC;
    }
    .duration {
      font-size: 12px;
      color: #666;
    }
    .customer-name {
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .address {
      font-size: 11px;
      color: #666;
      margin-bottom: 3px;
    }
    .phone {
      font-size: 11px;
      color: #0066CC;
      font-weight: bold;
    }
    .service-type {
      background-color: #E6F4FE;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      display: inline-block;
      margin-top: 3px;
    }
    .notes {
      background-color: #FFF9E6;
      padding: 6px 8px;
      border-radius: 3px;
      margin-top: 5px;
      font-size: 10px;
      line-height: 1.3;
    }
    .appointments-container {
      display: flex;
      flex-direction: column;
      min-height: calc(297mm - 15mm - 15mm - 80px); /* A4 height - top margin - bottom margin - header/summary */
    }
    .appointment.flexible {
      flex: 1;
      min-height: 50px;
      display: flex;
      flex-direction: column;
    }
    .notes-space {
      flex: 1;
      min-height: 30px;
      margin-top: 8px;
      border-top: 1px dashed #ccc;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Planning Giornaliero</h1>
    <div class="date">${dateStr}</div>
    <div style="font-size: 13px; margin-top: 5px;">Tecnico: <strong>${technicianName}</strong></div>
  </div>

  <div class="summary">
    <div class="summary-item">🔧 Appuntamenti: ${appointments.length}</div>
    <div class="summary-item">⏱️ Durata totale: ${appointments.reduce((sum, apt) => sum + apt.duration, 0)} min</div>
  </div>
`;

  // Appointments
  if (appointments.length === 0) {
    html += `
  <div style="text-align: center; padding: 40px; color: #999;">
    <p style="font-size: 18px;">Nessun appuntamento programmato per questa giornata</p>
  </div>
`;
  } else {
    html += `
  <div class="appointments-container">
`;
    appointments.forEach((apt) => {
      // Usa timezone locale (UTC+1 Italia) invece di UTC
      const aptDate = new Date(apt.scheduledDate);
      const time = aptDate.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Rome", // Forza timezone Italia
      });

      html += `
  <div class="appointment flexible">
    <div class="appointment-header">
      <div class="time">${time}</div>
      <div class="duration">${apt.duration} minuti</div>
    </div>
    <div class="customer-name">${apt.customer.firstName} ${apt.customer.lastName}</div>
    <div class="address">📍 ${apt.customer.address}, ${apt.customer.city}</div>
    <div class="phone">📞 ${apt.customer.phone}</div>
    ${apt.serviceType ? `<div class="service-type">${apt.serviceType}</div>` : ""}
    ${apt.notes ? `<div class="notes"><strong>Note appuntamento:</strong> ${apt.notes}</div>` : ""}
    ${apt.customer.notes ? `<div class="notes" style="color: #0066CC; font-weight: 600;"><strong>📝 Note cliente:</strong> ${apt.customer.notes}</div>` : ""}
    <div class="notes-space"></div>
  </div>
`;
    });
    html += `
  </div>
`;
  }

  html += `
</body>
</html>
`;

  return html;
}
