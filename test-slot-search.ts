import { proposeOptimalSlots } from './server/route-optimizer';
import * as db from './server/db';

async function testSlotSearch() {
  console.log('=== TEST RICERCA SLOT PER BAGGIO ALESSANDRO ===\n');
  
  // Non serve verificare db, le funzioni lo gestiscono internamente
  
  // ID cliente Baggio Alessandro: 66751
  const customerId = 66751;
  const technicianId = 1; // Luca Corsi
  const duration = 60; // 60 minuti
  
  console.log('Parametri ricerca:');
  console.log(`- Cliente ID: ${customerId}`);
  console.log(`- Tecnico ID: ${technicianId} (Luca Corsi)`);
  console.log(`- Durata: ${duration} minuti\n`);
  
  try {
    // Recupera dati cliente
    const customer = await db.getCustomerById(customerId);
    if (!customer) {
      console.error('Cliente non trovato');
      return;
    }
    
    console.log(`Cliente: ${customer.firstName} ${customer.lastName}`);
    console.log(`Indirizzo: ${customer.address}, ${customer.city}`);
    console.log(`Coordinate: lat=${customer.latitude}, lon=${customer.longitude}\n`);
    
    // Recupera tecnico
    let technicians = await db.getAllTechnicians();
    technicians = technicians.filter((t: any) => t.id === technicianId);
    
    if (technicians.length === 0) {
      console.error('Tecnico non trovato');
      return;
    }
    
    const lat = customer.latitude ? Number(customer.latitude) : 42.0;
    const lon = customer.longitude ? Number(customer.longitude) : 12.0;
    
    console.log('Chiamata proposeOptimalSlots...\n');
    
    const slots = await proposeOptimalSlots(
      lat,
      lon,
      technicians,
      undefined, // preferredDate
      duration
    );
    
    console.log('\n=== RISULTATI ===');
    console.log(`Slot proposti: ${slots.length}\n`);
    
    slots.forEach((slot, i) => {
      const date = new Date(slot.date);
      const dayName = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toISOString().split('T')[1].substring(0, 5);
      
      console.log(`Slot ${i + 1}:`);
      console.log(`  Data/Ora: ${dayName} ${dateStr} ${timeStr}`);
      console.log(`  Tecnico: ${slot.technicianName}`);
      console.log(`  Score: ${slot.score.toFixed(2)}`);
      console.log(`  Distanza totale: ${slot.totalDistance.toFixed(2)} km`);
      console.log(`  Dist. da precedente: ${slot.distanceFromPrevious.toFixed(2)} km`);
      console.log(`  Dist. a successivo: ${slot.distanceToNext.toFixed(2)} km`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Errore durante la ricerca:', error);
  }
  
  process.exit(0);
}

testSlotSearch();
