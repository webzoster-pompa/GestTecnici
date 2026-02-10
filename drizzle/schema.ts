import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  datetime,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// WhatsApp Templates table - Template messaggi WhatsApp
export const whatsappTemplates = mysqlTable("whatsapp_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  message: text("message").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Customers table - Anagrafica clienti
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postalCode", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  notes: text("notes"),
  province: varchar("province", { length: 2 }), // Provincia (es: VI, VE, PD)
  zone: varchar("zone", { length: 100 }), // Zona geografica
  taxCode: varchar("taxCode", { length: 16 }), // Codice fiscale
  vatNumber: varchar("vatNumber", { length: 11 }), // Partita IVA
  iban: varchar("iban", { length: 27 }), // IBAN
  pec: varchar("pec", { length: 320 }), // PEC
  sdiCode: varchar("sdiCode", { length: 7 }), // Codice SDI
  referent: varchar("referent", { length: 200 }), // Referente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Technicians table - Tecnici
export const technicians = mysqlTable("technicians", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Link to users table for authentication
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  pushToken: varchar("pushToken", { length: 255 }), // Expo push notification token
  isActive: boolean("isActive").default(true).notNull(),
  skills: text("skills"), // JSON array of skills
  vehiclePlate: varchar("vehiclePlate", { length: 50 }), // Targa furgone
  vehicleModel: varchar("vehicleModel", { length: 100 }), // Modello furgone
  notes: text("notes"), // Note e zone preferite
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Appointments table - Appuntamenti
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  technicianId: int("technicianId").notNull(),
  scheduledDate: datetime("scheduledDate").notNull(),
  duration: int("duration").default(60).notNull(), // Duration in minutes
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled").notNull(),
  serviceType: varchar("serviceType", { length: 100 }),
  notes: text("notes"),
  signatureUrl: varchar("signatureUrl", { length: 500 }), // URL firma cliente
  signedAt: timestamp("signedAt"), // Timestamp firma
  sendWhatsAppReminder: boolean("sendWhatsAppReminder").default(false).notNull(),
  whatsappTemplateId: int("whatsappTemplateId"),
  whatsappReminderSent: boolean("whatsappReminderSent").default(false).notNull(),
  whatsappReminderSentAt: timestamp("whatsappReminderSentAt"),
  confirmed: boolean("confirmed").default(false).notNull(), // Appuntamento confermato
  completedAt: timestamp("completedAt"),
  // Check-in/Check-out fields for mobile app
  checkInTime: timestamp("checkInTime"),
  checkInLatitude: decimal("checkInLatitude", { precision: 10, scale: 8 }),
  checkInLongitude: decimal("checkInLongitude", { precision: 11, scale: 8 }),
  checkOutTime: timestamp("checkOutTime"),
  checkOutLatitude: decimal("checkOutLatitude", { precision: 10, scale: 8 }),
  checkOutLongitude: decimal("checkOutLongitude", { precision: 11, scale: 8 }),
  actualDuration: int("actualDuration"), // Durata effettiva in minuti
  // Work details filled by technician after completion
  workDescription: text("workDescription"), // Descrizione lavoro svolto
  laborPrice: decimal("laborPrice", { precision: 10, scale: 2 }), // Prezzo manodopera
  partsPrice: decimal("partsPrice", { precision: 10, scale: 2 }), // Prezzo materiali/pezzi
  partsCode: varchar("partsCode", { length: 200 }), // Codice pezzo utilizzato
  // Payment and invoicing fields
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "pos", "transfer", "unpaid"]),
  paymentAmount: decimal("paymentAmount", { precision: 10, scale: 2 }),
  ivaRate: int("ivaRate"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  invoiceStatus: mysqlEnum("invoiceStatus", ["pending", "invoiced", "issued", "sent"]).default("pending"),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }),
  invoicedAt: timestamp("invoicedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Notifications table - Log notifiche inviate
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  appointmentId: int("appointmentId").notNull(),
  type: mysqlEnum("type", ["email", "whatsapp", "push"]).notNull(),
  recipient: varchar("recipient", { length: 320 }).notNull(), // Email or phone number
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Equipments table - Apparecchi/Impianti installati presso clienti
export const equipments = mysqlTable("equipments", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // caldaia, condizionatore, ecc.
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  installationDate: datetime("installationDate"),
  warrantyExpiry: datetime("warrantyExpiry"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Calls table - Log telefonate con clienti
// Calls table - Gestione chiamate in arrivo
export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId"), // Nullable perché cliente potrebbe non esistere ancora
  customerName: varchar("customerName", { length: 200 }), // Nome cliente (se nuovo)
  customerPhone: varchar("customerPhone", { length: 20 }).notNull(),
  customerAddress: text("customerAddress"),
  customerCity: varchar("customerCity", { length: 100 }),
  customerPostalCode: varchar("customerPostalCode", { length: 10 }),
  customerZone: varchar("customerZone", { length: 100 }),
  devices: text("devices"), // Apparecchi
  callType: varchar("callType", { length: 100 }), // Tipo intervento
  description: text("description"), // Descrizione intervento
  notes: text("notes"), // Note aggiuntive
  technicianId: int("technicianId"), // Tecnico assegnato (opzionale)
  status: mysqlEnum("status", ["waiting_parts", "info_only", "completed", "appointment_scheduled"]).notNull().default("info_only"),
  appointmentDate: datetime("appointmentDate"), // Data programmazione appuntamento
  callDate: datetime("callDate").notNull(), // Data chiamata
  userId: int("userId"), // Operatore che ha registrato la chiamata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Contracts table - Contratti manutenzione periodica
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(), // manutenzione ordinaria, straordinaria, ecc.
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  renewalDate: datetime("renewalDate"), // Data rinnovo automatico
  status: mysqlEnum("status", ["active", "expiring", "expired", "cancelled"]).default("active").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }), // Importo contratto
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Maintenance Books table - Libretti impianto caldaie/condizionatori
export const maintenanceBooks = mysqlTable("maintenance_books", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  equipmentId: int("equipmentId"), // Collegamento opzionale all'apparecchio
  bookNumber: varchar("bookNumber", { length: 100 }).notNull(),
  issueDate: datetime("issueDate").notNull(), // Data emissione libretto
  lastCheckDate: datetime("lastCheckDate"), // Data ultimo controllo
  nextCheckDate: datetime("nextCheckDate").notNull(), // Data prossimo controllo obbligatorio
  status: mysqlEnum("status", ["ok", "expiring", "expired"]).default("ok").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Quotes table - Preventivi
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  quoteNumber: varchar("quoteNumber", { length: 50 }).notNull().unique(),
  date: datetime("date").notNull(),
  validUntil: datetime("validUntil").notNull(), // Data scadenza preventivo
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(), // Totale imponibile
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("22.00").notNull(), // Aliquota IVA %
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull(), // Importo IVA
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(), // Totale con IVA
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Quote Items table - Righe preventivo
export const quoteItems = mysqlTable("quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Documents table - Documenti allegati (foto, certificati, contratti)
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  appointmentId: int("appointmentId"), // Collegamento opzionale all'intervento
  type: mysqlEnum("type", ["photo", "certificate", "contract", "other"]).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(), // URL file storage
  fileSize: int("fileSize"), // Dimensione in bytes
  mimeType: varchar("mimeType", { length: 100 }), // es. image/jpeg, application/pdf
  notes: text("notes"),
  uploadDate: timestamp("uploadDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Export types for TypeScript
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Technician = typeof technicians.$inferSelect;
export type InsertTechnician = typeof technicians.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type WhatsAppTemplate = typeof whatsappTemplates.$inferSelect;
export type InsertWhatsAppTemplate = typeof whatsappTemplates.$inferInsert;
export type Equipment = typeof equipments.$inferSelect;
export type InsertEquipment = typeof equipments.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;
export type MaintenanceBook = typeof maintenanceBooks.$inferSelect;
export type InsertMaintenanceBook = typeof maintenanceBooks.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// Time Entries table - Timbrature giornaliere
export const timeEntries = mysqlTable("time_entries", {
  id: int("id").autoincrement().primaryKey(),
  technicianId: int("technicianId").notNull(),
  date: datetime("date").notNull(), // Data della timbratura
  type: mysqlEnum("type", ["start_day", "start_break", "end_break", "end_day"]).notNull(),
  timestamp: datetime("timestamp").notNull(), // Orario esatto della timbratura
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isRemote: boolean("isRemote").default(false).notNull(), // Timbratura fuori sede
  remoteReason: text("remoteReason"), // Motivo timbratura fuori sede (obbligatorio se isRemote=true)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

// Payments table - Pagamenti clienti
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  appointmentId: int("appointmentId"), // Optional: collegamento a un appuntamento specifico
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "bank_transfer", "other"]).notNull(),
  paymentDate: datetime("paymentDate").notNull(),
  notes: text("notes"),
  technicianId: int("technicianId"), // Tecnico che ha registrato il pagamento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// Absences table - Assenze tecnici (ferie, malattia, permessi)
export const absences = mysqlTable("absences", {
  id: int("id").autoincrement().primaryKey(),
  technicianId: int("technicianId").notNull(),
  date: datetime("date").notNull(), // Data assenza
  reason: mysqlEnum("reason", ["ferie", "malattia", "permesso"]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;

// Intervention Types table - Tipi intervento personalizzabili
export const interventionTypes = mysqlTable("intervention_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InterventionType = typeof interventionTypes.$inferSelect;
export type InsertInterventionType = typeof interventionTypes.$inferInsert;
