/**
 * Export Chiamate Filtrate
 * Esporta le chiamate filtrate in formato Excel
 */

import * as XLSX from "xlsx";
import * as db from "./db";

export interface CallsExportFilters {
  statusFilter?: string;
  searchQuery?: string;
  cityFilter?: string;
  technicianFilter?: number | "all";
  showOpenOnly?: boolean;
}

export async function generateCallsExport(filters: CallsExportFilters = {}): Promise<Buffer> {
  // Fetch all calls
  const allCalls = await db.getAllCalls();
  const technicians = await db.getAllTechnicians();
  
  // Apply filters
  let filteredCalls = allCalls;
  
  // Filter by open only (exclude appointment_scheduled)
  if (filters.showOpenOnly) {
    filteredCalls = filteredCalls.filter((call: any) => call.status !== "appointment_scheduled");
  }
  
  // Filter by status
  if (filters.statusFilter && filters.statusFilter !== "all") {
    filteredCalls = filteredCalls.filter((call: any) => call.status === filters.statusFilter);
  }
  
  // Filter by city
  if (filters.cityFilter) {
    filteredCalls = filteredCalls.filter((call: any) => 
      call.customerCity?.toLowerCase().includes(filters.cityFilter!.toLowerCase())
    );
  }
  
  // Filter by technician
  if (filters.technicianFilter && filters.technicianFilter !== "all") {
    filteredCalls = filteredCalls.filter((call: any) => call.technicianId === filters.technicianFilter);
  }
  
  // Filter by search query (name or phone)
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filteredCalls = filteredCalls.filter((call: any) => {
      const matchesName = call.customerName?.toLowerCase().includes(query);
      const matchesPhone = call.customerPhone?.includes(query);
      return matchesName || matchesPhone;
    });
  }
  
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare data
  const callsData = filteredCalls.map((call: any) => {
    const technician = technicians.find((t) => t.id === call.technicianId);
    
    return {
      ID: call.id,
      "Data Chiamata": new Date(call.callDate).toLocaleString("it-IT"),
      "Nome Cliente": call.customerName || "",
      "Telefono Cliente": call.customerPhone || "",
      "Indirizzo Cliente": call.customerAddress || "",
      "Città Cliente": call.customerCity || "",
      "CAP Cliente": call.customerPostalCode || "",
      "Zona Cliente": call.customerZone || "",
      "Apparecchi": call.devices || "",
      "Tipo Intervento": call.callType || "",
      "Descrizione": call.description || "",
      "Note": call.notes || "",
      "Stato": getStatusLabel(call.status),
      "Tecnico Assegnato": technician ? `${technician.firstName} ${technician.lastName}` : "Non assegnato",
      "Telefono Tecnico": technician?.phone || "",
      "Data Creazione": new Date(call.createdAt).toLocaleString("it-IT"),
    };
  });
  
  const callsSheet = XLSX.utils.json_to_sheet(callsData);
  
  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(callsData[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...callsData.map((row: any) => String(row[key as keyof typeof row] || "").length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  callsSheet["!cols"] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, callsSheet, "Chiamate");
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "waiting_parts":
      return "⏳ In Attesa Pezzi";
    case "info_only":
      return "ℹ️ Solo Info";
    case "completed":
      return "✅ Concluso";
    case "appointment_scheduled":
      return "📅 Fissato Appuntamento";
    default:
      return status;
  }
}
