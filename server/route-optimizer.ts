import { Appointment, Customer, Technician } from "../drizzle/schema";
import { getDb } from "./db";
import { getAppointmentsByTechnician, getCustomerById } from "./db";
import { absences } from "../drizzle/schema";
import { and, gte, lte } from "drizzle-orm";
// Haversine formula per calcolo distanza tra due coordinate (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raggio della Terra in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Tipo per slot proposto
export interface ProposedSlot {
  date: Date;
  technicianId: number;
  technicianName: string;
  distanceFromPrevious: number;
  distanceToNext: number;
  totalDistance: number;
  score: number; // Punteggio: minore è meglio
}

/**
 * Geocodifica un indirizzo usando Nominatim (OpenStreetMap)
 * API gratuita, nessuna key richiesta
 * Limiti: max 1 richiesta/secondo (rispettato con delay)
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Nominatim richiede User-Agent
    const userAgent = "GestioneAppuntamentiTecnici/1.0";
    
    // URL encode dell'indirizzo
    const encodedAddress = encodeURIComponent(address);
    
    // Chiamata API Nominatim
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=it`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
    });
    
    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      console.warn(`No geocoding results for address: ${address}`);
      
      // Fallback: prova solo con la città (ultima parte dopo virgola)
      const cityMatch = address.match(/,\s*([^,]+)\s*$/);
      if (cityMatch) {
        const city = cityMatch[1].trim();
        console.log(`[Geocoding] Fallback to city: ${city}`);
        
        const cityUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Italia')}&format=json&limit=1`;
        const cityResponse = await fetch(cityUrl, {
          headers: { "User-Agent": userAgent },
        });
        
        if (cityResponse.ok) {
          const cityData = await cityResponse.json();
          if (cityData.length > 0) {
            console.log(`[Geocoding] City found: ${city}`);
            return {
              lat: parseFloat(cityData[0].lat),
              lon: parseFloat(cityData[0].lon),
            };
          }
        }
      }
      
      return null;
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Delay helper per rispettare rate limit Nominatim (1 req/sec)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Funzione principale per proporre 3 slot ottimali
export async function proposeOptimalSlots(
  customerLat: number,
  customerLon: number,
  technicians: Technician[],
  preferredDate?: Date,
  duration: number = 60 // Durata appuntamento in minuti
): Promise<ProposedSlot[]> {
  const slots: ProposedSlot[] = [];
  
  // Definisci range di date da considerare (7 giorni da oggi o da preferredDate)
  const startDate = preferredDate || new Date();
  // Normalizza startDate a mezzanotte per confronto con absences.date (solo data)
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  endDate.setHours(23, 59, 59, 999); // Fine giornata
  
  // Recupera tutte le assenze nel periodo per tutti i tecnici
  const dbInstance = await getDb();
  if (!dbInstance) {
    throw new Error("Database connection failed");
  }
  
  console.log('[proposeOptimalSlots] Querying absences:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
  
  const allAbsences = await dbInstance
    .select()
    .from(absences)
    .where(
      and(
        gte(absences.date, startDate),
        lte(absences.date, endDate)
      )
    );
  
  console.log('[proposeOptimalSlots] Absences found:', allAbsences.length);
  console.log('[proposeOptimalSlots] Absences details:', allAbsences.map(a => ({
    technicianId: a.technicianId,
    date: a.date,
    dateISO: a.date.toISOString(),
    reason: a.reason
  })));
  
  // Per ogni tecnico
  for (const technician of technicians) {
    // Recupera appuntamenti esistenti del tecnico nel periodo
    const existingAppointments = await getAppointmentsByTechnician(
      technician.id,
      startDate,
      endDate
    );
    
    // Log appuntamenti esistenti per questo tecnico
    console.log(`[proposeOptimalSlots] Tecnico ${technician.firstName} ${technician.lastName} (ID:${technician.id}) - Appuntamenti esistenti:`, existingAppointments.length);
    existingAppointments.forEach(apt => {
      console.log(`  - Appuntamento ID:${apt.id} | Data: ${new Date(apt.scheduledDate).toISOString()} | Durata: ${apt.duration}min | Status: ${apt.status}`);
    });
    
    // Genera slot disponibili (es. 8:00-18:00, slot da 1h)
    const availableSlots = generateAvailableSlots(
      startDate,
      endDate,
      existingAppointments,
      duration,
      technician.id,
      allAbsences
    );
    
    // Seleziona slot distribuiti su più giorni (non solo il primo giorno)
    // Prendi 3 slot per giorno per i primi 5 giorni = 15 slot max
    const distributedSlots: Date[] = [];
    const slotsByDay = new Map<string, Date[]>();
    
    // Raggruppa slot per giorno
    for (const slot of availableSlots) {
      const dayKey = slot.toISOString().split('T')[0];
      if (!slotsByDay.has(dayKey)) {
        slotsByDay.set(dayKey, []);
      }
      slotsByDay.get(dayKey)!.push(slot);
    }
    
    // Log slot disponibili per giorno
    console.log('[proposeOptimalSlots] Slot disponibili per giorno:');
    for (const [dayKey, daySlots] of slotsByDay) {
      console.log(`  ${dayKey}: ${daySlots.length} slot - Orari:`, daySlots.map(s => s.toISOString().split('T')[1].substring(0, 5)).join(', '));
    }
    
    // Prendi TUTTI gli slot del primo giorno, poi max 5 slot per gli altri giorni (max 5 giorni totali)
    let daysProcessed = 0;
    for (const [dayKey, daySlots] of slotsByDay) {
      if (daysProcessed >= 5) break;
      if (daysProcessed === 0) {
        // Primo giorno: prendi TUTTI gli slot disponibili per massimizzare scelta
        console.log(`[proposeOptimalSlots] Primo giorno ${dayKey}: prendo TUTTI i ${daySlots.length} slot`);
        distributedSlots.push(...daySlots);
      } else {
        // Giorni successivi: prendi solo 5 slot per limitare calcoli
        console.log(`[proposeOptimalSlots] Giorno ${dayKey}: prendo primi 5 di ${daySlots.length} slot`);
        distributedSlots.push(...daySlots.slice(0, 5));
      }
      daysProcessed++;
    }
    
    const limitedSlots = distributedSlots;
    
    // Per ogni slot disponibile, calcola distanze
    for (const slot of limitedSlots) {
      const { distanceFromPrevious, distanceToNext } = await calculateSlotDistances(
        slot,
        customerLat,
        customerLon,
        existingAppointments
      );
      
      const totalDistance = distanceFromPrevious + distanceToNext;
      
      // Calcola vicinanza temporale all'ultimo appuntamento dello stesso giorno
      const slotDay = slot.toISOString().split('T')[0];
      const sameDayAppointments = existingAppointments.filter(
        apt => new Date(apt.scheduledDate).toISOString().split('T')[0] === slotDay
      ).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
      
      let temporalBonus = 0;
      if (sameDayAppointments.length > 0) {
        // Trova l'appuntamento PRECEDENTE più vicino allo slot
        const previousAppointments = sameDayAppointments.filter(
          apt => new Date(apt.scheduledDate).getTime() < slot.getTime()
        );
        
        if (previousAppointments.length > 0) {
          // Prendi l'ultimo appuntamento precedente (più vicino allo slot)
          const lastAppointment = previousAppointments[previousAppointments.length - 1];
          const lastAppointmentEnd = new Date(lastAppointment.scheduledDate);
          lastAppointmentEnd.setMinutes(lastAppointmentEnd.getMinutes() + lastAppointment.duration);
          
          // Calcola differenza in minuti
          const minutesDiff = (slot.getTime() - lastAppointmentEnd.getTime()) / (1000 * 60);
          
          // Bonus: più è vicino temporalmente, minore è il bonus (vogliamo score basso)
          // Se slot è subito dopo (0-30 min): bonus = 0-1
          // Se slot è 1 ora dopo: bonus = 2
          // Se slot è 3 ore dopo: bonus = 6
          temporalBonus = minutesDiff / 30; // Ogni 30 min = +1 al bonus
          
          console.log(`[temporalBonus] Slot ${slot.toISOString().split('T')[1].substring(0,5)}: ultimo apt ${new Date(lastAppointment.scheduledDate).toISOString().split('T')[1].substring(0,5)}-${lastAppointmentEnd.toISOString().split('T')[1].substring(0,5)}, diff=${minutesDiff.toFixed(0)}min, bonus=${temporalBonus.toFixed(1)}`);
        } else {
          // Nessun appuntamento precedente nello stesso giorno
          // Questi sono i primi slot del giorno - MASSIMA PRIORITÀ!
          temporalBonus = 0;
          console.log(`[temporalBonus] Slot ${slot.toISOString().split('T')[1].substring(0,5)}: primo slot del giorno, bonus=0 (PRIORITÀ MASSIMA)`);
        }
      }
      
      // Penalizza fortemente slot con distanza > 20 km
      let score = totalDistance + temporalBonus;
      if (distanceFromPrevious > 20 || distanceToNext > 20) {
        score += 1000; // Penalizzazione pesante per distanze elevate
      }
      
      const slotInfo = {
        date: slot,
        technicianId: technician.id,
        technicianName: `${technician.firstName} ${technician.lastName}`,
        distanceFromPrevious,
        distanceToNext,
        totalDistance,
        score,
      };
      
      console.log(`[proposeOptimalSlots] Slot ${slot.toISOString()}: distPrev=${distanceFromPrevious.toFixed(1)}km, distNext=${distanceToNext.toFixed(1)}km, total=${totalDistance.toFixed(1)}km, temporalBonus=${temporalBonus.toFixed(1)}, score=${score.toFixed(1)}`);
      
      slots.push(slotInfo);
    }
  }
  
  // Ordinamento slot per score (punteggio: minore è meglio) e poi per data
  slots.sort((a, b) => {
    // Priorità 1: punteggio (distanza + temporal bonus)
    // Score più basso = migliore (primi slot del giorno hanno bonus=0)
    if (a.score !== b.score) return a.score - b.score;
    
    // Priorità 2: orario più vicino (mattina prima di pomeriggio)
    return a.date.getTime() - b.date.getTime();
  });
  
  // Restituisci i primi 3 slot migliori (anche se stesso giorno)
  // Questo permette di proporre più slot dello stesso giorno se sono i migliori
  return slots.slice(0, 3);
}

// Festività italiane fisse
const italianHolidays = [
  { month: 0, day: 1 },   // Capodanno
  { month: 0, day: 6 },   // Epifania
  { month: 3, day: 25 },  // Festa della Liberazione
  { month: 4, day: 1 },   // Festa del Lavoro
  { month: 5, day: 2 },   // Festa della Repubblica
  { month: 7, day: 15 },  // Ferragosto
  { month: 10, day: 1 },  // Ognissanti
  { month: 11, day: 8 },  // Immacolata Concezione
  { month: 11, day: 25 }, // Natale
  { month: 11, day: 26 }, // Santo Stefano
];

function isHoliday(date: Date): boolean {
  // Domenica
  if (date.getDay() === 0) return true;
  
  // Festività fisse
  const month = date.getMonth();
  const day = date.getDate();
  return italianHolidays.some(h => h.month === month && h.day === day);
}

// Genera slot disponibili per un tecnico
function generateAvailableSlots(
  startDate: Date,
  endDate: Date,
  existingAppointments: Appointment[],
  duration: number,
  technicianId: number,
  absences: Array<{ technicianId: number; date: Date }>
): Date[] {
  console.log('[DEBUG generateAvailableSlots] Input:', {
    technicianId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    absencesCount: absences.length,
    absences: absences.map(a => ({
      technicianId: a.technicianId,
      date: a.date.toISOString(),
      type: typeof a.date
    }))
  });
  
  const slots: Date[] = [];
  const workStartHour = 8;
  const workEndHour = 18;
  
  let currentDate = new Date(startDate);
  currentDate.setUTCHours(workStartHour, 0, 0, 0);
  
  while (currentDate < endDate) {
    // Salta weekend, domeniche e festivi
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isHoliday(currentDate)) {
      // Verifica se tecnico assente in questo giorno
      // Normalizza la data corrente a mezzanotte per confronto
      const currentDayMidnight = new Date(currentDate);
      currentDayMidnight.setHours(0, 0, 0, 0);
      const currentDayTime = currentDayMidnight.getTime();
      
      console.log('[DEBUG] Checking day:', currentDayMidnight.toISOString(), 'for technician:', technicianId);
      
      const isTechnicianAbsent = absences.some((abs) => {
        // Normalizza anche la data dell'assenza a mezzanotte
        const absDate = new Date(abs.date);
        absDate.setHours(0, 0, 0, 0);
        const absTime = absDate.getTime();
        
        const isMatch = abs.technicianId === technicianId && absTime === currentDayTime;
        console.log('[DEBUG] Absence check:', {
          absDate: absDate.toISOString(),
          currentDate: currentDayMidnight.toISOString(),
          absTechId: abs.technicianId,
          currentTechId: technicianId,
          absTime,
          currentDayTime,
          isMatch
        });
        return isMatch;
      });
      
      console.log('[DEBUG] isTechnicianAbsent:', isTechnicianAbsent, 'for day:', currentDayMidnight.toISOString());
      
      // Salta giorno se tecnico assente
      if (isTechnicianAbsent) {
        console.log('[DEBUG] SKIPPING day', currentDayMidnight.toISOString(), 'due to absence');
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(workStartHour, 0, 0, 0);
        continue;
      }
      // Genera slot ogni 30 minuti per la giornata
      for (let hour = workStartHour; hour < workEndHour; hour++) {
        for (let minute of [0, 30]) {
          const slotTime = new Date(currentDate);
          slotTime.setUTCHours(hour, minute, 0, 0);
          
          // Verifica se lo slot è libero
          const isOccupied = existingAppointments.some((apt) => {
            const aptStart = new Date(apt.scheduledDate);
            const aptEnd = new Date(aptStart);
            aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);
            
            const slotEnd = new Date(slotTime);
            slotEnd.setMinutes(slotEnd.getMinutes() + duration);
            
            // IMPORTANTE: Verifica sovrapposizione SOLO se slot e appuntamento sono nello stesso giorno
            const slotDay = slotTime.toISOString().split('T')[0];
            const aptDay = aptStart.toISOString().split('T')[0];
            
            if (slotDay !== aptDay) {
              // Slot e appuntamento in giorni diversi: NON si sovrappongono
              return false;
            }
            
            // Controlla sovrapposizione con logica semplificata
            // Due intervalli [A,B) e [C,D) si sovrappongono se e solo se: A < D AND C < B
            // Slot: [slotTime, slotEnd)
            // Appuntamento: [aptStart, aptEnd)
            const overlaps = slotTime < aptEnd && aptStart < slotEnd;
            
            console.log(`[DEBUG OVERLAP] Slot [${slotTime.toISOString().split('T')[1].substring(0,5)}, ${slotEnd.toISOString().split('T')[1].substring(0,5)}) vs Apt [${aptStart.toISOString().split('T')[1].substring(0,5)}, ${aptEnd.toISOString().split('T')[1].substring(0,5)}) dur:${apt.duration}min | overlaps:${overlaps}`);
            
            return overlaps;
          });
          
          // Escludi slot nel passato
          const now = new Date();
          
          if (!isOccupied && slotTime > now) {
            // Slot libero aggiunto
            slots.push(slotTime);
          } else if (isOccupied) {
            // Già loggato sopra
          } else if (slotTime <= now) {
            // Slot nel passato, saltato
          }
        }
      }
    }
    
    // Passa al giorno successivo
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    currentDate.setUTCHours(workStartHour, 0, 0, 0);
  }
  
  return slots;
}

// Calcola distanze da appuntamento precedente e successivo
async function calculateSlotDistances(
  slotDate: Date,
  customerLat: number,
  customerLon: number,
  existingAppointments: Appointment[]
): Promise<{ distanceFromPrevious: number; distanceToNext: number }> {
  // Trova appuntamento precedente e successivo più vicini
  const sortedAppointments = existingAppointments
    .map((apt) => ({
      ...apt,
      date: new Date(apt.scheduledDate),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  let distanceFromPrevious = 999; // Default alto se non trova appuntamenti
  let distanceToNext = 999;
  
  // Trova appuntamento precedente DELLO STESSO GIORNO
  const slotDay = slotDate.toISOString().split('T')[0];
  const sameDayPreviousAppointments = sortedAppointments.filter(
    (apt) => apt.date < slotDate && apt.date.toISOString().split('T')[0] === slotDay
  );
  
  if (sameDayPreviousAppointments.length > 0) {
    // C'è un appuntamento precedente nello stesso giorno - OTTIMO!
    const previous = sameDayPreviousAppointments[sameDayPreviousAppointments.length - 1];
    try {
      const previousCustomer = await getCustomerById(previous.customerId);
      if (previousCustomer?.latitude && previousCustomer?.longitude) {
        distanceFromPrevious = calculateDistance(
          Number(previousCustomer.latitude),
          Number(previousCustomer.longitude),
          customerLat,
          customerLon
        );
      }
    } catch (error) {
      console.error("Error calculating distance from previous:", error);
    }
  } else {
    // Nessun appuntamento precedente nello stesso giorno
    // Cerca l'ultimo appuntamento del giorno precedente
    const allPreviousAppointments = sortedAppointments.filter(
      (apt) => apt.date < slotDate
    );
    if (allPreviousAppointments.length > 0) {
      const previous = allPreviousAppointments[allPreviousAppointments.length - 1];
      try {
        const previousCustomer = await getCustomerById(previous.customerId);
        if (previousCustomer?.latitude && previousCustomer?.longitude) {
          const distance = calculateDistance(
            Number(previousCustomer.latitude),
            Number(previousCustomer.longitude),
            customerLat,
            customerLon
          );
          // Penalizza distanze tra giorni diversi (aggiungi 50 km virtuale)
          distanceFromPrevious = distance + 50;
        }
      } catch (error) {
        console.error("Error calculating distance from previous:", error);
      }
    }
  }
  
  // Trova appuntamento successivo DELLO STESSO GIORNO
  const sameDayNextAppointments = sortedAppointments.filter(
    (apt) => apt.date > slotDate && apt.date.toISOString().split('T')[0] === slotDay
  );
  
  if (sameDayNextAppointments.length > 0) {
    // C'è un appuntamento successivo nello stesso giorno - OTTIMO!
    const next = sameDayNextAppointments[0];
    try {
      const nextCustomer = await getCustomerById(next.customerId);
      if (nextCustomer?.latitude && nextCustomer?.longitude) {
        distanceToNext = calculateDistance(
          Number(nextCustomer.latitude),
          Number(nextCustomer.longitude),
          customerLat,
          customerLon
        );
      }
    } catch (error) {
      console.error("Error calculating distance to next:", error);
    }
  } else {
    // Nessun appuntamento successivo nello stesso giorno
    // Cerca il primo appuntamento del giorno successivo
    const allNextAppointments = sortedAppointments.filter(
      (apt) => apt.date > slotDate
    );
    if (allNextAppointments.length > 0) {
      const next = allNextAppointments[0];
      try {
        const nextCustomer = await getCustomerById(next.customerId);
        if (nextCustomer?.latitude && nextCustomer?.longitude) {
          const distance = calculateDistance(
            Number(nextCustomer.latitude),
            Number(nextCustomer.longitude),
            customerLat,
            customerLon
          );
          // Penalizza distanze tra giorni diversi (aggiungi 50 km virtuale)
          distanceToNext = distance + 50;
        }
      } catch (error) {
        console.error("Error calculating distance to next:", error);
      }
    }
  }
  
  return { distanceFromPrevious, distanceToNext };
}

// Funzione helper per calcolare distanza tra due clienti
export function getDistanceBetweenCustomers(
  customer1: Customer,
  customer2: Customer
): number | null {
  if (
    !customer1.latitude ||
    !customer1.longitude ||
    !customer2.latitude ||
    !customer2.longitude
  ) {
    return null;
  }
  
  return calculateDistance(
    Number(customer1.latitude),
    Number(customer1.longitude),
    Number(customer2.latitude),
    Number(customer2.longitude)
  );
}
