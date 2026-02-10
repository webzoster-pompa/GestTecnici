import { getDb } from "../server/db";
import { appointments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

(async () => {
  const db = await getDb();
  if (!db) {
    console.log("Database non disponibile");
    return;
  }

  // Trova appuntamento Denis Corsi (ID 780001)
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, 780001))
    .limit(1);

  if (!appointment) {
    console.log("Appuntamento non trovato");
    return;
  }

  console.log("Appuntamento Denis Corsi:");
  console.log(`  ID: ${appointment.id}`);
  console.log(`  Status: ${appointment.status}`);
  console.log(`  Check-in: ${appointment.checkInTime}`);
  console.log(`  Check-out: ${appointment.checkOutTime}`);
  console.log(`  actualDuration attuale: ${appointment.actualDuration}`);

  if (appointment.checkInTime && appointment.checkOutTime) {
    const checkIn = new Date(appointment.checkInTime);
    const checkOut = new Date(appointment.checkOutTime);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const actualDuration = Math.round(diffMs / (1000 * 60));

    console.log(`\n✅ Calcolo corretto: ${actualDuration} minuti`);

    // Aggiorna database
    await db
      .update(appointments)
      .set({ actualDuration })
      .where(eq(appointments.id, 780001));

    console.log(`✅ Database aggiornato!`);
  } else {
    console.log("\n❌ Mancano checkInTime o checkOutTime");
  }
})();
