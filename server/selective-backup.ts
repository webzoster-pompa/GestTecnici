/**
 * Backup Selettivo Clienti
 * Export clienti selezionati prima della cancellazione definitiva
 */

import * as XLSX from "xlsx";
import * as db from "./db";
import * as fs from "fs";
import * as path from "path";

export interface SelectiveBackupResult {
  success: boolean;
  filePath: string;
  customersCount: number;
  appointmentsCount: number;
  error?: string;
}

/**
 * Crea backup Excel di clienti selezionati con tutti i loro appuntamenti
 */
export async function createSelectiveBackup(
  customerIds: number[],
  backupPath: string = "/home/ubuntu/backups/selective"
): Promise<SelectiveBackupResult> {
  try {
    // Crea directory backup se non esiste
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Recupera dati clienti
    const customers: any[] = [];
    const allAppointments = [];

    for (const customerId of customerIds) {
      const customer = await db.getCustomerById(customerId);
      if (customer) {
        customers.push(customer);

        // Recupera appuntamenti del cliente
        const appointments = await db.getAppointmentsByCustomer(customerId);
        allAppointments.push(...appointments);
      }
    }

    // Crea workbook Excel
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Clienti
    const customersData = customers.map((c) => ({
      "ID Cliente": c.id,
      "Nome": c.firstName,
      "Cognome": c.lastName,
      "Email": c.email,
      "Telefono": c.phone,
      "Indirizzo": c.address,
      "Città": c.city,
      "CAP": c.postalCode,
      "Tipo Impianto": "",
      "Ultimo Intervento": "",
      "Note": c.notes || "",
      "Data Creazione": new Date(c.createdAt).toLocaleDateString("it-IT"),
    }));

    const customersSheet = XLSX.utils.json_to_sheet(customersData);
    XLSX.utils.book_append_sheet(workbook, customersSheet, "Clienti");

    // Sheet 2: Appuntamenti
    const appointmentsData = await Promise.all(
      allAppointments.map(async (apt) => {
        const customer: any = customers.find((c) => c.id === apt.customerId);
        const technician = await db.getTechnicianById(apt.technicianId);

        return {
          "ID Appuntamento": apt.id,
          "Data": new Date(apt.scheduledDate).toLocaleDateString("it-IT"),
          "Ora": new Date(apt.scheduledDate).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
          "Cliente": customer ? `${customer.firstName} ${customer.lastName}` : "",
          "Telefono Cliente": customer?.phone || "",
          "Indirizzo": customer?.address || "",
          "Tecnico": technician ? `${technician.firstName} ${technician.lastName}` : "",
          "Servizio": apt.serviceType,
          "Durata (min)": apt.duration,
          "Stato": apt.status === "completed" ? "Completato" : apt.status === "cancelled" ? "Cancellato" : "In attesa",
          "Note": apt.notes || "",
          "Firma Cliente": apt.signatureUrl ? "Sì" : "No",
          "Data Firma": apt.signedAt ? new Date(apt.signedAt).toLocaleDateString("it-IT") : "",
        };
      })
    );

    const appointmentsSheet = XLSX.utils.json_to_sheet(appointmentsData);
    XLSX.utils.book_append_sheet(workbook, appointmentsSheet, "Interventi");

    // Genera nome file con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const fileName = `Backup_Selettivo_${timestamp}_${customerIds.length}clienti.xlsx`;
    const filePath = path.join(backupPath, fileName);

    // Salva file
    XLSX.writeFile(workbook, filePath);

    console.log(`[Selective Backup] Created: ${filePath}`);
    console.log(`[Selective Backup] Customers: ${customers.length}, Appointments: ${allAppointments.length}`);

    return {
      success: true,
      filePath,
      customersCount: customers.length,
      appointmentsCount: allAppointments.length,
    };
  } catch (error) {
    console.error("[Selective Backup] Error:", error);
    return {
      success: false,
      filePath: "",
      customersCount: 0,
      appointmentsCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Elimina definitivamente clienti e tutti i loro appuntamenti
 */
export async function deleteCustomersPermanently(customerIds: number[]): Promise<{
  success: boolean;
  deletedCustomers: number;
  deletedAppointments: number;
  error?: string;
}> {
  try {
    let deletedAppointments = 0;

    // Elimina appuntamenti per ogni cliente
    for (const customerId of customerIds) {
      const appointments = await db.getAppointmentsByCustomer(customerId);
      
      for (const apt of appointments) {
        await db.deleteAppointment(apt.id);
        deletedAppointments++;
      }

      // Elimina cliente
      await db.deleteCustomer(customerId);
    }

    console.log(`[Selective Delete] Deleted ${customerIds.length} customers and ${deletedAppointments} appointments`);

    return {
      success: true,
      deletedCustomers: customerIds.length,
      deletedAppointments,
    };
  } catch (error) {
    console.error("[Selective Delete] Error:", error);
    return {
      success: false,
      deletedCustomers: 0,
      deletedAppointments: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Operazione completa: backup + cancellazione
 */
export async function backupAndDeleteCustomers(
  customerIds: number[],
  backupPath?: string
): Promise<{
  backupResult: SelectiveBackupResult;
  deleteResult: {
    success: boolean;
    deletedCustomers: number;
    deletedAppointments: number;
    error?: string;
  };
}> {
  // 1. Crea backup
  const backupResult = await createSelectiveBackup(customerIds, backupPath);

  if (!backupResult.success) {
    throw new Error(`Backup failed: ${backupResult.error}`);
  }

  // 2. Elimina clienti
  const deleteResult = await deleteCustomersPermanently(customerIds);

  return {
    backupResult,
    deleteResult,
  };
}
