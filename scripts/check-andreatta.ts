import { getDb } from "../server/db";

async function checkAndreatta() {
  const db = await getDb();
  
  // Cerca appuntamenti di oggi per Denis Corsi (technicianId = 2)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const appointments = await db.getAppointmentsByTechnician(2);
  
  // Filtra appuntamenti di oggi
  const todayAppointments = appointments.filter((apt: any) => {
    const aptDate = new Date(apt.scheduledDate);
    return aptDate >= today && aptDate < tomorrow;
  });
  
  console.log("\n=== Appuntamenti Denis Corsi Oggi ===\n");
  
  for (const apt of todayAppointments) {
    // Carica dati cliente
    const customer = await db.getCustomer(apt.customerId);
    
    console.log(`Cliente: ${customer?.name || "N/A"}`);
    console.log(`Città: ${customer?.city || "N/A"}`);
    console.log(`Orario: ${apt.scheduledTime}`);
    console.log(`Status: ${apt.status}`);
    console.log(`Check-in: ${apt.checkInTime || "N/A"}`);
    console.log(`Check-out: ${apt.checkOutTime || "N/A"}`);
    console.log(`Durata prevista: ${apt.duration} minuti`);
    console.log(`Durata effettiva: ${apt.actualDuration || 0} minuti`);
    
    if (apt.checkInTime && apt.checkOutTime) {
      const checkIn = new Date(apt.checkInTime);
      const checkOut = new Date(apt.checkOutTime);
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const diffMin = Math.floor(diffMs / 1000 / 60);
      console.log(`Durata calcolata: ${diffMin} minuti`);
    }
    
    console.log("---\n");
  }
  
  process.exit(0);
}

checkAndreatta().catch(console.error);
