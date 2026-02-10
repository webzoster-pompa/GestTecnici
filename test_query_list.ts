import { getAllAppointments } from "./server/db";

async function test() {
  console.log("\n=== TEST QUERY getAllAppointments ===\n");
  
  // Recupera tutti gli appuntamenti come fa il calendario
  const appointments = await getAllAppointments();
  
  console.log(`Totale appuntamenti recuperati: ${appointments.length}\n`);
  
  // Filtra solo quelli di Baggio Alessandro (customer ID 66751)
  const baggioAppointments = appointments.filter(apt => apt.customerId === 66751);
  
  console.log(`Appuntamenti di Baggio Alessandro: ${baggioAppointments.length}\n`);
  
  baggioAppointments.forEach(apt => {
    console.log('---');
    console.log('ID:', apt.id);
    console.log('Cliente:', apt.customer?.firstName, apt.customer?.lastName);
    console.log('Data:', new Date(apt.scheduledDate).toISOString());
    console.log('DURATION:', apt.duration);
    console.log('Servizio:', apt.serviceType);
    console.log('Tecnico:', apt.technician?.firstName);
  });
  
  process.exit(0);
}

test();
