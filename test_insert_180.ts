import { createAppointment } from "./server/db";

async function test() {
  console.log("\n=== TEST INSERIMENTO APPUNTAMENTO CON DURATION 180 ===\n");
  
  const testData = {
    customerId: 66751, // Baggio Alessandro
    technicianId: 1, // Luca Corsi
    scheduledDate: new Date('2026-01-20T10:00:00.000Z'),
    duration: 180,
    status: "scheduled" as const,
    serviceType: "TEST 180 MINUTI",
    notes: "Test per verificare se duration 180 viene salvato correttamente",
  };
  
  console.log("Dati da inserire:", JSON.stringify(testData, null, 2));
  console.log("Duration da salvare:", testData.duration);
  console.log("Tipo di duration:", typeof testData.duration);
  
  try {
    const id = await createAppointment(testData);
    console.log("\n✅ Appuntamento creato con ID:", id);
    console.log("\nOra controlla nel calendario se l'appuntamento del 20 gennaio alle 10:00");
    console.log("si estende fino alle 13:00 (3 ore = 180 minuti)");
    console.log("Se si estende solo fino alle 12:30, allora il problema è nel database/backend\n");
  } catch (error) {
    console.error("\n❌ Errore:", error);
  }
  
  process.exit(0);
}

test();
