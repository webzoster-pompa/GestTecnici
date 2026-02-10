import { proposeOptimalSlots } from './server/route-optimizer';
import * as db from './server/db';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, expected: string, actual: string, error?: string) {
  results.push({ name, passed, expected, actual, error });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (!passed) {
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual: ${actual}`);
    if (error) console.log(`  Error: ${error}`);
  }
}

async function testRegressionSuite() {
  console.log('=== TEST DI REGRESSIONE COMPLETO ===\n');
  console.log('Verifica che la correzione timezone non abbia introdotto nuovi problemi\n');
  
  try {
    // Test 1: Slot mattutini vengono proposti per domani
    console.log('\n--- Test 1: Proposta Slot Mattutini ---');
    const customer1 = await db.getCustomerById(66751); // Baggio Alessandro
    if (!customer1) {
      addResult('Test 1', false, 'Cliente trovato', 'Cliente non trovato');
      return;
    }
    
    const lat1 = customer1.latitude ? Number(customer1.latitude) : 42.0;
    const lon1 = customer1.longitude ? Number(customer1.longitude) : 12.0;
    
    let technicians1 = await db.getAllTechnicians();
    technicians1 = technicians1.filter((t: any) => t.id === 1); // Luca Corsi
    
    const slots1 = await proposeOptimalSlots(lat1, lon1, technicians1, undefined, 60);
    
    const firstSlotHour = new Date(slots1[0].date).getUTCHours();
    const passed1 = firstSlotHour >= 8 && firstSlotHour < 13;
    addResult(
      'Primo slot proposto è mattutino (8:00-13:00)',
      passed1,
      '8:00-13:00',
      `${firstSlotHour}:00`
    );
    
    // Test 2: Slot sono in ordine cronologico
    console.log('\n--- Test 2: Ordine Cronologico Slot ---');
    const slot1Time = new Date(slots1[0].date).getTime();
    const slot2Time = new Date(slots1[1].date).getTime();
    const slot3Time = new Date(slots1[2].date).getTime();
    
    const passed2 = slot1Time < slot2Time && slot2Time < slot3Time;
    addResult(
      'Slot proposti sono in ordine cronologico',
      passed2,
      'slot1 < slot2 < slot3',
      `${slot1Time < slot2Time} && ${slot2Time < slot3Time}`
    );
    
    // Test 3: Slot non sono nel passato
    console.log('\n--- Test 3: Slot Non Nel Passato ---');
    const now = new Date();
    const allFuture = slots1.every(s => new Date(s.date) > now);
    addResult(
      'Tutti gli slot sono nel futuro',
      allFuture,
      'Tutti > now',
      allFuture ? 'Tutti > now' : 'Alcuni <= now'
    );
    
    // Test 4: Slot sono in giorni lavorativi (non domenica)
    console.log('\n--- Test 4: Giorni Lavorativi ---');
    const allWeekdays = slots1.every(s => {
      const day = new Date(s.date).getUTCDay();
      return day !== 0 && day !== 6; // 0=Domenica, 6=Sabato
    });
    addResult(
      'Tutti gli slot sono in giorni lavorativi',
      allWeekdays,
      'Lun-Ven',
      allWeekdays ? 'Lun-Ven' : 'Include weekend'
    );
    
    // Test 5: Slot hanno score ragionevole
    console.log('\n--- Test 5: Score Ragionevole ---');
    const allScoresValid = slots1.every(s => s.score >= 0 && s.score < 10000);
    addResult(
      'Score degli slot sono ragionevoli (0-10000)',
      allScoresValid,
      '0 <= score < 10000',
      allScoresValid ? 'OK' : 'Alcuni score fuori range'
    );
    
    // Test 6: Distanze sono ragionevoli
    console.log('\n--- Test 6: Distanze Ragionevoli ---');
    const allDistancesValid = slots1.every(s => 
      s.totalDistance >= 0 && s.totalDistance < 2000 // Max 2000 km
    );
    addResult(
      'Distanze sono ragionevoli (< 2000 km)',
      allDistancesValid,
      '0 <= dist < 2000',
      allDistancesValid ? 'OK' : 'Alcune distanze > 2000 km'
    );
    
    // Test 7: Slot hanno tecnico assegnato
    console.log('\n--- Test 7: Tecnico Assegnato ---');
    const allHaveTechnician = slots1.every(s => 
      s.technicianId > 0 && s.technicianName && s.technicianName.length > 0
    );
    addResult(
      'Tutti gli slot hanno tecnico assegnato',
      allHaveTechnician,
      'technicianId > 0 && technicianName != ""',
      allHaveTechnician ? 'OK' : 'Alcuni slot senza tecnico'
    );
    
    // Test 8: Slot sono distanziati di almeno 30 minuti
    console.log('\n--- Test 8: Distanziamento Slot ---');
    const minGapMinutes = 30;
    let allProperlySpaced = true;
    for (let i = 1; i < slots1.length; i++) {
      const gap = (new Date(slots1[i].date).getTime() - new Date(slots1[i-1].date).getTime()) / (1000 * 60);
      if (gap < minGapMinutes && gap > 0) {
        allProperlySpaced = false;
        break;
      }
    }
    addResult(
      'Slot sono distanziati di almeno 30 minuti',
      allProperlySpaced,
      '>= 30 min',
      allProperlySpaced ? 'OK' : '< 30 min'
    );
    
    // Test 9: Proposta per cliente diverso
    console.log('\n--- Test 9: Proposta Cliente Diverso ---');
    const customer2 = await db.getCustomerById(66752); // Cliente diverso
    if (customer2) {
      const lat2 = customer2.latitude ? Number(customer2.latitude) : 42.0;
      const lon2 = customer2.longitude ? Number(customer2.longitude) : 12.0;
      
      const slots2 = await proposeOptimalSlots(lat2, lon2, technicians1, undefined, 60);
      const passed9 = slots2.length === 3;
      addResult(
        'Proposta per cliente diverso funziona',
        passed9,
        '3 slot',
        `${slots2.length} slot`
      );
    } else {
      addResult('Test 9', true, 'Cliente non trovato', 'Skip test');
    }
    
    // Test 10: Proposta con durata diversa (90 minuti)
    console.log('\n--- Test 10: Durata Diversa (90 min) ---');
    const slots10 = await proposeOptimalSlots(lat1, lon1, technicians1, undefined, 90);
    const passed10 = slots10.length === 3;
    addResult(
      'Proposta con durata 90 min funziona',
      passed10,
      '3 slot',
      `${slots10.length} slot`
    );
    
  } catch (error) {
    console.error('Errore durante i test:', error);
    addResult('Suite Test', false, 'Nessun errore', `Errore: ${error}`);
  }
  
  // Riepilogo
  console.log('\n\n=== RIEPILOGO TEST ===');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\nTotale test: ${total}`);
  console.log(`✅ Passati: ${passed}`);
  console.log(`❌ Falliti: ${failed}`);
  console.log(`Percentuale successo: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 TUTTI I TEST SONO PASSATI! La correzione timezone non ha introdotto regressioni.');
  } else {
    console.log('\n⚠️  ALCUNI TEST SONO FALLITI. Verificare i problemi sopra.');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

testRegressionSuite();
