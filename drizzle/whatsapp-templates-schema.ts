/**
 * Schema Database per Template Messaggi WhatsApp
 */

import { mysqlTable, int, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core";

export const whatsappTemplates = mysqlTable("whatsapp_templates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  message: text("message").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Aggiunta colonna agli appuntamenti
export const appointmentsExtension = {
  sendWhatsAppReminder: boolean("send_whatsapp_reminder").default(false),
  whatsappTemplateId: int("whatsapp_template_id"),
  whatsappReminderSent: boolean("whatsapp_reminder_sent").default(false),
  whatsappReminderSentAt: timestamp("whatsapp_reminder_sent_at"),
};
