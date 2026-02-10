import { describe, it, expect } from 'vitest';

describe('Google Maps Geocoding API', () => {
  it('should validate API key with a test geocoding request', async () => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');

    // Test geocoding con indirizzo semplice
    const testAddress = 'Via Roma 1, Milano, Italia';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(testAddress)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    // Verifica che la richiesta sia andata a buon fine
    expect(data.status).toBe('OK');
    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
    
    // Verifica che abbiamo coordinate valide
    const location = data.results[0].geometry.location;
    expect(location.lat).toBeDefined();
    expect(location.lng).toBeDefined();
    expect(typeof location.lat).toBe('number');
    expect(typeof location.lng).toBe('number');
  }, 10000); // Timeout 10s per chiamata API esterna
});
