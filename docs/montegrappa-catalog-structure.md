# Struttura Catalogo Caminetti Montegrappa

## URL Base
- Login: https://ordini.caminettimontegrappa.it/login.jsp
- Selezione prodotti listino: https://ordini.caminettimontegrappa.it/productSelection.do?type=priceList

## Credenziali
- Username: 1203526
- Password: 78823056

## Struttura Gerarchica

### Brand: Caminetti Montegrappa

#### Categorie Prodotti (Products groups):
1. OPEN FIREPLACES (Caminetti aperti)
2. PELLET WATER BOILER (Caldaie a pellet)
3. PELLET-BURNING FIREPLACES (Caminetti a pellet)
4. PELLET-BURNING INSERTS (Inserti a pellet)
5. PELLET-BURNING STOVES (Stufe a pellet)
6. WOOD-BURNING FIREPLACES (Caminetti a legna)
7. WOOD-BURNING INSERTS (Inserti a legna)
8. WOOD-BURNING STOVES (Stufe a legna)

## Prossimi passi
- Esplorare una categoria per vedere i modelli
- Vedere come sono organizzati i pezzi di ricambio per modello
- Analizzare la struttura HTML per scraping automatico


## Esempio Listino Pezzi di Ricambio

### Modello: NIS9 EVO Wi-Fi (SERIES NIS EVO Wi-Fi - PELLET-BURNING STOVES)

URL: https://ordini.caminettimontegrappa.it/productSelection.do?selectorId=1036&level=4&type=priceList

#### Sezioni disponibili:
- **Products** (Prodotti completi)
- **Accessories** (Accessori)
- **Spare parts** (Pezzi di ricambio) ← La sezione che ci interessa
- **Claddings** (Rivestimenti)

#### Struttura tabella pezzi di ricambio:
| Colonna | Descrizione |
|---------|-------------|
| Image | Immagine del pezzo (link cliccabile) |
| Code | Codice articolo (es. 1010009000) |
| Description | Descrizione pezzo (es. "BEARING") |
| Serial N° | Numero seriale (vuoto per pezzi generici) |
| Price | Prezzo in EUR (es. 6.60) |
| F.P. | Flag (vuoto o icona per articoli esauriti) |

#### Esempi pezzi:
- `1010009000` - BEARING - €6.60
- `1121125601` - Bruciatore stufe plus verniciato - €76.00
- `1043030300` - Cable control board - €9.90
- `1042004400` - Clickson sensor 100 degrees - €12.00
- `1046202900M` - Pannello comandi touch retroilluminato - €151.00
- `1184018210` - Smoke exhauster TRIAL shaded poles - €122.00

#### Note:
- Prezzi aggiornati in tempo reale
- Alcuni articoli possono essere esauriti (icona rossa)
- Ogni pezzo ha un'immagine visualizzabile
- I codici sono univoci e consistenti

## Strategia di Integrazione

### Approccio 1: Scraping Automatico
1. Login automatico con credenziali
2. Navigazione gerarchica: Brand → Category → Series → Model → Spare parts
3. Estrazione dati da tabella HTML
4. Cache locale con aggiornamento periodico (es. giornaliero)

### Approccio 2: Import Manuale Periodico
1. Download manuale listini in formato Excel/PDF (se disponibile)
2. Import nel database dell'app
3. Aggiornamento manuale quando necessario

### Approccio 3: Ricerca On-Demand
1. Utente inserisce codice pezzo nell'app
2. App fa scraping in tempo reale per quel codice specifico
3. Mostra prezzo aggiornato
4. Cache temporanea (24h) per evitare troppe richieste

**Raccomandazione:** Approccio 3 (ricerca on-demand) per iniziare, poi eventualmente passare ad Approccio 1 se il volume di ricerche è alto.
