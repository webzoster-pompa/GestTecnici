# Design Sistema Gestione Appuntamenti Tecnici

## Panoramica

Sistema completo per la gestione di appuntamenti tecnici con circa 10.000 clienti, ottimizzazione automatica dei percorsi, notifiche automatiche e calendario condiviso.

## Architettura Sistema

### Componenti Principali

1. **Database PostgreSQL**
   - Tabella `customers`: 10.000+ clienti con dati anagrafici e geolocalizzazione
   - Tabella `appointments`: appuntamenti con stato, tecnico assegnato, note
   - Tabella `technicians`: tecnici con disponibilità e competenze
   - Tabella `notifications`: log notifiche email/WhatsApp inviate

2. **Backend API (Express + tRPC)**
   - Endpoint per gestione clienti (CRUD)
   - Endpoint per gestione appuntamenti (CRUD)
   - Algoritmo ottimizzazione percorsi (proposta 3 slot ottimali)
   - Sistema notifiche automatiche (email + WhatsApp)
   - Calcolo distanze tra indirizzi (geocoding)

3. **Interfaccia Web (React Native Web)**
   - Dashboard operatore per gestione chiamate
   - Form inserimento rapido dati cliente
   - Visualizzazione 3 slot proposti con mappa percorsi
   - Calendario settimanale completo
   - Gestione anagrafica clienti

4. **App Mobile (React Native - iOS/Android)**
   - Calendario settimanale tecnico
   - Dettagli appuntamenti giornalieri
   - Navigazione verso cliente
   - Notifiche push per nuovi appuntamenti

## Design Interfaccia Mobile (9:16 Portrait)

### Schermate Principali

#### 1. **Home - Calendario Giornaliero**
- Header: Data corrente, nome tecnico
- Lista appuntamenti del giorno (card verticali)
- Ogni card mostra: orario, nome cliente, indirizzo, tipo intervento
- Badge stato: "In attesa", "In corso", "Completato"
- Pulsante floating "+" per visualizzare settimana completa
- Colori: Verde per completati, Blu per in corso, Grigio per in attesa

#### 2. **Calendario Settimanale**
- Vista calendario con giorni della settimana
- Tap su giorno → lista appuntamenti di quel giorno
- Indicatori numerici su ogni giorno (es. "5 appuntamenti")
- Swipe orizzontale per cambiare settimana

#### 3. **Dettaglio Appuntamento**
- Nome cliente (grande, bold)
- Indirizzo completo con icona mappa
- Orario e durata stimata
- Note intervento
- Telefono cliente (tap to call)
- Pulsante "Naviga" (apre Google Maps/Apple Maps)
- Pulsante "Segna come completato"

#### 4. **Profilo Tecnico**
- Nome e foto tecnico
- Statistiche: appuntamenti completati oggi/settimana
- Impostazioni notifiche
- Logout

### Flussi Utente Principali (Mobile)

1. **Visualizzare appuntamenti giornalieri**
   - Apri app → Home screen con lista giornaliera

2. **Navigare verso cliente**
   - Home → Tap su appuntamento → Dettaglio → Tap "Naviga" → Apre navigatore

3. **Completare appuntamento**
   - Dettaglio appuntamento → Tap "Segna come completato" → Conferma → Torna a Home

4. **Visualizzare settimana**
   - Home → Tap "+" → Calendario settimanale → Tap giorno → Lista appuntamenti

## Design Interfaccia Web (Desktop)

### Schermate Principali

#### 1. **Dashboard Operatore**
- Layout a 3 colonne:
  - **Sinistra**: Form inserimento/ricerca cliente
  - **Centro**: 3 slot proposti con mappa percorsi
  - **Destra**: Calendario settimanale compatto

#### 2. **Form Inserimento Cliente (Colonna Sinistra)**
- Campo ricerca cliente (autocomplete)
- Se nuovo: campi rapidi (nome, cognome, telefono, indirizzo, email)
- Pulsante "Cerca slot disponibili"

#### 3. **Proposta Slot (Colonna Centro)**
- 3 card con slot proposti:
  - Data e orario
  - Tecnico assegnato
  - Distanza dall'appuntamento precedente (km)
  - Tempo stimato percorso
  - Mappa con percorso visualizzato
- Pulsante "Conferma" su ogni card

#### 4. **Calendario Settimanale (Colonna Destra)**
- Vista compatta settimana corrente
- Ogni giorno mostra numero appuntamenti
- Click su giorno → mostra dettagli in modal

#### 5. **Gestione Clienti**
- Tabella clienti con ricerca e filtri
- Colonne: nome, telefono, indirizzo, ultimo appuntamento
- Paginazione (100 clienti per pagina)
- Export Excel

### Flussi Utente Principali (Web)

1. **Ricevere chiamata e fissare appuntamento**
   - Operatore riceve chiamata
   - Cerca cliente o inserisce nuovo
   - Click "Cerca slot disponibili"
   - Sistema calcola 3 slot ottimali
   - Operatore propone al cliente
   - Cliente sceglie → Operatore conferma
   - Sistema invia notifica automatica

2. **Gestire anagrafica clienti**
   - Menu → Clienti → Tabella completa
   - Ricerca/filtra → Modifica dati → Salva

3. **Visualizzare calendario completo**
   - Dashboard → Click su giorno → Modal con dettagli
   - Possibilità di spostare/cancellare appuntamenti

## Algoritmo Ottimizzazione Percorsi

### Logica Proposta 3 Slot

1. **Input**: 
   - Indirizzo cliente da visitare
   - Data/ora richiesta (opzionale)
   - Tecnici disponibili

2. **Processo**:
   - Per ogni tecnico disponibile:
     - Recupera appuntamenti già fissati
     - Calcola slot liberi (es. 1h per appuntamento)
     - Per ogni slot libero:
       - Calcola distanza da appuntamento precedente
       - Calcola distanza verso appuntamento successivo
       - Assegna punteggio: minore distanza = punteggio migliore
   - Ordina slot per punteggio
   - Restituisce top 3 slot

3. **Output**:
   - Array di 3 oggetti con: data, ora, tecnico, distanza, punteggio

## Sistema Notifiche

### Email
- Conferma appuntamento (subito dopo conferma)
- Promemoria 24h prima
- Promemoria 2h prima

### WhatsApp
- Conferma appuntamento con dettagli
- Promemoria 24h prima
- Link per riprogrammare/cancellare

### Implementazione
- Cron job per controllo scadenze
- Tabella `notifications` per tracking invii
- Integrazione WhatsApp Business API (o alternativa)

## Colori Brand

- **Primario**: #0066CC (Blu professionale)
- **Secondario**: #00CC66 (Verde successo)
- **Background**: #FFFFFF (Bianco)
- **Surface**: #F5F5F5 (Grigio chiaro)
- **Testo**: #1A1A1A (Nero)
- **Testo secondario**: #666666 (Grigio)
- **Errore**: #CC0000 (Rosso)
- **Warning**: #FF9900 (Arancione)

## Icona App

- Simbolo: Calendario con chiave inglese sovrapposta
- Stile: Moderno, minimale, iconico
- Colori: Blu primario con accento verde
- Forma: Quadrata, riempimento completo

## Note Tecniche

- **Geocoding**: Usare API gratuita (Nominatim OpenStreetMap) per convertire indirizzi in coordinate
- **Calcolo distanze**: Formula Haversine per distanze in linea d'aria
- **Autenticazione**: Login tecnici con email/password
- **Sincronizzazione**: Real-time con polling ogni 30s per aggiornamenti calendario
- **Offline**: App mobile deve mostrare ultimo stato sincronizzato anche offline
