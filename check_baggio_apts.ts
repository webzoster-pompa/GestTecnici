import { getDb } from "./server/db";
import { appointments } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function check() {
  const db = await getDb();
  if (!db) {
    console.error("Database non disponibile");
    process.exit(1);
  }
  
  // Recupera tutti gli appuntamenti di Baggio (customer ID 66751)
  const baggioApts = await db
    .select()
    .from(appointments)
    .where(eq(appointments.customerId, 66751))
    .orderBy(appointments.scheduledDate);
  
  console.log(`\nTotale appuntamenti di Baggio Alessandro (ID 66751): ${baggioApts.length}\n`);
  
  baggioApts.forEach(apt => {
    console.log('---');
    console.log('ID:', apt.id);
    console.log('Data:', new Date(apt.scheduledDate).toISOString());
    console.log('Ora locale:', new Date(apt.scheduledDate).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }));
    console.log('DURATION:', apt.duration, 'minuti');
    console.log('Status:', apt.status);
    console.log('Servizio:', apt.serviceType);
    console.log('Tecnico ID:', apt.technicianId);
  });
  
  process.exit(0);
}

check();
