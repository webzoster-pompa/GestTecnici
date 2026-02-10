import { drizzle } from "drizzle-orm/mysql2";
import { appointments, customers } from "./drizzle/schema";
import { desc, eq } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

const result = await db
  .select({
    id: appointments.id,
    customerId: appointments.customerId,
    scheduledDate: appointments.scheduledDate,
    duration: appointments.duration,
    customerName: customers.firstName,
  })
  .from(appointments)
  .leftJoin(customers, eq(appointments.customerId, customers.id))
  .orderBy(desc(appointments.id))
  .limit(5);

console.log("\n=== ULTIMI 5 APPUNTAMENTI ===");
result.forEach(apt => {
  console.log(`ID: ${apt.id} | Cliente: ${apt.customerName} | Data: ${apt.scheduledDate?.toISOString()} | DURATION: ${apt.duration} minuti`);
});
console.log("=============================\n");

process.exit(0);
