/**
 * Export PDF Storico Interventi Cliente
 * Genera PDF con logo, lista interventi e firme digitali
 */

import * as db from "./db";

export async function generateCustomerHistoryPDF(customerId: number): Promise<string> {
  const customer = await db.getCustomerById(customerId);
  if (!customer) {
    throw new Error("Cliente non trovato");
  }

  const appointments = await db.getAppointmentsByCustomer(customerId);
  
  // Filter only completed appointments
  const completedAppointments = appointments.filter(
    (app: any) => app.status === "completed"
  );

  // Sort by date descending
  completedAppointments.sort((a: any, b: any) => 
    new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );

  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Storico Interventi - ${customer.firstName} ${customer.lastName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: #fff;
    }
    .header {
      border-bottom: 3px solid #0066CC;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #0066CC;
      margin-bottom: 10px;
    }
    .customer-info {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .customer-info h2 {
      color: #333;
      margin-bottom: 15px;
    }
    .customer-info p {
      color: #666;
      margin: 5px 0;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      flex: 1;
      background: #0066CC;
      color: #fff;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card .number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .stat-card .label {
      font-size: 14px;
      opacity: 0.9;
    }
    .intervention {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .intervention-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    .intervention-date {
      font-size: 18px;
      font-weight: bold;
      color: #0066CC;
    }
    .intervention-status {
      background: #22C55E;
      color: #fff;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .intervention-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    .detail-item {
      color: #666;
      font-size: 14px;
    }
    .detail-label {
      font-weight: 600;
      color: #333;
      margin-right: 5px;
    }
    .intervention-notes {
      background: #FFF9E6;
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
      font-size: 14px;
      color: #666;
    }
    .signature-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    .signature-img {
      max-width: 300px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      background: #fff;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .intervention { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🔧 Gestione Tecnici</div>
    <p style="color: #666;">Storico Interventi Cliente</p>
  </div>

  <div class="customer-info">
    <h2>${customer.firstName} ${customer.lastName}</h2>
    <p><strong>Indirizzo:</strong> ${customer.address}, ${customer.city} ${customer.postalCode || ""}</p>
    <p><strong>Telefono:</strong> ${customer.phone}</p>
    ${customer.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ""}
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="number">${completedAppointments.length}</div>
      <div class="label">Interventi Totali</div>
    </div>
    <div class="stat-card">
      <div class="number">${completedAppointments.reduce((sum: number, app: any) => sum + (app.duration || 0), 0)} min</div>
      <div class="label">Durata Totale</div>
    </div>
    <div class="stat-card">
      <div class="number">${completedAppointments.filter((app: any) => app.signatureUrl).length}</div>
      <div class="label">Con Firma</div>
    </div>
  </div>

  <h3 style="margin-bottom: 20px; color: #333;">Lista Interventi</h3>

  ${completedAppointments.map((app: any) => `
    <div class="intervention">
      <div class="intervention-header">
        <div class="intervention-date">
          ${new Date(app.scheduledDate).toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <div class="intervention-status">Completato</div>
      </div>

      <div class="intervention-details">
        <div class="detail-item">
          <span class="detail-label">Orario:</span>
          ${new Date(app.scheduledDate).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div class="detail-item">
          <span class="detail-label">Durata:</span>
          ${app.duration} minuti
        </div>
        <div class="detail-item">
          <span class="detail-label">Tecnico:</span>
          ${app.technicianName || "N/D"}
        </div>
        <div class="detail-item">
          <span class="detail-label">Tipo Servizio:</span>
          ${app.serviceType || "Manutenzione"}
        </div>
      </div>

      ${app.notes ? `
        <div class="intervention-notes">
          <strong>📝 Note:</strong> ${app.notes}
        </div>
      ` : ""}

      ${app.signatureUrl ? `
        <div class="signature-section">
          <p style="font-weight: 600; color: #333; margin-bottom: 10px;">✍️ Firma Cliente:</p>
          <img src="${app.signatureUrl}" alt="Firma" class="signature-img" />
          <p style="font-size: 12px; color: #999; margin-top: 5px;">
            Firmato il ${app.signedAt ? new Date(app.signedAt).toLocaleString("it-IT") : "N/D"}
          </p>
        </div>
      ` : ""}
    </div>
  `).join("")}

  ${completedAppointments.length === 0 ? `
    <div style="text-align: center; padding: 40px; color: #999;">
      <p>Nessun intervento completato trovato per questo cliente.</p>
    </div>
  ` : ""}

  <div class="footer">
    <p>Documento generato il ${new Date().toLocaleString("it-IT")}</p>
    <p>Gestione Tecnici - Sistema di Gestione Appuntamenti</p>
  </div>
</body>
</html>
  `;

  return html;
}
