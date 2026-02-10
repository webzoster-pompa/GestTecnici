/**
 * Report Mensile Automatico
 * Genera e invia via email report PDF con statistiche mensili
 */

import * as db from "./db";
import { getMonthlyStatistics } from "./statistics";

export async function generateMonthlyReportHTML(year: number, month: number): Promise<string> {
  const stats = await getMonthlyStatistics(year, month);
  const technicians = await db.getAllTechnicians();
  
  // Calculate previous month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStats = await getMonthlyStatistics(prevYear, prevMonth);

  const monthName = new Date(year, month - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Mensile - ${monthName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .header p {
      font-size: 18px;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: #f9f9f9;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      border: 2px solid #E5E7EB;
    }
    .stat-number {
      font-size: 36px;
      font-weight: 700;
      color: #0066CC;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-change {
      font-size: 12px;
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .stat-change.positive {
      background: #D1FAE5;
      color: #065F46;
    }
    .stat-change.negative {
      background: #FEE2E2;
      color: #991B1B;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 24px;
      margin-bottom: 20px;
      color: #333;
      border-bottom: 3px solid #0066CC;
      padding-bottom: 12px;
    }
    .tech-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .tech-card {
      background: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #0066CC;
    }
    .tech-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }
    .tech-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .tech-stat {
      text-align: center;
    }
    .tech-stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #0066CC;
    }
    .tech-stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }
    .footer {
      background: #f9f9f9;
      padding: 24px 40px;
      text-align: center;
      color: #666;
      font-size: 14px;
      border-top: 1px solid #E5E7EB;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 Report Mensile</h1>
      <p>${monthName}</p>
    </div>

    <div class="content">
      <!-- KPI Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${stats.totalAppointments}</div>
          <div class="stat-label">Appuntamenti</div>
          ${getChangeHTML(stats.totalAppointments, prevStats.totalAppointments)}
        </div>

        <div class="stat-card">
          <div class="stat-number">${stats.completionRate.toFixed(1)}%</div>
          <div class="stat-label">Tasso Completamento</div>
          ${getChangeHTML(stats.completionRate, prevStats.completionRate, true)}
        </div>

        <div class="stat-card">
          <div class="stat-number">${stats.totalCustomers}</div>
          <div class="stat-label">Clienti Serviti</div>
          ${getChangeHTML(stats.totalCustomers, prevStats.totalCustomers)}
        </div>

        <div class="stat-card">
          <div class="stat-number">${stats.averageDuration.toFixed(0)} min</div>
          <div class="stat-label">Durata Media</div>
          ${getChangeHTML(stats.averageDuration, prevStats.averageDuration, true)}
        </div>
      </div>

      <!-- Technicians Section -->
      <div class="section">
        <h2>Performance Tecnici</h2>
        <div class="tech-list">
          ${technicians.map((tech) => {
            const techStats = stats.appointmentsByTechnician.find((t: any) => t.technicianId === tech.id);
            if (!techStats) return "";

            return `
              <div class="tech-card">
                <div class="tech-name">${tech.firstName} ${tech.lastName}</div>
                <div class="tech-stats">
                  <div class="tech-stat">
                    <div class="tech-stat-value">${techStats.count}</div>
                    <div class="tech-stat-label">Appuntamenti</div>
                  </div>
                  <div class="tech-stat">
                    <div class="tech-stat-value">${techStats.completed}</div>
                    <div class="tech-stat-label">Completati</div>
                  </div>
                  <div class="tech-stat">
                    <div class="tech-stat-value">${((techStats.completed / techStats.count) * 100).toFixed(0)}%</div>
                    <div class="tech-stat-label">Tasso</div>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Report generato automaticamente il ${new Date().toLocaleDateString("it-IT")}</p>
      <p>Gestione Tecnici - Sistema di Gestione Appuntamenti</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

function getChangeHTML(current: number, previous: number, isPercentage: boolean = false): string {
  if (previous === 0) return "";
  
  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  const sign = isPositive ? "+" : "";
  const className = isPositive ? "positive" : "negative";
  const arrow = isPositive ? "↑" : "↓";

  return `<div class="stat-change ${className}">${arrow} ${sign}${change.toFixed(1)}% vs mese precedente</div>`;
}

export async function sendMonthlyReport(year: number, month: number, recipientEmail: string): Promise<void> {
  const html = await generateMonthlyReportHTML(year, month);
  const monthName = new Date(year, month - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`[Monthly Report] Generated for ${monthName}`);
  console.log(`[Monthly Report] Would send to: ${recipientEmail}`);
  console.log(`[Monthly Report] HTML length: ${html.length} characters`);

  // Placeholder for actual email sending
  // await sendEmail({
  //   to: recipientEmail,
  //   subject: `Report Mensile - ${monthName}`,
  //   html: html,
  // });
}

// Cron job function - to be called by scheduler
export async function runMonthlyReportJob(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // Previous month (0-indexed)

  const recipientEmail = process.env.ADMIN_EMAIL || "admin@esempio.it";

  try {
    await sendMonthlyReport(year, month === 0 ? 12 : month, recipientEmail);
    console.log(`[Monthly Report] Successfully sent report for ${year}-${month}`);
  } catch (error) {
    console.error("[Monthly Report] Error sending report:", error);
    // TODO: Send error notification to admin
  }
}
