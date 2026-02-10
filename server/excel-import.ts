import * as XLSX from "xlsx";
import { createCustomer } from "./db";
import { geocodeAddress, delay } from "./route-optimizer";

export interface ExcelCustomerRow {
  idCliente?: string | number;
  nominativo?: string;
  indirizzo?: string;
  citta?: string;
  telefono?: string;
  email?: string;
  tipoImpianto?: string;
  ultimoIntervento?: string;
}

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data: ExcelCustomerRow }>;
  skipped: number;
}

/**
 * Parse Excel file buffer e restituisce array di righe
 */
export function parseExcelFile(buffer: Buffer): ExcelCustomerRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Trova la riga di intestazione corretta (quella che contiene "Nominativo" o "Nome")
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  let headerRow = 0;
  
  // Cerca la riga con le intestazioni (max 10 righe)
  for (let row = 0; row <= Math.min(10, range.e.r); row++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 });
    const cell = worksheet[cellAddress];
    
    // Controlla se questa riga contiene intestazioni comuni
    let hasHeaders = false;
    for (let col = 0; col <= range.e.c; col++) {
      const addr = XLSX.utils.encode_cell({ r: row, c: col });
      const c = worksheet[addr];
      if (c && c.v) {
        const value = String(c.v).toLowerCase().trim();
        if (value.includes('nominativo') || value.includes('nome') || value.includes('cliente') || 
            value.includes('indirizzo') || value.includes('telefono')) {
          hasHeaders = true;
          headerRow = row;
          break;
        }
      }
    }
    if (hasHeaders) break;
  }
  
  // Converti in JSON partendo dalla riga di intestazione trovata
  const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
    raw: false,
    defval: "",
    range: headerRow, // Inizia dalla riga di intestazione
  });

  // Mappa colonne Excel ai campi del sistema
  return jsonData.map((row) => {
    // Supporta vari nomi di colonne (case-insensitive)
    const normalizeKey = (obj: any, possibleKeys: string[]): any => {
      const keys = Object.keys(obj);
      for (const possible of possibleKeys) {
        const found = keys.find(
          (k) => k.toLowerCase().trim() === possible.toLowerCase()
        );
        if (found && obj[found]) return obj[found];
      }
      return undefined;
    };

    return {
      idCliente: normalizeKey(row, ["id cliente", "idcliente", "id", "codice cliente"]),
      nominativo: normalizeKey(row, ["nominativo", "nome", "cliente", "ragione sociale"]),
      indirizzo: normalizeKey(row, ["indirizzo", "via", "address"]),
      citta: normalizeKey(row, ["città", "citta", "city", "comune"]),
      telefono: normalizeKey(row, ["telefono", "tel", "phone", "cellulare"]),
      email: normalizeKey(row, ["email", "e-mail", "mail", "posta elettronica"]),
      tipoImpianto: normalizeKey(row, ["tipo impianto", "tipoimpianto", "impianto", "tipo"]),
      ultimoIntervento: normalizeKey(row, [
        "ultimo intervento",
        "ultimointervento",
        "data ultimo intervento",
        "ultima manutenzione",
      ]),
    };
  });
}

/**
 * Valida una riga di dati cliente
 */
function validateCustomerRow(row: ExcelCustomerRow): string | null {
  if (!row.nominativo || row.nominativo.trim() === "") {
    return "Nominativo mancante";
  }
  
  if (!row.telefono || row.telefono.trim() === "") {
    return "Telefono mancante";
  }
  
  if (!row.indirizzo || row.indirizzo.trim() === "") {
    return "Indirizzo mancante";
  }
  
  if (!row.citta || row.citta.trim() === "") {
    return "Città mancante";
  }
  
  return null;
}

/**
 * Estrae nome e cognome dal campo nominativo
 */
function parseNominativo(nominativo: string): { firstName: string; lastName: string } {
  const parts = nominativo.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  
  // Assume formato "Nome Cognome" o "Cognome Nome"
  // In Italia spesso è "Cognome Nome", ma proviamo a gestire entrambi
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  
  return { firstName, lastName };
}

/**
 * Importa clienti da array di righe Excel
 */
export async function importCustomersFromExcel(
  rows: ExcelCustomerRow[],
  options: {
    skipDuplicates?: boolean;
    geocode?: boolean;
  } = {}
): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    errors: [],
    skipped: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 perché Excel parte da 1 e la prima riga è l'header

    try {
      // Valida riga
      const validationError = validateCustomerRow(row);
      if (validationError) {
        result.errors.push({
          row: rowNumber,
          error: validationError,
          data: row,
        });
        continue;
      }

      // Parse nominativo
      const { firstName, lastName } = parseNominativo(row.nominativo!);

      // Geocodifica indirizzo se richiesto
      let latitude: string | undefined;
      let longitude: string | undefined;
      
      if (options.geocode) {
        try {
          const fullAddress = `${row.indirizzo}, ${row.citta}`;
          const coords = await geocodeAddress(fullAddress);
          if (coords) {
            latitude = coords.lat.toString();
            longitude = coords.lon.toString();
          }
          // Rispetta rate limit Nominatim (1 req/sec)
          await delay(1100);
        } catch (error) {
          // Geocoding fallito, continua senza coordinate
          console.warn(`Geocoding fallito per ${row.indirizzo}, ${row.citta}`);
        }
      }

      // Prepara note con info aggiuntive
      const notes: string[] = [];
      if (row.idCliente) {
        notes.push(`ID Cliente: ${row.idCliente}`);
      }
      if (row.tipoImpianto) {
        notes.push(`Tipo Impianto: ${row.tipoImpianto}`);
      }
      if (row.ultimoIntervento) {
        notes.push(`Ultimo Intervento: ${row.ultimoIntervento}`);
      }

      // Crea cliente
      await createCustomer({
        firstName,
        lastName,
        phone: row.telefono!.trim(),
        email: row.email?.trim() || null,
        address: row.indirizzo!.trim(),
        city: row.citta!.trim(),
        postalCode: null,
        latitude,
        longitude,
        notes: notes.length > 0 ? notes.join("\n") : null,
      });

      result.success++;
    } catch (error: any) {
      result.errors.push({
        row: rowNumber,
        error: error.message || "Errore sconosciuto",
        data: row,
      });
    }
  }

  return result;
}

/**
 * Genera template Excel vuoto per l'utente
 */
export function generateExcelTemplate(): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([
    [
      "ID Cliente",
      "Nominativo",
      "Indirizzo",
      "Città",
      "Telefono",
      "Email",
      "Tipo Impianto",
      "Ultimo Intervento",
    ],
    [
      "001",
      "Mario Rossi",
      "Via Roma 10",
      "Milano",
      "+39 333 1234567",
      "mario.rossi@example.com",
      "Caldaia",
      "15/12/2024",
    ],
    [
      "002",
      "Luigi Bianchi",
      "Corso Italia 25",
      "Milano",
      "+39 340 7654321",
      "luigi.bianchi@example.com",
      "Climatizzatore",
      "20/11/2024",
    ],
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clienti");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
