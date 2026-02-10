import { getAppointmentById } from "./server/db";

async function check() {
  const apt = await getAppointmentById(570013);
  
  if (apt) {
    console.log('\n=== APPUNTAMENTO ID 570013 ===\n');
    console.log('Cliente ID:', apt.customerId);
    console.log('Cliente:', apt.customer?.firstName, apt.customer?.lastName);
    console.log('Indirizzo:', apt.customer?.address);
    console.log('Data:', new Date(apt.scheduledDate).toISOString());
    console.log('Ora locale:', new Date(apt.scheduledDate).toLocaleString('it-IT', { timeZone: 'Europe/Rome' }));
    console.log('DURATION:', apt.duration, 'minuti');
    console.log('Servizio:', apt.serviceType);
    console.log('Tecnico:', apt.technician?.firstName);
  } else {
    console.log('Appuntamento non trovato');
  }
  
  process.exit(0);
}

check();
