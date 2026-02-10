import { getAppointmentById } from "./server/db";

async function test() {
  console.log("\n=== LETTURA APPUNTAMENTO TEST (ID 570014) ===\n");
  
  const apt = await getAppointmentById(570014);
  
  if (apt) {
    console.log("Appuntamento trovato:");
    console.log("- ID:", apt.id);
    console.log("- Cliente ID:", apt.customerId);
    console.log("- Data:", apt.scheduledDate);
    console.log("- DURATION:", apt.duration);
    console.log("- Tipo duration:", typeof apt.duration);
    console.log("- Servizio:", apt.serviceType);
    console.log("\nOggetto completo:");
    console.log(JSON.stringify(apt, null, 2));
  } else {
    console.log("❌ Appuntamento non trovato");
  }
  
  process.exit(0);
}

test();
