import { getDb } from "./server/db";

async function checkSchema() {
  console.log("\n=== VERIFICA SCHEMA TABELLA APPOINTMENTS ===\n");
  
  const db = await getDb();
  if (!db) {
    console.error("❌ Database non disponibile");
    process.exit(1);
  }
  
  // Query per vedere lo schema della tabella
  const result = await db.execute("DESCRIBE appointments");
  
  console.log("Schema tabella appointments:");
  console.log(JSON.stringify(result, null, 2));
  
  // Cerca specificamente il campo duration
  const rows = result as any[];
  const durationField = rows.find((row: any) => row.Field === 'duration');
  
  if (durationField) {
    console.log("\n=== CAMPO DURATION ===");
    console.log("Tipo:", durationField.Type);
    console.log("Null:", durationField.Null);
    console.log("Default:", durationField.Default);
    console.log("Extra:", durationField.Extra);
  }
  
  process.exit(0);
}

checkSchema();
