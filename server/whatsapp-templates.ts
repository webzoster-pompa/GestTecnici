/**
 * Gestione Template Messaggi WhatsApp
 */

import { getDb } from "./db";
import { whatsappTemplates, type WhatsAppTemplate, type InsertWhatsAppTemplate } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Crea template WhatsApp predefiniti al primo avvio
 */
export async function seedWhatsAppTemplates() {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(whatsappTemplates).limit(1);
  
  if (existing.length > 0) {
    console.log("[WhatsApp Templates] Already seeded");
    return;
  }

  const defaultTemplates: InsertWhatsAppTemplate[] = [
    {
      name: "Promemoria Standard",
      message: "Gentile {{cliente}}, le ricordiamo il suo appuntamento per il giorno {{data}} alle ore {{ora}} con il tecnico {{tecnico}}. Per qualsiasi necessità ci contatti al numero dell'ufficio. Grazie!",
      isActive: true,
    },
    {
      name: "Promemoria Cordiale",
      message: "Buongiorno {{cliente}}! 👋 Questo è un promemoria per il suo appuntamento di {{data}} alle {{ora}}. Il nostro tecnico {{tecnico}} sarà da lei puntuale. A presto!",
      isActive: true,
    },
    {
      name: "Promemoria con Conferma",
      message: "Salve {{cliente}}, confermiamo il suo appuntamento per {{data}} ore {{ora}}. Tecnico: {{tecnico}}. Se ha necessità di modificare l'orario ci contatti. Cordiali saluti.",
      isActive: true,
    },
    {
      name: "Promemoria Informale",
      message: "Ciao {{cliente}}! 😊 Ti ricordiamo che {{data}} alle {{ora}} verrà {{tecnico}} per l'intervento. Se hai domande scrivici pure!",
      isActive: true,
    },
    {
      name: "Promemoria Professionale",
      message: "Egregio {{cliente}}, con la presente le confermiamo l'appuntamento fissato per il giorno {{data}} alle ore {{ora}}. Il tecnico incaricato {{tecnico}} provvederà all'intervento concordato. Distinti saluti.",
      isActive: true,
    },
  ];

  for (const template of defaultTemplates) {
    await db.insert(whatsappTemplates).values(template);
  }

  console.log("[WhatsApp Templates] Seeded 5 default templates");
}

/**
 * Ottieni tutti i template attivi
 */
export async function getActiveTemplates(): Promise<WhatsAppTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.isActive, true));
}

/**
 * Ottieni template per ID
 */
export async function getTemplateById(id: number): Promise<WhatsAppTemplate | null> {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.id, id)).limit(1);
  return results[0] || null;
}

/**
 * Crea nuovo template
 */
export async function createTemplate(data: InsertWhatsAppTemplate): Promise<WhatsAppTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(whatsappTemplates).values(data);
  const newTemplate = await getTemplateById(Number(result.insertId));
  
  if (!newTemplate) {
    throw new Error("Failed to create template");
  }
  
  return newTemplate;
}

/**
 * Aggiorna template esistente
 */
export async function updateTemplate(id: number, data: Partial<InsertWhatsAppTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(whatsappTemplates).set(data).where(eq(whatsappTemplates.id, id));
}

/**
 * Elimina template
 */
export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
}

/**
 * Sostituisci variabili nel messaggio
 */
export function replaceTemplateVariables(
  message: string,
  variables: {
    cliente: string;
    data: string;
    ora: string;
    tecnico: string;
  }
): string {
  return message
    .replace(/\{\{cliente\}\}/g, variables.cliente)
    .replace(/\{\{data\}\}/g, variables.data)
    .replace(/\{\{ora\}\}/g, variables.ora)
    .replace(/\{\{tecnico\}\}/g, variables.tecnico);
}

/**
 * Invia promemoria WhatsApp
 */
export async function sendWhatsAppReminder(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrare WhatsApp Business API
    // Per ora solo log
    console.log(`[WhatsApp] Sending reminder to ${phone}:`);
    console.log(message);
    
    // Simula invio
    return { success: true };
  } catch (error) {
    console.error("[WhatsApp] Send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
