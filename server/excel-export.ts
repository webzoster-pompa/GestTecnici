/**
 * Export Excel Massivo
 * Esporta tutti i dati clienti e interventi in un unico file Excel
 */

import * as XLSX from "xlsx";
import * as db from "./db";

export async function generateFullDataExport(): Promise<Buffer> {
  // Fetch all data
  const customers = await db.getAllCustomers();
  const appointments = await db.getAllAppointments();
  const technicians = await db.getAllTechnicians();

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Clienti
  const customersData = customers.map((c) => ({
    ID: c.id,
    Nome: c.firstName,
    Cognome: c.lastName,
    Telefono: c.phone,
    Email: c.email || "",
    Indirizzo: c.address,
    Città: c.city,
    CAP: c.postalCode || "",
    Latitudine: c.latitude || "",
    Longitudine: c.longitude || "",
    Note: c.notes || "",
    "Data Creazione": c.createdAt ? new Date(c.createdAt).toLocaleString("it-IT") : "",
  }));

  const customersSheet = XLSX.utils.json_to_sheet(customersData);
  XLSX.utils.book_append_sheet(workbook, customersSheet, "Clienti");

  // Sheet 2: Interventi
  const appointmentsData = await Promise.all(
    appointments.map(async (a) => {
      const customer = customers.find((c) => c.id === a.customerId);
      const technician = technicians.find((t) => t.id === a.technicianId);

      return {
        ID: a.id,
        "Data Appuntamento": new Date(a.scheduledDate).toLocaleString("it-IT"),
        Cliente: customer ? `${customer.firstName} ${customer.lastName}` : "N/A",
        "Telefono Cliente": customer?.phone || "",
        "Indirizzo Cliente": customer?.address || "",
        Tecnico: technician ? `${technician.firstName} ${technician.lastName}` : "N/A",
        "Telefono Tecnico": technician?.phone || "",
        Durata: a.duration,
        Stato: getStatusLabel(a.status),
        "Tipo Servizio": a.serviceType || "",
        Note: a.notes || "",
        "Firma Cliente": a.signatureUrl ? "Sì" : "No",
        "Data Firma": a.signedAt ? new Date(a.signedAt).toLocaleString("it-IT") : "",
        "Data Completamento": a.completedAt ? new Date(a.completedAt).toLocaleString("it-IT") : "",
        "Data Creazione": new Date(a.createdAt).toLocaleString("it-IT"),
      };
    })
  );

  const appointmentsSheet = XLSX.utils.json_to_sheet(appointmentsData);
  XLSX.utils.book_append_sheet(workbook, appointmentsSheet, "Interventi");

  // Sheet 3: Tecnici
  const techniciansData = technicians.map((t) => ({
    ID: t.id,
    Nome: t.firstName,
    Cognome: t.lastName,
    Telefono: t.phone,
    Email: t.email || "",
    "Targa Furgone": t.vehiclePlate || "",
    "Modello Furgone": t.vehicleModel || "",
    Attivo: t.isActive ? "Sì" : "No",
    Competenze: t.skills || "",
    Note: t.notes || "",
    "Data Creazione": new Date(t.createdAt).toLocaleString("it-IT"),
  }));

  const techniciansSheet = XLSX.utils.json_to_sheet(techniciansData);
  XLSX.utils.book_append_sheet(workbook, techniciansSheet, "Tecnici");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completato";
    case "in_progress":
      return "In corso";
    case "cancelled":
      return "Cancellato";
    case "scheduled":
      return "Programmato";
    default:
      return status;
  }
}
