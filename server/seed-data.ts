/**
 * Script per popolare il database con dati di esempio
 * Esegui con: tsx server/seed-data.ts
 */

import { createCustomer, createTechnician, createAppointment } from "./db";

async function seedDatabase() {
  console.log("🌱 Popolamento database con dati di esempio...\n");

  try {
    // Crea tecnici di esempio
    console.log("Creazione tecnici...");
    const technician1Id = await createTechnician({
      userId: 1, // Placeholder - in produzione usare ID utente reale
      firstName: "Mario",
      lastName: "Rossi",
      phone: "+39 333 1234567",
      email: "mario.rossi@example.com",
      isActive: true,
      skills: JSON.stringify(["Idraulica", "Elettricità", "Climatizzazione"]),
    });
    console.log(`✓ Tecnico creato: Mario Rossi (ID: ${technician1Id})`);

    const technician2Id = await createTechnician({
      userId: 2,
      firstName: "Luigi",
      lastName: "Bianchi",
      phone: "+39 333 7654321",
      email: "luigi.bianchi@example.com",
      isActive: true,
      skills: JSON.stringify(["Elettricità", "Domotica"]),
    });
    console.log(`✓ Tecnico creato: Luigi Bianchi (ID: ${technician2Id})\n`);

    // Crea clienti di esempio
    console.log("Creazione clienti...");
    const customers = [
      {
        firstName: "Giovanni",
        lastName: "Verdi",
        phone: "+39 340 1111111",
        email: "giovanni.verdi@example.com",
        address: "Via Roma 10",
        city: "Milano",
        postalCode: "20121",
        latitude: "45.4642",
        longitude: "9.1900",
      },
      {
        firstName: "Anna",
        lastName: "Neri",
        phone: "+39 340 2222222",
        email: "anna.neri@example.com",
        address: "Corso Buenos Aires 50",
        city: "Milano",
        postalCode: "20124",
        latitude: "45.4784",
        longitude: "9.2058",
      },
      {
        firstName: "Paolo",
        lastName: "Gialli",
        phone: "+39 340 3333333",
        email: "paolo.gialli@example.com",
        address: "Via Torino 25",
        city: "Milano",
        postalCode: "20123",
        latitude: "45.4615",
        longitude: "9.1847",
      },
      {
        firstName: "Laura",
        lastName: "Blu",
        phone: "+39 340 4444444",
        email: "laura.blu@example.com",
        address: "Viale Monza 100",
        city: "Milano",
        postalCode: "20125",
        latitude: "45.4980",
        longitude: "9.2200",
      },
      {
        firstName: "Marco",
        lastName: "Viola",
        phone: "+39 340 5555555",
        email: "marco.viola@example.com",
        address: "Via Dante 15",
        city: "Milano",
        postalCode: "20121",
        latitude: "45.4668",
        longitude: "9.1855",
      },
    ];

    const customerIds = [];
    for (const customer of customers) {
      const id = await createCustomer(customer);
      customerIds.push(id);
      console.log(`✓ Cliente creato: ${customer.firstName} ${customer.lastName} (ID: ${id})`);
    }
    console.log();

    // Crea appuntamenti di esempio
    console.log("Creazione appuntamenti...");
    
    // Appuntamenti per oggi
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    
    const appointment1Id = await createAppointment({
      customerId: customerIds[0],
      technicianId: technician1Id,
      scheduledDate: new Date(today),
      duration: 60,
      status: "scheduled",
      serviceType: "Riparazione caldaia",
      notes: "Cliente preferisce mattina",
    });
    console.log(`✓ Appuntamento creato (ID: ${appointment1Id})`);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    const appointment2Id = await createAppointment({
      customerId: customerIds[1],
      technicianId: technician1Id,
      scheduledDate: new Date(tomorrow),
      duration: 90,
      status: "scheduled",
      serviceType: "Installazione climatizzatore",
      notes: "Portare scala",
    });
    console.log(`✓ Appuntamento creato (ID: ${appointment2Id})`);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);
    
    const appointment3Id = await createAppointment({
      customerId: customerIds[2],
      technicianId: technician2Id,
      scheduledDate: new Date(nextWeek),
      duration: 60,
      status: "scheduled",
      serviceType: "Controllo impianto elettrico",
    });
    console.log(`✓ Appuntamento creato (ID: ${appointment3Id})\n`);

    console.log("✅ Database popolato con successo!");
    console.log(`\nRiepilogo:`);
    console.log(`- ${2} tecnici creati`);
    console.log(`- ${customerIds.length} clienti creati`);
    console.log(`- ${3} appuntamenti creati`);
    
  } catch (error) {
    console.error("❌ Errore durante il popolamento del database:", error);
    process.exit(1);
  }
}

// Esegui seed
seedDatabase()
  .then(() => {
    console.log("\n🎉 Operazione completata!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Errore fatale:", error);
    process.exit(1);
  });
