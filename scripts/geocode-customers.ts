import { getDb } from "../server/db";
import { customers } from "../drizzle/schema";
import { eq, isNull, or } from "drizzle-orm";

/**
 * Script per popolare coordinate GPS (latitude, longitude) di tutti i clienti
 * usando il servizio gratuito Nominatim OpenStreetMap.
 * 
 * Uso: pnpm tsx scripts/geocode-customers.ts
 */

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

async function geocodeAddress(address: string, city: string, postalCode?: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Costruisci query indirizzo completo
    const fullAddress = [address, city, postalCode, "Italia"].filter(Boolean).join(", ");
    
    // Nominatim richiede User-Agent
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "GestioneAppuntamentiTecnici/1.0",
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Errore HTTP ${response.status} per: ${fullAddress}`);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      console.warn(`⚠️  Nessun risultato per: ${fullAddress}`);
      return null;
    }

    const result = results[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
  } catch (error) {
    console.error(`❌ Errore geocoding per ${address}, ${city}:`, error);
    return null;
  }
}

async function main() {
  console.log("🌍 Inizio geocoding clienti...\n");

  // Trova tutti i clienti senza coordinate GPS
  const db = await getDb();
  if (!db) {
    console.error("❌ Database non disponibile!");
    return;
  }

  const customersWithoutCoords = await db
    .select()
    .from(customers)
    .where(or(isNull(customers.latitude), isNull(customers.longitude)));

  console.log(`📋 Trovati ${customersWithoutCoords.length} clienti senza coordinate GPS\n`);

  if (customersWithoutCoords.length === 0) {
    console.log("✅ Tutti i clienti hanno già coordinate GPS!");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const customer of customersWithoutCoords) {
    console.log(`\n🔍 Geocoding: ${customer.firstName} ${customer.lastName}`);
    console.log(`   Indirizzo: ${customer.address}, ${customer.city} ${customer.postalCode || ""}`);

    // Nominatim richiede 1 richiesta/secondo max (Usage Policy)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const coords = await geocodeAddress(customer.address, customer.city, customer.postalCode || undefined);

    if (coords) {
      // Aggiorna database
      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance
          .update(customers)
          .set({
            latitude: coords.lat.toString(),
            longitude: coords.lon.toString(),
          })
          .where(eq(customers.id, customer.id));
      }

      console.log(`   ✅ Coordinate salvate: ${coords.lat}, ${coords.lon}`);
      successCount++;
    } else {
      console.log(`   ❌ Geocoding fallito`);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 RISULTATI:`);
  console.log(`   ✅ Successo: ${successCount} clienti`);
  console.log(`   ❌ Falliti: ${failCount} clienti`);
  console.log(`\n✅ Geocoding completato!\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Errore fatale:", error);
    process.exit(1);
  });
