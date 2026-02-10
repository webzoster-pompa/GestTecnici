import { getDb } from "../server/db";
import { appointments, customers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

(async () => {
  const db = await getDb();
  if (!db) {
    console.log("Database non disponibile");
    return;
  }

  // Cerca appuntamento Denis Corsi
  const result = await db
    .select()
    .from(appointments)
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .where(eq(customers.firstName, "Denis"));

  console.log("Appuntamenti Denis Corsi:");
  console.log(JSON.stringify(result, null, 2));
})();
