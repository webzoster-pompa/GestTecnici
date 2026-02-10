import { eq, and, gte, lte, lt, desc, like, or, sql, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  customers,
  technicians,
  appointments,
  notifications,
  equipments,
  calls,
  contracts,
  maintenanceBooks,
  quotes,
  quoteItems,
  documents,
  InsertCustomer,
  InsertTechnician,
  InsertAppointment,
  InsertNotification,
  InsertEquipment,
  InsertCall,
  InsertContract,
  InsertMaintenanceBook,
  InsertQuote,
  InsertQuoteItem,
  InsertDocument,
  timeEntries,
  InsertTimeEntry,
  payments,
  InsertPayment,
  absences,
  InsertAbsence,
  interventionTypes,
  InsertInterventionType,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== CUSTOMERS ====================

export async function getAllCustomers(limit: number = 10000, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(customers).limit(limit).offset(offset).orderBy(desc(customers.createdAt));
}

export async function searchCustomers(query: string) {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${query.toLowerCase()}%`;
  
  // Normalizza numero telefono per ricerca (rimuove spazi, trattini, parentesi, +39)
  const normalizedPhone = query.replace(/[\s\-\(\)\+]/g, '');
  const phonePattern = `%${normalizedPhone}%`;
  
  return db
    .select()
    .from(customers)
    .where(
      or(
        sql`LOWER(${customers.firstName}) LIKE ${searchPattern}`,
        sql`LOWER(${customers.lastName}) LIKE ${searchPattern}`,
        sql`LOWER(CONCAT(${customers.firstName}, ' ', ${customers.lastName})) LIKE ${searchPattern}`,
        sql`LOWER(CONCAT(${customers.lastName}, ' ', ${customers.firstName})) LIKE ${searchPattern}`,
        like(customers.phone, phonePattern),
        sql`LOWER(${customers.email}) LIKE ${searchPattern}`,
        sql`LOWER(${customers.address}) LIKE ${searchPattern}`,
        sql`LOWER(${customers.city}) LIKE ${searchPattern}`
      )
    )
    .limit(50);
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(customers).where(eq(customers.id, id));
  return result[0] || null;
}

export async function checkDuplicateCustomer(phone: string, email?: string) {
  const db = await getDb();
  if (!db) return null;
  
  const normalizedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  const phonePattern = `%${normalizedPhone}%`;
  
  const conditions = [like(customers.phone, phonePattern)];
  if (email) {
    conditions.push(sql`LOWER(${customers.email}) = ${email.toLowerCase()}`);
  }
  
  const result = await db
    .select()
    .from(customers)
    .where(or(...conditions))
    .limit(1);
  
  return result[0] || null;
}

export async function checkDuplicateByAddress(city: string, address: string) {
  console.log('[DB] checkDuplicateByAddress START');
  console.log('[DB] city input:', city);
  console.log('[DB] address input:', address);
  
  const db = await getDb();
  if (!db) {
    console.log('[DB] Database not available!');
    return [];
  }
  
  // Normalizza città e indirizzo per ricerca case-insensitive
  const normalizedCity = city.trim().toLowerCase();
  const normalizedAddress = address.trim().toLowerCase();
  console.log('[DB] normalizedCity:', normalizedCity);
  console.log('[DB] normalizedAddress:', normalizedAddress);
  
  // Estrai numero civico e nome via dall'indirizzo
  // Pattern: "Via/Strada/Viale [Nome Via] [Numero]"
  const streetNumberMatch = address.match(/(\d+[a-zA-Z]?)\s*$/);
  const streetNumber = streetNumberMatch ? streetNumberMatch[1] : null;
  console.log('[DB] streetNumber extracted:', streetNumber);
  
  if (!streetNumber) {
    // Se non c'è numero civico, cerca solo per città e via
    const result = await db
      .select()
      .from(customers)
      .where(
        and(
          sql`LOWER(${customers.city}) = ${normalizedCity}`,
          sql`LOWER(${customers.address}) LIKE ${`%${normalizedAddress.replace(/\d+/g, '').trim()}%`}`
        )
      )
      .limit(10);
    return result;
  }
  
  // Estrai nome via rimuovendo numero civico
  const streetName = address.replace(/(\d+[a-zA-Z]?)\s*$/, '').trim().toLowerCase();
  // Rimuovi prefissi comuni (via, strada, viale, ecc.) e normalizza
  const streetNameNormalized = streetName
    .replace(/^(via|strada|viale|piazza|corso|vicolo|largo)\s+/i, '')
    .replace(/[,\.\s]+/g, ' ')
    .trim();
  console.log('[DB] streetName extracted:', streetName);
  console.log('[DB] streetNameNormalized:', streetNameNormalized);
  
  // Cerca clienti con stessa città, stesso nome via e stesso numero civico
  console.log('[DB] Eseguo query con streetName + streetNumber');
  const result = await db
    .select()
    .from(customers)
    .where(
      and(
        sql`LOWER(${customers.city}) = ${normalizedCity}`,
        sql`LOWER(REPLACE(REPLACE(REPLACE(${customers.address}, 'via ', ''), 'strada ', ''), 'viale ', '')) LIKE ${`%${streetNameNormalized}%${streetNumber}%`}`
      )
    )
    .limit(10);
  
  console.log('[DB] Query result:', result);
  console.log('[DB] Result count:', result.length);
  return result;
}

export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customers).values(data);
  return Number(result[0].insertId);
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(customers).set(data).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(customers).where(eq(customers.id, id));
}

// ==================== TECHNICIANS ====================

export async function getAllTechnicians() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(technicians).where(eq(technicians.isActive, true));
}

export async function getTechnicianById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(technicians).where(eq(technicians.id, id));
  return result[0] || null;
}

export async function getTechnicianByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(technicians).where(eq(technicians.userId, userId));
  return result[0] || null;
}

export async function createTechnician(data: InsertTechnician) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(technicians).values(data);
  return Number(result[0].insertId);
}

export async function updateTechnician(id: number, data: Partial<InsertTechnician>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(technicians).set(data).where(eq(technicians.id, id));
}

export async function updateTechnicianPushToken(technicianId: number, pushToken: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(technicians).set({ pushToken }).where(eq(technicians.id, technicianId));
}

// ==================== APPOINTMENTS ====================

export async function getAllAppointments(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  if (startDate && endDate) {
    return db
      .select({
        // Campi appointment
        id: appointments.id,
        customerId: appointments.customerId,
        technicianId: appointments.technicianId,
        scheduledDate: appointments.scheduledDate,
        duration: appointments.duration,
        actualDuration: appointments.actualDuration,
        status: appointments.status,
        notes: appointments.notes,
        checkInTime: appointments.checkInTime,
        checkOutTime: appointments.checkOutTime,
        checkInLatitude: appointments.checkInLatitude,
        checkInLongitude: appointments.checkInLongitude,
        serviceType: appointments.serviceType,
        signatureUrl: appointments.signatureUrl,
        signedAt: appointments.signedAt,
        sendWhatsAppReminder: appointments.sendWhatsAppReminder,
        whatsappTemplateId: appointments.whatsappTemplateId,
        whatsappReminderSent: appointments.whatsappReminderSent,
        whatsappReminderSentAt: appointments.whatsappReminderSentAt,
        completedAt: appointments.completedAt,
        confirmed: appointments.confirmed,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
        // Dati cliente (JOIN)
        customer: {
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
          email: customers.email,
          address: customers.address,
          city: customers.city,
          postalCode: customers.postalCode,
          notes: customers.notes,
          latitude: customers.latitude,
          longitude: customers.longitude,
          province: customers.province,
          zone: customers.zone,
          taxCode: customers.taxCode,
          vatNumber: customers.vatNumber,
          iban: customers.iban,
          pec: customers.pec,
          sdiCode: customers.sdiCode,
          referent: customers.referent,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
        },
        // Dati tecnico (JOIN)
        technician: {
          id: technicians.id,
          userId: technicians.userId,
          firstName: technicians.firstName,
          lastName: technicians.lastName,
          phone: technicians.phone,
          email: technicians.email,
          skills: technicians.skills,
          notes: technicians.notes,
          vehiclePlate: technicians.vehiclePlate,
          vehicleModel: technicians.vehicleModel,
          isActive: technicians.isActive,
          pushToken: technicians.pushToken,
          createdAt: technicians.createdAt,
          updatedAt: technicians.updatedAt,
        },
      })
      .from(appointments)
      .leftJoin(customers, eq(appointments.customerId, customers.id))
      .leftJoin(technicians, eq(appointments.technicianId, technicians.id))
      .where(
        and(
          gte(appointments.scheduledDate, startDate),
          lte(appointments.scheduledDate, endDate)
        )
      )
      .orderBy(appointments.scheduledDate);
  }
  
  return db
    .select({
      // Campi appointment
      id: appointments.id,
      customerId: appointments.customerId,
      technicianId: appointments.technicianId,
      scheduledDate: appointments.scheduledDate,
      duration: appointments.duration,
      actualDuration: appointments.actualDuration,
      status: appointments.status,
      notes: appointments.notes,
      checkInTime: appointments.checkInTime,
      checkOutTime: appointments.checkOutTime,
      checkInLatitude: appointments.checkInLatitude,
      checkInLongitude: appointments.checkInLongitude,
      serviceType: appointments.serviceType,
      signatureUrl: appointments.signatureUrl,
      signedAt: appointments.signedAt,
      sendWhatsAppReminder: appointments.sendWhatsAppReminder,
      whatsappTemplateId: appointments.whatsappTemplateId,
      whatsappReminderSent: appointments.whatsappReminderSent,
      whatsappReminderSentAt: appointments.whatsappReminderSentAt,
      completedAt: appointments.completedAt,
      confirmed: appointments.confirmed,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      // Dati cliente (JOIN)
      customer: {
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        email: customers.email,
        address: customers.address,
        city: customers.city,
        postalCode: customers.postalCode,
        notes: customers.notes,
        latitude: customers.latitude,
        longitude: customers.longitude,
        province: customers.province,
        zone: customers.zone,
        taxCode: customers.taxCode,
        vatNumber: customers.vatNumber,
        iban: customers.iban,
        pec: customers.pec,
        sdiCode: customers.sdiCode,
        referent: customers.referent,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
      },
      // Dati tecnico (JOIN)
      technician: {
        id: technicians.id,
        userId: technicians.userId,
        firstName: technicians.firstName,
        lastName: technicians.lastName,
        phone: technicians.phone,
        email: technicians.email,
        skills: technicians.skills,
        notes: technicians.notes,
        vehiclePlate: technicians.vehiclePlate,
        vehicleModel: technicians.vehicleModel,
        isActive: technicians.isActive,
        pushToken: technicians.pushToken,
        createdAt: technicians.createdAt,
        updatedAt: technicians.updatedAt,
      },
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(technicians, eq(appointments.technicianId, technicians.id))
    .orderBy(appointments.scheduledDate);
}

export async function getAppointmentsByTechnician(technicianId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [
    eq(appointments.technicianId, technicianId),
    // Escludi appuntamenti cancellati dal controllo sovrapposizioni
    ne(appointments.status, 'cancelled')
  ];
  
  if (startDate && endDate) {
    conditions.push(gte(appointments.scheduledDate, startDate));
    conditions.push(lte(appointments.scheduledDate, endDate));
  }
  
  return db
    .select()
    .from(appointments)
    .where(and(...conditions))
    .orderBy(appointments.scheduledDate);
}

export async function getAppointmentsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  console.log(`[getAppointmentsByCustomer] Querying for customerId: ${customerId}`);
  
  const result = await db
    .select()
    .from(appointments)
    .where(eq(appointments.customerId, customerId))
    .orderBy(desc(appointments.scheduledDate));
  
  console.log(`[getAppointmentsByCustomer] Found ${result.length} appointments for customerId ${customerId}`);
  console.log(`[getAppointmentsByCustomer] Raw DB result:`, JSON.stringify(result, null, 2));
  result.forEach((apt, idx) => {
    console.log(`[getAppointmentsByCustomer] Appointment ${idx}:`, { id: apt.id, idType: typeof apt.id, idValue: String(apt.id), invoiceStatus: apt.invoiceStatus, invoiceNumber: apt.invoiceNumber });
  });
  
  return result;
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(appointments).where(eq(appointments.id, id));
  return result[0] || null;
}

export async function createAppointment(data: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log(`[createAppointment] Creating appointment with data:`, data);
  const result = await db.insert(appointments).values(data);
  console.log(`[createAppointment] Raw insert result:`, JSON.stringify(result, null, 2));
  console.log(`[createAppointment] insertId:`, result[0].insertId, `type:`, typeof result[0].insertId);
  const insertedId = Number(result[0].insertId);
  console.log(`[createAppointment] Converted insertedId:`, insertedId, `type:`, typeof insertedId);
  
  // Verifica che l'appuntamento sia stato creato correttamente
  const verifyResult = await db.select().from(appointments).where(eq(appointments.id, insertedId)).limit(1);
  console.log(`[createAppointment] Verification - Found appointment with ID ${insertedId}:`, verifyResult.length > 0 ? 'YES' : 'NO');
  
  return insertedId;
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Se l'appuntamento viene completato, ricalcola sempre actualDuration
  // da checkInTime e checkOutTime per garantire accuratezza
  if (data.status === "completed" || data.checkOutTime) {
    // Prima recupera l'appuntamento esistente per avere checkInTime
    const [existing] = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    
    if (existing) {
      const checkInTime = data.checkInTime || existing.checkInTime;
      const checkOutTime = data.checkOutTime || new Date();
      
      if (checkInTime && checkOutTime) {
        const checkIn = new Date(checkInTime);
        const checkOut = new Date(checkOutTime);
        const diffMs = checkOut.getTime() - checkIn.getTime();
        const calculatedDuration = Math.round(diffMs / (1000 * 60)); // Convert to minutes
        
        // Usa il valore calcolato se è positivo, altrimenti mantieni quello fornito dal client
        if (calculatedDuration > 0) {
          data.actualDuration = calculatedDuration;
        }
      }
    }
  }
  
  await db.update(appointments).set(data).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(appointments).where(eq(appointments.id, id));
}

// ==================== NOTIFICATIONS ====================

export async function getNotificationsByAppointment(appointmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.appointmentId, appointmentId))
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(notifications).values(data);
  return Number(result[0].insertId);
}

export async function updateNotification(id: number, data: Partial<InsertNotification>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notifications).set(data).where(eq(notifications.id, id));
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.status, "pending"))
    .orderBy(notifications.createdAt);
}

// ==================== TECHNICIAN ABSENCES ====================

export async function getAbsencesByTechnician(
  technicianId: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(absences.technicianId, technicianId)];
  
  if (startDate && endDate) {
    conditions.push(gte(absences.date, startDate));
    conditions.push(lte(absences.date, endDate));
  }
  
  return db
    .select()
    .from(absences)
    .where(and(...conditions))
    .orderBy(absences.date);
}

export async function getAllAbsences(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  if (startDate && endDate) {
    return db
      .select()
      .from(absences)
      .where(
        and(
          gte(absences.date, startDate),
          lte(absences.date, endDate)
        )
      )
      .orderBy(absences.date);
  }
  
  return db
    .select()
    .from(absences)
    .orderBy(absences.date);
}

export async function createAbsence(data: InsertAbsence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(absences).values(data);
  return Number(result[0].insertId);
}

export async function updateAbsence(id: number, data: Partial<InsertAbsence>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(absences).set(data).where(eq(absences.id, id));
}

export async function deleteAbsence(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(absences).where(eq(absences.id, id));
}

// ============================================
// EQUIPMENTS (Apparecchi) FUNCTIONS
// ============================================

export async function getEquipmentsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(equipments)
    .where(eq(equipments.customerId, customerId))
    .orderBy(desc(equipments.createdAt));
}

export async function getEquipmentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(equipments)
    .where(eq(equipments.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createEquipment(data: InsertEquipment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(equipments).values(data);
  return Number(result[0].insertId);
}

export async function updateEquipment(id: number, data: Partial<InsertEquipment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(equipments).set(data).where(eq(equipments.id, id));
}

export async function deleteEquipment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(equipments).where(eq(equipments.id, id));
}

// ============================================
// CALLS (Chiamate) FUNCTIONS
// ============================================

export async function getAllCalls() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(calls)
    .orderBy(desc(calls.callDate));
}

export async function getCallsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(calls)
    .where(eq(calls.customerId, customerId))
    .orderBy(desc(calls.callDate));
}

export async function getCallById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(calls)
    .where(eq(calls.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createCall(data: InsertCall) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(calls).values(data);
  return Number(result[0].insertId);
}

export async function updateCall(id: number, data: Partial<InsertCall>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(calls).set(data).where(eq(calls.id, id));
}

export async function deleteCall(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(calls).where(eq(calls.id, id));
}

// ============================================
// CONTRACTS (Contratti) FUNCTIONS
// ============================================

export async function getContractsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(contracts)
    .where(eq(contracts.customerId, customerId))
    .orderBy(desc(contracts.startDate));
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createContract(data: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contracts).values(data);
  return Number(result[0].insertId);
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

export async function deleteContract(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(contracts).where(eq(contracts.id, id));
}

// Funzione per aggiornare automaticamente lo stato dei contratti
export async function updateContractStatuses() {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Contratti scaduti
  await db
    .update(contracts)
    .set({ status: "expired" })
    .where(and(
      lt(contracts.endDate, now),
      eq(contracts.status, "active")
    ));
  
  // Contratti in scadenza (entro 30 giorni)
  await db
    .update(contracts)
    .set({ status: "expiring" })
    .where(and(
      gte(contracts.endDate, now),
      lte(contracts.endDate, thirtyDaysFromNow),
      eq(contracts.status, "active")
    ));
}

// ============================================
// MAINTENANCE BOOKS (Libretti Impianto) FUNCTIONS
// ============================================

export async function getMaintenanceBooksByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(maintenanceBooks)
    .where(eq(maintenanceBooks.customerId, customerId))
    .orderBy(desc(maintenanceBooks.nextCheckDate));
}

export async function getMaintenanceBookById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(maintenanceBooks)
    .where(eq(maintenanceBooks.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createMaintenanceBook(data: InsertMaintenanceBook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(maintenanceBooks).values(data);
  return Number(result[0].insertId);
}

export async function updateMaintenanceBook(id: number, data: Partial<InsertMaintenanceBook>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(maintenanceBooks).set(data).where(eq(maintenanceBooks.id, id));
}

export async function deleteMaintenanceBook(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(maintenanceBooks).where(eq(maintenanceBooks.id, id));
}

// Funzione per aggiornare automaticamente lo stato dei libretti
export async function updateMaintenanceBookStatuses() {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Libretti scaduti
  await db
    .update(maintenanceBooks)
    .set({ status: "expired" })
    .where(and(
      lt(maintenanceBooks.nextCheckDate, now),
      ne(maintenanceBooks.status, "expired")
    ));
  
  // Libretti in scadenza (entro 30 giorni)
  await db
    .update(maintenanceBooks)
    .set({ status: "expiring" })
    .where(and(
      gte(maintenanceBooks.nextCheckDate, now),
      lte(maintenanceBooks.nextCheckDate, thirtyDaysFromNow),
      eq(maintenanceBooks.status, "ok")
    ));
}

// ============================================
// QUOTES (Preventivi) FUNCTIONS
// ============================================

export async function getQuotesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(quotes)
    .where(eq(quotes.customerId, customerId))
    .orderBy(desc(quotes.date));
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getQuoteWithItems(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const quote = await getQuoteById(id);
  if (!quote) return null;
  
  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id))
    .orderBy(quoteItems.sortOrder);
  
  return { ...quote, items };
}

export async function createQuote(data: InsertQuote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(quotes).values(data);
  return Number(result[0].insertId);
}

export async function updateQuote(id: number, data: Partial<InsertQuote>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(quotes).set(data).where(eq(quotes.id, id));
}

export async function deleteQuote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Elimina prima le righe del preventivo
  await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
  // Poi elimina il preventivo
  await db.delete(quotes).where(eq(quotes.id, id));
}

// Quote Items functions
export async function createQuoteItem(data: InsertQuoteItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(quoteItems).values(data);
  return Number(result[0].insertId);
}

export async function updateQuoteItem(id: number, data: Partial<InsertQuoteItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(quoteItems).set(data).where(eq(quoteItems.id, id));
}

export async function deleteQuoteItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(quoteItems).where(eq(quoteItems.id, id));
}

// ============================================
// DOCUMENTS (Documenti) FUNCTIONS
// ============================================

export async function getDocumentsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(documents)
    .where(eq(documents.customerId, customerId))
    .orderBy(desc(documents.uploadDate));
}

export async function getDocumentsByAppointment(appointmentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(documents)
    .where(eq(documents.appointmentId, appointmentId))
    .orderBy(desc(documents.uploadDate));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documents).values(data);
  return Number(result[0].insertId);
}

export async function updateDocument(id: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(documents).set(data).where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(documents).where(eq(documents.id, id));
}

// ============================================
// Time Entries (Timbrature) Functions
// ============================================

export async function createTimeEntry(data: InsertTimeEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(timeEntries).values(data);
  return Number(result[0].insertId);
}

export async function deleteTimeEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
}

// ============================================
// Payments Functions
// ============================================

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(data);
  return Number(result[0].insertId);
}

export async function getPaymentsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(payments).where(eq(payments.customerId, customerId));
}

export async function getPaymentsByAppointment(appointmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(payments).where(eq(payments.appointmentId, appointmentId));
}

export async function deletePayment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(payments).where(eq(payments.id, id));
}

export async function getTimeEntriesByTechnicianAndDate(
  technicianId: number,
  date: Date
) {
  const db = await getDb();
  if (!db) return [];
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.technicianId, technicianId),
        gte(timeEntries.date, startOfDay),
        lte(timeEntries.date, endOfDay)
      )
    )
    .orderBy(timeEntries.timestamp);
}

export async function getAllTimeEntriesToday(today: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db
    .select({
      timeEntry: timeEntries,
      technician: technicians,
    })
    .from(timeEntries)
    .leftJoin(technicians, eq(timeEntries.technicianId, technicians.id))
    .where(
      and(
        gte(timeEntries.date, startOfDay),
        lte(timeEntries.date, endOfDay)
      )
    )
    .orderBy(desc(timeEntries.timestamp));
}

export async function searchCustomerByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Normalizza numero telefono (rimuovi spazi, trattini, prefissi)
  const normalizedPhone = phone.replace(/[\s\-\+]/g, "");
  
  const results = await db
    .select()
    .from(customers)
    .where(like(customers.phone, `%${normalizedPhone}%`))
    .limit(1);
  
  return results[0] || null;
}

// ==================== Intervention Types ====================

export async function getAllInterventionTypes() {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(interventionTypes)
    .orderBy(interventionTypes.name);
}

export async function createInterventionType(data: InsertInterventionType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(interventionTypes).values(data);
  return result;
}

export async function deleteInterventionType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(interventionTypes).where(eq(interventionTypes.id, id));
}

export async function searchCustomerByName(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  const normalizedSearch = searchTerm.trim().toLowerCase();
  
  const results = await db
    .select()
    .from(customers)
    .where(
      or(
        like(customers.firstName, `%${normalizedSearch}%`),
        like(customers.lastName, `%${normalizedSearch}%`)
      )
    )
    .limit(10);
  
  return results;
}
