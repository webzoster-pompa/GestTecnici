import { db } from "../server/_core/db";
import { customers } from "../drizzle/schema";
import { like, or } from "drizzle-orm";

async function findCustomers() {
  console.log("🔍 Cercando clienti Bau Gianna e Facchinello Pietro...\n");
  
  const results = await db.select().from(customers).where(
    or(
      like(customers.lastName, "%Bau%"),
      like(customers.lastName, "%Gianna%"),
      like(customers.lastName, "%Facchinello%"),
      like(customers.lastName, "%Pietro%"),
      like(customers.firstName, "%Bau%"),
      like(customers.firstName, "%Gianna%"),
      like(customers.firstName, "%Facchinello%"),
      like(customers.firstName, "%Pietro%")
    )
  );
  
  console.log(`Trovati ${results.length} clienti:\n`);
  results.forEach(c => {
    console.log(`ID: ${c.id} | Nome: ${c.firstName} ${c.lastName} | Città: ${c.city || 'N/A'}`);
  });
  
  // Cerca anche il cliente con ID 66566
  console.log("\n🔍 Verificando se esiste cliente con ID 66566...\n");
  const customer66566 = await db.select().from(customers).where(eq(customers.id, 66566));
  
  if (customer66566.length > 0) {
    console.log("✅ Cliente 66566 trovato:", customer66566[0]);
  } else {
    console.log("❌ Cliente 66566 NON esiste nel database");
  }
  
  process.exit(0);
}

findCustomers().catch(console.error);
