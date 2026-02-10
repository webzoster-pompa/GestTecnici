# Project TODO

## Database e Backend
- [x] Creare schema database per clienti (customers)
- [x] Creare schema database per appuntamenti (appointments)
- [x] Creare schema database per tecnici (technicians)
- [x] Creare schema database per notifiche (notifications)
- [x] API per CRUD clienti
- [x] API per CRUD appuntamenti
- [x] API per CRUD tecnici
- [x] Algoritmo ottimizzazione percorsi (proposta 3 slot)
- [x] Integrazione geocoding per calcolo distanze
- [x] Sistema notifiche email
- [x] Sistema notifiche WhatsApp
- [ ] Cron job per notifiche automatiche (placeholder implementato)

## Interfaccia Web (Desktop)
- [x] Dashboard operatore layout a 3 colonne
- [x] Form inserimento/ricerca cliente con autocomplete
- [x] Visualizzazione 3 slot proposti con dettagli
- [ ] Mappa percorsi per ogni slot
- [ ] Calendario settimanale compatto
- [ ] Pagina gestione anagrafica clienti con tabella
- [ ] Ricerca e filtri clienti
- [ ] Paginazione tabella clienti
- [ ] Export Excel clienti
- [ ] Modal dettagli giorno calendario

## App Mobile (iOS/Android)
- [x] Schermata Home con calendario giornaliero
- [x] Lista appuntamenti del giorno con card
- [x] Badge stato appuntamenti (in attesa/in corso/completato)
- [ ] Schermata calendario settimanale
- [ ] Swipe per cambiare settimana
- [ ] Schermata dettaglio appuntamento
- [x] Pulsante navigazione verso cliente (Google Maps/Apple Maps)
- [x] Pulsante "Segna come completato"
- [x] Tap to call cliente
- [ ] Schermata profilo tecnico con statistiche
- [ ] Sistema notifiche push
- [ ] Sincronizzazione dati ogni 30s

## Branding
- [x] Generare logo app (calendario + chiave inglese)
- [x] Aggiornare app.config.ts con nome app
- [x] Configurare colori brand nel theme

## Testing e Documentazione
- [x] Test algoritmo ottimizzazione percorsi
- [x] Test sistema notifiche
- [x] Test sincronizzazione mobile
- [x] Documentazione setup e deployment
- [x] Guida utente operatore web
- [x] Guida utente tecnico mobile
- [x] Popolamento database con dati di esempio

## Nuove Feature - Calendario Interattivo
- [x] Componente calendario settimanale con vista oraria
- [x] Sistema drag-and-drop per spostare appuntamenti
- [x] Aggiornamento API per modificare data/ora appuntamenti
- [x] Validazione sovrapposizioni appuntamenti
- [x] Feedback visivo durante drag
- [x] Conferma spostamento con toast notification

## Importazione Massiva Clienti da Excel
- [x] API backend per parsing file Excel (.xlsx)
- [x] Validazione formato colonne Excel
- [x] Importazione batch con transazioni
- [x] Geocodificazione automatica indirizzi durante import
- [x] Interfaccia upload file nella dashboard
- [x] Preview dati prima dell'importazione
- [x] Progress bar durante importazione
- [x] Report errori e successi post-importazione
- [x] Gestione duplicati (skip o aggiorna)
- [x] Download template Excel di esempio
- [x] Pulsante importazione nella dashboard operatore

## Storico Interventi Cliente
- [x] API backend per recupero storico appuntamenti per cliente
- [x] Ordinamento cronologico inverso (più recenti prima)
- [x] Filtri per periodo (ultimo mese, ultimi 3 mesi, ultimo anno, tutti)
- [x] Interfaccia visualizzazione storico nella dashboard
- [x] Card intervento con data, tecnico, servizio, durata
- [x] Indicatore visivo stato intervento (completato/cancellato)
- [x] Espandibile per vedere note dettagliate
- [x] Contatore totale interventi per cliente
- [x] Calcolo ultimo intervento automatico
- [x] Pulsante "Storico Interventi" quando cliente selezionato
- [x] Modal con statistiche riepilogative

## Ricerca Cliente per Telefono
- [x] Modifica API search per supportare ricerca per telefono
- [x] Normalizzazione numero telefono (rimozione spazi, trattini, prefissi)
- [x] Ricerca parziale numero telefono
- [x] Aggiornamento placeholder barra ricerca (già presente)
- [x] Test ricerca con vari formati telefono italiani

## Note Rapide Calendario
- [x] Visualizzazione note esistenti nelle card calendario
- [x] Click su card per attivare modalità edit note
- [x] Input inline per modificare note
- [x] Salvataggio note con pulsanti Salva/Annulla
- [x] API update appointment per modificare solo note (già esistente)
- [x] Indicatore visivo presenza note (sfondo giallo + icona 📝)
- [x] Limite caratteri note (100 caratteri)
- [x] Tooltip note complete su hover
- [x] Supporto tasti Enter (salva) ed Escape (annulla)
- [x] Prevenzione drag durante editing note

## Filtro Tecnici Calendario
- [x] Dropdown selezione tecnici sopra calendario
- [x] Checkbox multipla per selezionare più tecnici
- [x] Opzione "Tutti" per reset filtro
- [x] Filtro appuntamenti visualizzati in base a selezione
- [x] Persistenza selezione durante navigazione settimane

## Menu Contestuale Cambio Stato
- [x] Click destro su card appuntamento per aprire menu
- [x] Opzioni menu: Completato, In corso, Cancella
- [x] Aggiornamento stato con API update
- [x] Cambio colore card in base a nuovo stato
- [x] Conferma prima di cancellare appuntamento
- [x] Chiusura automatica menu dopo selezione
- [x] Hover effect su voci menu
- [x] Chiusura menu click fuori

## Export PDF Planning Giornaliero
- [x] Pulsante "Esporta PDF" nel calendario
- [x] Selezione data e tecnico per export
- [x] Generazione HTML con lista appuntamenti
- [x] Inclusione indirizzo, telefono, orario per ogni appuntamento
- [x] Statistiche riepilogative (totale appuntamenti, durata)
- [x] Intestazione con nome tecnico e data
- [x] Download automatico file HTML generato
- [x] Ordinamento appuntamenti per orario
- [x] Gestione caso nessun appuntamento

## Notifiche Push Tecnici
- [x] Setup Expo Notifications nell'app mobile
- [x] Registrazione token push device tecnico
- [x] Salvataggio token push nel database
- [x] API backend per invio notifiche push
- [x] Notifica nuovo appuntamento assegnato
- [x] Notifica modifica appuntamento esistente
- [x] Notifica cancellazione appuntamento
- [x] Notifica promemoria 30 min prima appuntamento
- [x] Tap notifica apre dettaglio appuntamento
- [x] Badge count appuntamenti del giorno

## Firma Digitale Cliente
- [x] Schermata dettaglio appuntamento nell'app tecnico
- [x] Canvas firma con react-native-signature-canvas
- [x] Pulsante "Richiedi Firma Cliente"
- [x] Salvataggio firma come immagine base64
- [x] Campo signatureUrl in database
- [x] Collegamento firma ad appuntamento
- [x] Visualizzazione firma salvata nella card
- [x] Pulsanti Salva/Cancella/Annulla
- [x] Timestamp firma automatico (signedAt)
- [x] Pulsante firma solo per appuntamenti completati

## Dashboard Statistiche Mensili
- [x] Tab "Statistiche" nella dashboard web
- [x] Selezione mese/anno con navigazione frecce
- [x] Statistiche per tecnico con progress bar
- [x] Card KPI: totale appuntamenti mese
- [x] Card KPI: tasso completamento
- [x] Card KPI: totale clienti serviti
- [x] Card KPI: durata media intervento
- [x] Confronto con mese precedente (+/- %)
- [x] API backend calcolo statistiche mensili
- [x] Conteggio appuntamenti per tecnico

## Autenticazione Tecnici App Mobile
- [x] Schermata login con email/password
- [x] API backend autenticazione tecnico
- [x] Salvataggio sessione con AsyncStorage
- [x] Collegamento tecnico loggato agli appuntamenti
- [x] Filtro automatico appuntamenti per tecnico loggato
- [x] Salvataggio automatico push token al login
- [x] Pulsante logout
- [x] Redirect automatico a login se non autenticato

## Export PDF Storico Interventi
- [x] Pulsante "Esporta PDF" nel modal storico
- [x] Generazione HTML con logo aziendale
- [x] Header con dati cliente
- [x] Tabella interventi con data, tecnico, servizio, note
- [x] Inclusione firme digitali come immagini
- [x] Footer con totali e statistiche
- [x] Download automatico file HTML generato
- [x] Nome file con formato "Storico_NomeCognome_Data.html"

## Gestione Tecnici Fissi
- [x] Pagina amministrazione tecnici nella dashboard web
- [x] Form inserimento/modifica tecnico (nome, telefono, targa furgone)
- [x] Lista tecnici con card dettagliate
- [x] Campi targa e modello furgone
- [x] Campo note e zone preferite
- [x] Tab dedicato "Tecnici" nella dashboard
- [x] Aggiornamento schema database con campi furgone
- [x] Pulsante modifica tecnico

## Export Excel Massivo
- [x] Pulsante "Esporta Tutto Excel" nella dashboard
- [x] Generazione Excel con foglio "Clienti"
- [x] Generazione Excel con foglio "Interventi"
- [x] Generazione Excel con foglio "Tecnici"
- [x] Colonne clienti: tutti i campi database
- [x] Colonne interventi: data, cliente, tecnico, servizio, durata, stato, note, firma
- [x] Formattazione date in formato italiano
- [x] Download automatico file .xlsx
- [x] Nome file con formato "Export_Completo_YYYY-MM-DD.xlsx"

## Report Mensile Automatico Email
- [x] Generazione HTML report mensile con statistiche
- [x] API endpoint per generazione report
- [x] Funzione cron job esecuzione primo giorno mese
- [x] Placeholder invio email automatico
- [x] Configurazione destinatario email amministratore
- [x] Statistiche appuntamenti, clienti serviti, performance tecnici
- [x] Confronto con mese precedente

## PWA (Progressive Web App)
- [x] Configurazione manifest.json
- [x] Implementazione service worker
- [x] Cache statica assets
- [x] Cache dinamica API responses
- [x] Strategia Network First per API
- [x] Strategia Cache First per assets
- [x] Icone app per installazione desktop
- [x] Shortcuts rapidi calendario e statistiche

## Backup Automatico Database
- [x] Script bash backup PostgreSQL dump
- [x] Configurazione cron job ore 2:00 AM
- [x] Salvataggio backup in /home/ubuntu/backups
- [x] Rotazione automatica backup 7 giorni
- [x] Compressione file backup (.gz)
- [x] Log operazioni in backup.log
- [x] Documentazione setup cron e ripristino

## Backup Selettivo Clienti
- [x] Interfaccia modal selezione clienti
- [x] Checkbox multipla selezione clienti
- [x] Export Excel clienti e appuntamenti
- [x] Salvataggio su percorso disco esterno configurabile
- [x] Cancellazione definitiva clienti dopo backup
- [x] Cancellazione cascata appuntamenti collegati
- [x] Conferma operazione con alert riepilogo
- [x] Pulsante rosso "Backup e Cancella" in dashboard

## Gestione Pagamenti App Mobile
- [x] Tabella database payments con campi customerId, amount, paymentMethod, paymentDate, notes
- [x] API backend CRUD pagamenti (create, getByCustomer, delete)
- [x] Sezione pagamenti nella scheda cliente mobile
- [x] Pulsante "Aggiungi Pagamento" nella scheda cliente
- [x] Modal form pagamento con campi importo, metodo, note
- [x] Selezione metodo pagamento (contanti/POS/bonifico/non pagato)
- [x] Validazione importo > 0
- [x] Salvataggio pagamento con collegamento a cliente e tecnico
- [x] Lista pagamenti esistenti con totale
- [x] Badge colorati per metodo pagamento
- [x] Visualizzazione data pagamento
- [x] Refresh automatico lista dopo salvataggio

## Promemoria WhatsApp Personalizzabili
- [ ] Checkbox "Invia promemoria WhatsApp" nella creazione appuntamento
- [x] Gestione 5 messaggi template personalizzabili
- [ ] Dropdown selezione messaggio da inviare
- [ ] Cron job controllo appuntamenti tra 2 giorni
- [ ] Invio automatico WhatsApp 2 giorni prima
- [x] Sostituzione variabili nel messaggio (nome cliente, data, ora, tecnico)
- [x] Interfaccia admin per creare/modificare template messaggi
- [ ] Preview messaggio prima invio
- [x] Schema database whatsapp_templates
- [x] Campi WhatsApp nello schema appointments
- [x] API backend CRUD template
- [x] 5 template predefiniti al seed

## Dashboard Amministratore
- [ ] Pagina admin separata con autenticazione
- [ ] Gestione utenti operatori (CRUD)
- [ ] Assegnazione ruoli e permessi
- [ ] Log accessi con timestamp e IP
- [ ] Configurazione credenziali email (SMTP)
- [ ] Configurazione credenziali WhatsApp Business API
- [ ] Monitoraggio performance sistema (CPU, RAM, disco)
- [ ] Statistiche real-time appuntamenti oggi
- [ ] Grafici utilizzo sistema ultimi 30 giorni

## Sistema Fatturazione Automatica
- [ ] Generazione fattura PDF da appuntamento completato
- [ ] Calcolo automatico costo intervento
- [ ] Calcolo IVA (22%)
- [ ] Numerazione progressiva fatture
- [ ] Dati azienda e cliente in fattura
- [ ] Invio email fattura al cliente
- [ ] Registro contabile mensile Excel
- [ ] Archivio fatture per anno
- [ ] Ricerca fatture per cliente/periodo
- [ ] Dashboard totali fatturato mensile/annuale

## App Tecnici Offline-First
- [ ] Salvataggio appuntamenti in AsyncStorage
- [ ] Sincronizzazione automatica quando online
- [ ] Indicatore stato connessione
- [ ] Coda operazioni pending offline
- [ ] Salvataggio note offline
- [ ] Salvataggio firma offline
- [ ] Upload firma quando torna online
- [ ] Conflict resolution sincronizzazione
- [ ] Badge count operazioni pending

## Completamento Integrazione WhatsApp
- [x] Checkbox "Invia promemoria WhatsApp" nel form creazione appuntamento
- [x] Dropdown selezione template WhatsApp
- [x] Salvataggio whatsappEnabled e whatsappTemplateId in appointments
- [x] Preview messaggio selezionato con variabili sostituite
- [x] Documentazione setup cron job ore 9:00
- [x] Logica invio automatico promemoria 2 giorni prima
- [x] Guida configurazione Windows Task Scheduler
- [x] Guida configurazione Linux crontab
- [ ] Implementazione script eseguibile (da completare in produzione)
- [ ] Log invii WhatsApp effettuati
- [ ] Gestione errori invio con retry

## Dashboard Amministratore Completa
- [x] Tab "⚙️ Amministrazione" nella dashboard
- [x] Interfaccia gestione template WhatsApp
- [x] Sezione configurazione WhatsApp Business API
- [x] Placeholder gestione utenti operatori
- [x] Placeholder log accessi sistema
- [x] Placeholder monitoraggio sistema
- [ ] Autenticazione separata admin (futuro)
- [ ] CRUD utenti operatori completo (futuro)
- [ ] Log accessi reale con database (futuro)
- [ ] Monitoraggio real-time CPU/RAM (futuro)

## Fix Routing Web vs Mobile
- [x] Modificare app/(tabs)/index.tsx per rilevare Platform.OS === 'web'
- [x] Mostrare OperatorDashboard su web
- [x] Mostrare TechnicianLogin solo su mobile

## Ottimizzazione Layout Dashboard Operatore
- [x] Ridurre larghezza colonna "Ricerca Cliente" (da 33% a 20%)
- [x] Ridurre larghezza colonna "Slot Proposti" (da 33% a 20%)
- [x] Espandere larghezza calendario settimanale (da 33% a 60%)
- [x] Verificare che tutti i 7 giorni della settimana siano visibili senza scroll orizzontale

## Bug Fix - Dashboard Operatore
- [x] Risolvere problema ricerca clienti (non trova clienti anche se esistono nel database)
- [ ] Migliorare ricerca per gestire caratteri accentati (es: Baù, Rosé, etc.)
- [ ] Verificare visibilità calendario nella dashboard (potrebbe essere fuori schermo)
- [x] Testare ricerca con nome cliente esistente
- [ ] Risolvere problema form "Nuovo Cliente" - pulsante Salva non funziona

## Bug Fix - Importazione Excel
- [ ] Risolvere parser Excel che non riconosce colonna "Nominativo"
- [ ] Testare importazione con file reale utente (5018 righe)
- [ ] Gestire split Nome/Cognome da colonna unica "Nominativo"

## Miglioramento UI - Ricerca Clienti
- [x] Mostrare città nei risultati di ricerca clienti (oltre a nome, telefono, indirizzo)

## Miglioramenti Calendario
- [x] Assegnare colore distintivo per ogni tecnico nelle card appuntamenti
- [x] Mostrare più informazioni nelle card (nome cliente, orario, servizio)
- [x] Modal dettaglio appuntamento con click su card
- [x] Nel modal mostrare: dati cliente completi, note, telefono, indirizzo, storia interventi

## Bug Critici - Appuntamenti e Route Optimizer
- [x] Correggere sovrapposizione appuntamenti (stesso tecnico, stessa ora)
- [x] Validare che nuovo appuntamento non si sovrapponga con esistenti
- [x] Correggere calcolo distanze route optimizer (attualmente restituisce sempre 0.0 km)
- [x] Migliorare algoritmo proposta slot per considerare percorsi ottimali

## Implementazione Geocoding Nominatim
- [x] Implementare funzione geocoding con API Nominatim (gratuita)
- [x] Integrare geocoding nell'importazione Excel
- [x] Integrare geocoding nella creazione manuale clienti
- [x] Integrare geocoding nella modifica clienti (ricalcola se indirizzo cambia)
- [ ] Testare calcolo distanze reali con coordinate geocodificate

## Bug Fix - Backup Clienti
- [x] Correggere backup che esporta solo 20 clienti invece di tutti
- [x] Modificato modal per usare list con limite 10000 invece di search con limite 20

## Feature - Slot Manuale
- [x] Aggiungere slot "Inserimento Manuale" nella sezione Slot Proposti
- [x] Form con campi: data, ora, durata, tecnico
- [x] Validazione sovrapposizioni anche per slot manuale (usa stessa validazione degli slot automatici)
- [x] Pulsante conferma per creare appuntamento con dati personalizzati

## Bug Fix - Cerca Slot Disponibili
- [x] Risolvere problema pulsante "Cerca Slot Disponibili" che non propone slot
- [x] Verificare query proposeSlots e handleFindSlots
- [x] Gestire caso cliente senza coordinate (usa coordinate default invece di errore)
- [x] Limitare slot generati a 10 per tecnico per evitare timeout
- [x] Testare con cliente selezionato

## Bug Fix - Slot Proposti
- [x] Slot già occupati vengono proposti (es: 14:00 già occupato ma appare negli slot)
- [x] Migliorare geocoding con fallback su città se indirizzo completo fallisce
- [x] Correggere validazione sovrapposizioni in generateAvailableSlots (esclusi appuntamenti cancellati)
- [ ] Slot sempre sullo stesso giorno (dovrebbero distribuirsi su più giorni)
- [ ] Distanze sempre 0.0 km (geocoding fallito per molti indirizzi)
- [ ] Conferma appuntamento non funziona (pulsante non salva)

## Requisiti Nuovi - Slot Proposti
- [x] Proporre 3 slot su 3 GIORNI DIVERSI (non 3 orari dello stesso giorno)
- [x] Se distanza > 20 km, mostrare warning "Distanza elevata"
- [x] Penalizzare slot con distanza > 20 km nello scoring (+1000 punti penalizzazione)

## Bug Critico - Cancellazione Appuntamenti
- [x] Appuntamenti cancellati rimangono visibili nel calendario
- [x] Slot cancellati rimangono bloccati (non si possono creare nuovi appuntamenti)
- [x] Filtro appuntamenti cancellati (status='cancelled') dal calendario

## Visualizzazione Coordinate nell'Anagrafica Cliente
- [x] Aggiungere campi latitudine e longitudine nel form anagrafica cliente
- [x] Permettere modifica manuale coordinate se geocoding fallisce
- [x] Mostrare coordinate esistenti quando si visualizza/modifica cliente

## Bug Fix - Validazione Email e Database
- [x] Correggere validazione email troppo restrittiva (rifiuta email valide come giannabaus4@gmail.com)
- [x] Verificare perché database mostra ancora 10,247 clienti dopo DELETE

## Bug Fix - Dashboard Amministratore Statistiche Errate
- [x] Correggere conteggio clienti totali (mostra 10,247 invece di 0)
- [x] Correggere conteggio appuntamenti mese (mostra 156 invece di 0)
- [x] Correggere conteggio tecnici attivi (mostra 3 invece di 2)

## Miglioramenti Dashboard Amministratore
- [x] Escludere appuntamenti cancellati dal conteggio statistiche mensili
- [x] Aggiungere auto-refresh dati quando si cambia tab (no F5 manuale)

## Bug Fix UX - Slot Proposti e Calendario
- [x] Filtrare slot proposti per escludere orari nel passato (es: propone ore 14:00 quando sono le 18:00)
- [x] Mostrare banner con cliente selezionato sopra "Slot Proposti" (es: "Prenotazione per: Mario Rossi - Vicenza")
- [x] Nel calendario mostrare nome CLIENTE + città invece del nome tecnico
- [x] Verificare calcolo distanze (0.0 km è corretto quando non ci sono appuntamenti vicini)

## Nuovo Layout Calendario - 2 Colonne per Tecnico
- [ ] Modificare layout calendario per mostrare 2 colonne per ogni giorno (una per tecnico)
- [ ] Assegnare colore verde a Luca Corsi e blu a Denis Corsi
- [ ] Rimuovere filtro tecnico (mostrare sempre entrambi)
- [ ] Implementare auto-refresh quando cambiano appuntamenti o tecnici
- [ ] Header colonne con nome tecnico e icona colore

## In Corso - Redesign Calendario
- [ ] Riscrivere struttura griglia per supportare 2 colonne per giorno
- [ ] Mappare colori tecnici (verde/blu)
- [ ] Rimuovere UI filtro tecnico
- [ ] Testare rendering appuntamenti in colonne separate

## Bug Fix Urgenti - Calendario e Filtri Slot
- [x] Calendario mostra solo "Cliente" invece di nome e città del cliente
- [x] Mancano filtri per scegliere tecnico prima di cercare slot
- [x] Manca filtro per scegliere durata intervento (30/60/90/120 min)

## Evidenziazione Giorni Non Lavorativi
- [x] Colorare domeniche in rosso nel calendario
- [x] Aggiungere lista festività italiane
- [x] Evidenziare festivi con sfondo rosso chiaro

## Bug Fix Urgenti - Slot Proposti e Distanze
- [ ] Slot proposti includono giorni festivi (es: 6 gennaio Epifania)
- [ ] Calcolo distanze mostra 11.2 km senza appuntamenti precedenti visibili

## Sistema Assenze Tecnici
- [ ] Creare tabella database technician_absences (technicianId, date, type, startTime, endTime)
- [ ] API per creare/modificare/eliminare assenze
- [ ] Menu contestuale tasto destro su header giorno per assenza giornata intera
- [ ] Menu contestuale tasto destro su cella oraria per assenza parziale
- [ ] Visualizzazione badge assenze nell'header calendario
- [ ] Sfondo colorato celle con assenze (giallo ferie, arancione malattia, azzurro permesso)
- [ ] Bloccare creazione appuntamenti in slot con assenze
- [ ] Filtrare slot proposti per escludere giorni/ore con assenze tecnico

## Scheda Cliente Completa - Fase 1: Anagrafica
- [ ] Creare componente CustomerDetailSheet
- [ ] Implementare card riepilogative in alto (Interventi, Apparecchi, Chiamate, Libretti, Contratti, Preventivi, Fatture)
- [ ] Form anagrafica completo con tutti i campi (nome, indirizzo, telefono, email, P.IVA, CF, IBAN, PEC, SDI, ecc.)
- [ ] Pulsanti azione rapida (Chiama, WhatsApp, Email, Mappa)
- [ ] Sezioni raggruppate (Dati Anagrafici, Dati Fiscali, Note, Coordinate)
- [ ] Integrazione apertura scheda da lista clienti
- [ ] Pulsanti Salva e Elimina

## Scheda Cliente Dettagliata (Customer Detail Sheet)
- [x] Componente CustomerDetailSheet con modal full-screen
- [x] Sezione Anagrafica con form completo
- [x] Estensione schema database con nuovi campi (province, zone, taxCode, vatNumber, iban, pec, sdiCode, referent)
- [x] Migrazione database con nuovi campi
- [x] Aggiornamento query SQL per includere nuovi campi
- [x] Pulsante "Scheda Cliente" nella dashboard operatore
- [x] Integrazione con dashboard operatore
- [ ] Card riepilogo: Interventi (conteggio e ultimo)
- [ ] Card riepilogo: Apparecchi (lista impianti)
- [ ] Card riepilogo: Chiamate (log telefonate)
- [ ] Card riepilogo: Libretti (manutenzione)
- [ ] Card riepilogo: Contratti (attivi/scaduti)
- [ ] Card riepilogo: Preventivi (in attesa/accettati)
- [ ] Card riepilogo: Fatture (pagate/da pagare)
- [ ] Pulsanti azione: Chiama, WhatsApp, Email, Vedi Mappa
- [ ] Form modifica dati cliente con salvataggio
- [ ] Pulsante elimina cliente con conferma
- [ ] Sezione Interventi con lista completa
- [ ] Sezione Apparecchi con CRUD
- [ ] Sezione Chiamate con log
- [ ] Sezione Libretti con gestione manutenzione
- [ ] Sezione Contratti con scadenzario
- [ ] Sezione Preventivi con stato
- [ ] Sezione Fatture con gestione pagamenti

## Miglioramenti Scheda Cliente
- [x] Layout card riepilogo in singola riga orizzontale con scroll
- [x] Ridurre dimensione card per renderle più compatte
- [x] Implementare form salvataggio dati cliente con API update
- [ ] Validazione campi form (email, telefono, codice fiscale, partita IVA, IBAN)
- [x] Pulsante "Chiama" con link tel:
- [x] Pulsante "WhatsApp" con link wa.me
- [x] Pulsante "Email" con link mailto:
- [x] Pulsante "Vedi Mappa" con Google Maps
- [x] Query database per conteggio interventi reali
- [ ] Query database per conteggio apparecchi
- [ ] Query database per conteggio chiamate
- [ ] Query database per conteggio libretti
- [ ] Query database per conteggio contratti
- [ ] Query database per conteggio preventivi
- [ ] Query database per conteggio fatture

## Gestione Apparecchi
- [x] Creare tabella "equipments" nel database
- [x] Campi: id, customerId, type, brand, model, serialNumber, installationDate, warrantyExpiry, notes
- [x] API CRUD per apparecchi (create, list, update, delete)
- [x] Componente lista apparecchi nella scheda cliente
- [x] Form aggiunta nuovo apparecchio
- [x] Form modifica apparecchio esistente
- [x] Pulsante elimina apparecchio con conferma
- [x] Collegare contatore card "Apparecchi"

## Gestione Chiamate
- [x] Creare tabella "calls" nel database
- [x] Campi: id, customerId, callDate, duration, outcome, notes, followUpDate, userId
- [x] API CRUD per chiamate (create, list, update, delete)
- [x] Componente lista chiamate nella scheda cliente
- [x] Form registrazione nuova chiamata
- [x] Filtri per esito chiamata (risposto, non risposto, occupato, follow-up)
- [x] Indicatore chiamate aperte vs chiuse
- [x] Collegare contatore card "Chiamate"

## Gestione Contratti
- [x] Creare tabella "contracts" nel database
- [x] Campi: id, customerId, contractNumber, type, startDate, endDate, renewalDate, status, amount, notes
- [x] API CRUD per contratti (create, list, update, delete)
- [x] Componente lista contratti nella scheda cliente
- [x] Form creazione nuovo contratto
- [x] Form modifica contratto esistente
- [x] Badge stato contratto (attivo, scaduto, in scadenza)
- [x] Alert contratti in scadenza (30 giorni)
- [ ] Collegamento contratto con interventi programmati
- [x] Collegare contatore card "Contratti"

## Gestione Libretti Impianto
- [x] Creare tabella "maintenance_books" nel database
- [x] Campi: id, customerId, equipmentId, bookNumber, issueDate, lastCheckDate, nextCheckDate, status, notes
- [x] API CRUD per libretti (create, list, update, delete)
- [x] Componente lista libretti nella scheda cliente
- [x] Form aggiunta nuovo libretto
- [x] Form modifica libretto esistente
- [x] Badge scadenza controlli (scaduto, in scadenza, ok)
- [x] Alert automatici per controlli in scadenza (30 giorni)
- [x] Collegare contatore card "Libretti Impianto"

## Gestione Preventivi Interni
- [x] Creare tabella "quotes" nel database
- [x] Campi: id, customerId, quoteNumber, date, validUntil, status, items (JSON), totalAmount, notes
- [x] Creare tabella "quote_items" per righe preventivo
- [x] API CRUD per preventivi (create, list, update, delete, send)
- [x] Componente lista preventivi nella scheda cliente
- [x] Form creazione preventivo con righe multiple
- [x] Calcolo automatico totali e IVA
- [x] Stati preventivo (bozza, inviato, accettato, rifiutato, scaduto)
- [ ] Generazione PDF preventivo
- [ ] Invio preventivo via email
- [x] Collegare contatore card "Preventivi"

## Report e Statistiche
- [ ] Creare pagina Dashboard Statistiche
- [ ] KPI: Interventi totali per periodo
- [ ] KPI: Clienti attivi vs totali
- [ ] KPI: Tecnici più produttivi (interventi completati)
- [ ] KPI: Contratti in scadenza (30/60/90 giorni)
- [ ] KPI: Fatturato stimato (da preventivi accettati)
- [ ] Grafico: Interventi per mese (ultimi 12 mesi)
- [ ] Grafico: Distribuzione interventi per tecnico
- [ ] Grafico: Tipologie intervento più frequenti
- [ ] Tabella: Top 10 clienti per numero interventi
- [ ] Export report in PDF/Excel

## Notifiche WhatsApp
- [ ] Configurare API WhatsApp Business
- [ ] Template messaggio promemoria appuntamento
- [ ] Invio automatico 24h prima appuntamento
- [ ] Log invii WhatsApp nel database
- [ ] Gestione errori invio
- [ ] Pannello configurazione template messaggi
- [ ] Test invio manuale WhatsApp
- [ ] Statistiche invii WhatsApp (inviati, falliti, letti)

## Gestione Documenti
- [x] Creare tabella "documents" nel database
- [x] Campi: id, customerId, appointmentId, type, filename, fileUrl, uploadDate, notes
- [x] API upload documenti (con S3 o storage locale)
- [x] API list/download/delete documenti
- [x] Componente upload documenti nella scheda cliente
- [x] Categorie documenti (foto intervento, certificato, contratto, altro)
- [ ] Anteprima immagini/PDF
- [x] Download documenti
- [x] Collegamento documenti agli interventi
- [ ] Galleria foto intervento

## Bug Fix
- [x] Documentazione completa Scheda Cliente creata
- [ ] Correggere funzionalità ricerca clienti nella dashboard
- [ ] Verificare che il pulsante Scheda Cliente appaia quando un cliente è selezionato

## Correzioni e Miglioramenti Ricerca Clienti
- [x] Correggere bug ricerca clienti che non mostra risultati
- [x] Aggiungere ricerca per indirizzo completo
- [x] Aggiungere ricerca per numero di telefono
- [x] Implementare controllo duplicati prima inserimento nuovo cliente
- [x] Mostrare alert se cliente già esistente con stesso telefono/email
- [x] Funzionalità eliminazione cliente dal database con conferma
- [ ] Verificare eliminazione cascata (apparecchi, chiamate, contratti, ecc.)

## Dashboard Report e Statistiche
- [ ] Creare componente StatisticsDashboard con grafici
- [ ] KPI: Interventi totali per mese (grafico a barre)
- [ ] KPI: Fatturato mensile (grafico lineare)
- [ ] KPI: Tecnici più produttivi (grafico a torta)
- [ ] KPI: Contratti in scadenza (lista con alert)
- [ ] KPI: Clienti attivi vs inattivi
- [ ] Filtri per periodo (ultimo mese, trimestre, anno)
- [ ] Export report in PDF/Excel

## Notifiche WhatsApp Automatiche
- [x] Integrazione API WhatsApp Business (struttura base)
- [x] Template messaggio promemoria appuntamento
- [ ] Invio automatico 24h prima dell'appuntamento (TODO backend)
- [x] Configurazione numero WhatsApp Business
- [ ] Log invii WhatsApp (successo/fallimento)
- [ ] Possibilità di disabilitare notifiche per singolo cliente
- [x] Test invio WhatsApp manuale (UI pronta)

## App Mobile Tecnici
- [x] Creare nuova tab "Tecnici" nella tab bar
- [x] Schermata base con selezione tecnico
- [x] Visualizzazione appuntamenti giornalieri del tecnico loggato
- [x] Lista appuntamenti con orario, cliente, indirizzo
- [x] Pulsante check-in con rilevazione GPS automatica
- [x] Pulsante check-out con calcolo durata intervento
- [x] Upload foto interventi (max 5 foto per intervento)
- [x] Anteprima foto caricate con possibilità eliminazione
- [x] Campo note rapide per intervento
- [x] Pulsante "Completa Intervento" con conferma
- [x] Salvataggio automatico GPS, foto e note nel database
- [x] Badge stato intervento (da iniziare, in corso, completato)
- [x] Navigazione Google Maps per raggiungere cliente

## Bug Fix Autenticazione
- [ ] Disabilitare autenticazione OAuth in modalità sviluppo
- [ ] Permettere accesso diretto alla dashboard senza login
- [ ] Testare accesso da Expo Go senza credenziali

## Semplificazione Interfaccia Mobile Tecnici
- [x] Rimuovere selezione tecnico (login automatico)
- [x] Mostrare solo lista appuntamenti del giorno corrente
- [x] Card appuntamento con: nome cliente, indirizzo, orario
- [x] Pulsante "Arrivato dal Cliente" (verde) con GPS automatico
- [x] Pulsante "Finito Lavoro" (rosso) con calcolo tempo automatico
- [ ] Accesso rapido scheda cliente da ogni appuntamento
- [x] Rimuovere upload foto e note (troppo complesso per v1)
- [x] Badge stato semplificato (Da fare, In corso, Completato)
- [x] Contatore tempo trascorso in tempo reale
- [x] Pulsante navigazione Google Maps

## Miglioramenti App Mobile Tecnici
- [x] Filtro giorno/settimana per visualizzazione appuntamenti
- [x] Pulsanti toggle "Oggi" e "Settimana" in header
- [x] Integrazione Google Maps con Linking API
- [x] Pulsante navigazione apre Google Maps nativo
- [x] Aggiornamento real-time calendario PC al completamento intervento
- [x] Invalidazione query tRPC per refresh automatico

## Bug Fix Filtro Settimana
- [x] Correggere calcolo date settimana corrente (lunedì-domenica)
- [x] Appuntamenti fuori range non devono essere mostrati
- [x] Testare con appuntamenti in settimane diverse

## Verifica e Dati Demo
- [x] Verificare appuntamenti esistenti nel database per tecnico ID 1
- [x] Creare 4 appuntamenti demo per settimana corrente (6, 7, 8 gennaio)
- [x] Testare filtro Oggi e Settimana con dati reali

## Bug Filtro Settimana App Mobile
- [ ] Appuntamento 2 gennaio appare in settimana 4-10 gennaio
- [ ] Nuovi appuntamenti creati non vengono mostrati
- [ ] Verificare query API listByTechnician
- [ ] Verificare filtro date nel backend

## Debug Query listByTechnician
- [ ] Aggiungere console.log nel backend per vedere parametri query
- [ ] Verificare che i 4 nuovi appuntamenti (6-8 gen) vengano restituiti
- [ ] Risolvere problema "Invalid Date" nell'interfaccia

## Debug Query listByTechnician - App Mobile Tecnici
- [x] Aggiungere console.log nel backend per vedere parametri query
- [x] Verificare che i 4 nuovi appuntamenti (6-8 gen) vengano restituiti
- [x] Risolvere problema "Invalid Date" nell'interfaccia
- [x] Eliminare appuntamenti con date errate (2026 invece di 2025)
- [x] Creare 4 appuntamenti demo per settimana 6-8 gennaio 2025

## Scheda Cliente Mobile Tecnici
- [x] Modal scheda cliente con dati completi
- [x] Visualizzazione storico interventi passati
- [x] Note appuntamento corrente (cosa fare oggi)
- [x] Pulsante chiama cliente
- [ ] Pulsante navigazione Google Maps
- [x] Click su nome cliente per aprire scheda

## Navigazione Settimane App Mobile
- [x] Stato per offset settimana (precedente/successiva)
- [x] Pulsanti freccia sinistra/destra per navigare
- [x] Aggiornare label "Settimana X - Y" dinamicamente
- [x] Ricaricare appuntamenti quando cambia settimana

## Bug da Risolvere - Dashboard Operatore
- [x] Inserimento manuale appuntamento: campo durata (minuti) non modificabile
- [x] Scheda Cliente - Modifica: campo provincia non viene salvato
- [x] Scheda Cliente - Modifica: campo codice fiscale non viene salvato
- [x] Verificare che il pulsante "Salva modifiche" funzioni correttamente

## Bug Esportazione PDF Calendario
- [x] Verificare funzione esportazione PDF nel calendario settimanale (usato tRPC invece di fetch)
- [x] Testare che il PDF venga generato correttamente con tutti gli appuntamenti
- [x] Risolvere problema timezone nel campo data (shift di un giorno)
- [x] Campo data ora modificabile correttamente tramite calendario

## Sistema Timbratura Giornaliera con GPS
- [x] Creare tabella `time_entries` nel database (technicianId, date, type, timestamp, latitude, longitude, isRemote, remoteReason)
- [x] Configurare coordinate sede (Via Andrea Palladio 2, Romano d'Ezzelino) - Lat: 45.7801155, Lon: 11.7564534
- [x] Implementare funzione calcolo distanza GPS (raggio 50m) - Formula Haversine
- [x] Route backend: timbratura con validazione GPS
- [x] Route backend: lista timbrature giornaliere per tecnico
- [x] Route backend: report giornaliero con ore totali
- [x] UI app mobile: schermata timbratura con 4 pulsanti (Inizio/Pausa/Ripresa/Fine)
- [x] UI app mobile: mostrare stato corrente (es. "In pausa dalle 12:30")
- [x] UI app mobile: modal nota obbligatoria se fuori sede
- [x] Dashboard operatore: sezione timbrature tempo reale con aggiornamento automatico ogni 10s
- [x] Dashboard operatore: report giornaliero stampabile PDF
- [x] Calcolo automatico ore lavorate (escluse pause)

## Ottimizzazione Export PDF Planning
- [x] Modificare layout PDF per stampa A4 verticale
- [x] Aggiungere CSS @page con margini ottimizzati
- [x] Ridurre font size per contenere tutto su una pagina
- [x] Ridurre padding e margini per massimizzare spazio
- [x] Ottimizzare font size (header 22px, appuntamenti 11-13px)
- [x] Margini pagina: 15mm top/bottom, 10mm left/right

## Adattamento Dinamico PDF Planning
- [x] Calcolare altezza dinamica caselle in base a numero appuntamenti
- [x] Rimuovere footer "Documento generato il..." per risparmiare spazio
- [x] Espandere caselle per riempire tutta la pagina A4
- [x] Aggiungere spazio note scritte a mano in ogni casella
- [x] Usare flexbox per distribuire altezza equamente tra appuntamenti

## Verifica e Correzione PDF Export
- [x] Verificare che footer sia stato effettivamente rimosso
- [x] Verificare che layout dinamico funzioni correttamente
- [x] Riavviare server per caricare modifiche
- [ ] Testare export con 5 appuntamenti reali dal browser

## Vista Calendario Giornaliero con Colonne Tecnici
- [x] Creare componente DailyCalendarView con layout a colonne
- [x] Una colonna per ogni tecnico (Luca Corsi, Denis Corsi)
- [x] Griglia oraria 8:00-18:00 con slot da 30 minuti
- [x] Sistema colori per stati: scheduled (blu), in_progress (arancione), completed (verde), cancelled (rosso)
- [x] Drag and drop appuntamenti tra tecnici e orari
- [x] Navigazione giorno precedente/successivo + pulsante Oggi
- [x] Supporto appuntamenti sovrapposti alla stessa ora per tecnici diversi
- [x] Integrare nella dashboard operatore sostituendo vista settimanale
- [x] Legenda colori stati nella parte superiore
- [x] Card appuntamenti con durata variabile (altezza proporzionale)

## Calendario Settimanale Multi-Tecnico (Correzione)
- [x] Modificare layout: colonne = giorni settimana, righe = ore
- [x] Supportare più appuntamenti (tecnici diversi) nella stessa cella
- [x] Aggiungere toggle vista: Mese / Settimana / Lista / Giorno
- [x] Mantenere colori per stato appuntamenti
- [x] Drag and drop tra giorni e orari
- [x] Visualizzare iniziali tecnico (LC/DC) in badge su ogni card
- [x] Gestire festività italiane con sfondo rosso
- [x] Legenda colori stati

## Click Scheda Cliente dal Calendario
- [x] Aggiungere onClick su card appuntamento calendario
- [x] Passare customerId e customerName tramite callback
- [x] Aprire pannello CustomerHistory nella dashboard
- [x] Gestire conflitto tra drag e click (ignora click durante drag)

## Correzione Click Calendario - Scheda Cliente Completa
- [x] Modificare callback per aprire CustomerDetailSheet invece di CustomerHistory
- [x] Ora click su card calendario apre scheda completa con anagrafica + storico

## Storico Interventi in CustomerDetailSheet
- [x] Verificare contenuto attuale CustomerDetailSheet
- [x] Aggiungere componente CustomerHistory nella scheda
- [x] Creare nuova sezione 'Interventi' con tab dedicato
- [x] Aggiungere onClick sulla card Interventi per aprire sezione
- [x] Integrare CustomerHistory con customerId e customerName
- [x] Posizionare tab Interventi dopo Anagrafica

## Sistema Pagamenti e Notifiche Fattura
- [x] Aggiungere campo paymentMethod al database (cash, pos, transfer, unpaid)
- [x] Aggiungere campo invoiceStatus (pending, issued, sent)
- [x] Aggiungere campi paymentAmount, invoiceNumber, invoicedAt
- [x] Modificare schema appointments con nuovi campi
- [x] Eseguire migrazione database (0012_crazy_karma.sql)
- [x] Aggiungere modal selezione pagamento in app mobile alla chiusura
- [x] Modal con 4 opzioni: Contanti, POS, Bonifico, Non Pagato
- [x] Campo input importo opzionale
- [x] Aggiornare handleMarkCompleted per aprire modal
- [x] Creare handlePaymentSubmit per salvare pagamento e stato fattura
- [x] Creare componente notifiche fatture in attesa su dashboard
- [x] Implementare animazione lampeggiante per notifiche urgenti
- [x] Aggiungere badge conteggio fatture da emettere
- [x] Creare query getPendingInvoices nel backend
- [x] Integrare PendingInvoicesAlert nella dashboard operatore
- [x] Posizionare notifica fixed in alto a destra con z-index 1000
- [x] Refresh automatico ogni 30 secondi
- [x] Testare flusso completo: chiusura → pagamento → notifica

## Tab Fatture Dashboard
- [x] Creare componente InvoicesManager
- [x] Lista interventi completati con fattura pending
- [x] Card con: Data, Cliente, Tecnico, Importo, Metodo Pagamento
- [x] Filtri per metodo pagamento (tutti/contanti/POS/bonifico/non pagato)
- [x] Filtro per periodo (oggi/settimana/mese)
- [x] Pulsante "Segna come Fatturata" per ogni card
- [x] Modal per inserire numero fattura Danea
- [x] Aggiornare invoiceStatus da pending a issued
- [x] Salvare invoiceNumber e invoicedAt
- [x] Badge totale importo da fatturare
- [x] Badge conteggio fatture in attesa
- [x] Integrare tab Fatture nella dashboard operatore
- [x] Aggiungere pulsante tab "📄 Fatture" dopo Timbrature
- [x] Rendering InvoicesManager nel content area
- [x] Testare flusso completo gestione fatture

## Sezione Chiamate (Call Center)
- [x] Creare tabella database calls
- [x] Campi: id, customerId, callDate, customerPhone, customerName, devices, callType, description, notes, technicianId, status, appointmentDate, createdAt, updatedAt
- [x] Campi aggiuntivi: customerAddress, customerCity, customerPostalCode, customerZone, userId
- [x] Stati: waiting_parts (In Attesa Pezzi), info_only (Solo Info), completed (Concluso), appointment_scheduled (Fissato Appuntamento)
- [x] Migrazione database completata
- [x] Creare componente CallsManager con tabella completa
- [x] Pulsante "➞ Nuova Chiamata" in alto
- [x] Pulsante "Chiamate Aperte" per filtrare solo attive
- [x] Filtri: Cerca per città, Cerca chiamata, Stato chiamata
- [x] Colonne tabella: Azioni, Data chiamata, Cliente, Apparecchi, Città, Indirizzo, Telefono, Tipo intervento, Descrizione, Note, Tecnico, Stato
- [x] Aggiungere route backend: list, create, update, delete, searchCustomerByPhone
- [ ] Modal "Nuova Chiamata" con form completo
- [ ] Ricerca automatica cliente per telefono/nome
- [ ] Se cliente esiste → pre-compila dati (nome, indirizzo, città, telefono)
- [ ] Se cliente nuovo → form completo per creazione
- [ ] Dropdown stati chiamata con 4 opzioni
- [ ] Quando stato diventa "Fissato Appuntamento" → rimuovi da elenco automaticamente
- [ ] Azioni per ogni riga: Modifica ✏️, Scheda Cliente 👤
- [ ] Export Excel chiamate
- [ ] Integrare tab Chiamate nella dashboard
- [ ] Testare flusso completo: nuova chiamata → modifica → fissa appuntamento → rimozione automatica


## Completamento Sezione Chiamate
- [x] Implementare modal Nuova Chiamata con form completo
- [x] Input telefono con ricerca automatica cliente
- [x] Se cliente esiste → pre-compila nome, indirizzo, città, CAP, zona (campi readonly)
- [x] Se cliente nuovo → permetti inserimento dati completi
- [x] Campi: telefono, nome, indirizzo, città, CAP, zona, apparecchi, tipo intervento, descrizione, note, tecnico, stato
- [x] Pulsante "Salva Chiamata" per creare record nel database
- [x] Indicatore visivo cliente trovato (sfondo verde + messaggio)
- [x] Aggiungere tab "📞 Chiamate" nella dashboard operatore dopo Fatture
- [x] Import CallsManager in operator-dashboard
- [x] Aggiornare type activeTab con "calls"
- [x] Aggiungere pulsante tab dopo Fatture
- [x] Rendering CallsManager nel content area
- [x] Implementare logica rimozione automatica: quando si crea appuntamento, aggiornare stato chiamata a "appointment_scheduled"
- [x] Aggiungere import ne, calls da drizzle-orm e schema
- [x] Aggiornare route appointments.create per aggiornare chiamate aperte
- [x] Testare flusso completo: Nuova Chiamata → Fissa Appuntamento → Chiamata rimossa da elenco attivo


## Pulsante Fissa Appuntamento nelle Chiamate
- [x] Aggiungere pulsante "📅 Fissa Appuntamento" nella colonna Azioni di ogni chiamata
- [x] Creare modal AppointmentFromCall con form creazione appuntamento
- [x] Pre-compilare customerId, nome cliente, telefono, indirizzo dalla chiamata
- [x] Permettere selezione tecnico, data, ora, durata, tipo servizio, note
- [x] Alla conferma: creare appuntamento (logica backend già aggiorna stato chiamata)
- [x] Mostrare info cliente in card riepilogativa nel modal
- [x] Testare flusso completo: Chiamata → Fissa Appuntamento → Appuntamento creato + Chiamata rimossa da elenco


## Miglioramenti Gestione Chiamate

### Notifica WhatsApp Automatica
- [x] Aggiungere checkbox "Invia conferma WhatsApp" nel modal Fissa Appuntamento
- [x] Checkbox attivo per default con sfondo verde quando selezionato
- [x] Passare whatsappEnabled al createAppointmentMutation
- [x] Sistema backend esistente già gestisce invio notifiche (sendAppointmentNotifications)

### Modal Modifica Chiamata
- [x] Aggiungere funzionalità al pulsante ✏️ per aprire modal modifica
- [x] Creare componente EditCallModal con form pre-compilato
- [x] Permettere modifica: stato, note, tecnico, descrizione, tipo intervento
- [x] Campi cliente (telefono, nome, indirizzo) readonly in card riepilogativa
- [x] Pulsante "Salva Modifiche" per aggiornare chiamata
- [x] Selezione stato con colori distintivi per ogni opzione

### Filtro Tecnico
- [x] Aggiungere filtro selezione tecnico sopra tabella chiamate
- [x] Opzioni: "Tutti", "Luca Corsi", "Denis Corsi", ecc.
- [x] Filtrare chiamate per technicianId selezionato
- [x] Pulsanti con stile attivo/inattivo per selezione rapida
- [x] Conteggio chiamate filtrate già presente nel badge totale


## Menu Dropdown Amministrazione
- [x] Creare componente dropdown menu in alto a destra dashboard
- [x] Pulsante "⚙️ Menu ▾" per aprire/chiudere menu
- [x] Voci menu: Statistiche, Tecnici, Amministrazione
- [x] Click su voce → cambia activeTab e chiude menu automaticamente
- [x] Rimuovere pulsanti Amministrazione, Tecnici, Statistiche dalla barra tab
- [x] Mantenere solo tab operativi: Dashboard, Timbrature, Fatture, Chiamate
- [x] Dropdown con shadow, bordi arrotondati e sfondo evidenziato per voce attiva
- [x] Posizionamento assoluto con z-index 1000 per sovrapporsi al contenuto


## Fix Menu Dropdown Non Si Apre
- [x] Verificare stato showAdminMenu e toggle
- [x] Controllare rendering condizionale del dropdown
- [x] Aggiungere console.log per debug click
- [x] Aumentare z-index contenitore a 2000
- [x] Testare click sul pulsante Menu dopo modifiche
- [x] Verificato: click funziona, stato cambia correttamente
- [x] Problema: dropdown renderizzato ma nascosto/tagliato
- [x] Cambiato position da absolute a fixed
- [x] Posizionamento fisso: top 60px, right 10px


## Posizionamento Dinamico Menu Dropdown
- [x] Usare useWindowDimensions per ottenere dimensioni schermo
- [x] Usare onLayout sul pulsante menu per ottenere posizione esatta
- [x] Calcolare posizione dropdown dinamicamente (sotto pulsante, allineato a destra)
- [x] Gestire overflow su schermi piccoli (Math.min per right position)
- [x] Condizione rendering: showAdminMenu && menuButtonLayout
- [ ] Testare su desktop, tablet e mobile


## Correzione Errori TypeScript Backend
- [x] Correggere errore 'db' is possibly 'null' in server/routers.ts (aggiunto null check a tutti i getDb())
- [x] Correggere errore Cannot find name 'customers' (aggiunto import customers da schema)
- [x] Ridotto da 35 a 28 errori TypeScript
- [x] Testare visualizzazione appuntamenti nel calendario - FUNZIONA

## Modifica Visualizzazione Appuntamenti App Mobile
- [x] Sostituire orario e durata prevista con data completa (giorno, mese, anno)
- [x] Aggiungere visualizzazione tempo effettivo per interventi completati
- [x] Formattare data in italiano (es. "5 gennaio 2026")
- [x] Mostrare tempo effettivo solo se status = completed e actualDuration disponibile
- [x] Mantenere orario appuntamento accanto alla data

## Bug Fix - Ricerca Clienti Dashboard
- [x] Correggere errore "ActivityIndicator is not defined" in operator-dashboard.tsx
- [x] Aggiungere import ActivityIndicator da react-native
- [x] Testare ricerca clienti funzionante

## Bug Fix - Salvataggio Chiamate
- [x] Verificare errore "Errore durante il salvataggio della chiamata"
- [x] Controllare log backend per identificare causa (Unknown column 'customerName')
- [x] Correggere errore nel database o API (rimosso casting date non necessario)
- [x] Bug persiste - verificare dati inviati dal frontend
- [x] Aggiungere logging per debug
- [x] Trovato problema: colonne mancanti nella tabella calls del database
- [x] Aggiunto colonne customerName, customerPhone, customerAddress, ecc. con ALTER TABLE
- [x] Testare salvataggio chiamata funzionante

## Bug Fix - Schema Database Calls (Valori NULL)
- [x] Problema: colonne con default non accettano NULL quando campo non specificato
- [x] Aggiunta colonna status mancante (ENUM con default 'info_only')
- [x] Modificare colonne customerZone, devices, notes, technicianId per accettare NULL
- [x] Modificate tutte le colonne opzionali per accettare NULL
- [x] Testare salvataggio chiamata con campi opzionali vuoti

## Bug Fix - Ricerca Automatica Cliente e Salvataggio Chiamate
- [x] Ricerca automatica cliente per telefono non funziona (non succede nulla)
- [x] Verificare logica handlePhoneChange e searchCustomerQuery
- [x] Corretto: query ora abilitata quando phone.length >= 8
- [x] Aggiunto useEffect per pre-compilare dati automaticamente
- [x] Modificato customerId per accettare NULL (clienti nuovi)
- [x] Testare ricerca con numero esistente (es. 3287632299)
- [x] Verificare salvataggio chiamata dopo correzioni database
- [x] Testare salvataggio con cliente nuovo vs cliente esistente

## Feature - Indicatore Visivo Ricerca Cliente
- [x] Mostrare icona di caricamento durante ricerca cliente
- [x] Aggiungere messaggio "Ricerca in corso..." accanto a label Telefono
- [x] Nascondere indicatore quando ricerca completata
- [x] Aggiunto useEffect per sincronizzare isSearching con searchCustomerQuery.isLoading
- [x] Testare feedback visivo funzionante

## Feature - Calendario Multi-Colonna per Tecnico
- [x] Modificare layout calendario settimanale
- [x] Creare due colonne per ogni giorno (una per Luca Corsi, una per Denis Corsi)
- [x] Escludere domenica dal calendario (6 giorni: lunedì-sabato)
- [x] Mostrare header con nome tecnico sopra ogni colonna (Luca C. | Denis C.)
- [x] Filtrare appuntamenti per tecnico assegnato in ogni colonna (technicianId 1 e 2)
- [x] Cambiare granularità da 1 ora a 30 minuti (8:00, 8:30, 9:00, ...)
- [x] Aggiornare funzione handleDrop per supportare minuti
- [x] Testare visualizzazione con appuntamenti di entrambi i tecnici

## Bug Fix - Assegnazione Tecnici e Colori Calendario
- [x] Problema: appuntamenti 12 gennaio entrambi nella colonna Luca (stesso colore blu)
- [x] Verificare technicianId appuntamenti nel database
- [x] Correggere appuntamento ore 14:00 → assegnare a Denis (technicianId = 2)
- [x] Implementare colori diversi per tecnico (blu #0066CC per Luca, verde #00AA66 per Denis)
- [x] Aggiunta funzione getTechnicianColor per assegnare colori in base a technicianId
- [x] Modificato rendering appuntamenti per usare colore tecnico invece di status
- [x] Testare che appuntamenti appaiano nelle colonne corrette

## Feature - Sfondo Colorato Colonne Tecnici
- [x] Applicare sfondo azzurro chiaro (#E6F2FF) per colonne Luca Corsi
- [x] Applicare sfondo verde chiaro (#E6FFF2) per colonne Denis Corsi
- [x] Testare distinzione visiva migliorata

## Feature - Creazione Rapida Appuntamento da Calendario
- [x] Rendere celle vuote cliccabili (trasformate View in TouchableOpacity)
- [x] Implementato onPress che registra data, ora e tecnico
- [x] Al click su cella vuota, aprire modal creazione appuntamento
- [x] Pre-compilare data, ora e tecnico in base a cella selezionata
- [x] Creato modal semplificato con preview dati precompilati
- [ ] Integrare form completo con selezione cliente, tipo intervento, note (TODO)
- [x] Testare apertura modal e preview dati

## Feature - Drag & Drop tra Colonne Tecnici
- [x] Aggiornare handleDrop per supportare cambio tecnico
- [ ] Implementare onDrop handler sulle celle (richiede gestione drag & drop nativa)
- [ ] Permettere drop su colonna diversa da quella di partenza
- [ ] Testare riassegnazione tecnico tramite drag & drop (TODO: richiede implementazione completa)

## Feature - Form Completo Creazione Appuntamento
- [ ] Aggiungere ricerca cliente con autocomplete nel modal
- [ ] Campo selezione tipo intervento (dropdown con opzioni)
- [ ] Campo durata prevista (input numerico in minuti)
- [ ] Campo note (textarea)
- [ ] Campo indirizzo (pre-compilato se cliente trovato)
- [ ] Collegare a mutation trpc appointments.create
- [ ] Validazione campi obbligatori prima del salvataggio
- [ ] Chiudere modal e aggiornare calendario dopo salvataggio
- [ ] Testare creazione appuntamento completa

## Feature - Modal Modifica Rapida Appuntamento
- [ ] Rendere appuntamenti esistenti cliccabili nel calendario
- [ ] Aprire modal modifica al click su appuntamento
- [ ] Pre-compilare tutti i campi con dati appuntamento esistente
- [ ] Permettere modifica tecnico, orario, stato, note
- [ ] Collegare a mutation trpc appointments.update
- [ ] Aggiornare calendario dopo modifica
- [ ] Testare modifica appuntamento

## Feature - Filtro Tecnico nel Calendario
- [ ] Aggiungere toggle/pulsanti sopra calendario per filtro tecnico
- [ ] Opzioni: "Tutti" | "Solo Luca" | "Solo Denis"
- [ ] Filtrare appuntamenti visualizzati in base a selezione
- [ ] Mantenere layout colonne anche con filtro attivo
- [ ] Testare filtro funzionante

## Feature - Form Completo Creazione Appuntamento
- [x] Creare componente AppointmentFormModal con form completo
- [x] Aggiungere ricerca cliente con autocomplete
- [x] Aggiungere campi: tipo intervento, durata prevista, note, indirizzo
- [x] Collegare a mutation trpc appointments.create
- [x] Sostituire modal semplificato con AppointmentFormModal nel calendario
- [x] Testare creazione appuntamento da calendario

## Feature - Modal Modifica Rapida Appuntamento
- [x] Permettere click su appuntamento esistente per aprire modal
- [x] Riutilizzare AppointmentFormModal in modalità modifica (prop existingAppointment)
- [x] Pre-compilare tutti i campi con dati appuntamento esistente
- [x] Aggiungere possibilità di cambiare tecnico, orario, stato
- [x] Aggiunto onPress a tutti gli appuntamenti nel calendario
- [x] Testare modifica appuntamento da calendario

## Feature - Filtro per Tecnico
- [x] Aggiungere pulsanti filtro sopra calendario (Tutti | Luca Corsi | Denis Corsi)
- [x] Implementare state technicianFilter (null = tutti, 1 = Luca, 2 = Denis)
- [x] Modificare getAppointmentsForSlot per applicare filtro globale
- [x] Evidenziare pulsante filtro attivo con colore tecnico (blu #0066CC, verde #00AA66)
- [x] Testare filtro funzionante

## Bug Fix - Calendario Multi-Colonna Non Visibile
- [x] Verificare quale calendario viene mostrato in operator-dashboard.tsx
- [x] Sostituire calendario vecchio con WeeklyCalendar multi-colonna
- [ ] Verificare che nuovo calendario appaia con 2 colonne per tecnico
- [ ] Verificare colori distintivi (blu Luca, verde Denis) funzionanti
- [ ] Testare filtro tecnici e creazione/modifica rapida

## Riorganizzazione Dashboard - Calendario Dedicato
- [x] Creare tab "Calendario" nella barra principale
- [x] Mostrare solo calendario a schermo intero (senza colonne laterali)
- [x] Spostare tab "Timbrature" nel menu dropdown (⚙️ Menu)
- [x] Rimuovere calendario dalla vista "Dashboard Operatore"
- [ ] Testare leggibilità card appuntamenti con più spazio

## Ottimizzazione Dimensioni Calendario
- [x] Rimuovere padding laterali per usare tutto lo schermo
- [x] Aumentare larghezza colonne giorni (da w-24 a w-40)
- [x] Ingrandire font nelle card appuntamenti (da text-xs a text-sm)
- [x] Ottimizzare spaziature per massimizzare area visibile
- [ ] Testare leggibilità su schermo standard

## Calendario Responsive - Riempire Tutto lo Schermo
- [x] Rimuovere larghezza fissa colonne (w-40)
- [x] Usare flex-1 per distribuire spazio equamente tra colonne
- [x] Rimuovere ScrollView orizzontale
- [x] Calcolare larghezza colonne dinamicamente in base allo schermo
- [ ] Testare che calendario riempia 100% larghezza disponibile

## Fix Larghezza Calendario - Usare Percentuali
- [x] Problema: flex-1 non funziona con struttura nidificata (View per giorno > 2 colonne tecnici)
- [x] Calcolare larghezza colonne: 100% / 12 colonne = ~8.33% per colonna
- [x] Applicare style={{ width: '8.33%' }} a ogni colonna tecnico
- [x] Applicare minWidth: 80px per evitare colonne troppo strette su schermi piccoli
- [ ] Testare che calendario riempia effettivamente 100% larghezza schermo

## Espandere Calendario per Riempire Tutto lo Schermo
- [x] Problema: calendario occupa solo parte sinistra, spazio bianco a destra inutilizzato
- [x] Rimuovere minWidth: 80px che limita espansione colonne
- [x] Usare flex: 1 per far espandere colonne automaticamente
- [x] Aumentare font size: text-sm per date, text-base per nomi, text-sm per card
- [x] Aumentare padding: p-3 header, p-2 celle, min-h-16 per celle
- [ ] Mostrare più dettagli: orario, città, tipo servizio

## Appiattire Struttura Calendario - 12 Colonne in Unica Riga
- [x] Problema: struttura nidificata (View per giorno > 2 colonne) impedisce flex di funzionare
- [x] Ristrutturare header: usato flatMap per generare 12 colonne direttamente in flex-row
- [x] Ristrutturare celle: usato flatMap per generare 12 colonne direttamente in flex-row
- [x] Ogni colonna ha flex: 1 per distribuire spazio equamente
- [ ] Testare che calendario riempia effettivamente 100% larghezza senza spazi bianchi

## Fix Durata Appuntamenti e Dettagli Completi
- [x] Problema: appuntamento 60 min occupa solo 1 slot da 30 min invece di 2
- [x] Calcolare altezza card: durationSlots = Math.ceil(duration / 30), cardHeight = slots × 64px
- [x] Applicare minHeight dinamica alle card (60min = 128px, 90min = 192px)
- [x] Aggiungere città cliente nella card con icona 📍
- [x] Aggiungere indirizzo completo nella card
- [ ] Testare con appuntamento 12:00-13:00 (60min) che deve occupare visivamente 2 slot

## Drag & Drop tra Tecnici
- [x] Implementare logica drop: onPress controlla se draggedAppointment è attivo
- [x] handleDrop già supporta cambio technicianId (linee 126-128)
- [x] Long press su card attiva drag, click su colonna vuota fa drop
- [ ] Testare trascinamento card da Luca a Denis e viceversa

## Vista Mensile Compatta
- [x] Aggiungere state calendarView ('week' | 'month')
- [x] Creare toggle button 📅 Settimana / 📆 Mese sopra filtro tecnici
- [ ] Implementare rendering calendario mensile (7 giorni × 4-5 settimane)
- [ ] Mostrare solo numero appuntamenti per giorno in vista mese
- [ ] Click su giorno in vista mese apre vista settimanale centrata su quel giorno

## Ricerca Rapida Clienti nel Calendario
- [x] Aggiungere input ricerca con icona 🔍 sopra calendario
- [x] Filtrare appuntamenti in tempo reale: nome, città, indirizzo
- [x] Pulsante ✕ per cancellare ricerca rapidamente
- [ ] Evidenziare card appuntamenti che matchano la ricerca
- [ ] Mostrare contatore risultati trovati

## Fix Espansione Visiva Card Appuntamenti
- [x] Problema: card 90 min (12:00-13:30) ha minHeight corretto ma non copre visivamente slot sottostanti
- [x] Usare position: 'absolute' per far sovrapporre card sulle celle
- [x] Calcolare height: durationSlots × 64px (90 min = 3 slot = 192px)
- [x] Aggiungere zIndex: 10 per assicurare card sopra le celle vuote
- [x] Celle con position: 'relative' per contenere card absolute
- [ ] Testare che card 90 min copra visivamente 3 slot (12:00, 12:30, 13:00)
- [ ] Verificare che card non si sovrappongano in modo errato

## Vista Mensile Completa - Calendario 7×5
- [x] Implementare rendering griglia 7 colonne (lun-dom) × 5 righe (settimane)
- [x] Mostrare numero appuntamenti per giorno con badge blu
- [x] Evidenziare giorno corrente con sfondo azzurro
- [x] Click su giorno apre vista settimanale centrata su quella settimana
- [ ] Navigazione mese precedente/successivo con frecce
- [x] Mostrare nome mese e anno in alto

## Notifiche Push - Alert 30 Minuti Prima
- [x] Richiedere permessi notifiche all'avvio app
- [x] Schedulare notifica locale 30 min prima di ogni appuntamento
- [x] Contenuto notifica: nome cliente, indirizzo, città
- [x] Data notifica contiene ID appuntamento per aprire dettaglio
- [ ] Aggiungere pulsante "Naviga" per aprire Maps con indirizzo cliente
- [x] Cancellare notifiche se appuntamenti vengono eliminati/modificati

## Report Statistiche - Dashboard KPI
- [x] Tab "Statistiche" già esistente, sostituito vecchio dashboard
- [x] KPI: Appuntamenti completati con numero grande
- [x] KPI: Tempo medio intervento in minuti
- [x] KPI: Top 5 clienti più frequenti con classifica
- [x] Grafico appuntamenti per tecnico (Luca vs Denis) con barre colorate
- [x] Filtro periodo: settimana/mese/anno
- [ ] Export report in PDF

## Timbrature - Aggiungere Data e Giorno Settimana
- [x] Mostrare giorno settimana abbreviato (lun., mar., mer., gio., ven., sab., dom.)
- [x] Mostrare data completa formato DD/MM/YYYY
- [x] Formato finale: "lun. 13/01/2026 - 08:00"
- [x] Applicare a tutte le timbrature (check-in e check-out)

## Riepilogo Ore Giornaliere Timbrature
- [x] Calcolare totale ore lavorate per ogni tecnico nella giornata
- [x] Calcolare ore pausa per ogni tecnico
- [x] Mostrare riepilogo sotto le timbrature con card per tecnico
- [x] Formato: Nome tecnico + ore lavorate (es. "8h 30m") + ore pausa
- [x] Evidenziare con bordo rosso se ore < 8h, verde se >= 8h

## Esportazione Automatica PDF Mensile Timbrature
- [x] Creare job schedulato che gira a fine mese (giorno 28 ore 23:59)
- [x] Generare PDF timbrature per ogni tecnico del mese precedente
- [x] Inviare PDF via email a indirizzo configurato (SMTP_USER, SMTP_PASS)
- [x] Salvare PDF su server in exports/timbrature/ per storico
- [x] Aggiungere log completo esportazioni automatiche

## Pulsante Reset Timbrature per Test
- [x] Problema: dopo aver completato giornata, non si possono testare altri pulsanti
- [x] Aggiungere pulsante "🔄 Reset Timbrature Oggi" quando stato = "finished"
- [x] Pulsante cancella tutte le timbrature di oggi per il tecnico
- [x] Mostrare conferma Alert prima di cancellare
- [x] Dopo reset, stato torna a "not_started" e si vedono tutti i pulsanti

## Fix Pulsante Reset Timbrature Non Funzionante
- [x] Problema: pulsante reset non fa nulla quando cliccato
- [x] Verificare se endpoint trpcClient.timeEntries.delete esiste (mancava)
- [x] Aggiungere endpoint delete nel router timeEntries
- [ ] Testare cancellazione singola timbratura
- [ ] Testare reset completo (cancella tutte le timbrature di oggi)

## Pagamenti Scheda Cliente per Tecnici
- [x] Creare tabella payments nel database (id, customerId, appointmentId, amount, paymentMethod, date, notes, technicianId)
- [x] Aggiungere funzioni CRUD payments nel db.ts
- [x] Aggiungere API payments nel router (create, getByCustomer, getByAppointment, delete)
- [x] Aggiungere sezione "Pagamenti" nella scheda cliente mobile
- [ ] Implementare form completo per aggiungere pagamento (attualmente solo pulsante placeholder)
- [ ] Mostrare lista pagamenti precedenti del cliente con query
- [ ] Calcolare e mostrare totale pagamenti ricevuti per cliente

## Form Pagamento Funzionante Scheda Cliente
- [ ] Problema: pulsante "Aggiungi Pagamento" mostra solo Alert placeholder
- [ ] Creare state per modal form pagamento (showPaymentForm, amount, paymentMethod, notes)
- [ ] Implementare modal con campi: importo (TextInput numerico), metodo (4 pulsanti), note (TextInput)
- [ ] Validazione: importo > 0 richiesto
- [ ] Collegare a trpcClient.payments.create mutation
- [ ] Dopo salvataggio, chiudere modal e ricaricare lista pagamenti
- [ ] Mostrare lista pagamenti esistenti sotto il form con query getByCustomer
- [ ] Calcolare e mostrare totale pagamenti ricevuti

## Bug da Risolvere
- [x] Bug salvataggio pagamento app mobile - errore quando si clicca "Salva Pagamento" (RISOLTO: tabella payments mancante nel database)

## Test Sistema
- [x] Cancellare tutti i pagamenti dal database
- [x] Cancellare tutti gli appuntamenti dal database
- [x] Verificare che il sistema funzioni correttamente con database pulito

## Bug Calendario Dashboard PC
- [x] Data settimana errata - mostra "22 dicembre - 28 dicembre 2025" invece di "12 gennaio - 18 gennaio 2026" (RISOLTO: bug calcolo lunedì)
- [x] Appuntamenti mostrano solo "Cliente" invece del nome completo (RISOLTO: form ora crea cliente automaticamente se non esiste)
- [x] Click su appuntamento non apre dettaglio cliente (FUNZIONAVA GIÀ: il problema era che gli appuntamenti non avevano customerId)
- [x] Tasto destro su appuntamento non mostra menu contestuale per cancellare (FUNZIONAVA GIÀ: menu contestuale presente)

## Miglioramenti Calendario Dashboard PC
- [x] Creazione appuntamento da calendario - Click su cella vuota per creare appuntamento direttamente (implementato in weekly-calendar-web.tsx)
- [ ] Modifica appuntamento - Richiede form web dedicato (attualmente si può solo cancellare e ricreare)
- [x] Vista mensile completa - Componente monthly-calendar-web.tsx creato (da integrare nella dashboard)

## Form Appuntamento Calendario con Ricerca Cliente
- [x] Creare form web appuntamento con ricerca automatica cliente da telefono
- [x] Pre-compilazione dati cliente se trovato nel database
- [x] Creazione automatica cliente se non esiste
- [x] Integrazione form nel calendario al click su cella vuota (sostituito AppointmentFormModal con AppointmentFormWeb in weekly-calendar.tsx)
## Bug Form Calendario
- [x] Orario sbagliato - Click su cella 8:00 mostra 7:00 nel form (RISOLTO: usato timezone locale invece di UTC)
- [x] Ricerca cliente non funziona - Inserimento telefono non cerca cliente esistente nel database (RISOLTO: creata API searchByPhone)

## Bug Interazione Appuntamenti Calendario
- [x] Click su appuntamento non apre scheda cliente (PARZIALE: sostituito WeeklyCalendar React Native con WeeklyCalendarWeb in operator-dashboard.tsx, ma testo appuntamenti non visibile)
- [ ] Tasto destro su appuntamento non mostra menu contestuale per cancellare (da testare dopo fix visualizzazione)
- [ ] Testo nome cliente non visibile nelle card appuntamento calendario (solo celle rosse vuote)

## Bug Layout Calendario
- [x] Calendario mostra solo una colonna per giorno invece di due colonne (una per Luca, una per Denis) (RISOLTO: ripristinato WeeklyCalendar originale)
- [x] Impossibile creare appuntamenti per entrambi i tecnici nello stesso giorno/ora (RISOLTO con ripristino layout)

## Apertura Scheda Cliente da Calendario
- [x] Click su appuntamento nel calendario deve aprire scheda cliente completa (anagrafica, interventi, apparecchi, chiamate, libretti, contratti, preventivi, documenti) (PARZIALE: prop onCustomerClick aggiunta e collegata, ma onPress React Native non funziona su web)
- [ ] Convertire evento onPress (React Native) in onClick (web) nel componente WeeklyCalendar per abilitare click su web

## Menu Contestuale Appuntamenti
- [x] Convertire Pressable React Native in div HTML con onClick e onContextMenu (PARZIALE: onContextMenu aggiunto ma Pressable potrebbe non supportarlo su web)
- [x] Implementare menu contestuale con tasto destro su appuntamenti
- [x] Opzione "Apri Cliente" - Apre scheda cliente completa
- [x] Opzione "Modifica" - Apre form modifica appuntamento
- [x] Opzione "Cancella" - Elimina appuntamento con conferma
- [ ] Test manuale tasto destro su appuntamento per verificare funzionamento menu

## Conversione Calendario Web-Compatibile (URGENTE)
- [x] Convertire Pressable React Native in div HTML con eventi web nativi
- [x] Convertire Text React Native in span HTML
- [x] Implementare drag & drop HTML5 nativo (draggable, onDragStart, onDragOver, onDrop)
- [x] Implementare menu contestuale tasto destro con onContextMenu
- [x] Menu contestuale con solo opzione "Cancella" per toggle stato confermato/non confermato
- [x] Cambio colore appuntamento: grigio quando non confermato, colore originale tecnico quando confermato
- [x] Sostituito WeeklyCalendar con WeeklyCalendarWebV2 in operator-dashboard.tsx
- [ ] Testare drag & drop tra giorni e orari diversi
- [ ] Testare tasto destro su appuntamento per toggle stato

## Menu Contestuale - Due Opzioni Separate
- [x] Aggiungere campo "confirmed" (boolean) nella tabella appointments
- [x] Opzione 1: "Elimina Appuntamento" - Elimina definitivamente dal database (con conferma)
- [x] Opzione 2: "Non Confermato/Confermato" - Toggle colore (grigio ↔ blu/verde) senza eliminare
- [x] Appuntamenti non confermati (confirmed=false) mostrano colore grigio
- [x] Appuntamenti confermati (confirmed=true) mostrano colore tecnico (blu/verde)
- [x] Mutation delete per eliminazione definitiva
- [x] Mutation update per toggle campo confirmed
- [ ] Testare tasto destro su appuntamento per vedere menu con due opzioni
- [ ] Testare toggle Non Confermato/Confermato (cambio colore)
- [ ] Testare Elimina Appuntamento (sparisce completamente)

## Bug da Correggere - Drag & Drop e Toggle Confermato
- [x] Cambiato colore non confermato da grigio (#999999) a giallo (#FFA500)
- [x] Aggiunto campo confirmed nella query getAllAppointments (db.ts)
- [x] Quando confirmed=false, mostrare colore giallo (#FFA500)
- [x] Quando confirmed=true, mostrare colore tecnico (blu/verde)
- [ ] Testare toggle "Confermato" per vedere cambio colore
- [ ] Testare drag & drop tra tecnici (Luca ↔ Denis)
- [ ] Verificare che appuntamento cambi tecnico quando trascinato tra colonne

## Bug Critici - Toggle e Drag & Drop Non Funzionanti
- [x] Aggiunto campo confirmed allo schema mutation update (routers.ts)
- [x] Aggiunto campo technicianId allo schema mutation update (routers.ts)
- [x] Aggiunto console.log per debug toggle confirmed
- [x] Aggiunto console.log per debug drag & drop tra tecnici
- [ ] Testare toggle "Non Confermato" e verificare console.log
- [ ] Testare drag & drop tra tecnici e verificare console.log
- [ ] Se non funziona, verificare che campo confirmed esista nel database

## Bug Visualizzazione Nome Cliente
- [x] Rimosso codice .find() che sovrascriveva customer dal database
- [x] Gli appuntamenti ora usano direttamente customer dal JOIN database
- [x] Query getAllAppointments già restituisce customer come oggetto annidato
- [ ] Testare che ora mostri nome cliente reale (es. "Denis Corsi", "Mario Rossi")

## Correzione Visualizzazione Nome Cliente - COMPLETATA
- [x] Rimosso codice .find() che sovrascriveva customer dal database
- [x] Gli appuntamenti ora usano direttamente customer dal JOIN database
- [ ] Testare che ora mostri nome cliente reale

## Bug Inizializzazione Calendario
- [x] Corretto calcolo currentWeekStart per usare data odierna
- [x] Calendario ora parte dalla settimana corrente (es. 11 gennaio 2026 → settimana 12-18 gennaio)
- [x] Rimosso bug today.setDate() che modificava oggetto Date
- [ ] Testare che calendario parta dalla settimana corrente dopo ricarica

## Tooltip Post-it Giallo su Hover Appuntamento
- [x] Implementare tooltip giallo che appare al passaggio mouse su appuntamento
- [x] Mostrare dati cliente: nome, zona, telefono, email, indirizzo completo
- [x] Mostrare dati appuntamento: tipo intervento, descrizione, tecnico, orario inizio/fine, stato
- [x] Stile post-it giallo con sfondo #FFEB3B e bordo #FBC02D
- [x] Eventi onMouseEnter/onMouseLeave per mostrare/nascondere tooltip
- [x] Tooltip con z-index 9999 per apparire sopra tutto
- [ ] Testare tooltip al passaggio mouse su appuntamento

## Correzioni Tooltip Post-it
- [x] Cambiare "Zona" in "Città"
- [x] Mostrare Note invece di "Tipo Intervento"
- [x] Rimuovere orario "Fine" (già visibile nel calendario)

## Ricerca Rapida Cliente
- [x] Campo ricerca sopra calendario con icona 🔍
- [x] Filtro in tempo reale mentre si digita
- [x] Ricerca per nome cliente (firstName + lastName)
- [x] Ricerca per città (customer.city)
- [x] Appuntamenti non corrispondenti nascosti automaticamente
- [x] Pulsante "X" per cancellare ricerca e mostrare tutti
- [x] Contatore risultati trovati (es. "3 appuntamenti trovati")
- [ ] Testare ricerca per nome cliente
- [ ] Testare ricerca per città
- [ ] Testare pulsante X per cancellare

## Modifiche Tooltip Post-it
- [x] Rimuovere campo "Tecnico" dal tooltip
- [x] Rimuovere campo "Inizio" dal tooltip
- [x] Rimuovere campo "Data" dal tooltip
- [x] Campo "Note" già presente nel tooltip
- [x] Mantenere: Nome cliente, Telefono, Email, Indirizzo, Città, Stato

## Aggiungere Note Cliente nel Tooltip
- [x] Aggiungere sezione "Note Cliente:" nel tooltip (da customer.notes)
- [x] Mantenere sezione "Note Appuntamento:" separata (da appointment.notes)
- [x] Due sezioni distinte per distinguere note permanenti cliente da note specifiche intervento

## Colorazione Domeniche e Festivi in Rosso
- [ ] Identificare colonne domenica nel calendario (day === 0)
- [ ] Applicare sfondo rosso (#FFE5E5) alle colonne domenica
- [ ] Implementare lista festivi italiani 2026 (Capodanno, Epifania, Pasqua, 25 Aprile, 1 Maggio, 2 Giugno, Ferragosto, Ognissanti, Immacolata, Natale, Santo Stefano)
- [ ] Applicare sfondo rosso anche ai festivi
- [ ] Indicare chiaramente indisponibilità scheduling su giorni rossi

## Filtri Tecnico con Checkbox
- [ ] Aggiungere checkbox sopra calendario: ☐ Luca ☐ Denis ☐ Entrambi
- [ ] Default: Entrambi selezionato (mostra tutti gli appuntamenti)
- [ ] Filtrare appuntamenti in tempo reale quando checkbox cambia
- [ ] Contatore appuntamenti filtrati (es. "12 appuntamenti di Luca")
- [ ] Utile per stampare foglio giornaliero singolo tecnico

## Slot Intelligente Stesso Giorno
- [ ] Algoritmo cerca primo slot libero stesso giorno prima di proporre giorno successivo
- [ ] Logica: se mattina (8:00-13:00) piena, proporre pomeriggio (14:00-18:00)
- [ ] Solo se giorno completamente pieno (8:00-18:00), proporre giorno successivo
- [ ] Riduce km furgoni ottimizzando percorsi tecnici
- [ ] Orario lavorativo: 8:00-18:00

## Colorazione Domeniche e Festivi in Rosso
- [x] Funzione isNonWorkingDay per identificare domeniche e festivi italiani 2026
- [x] Lista festivi: Capodanno, Epifania, Pasqua, 25 Aprile, 1 Maggio, 2 Giugno, Ferragosto, Ognissanti, Immacolata, Natale, Santo Stefano
- [x] Sfondo rosso (#FFE5E5) per colonne header domeniche/festivi
- [x] Sfondo rosso (#FFE5E5) per celle griglia domeniche/festivi (entrambi tecnici)
- [x] Indicazione visiva chiara giorni non lavorativi

## Filtri Tecnico con Radio Button
- [x] Radio button sopra campo ricerca: Entrambi / Solo Luca / Solo Denis
- [x] Stato technicianFilter ('all' | 1 | 2)
- [x] Filtro applicato in getAppointmentsForSlot
- [x] Colori: blu (#4A90E2) per Luca, verde (#4CAF50) per Denis
- [x] Default: "Entrambi" (mostra tutti)
- [x] Utile per stampare foglio singolo tecnico
- [ ] Testare filtro Solo Luca
- [ ] Testare filtro Solo Denis

## Slot Intelligente Stesso Giorno
- [x] Algoritmo ricerca primo slot libero stesso giorno (8:00-18:00)
- [x] Priorità pomeriggio se mattina piena
- [x] Solo se giorno completamente pieno → propone giorno successivo
- [x] Integrazione con modal CreateAppointmentModal
- [ ] Calcolo distanza per ottimizzazione km furgoni (futuro)


## Gestione Assenze Tecnici
- [x] Creare tabella absences (id, technicianId, date, reason, createdAt)
- [x] API backend CRUD assenze (create, list, delete)
- [x] Menu contestuale click destro su header giorno calendario
- [x] Opzioni menu: "Segna Assente" con sottomenu (Ferie/Malattia/Permesso)
- [x] Badge rosso "Assente" su colonna tecnico quando assente
- [x] Blocco creazione appuntamenti su slot tecnico assente
- [x] Indicatore visivo chiaro giorno assenza
- [x] Possibilità rimuovere assenza con click destro su badge

## Stampa Foglio Giornaliero PDF
- [x] Pulsante "🖨️ Stampa" sopra calendario (vicino filtri tecnico)
- [x] Generazione PDF con lista appuntamenti giorno corrente
- [x] Filtro automatico per tecnico selezionato nei radio button
- [x] Inclusione: nome cliente, indirizzo completo, telefono, orario, note
- [x] Ordinamento per orario crescente
- [x] Intestazione con nome tecnico, data, totale appuntamenti
- [x] Download automatico file PDF
- [x] Nome file formato "Foglio_Giornaliero_NomeTecnico_YYYY-MM-DD.pdf"


## Ottimizzazione Percorsi Slot Intelligente
- [x] Implementare funzione Haversine per calcolo distanza GPS tra coordinate
- [x] Modificare algoritmo findSmartSlot per recuperare coordinate cliente target
- [x] Calcolare distanza da ultimo appuntamento tecnico nello stesso giorno
- [x] Ordinare slot liberi per distanza minima (più vicino = priorità)
- [x] Mostrare distanza stimata nel messaggio conferma slot trovato
- [x] Gestire caso cliente senza coordinate GPS (fallback algoritmo originale)


## Notifica Slot Ottimale Creazione Manuale
- [x] Creare funzione per trovare slot alternativo più vicino geograficamente
- [x] Modificare handleSave per verificare slot ottimale prima del salvataggio
- [x] Calcolare distanza slot scelto manualmente vs slot ottimale
- [x] Mostrare alert se esiste slot migliore (es: "Slot più vicino disponibile: 15:00 (2.5 km più vicino)")
- [x] Opzioni alert: "Mantieni orario scelto" / "Usa slot ottimale"
- [x] Applicare slot ottimale se operatore accetta suggerimento
- [x] Non mostrare alert se slot scelto è già ottimale o se cliente senza coordinate GPS


## Appuntamenti Da Confermare (Pattern Righe Diagonali)
- [x] Aggiungere campo `confirmed` (boolean, default false) alla tabella appointments
- [x] Implementare pattern CSS righe diagonali per appuntamenti non confermati
- [x] Aggiungere menu contestuale su appuntamento con opzione "Conferma appuntamento"
- [x] Mutation tRPC per aggiornare stato confirmed
- [x] Rimuovere pattern righe quando appuntamento confermato
- [x] Mostrare indicatore visivo chiaro (es: icona ✓ quando confermato)

## Geocoding Automatico Indirizzi Clienti
- [x] Richiedere Google Maps API key tramite webdev_request_secrets
- [x] Implementare funzione geocoding nel backend (server/routers.ts)
- [x] Chiamata automatica geocoding quando operatore inserisce/modifica indirizzo
- [x] Salvare coordinate GPS (latitude/longitude) in database customers
- [x] Mostrare feedback visivo durante geocoding (loading spinner)
- [x] Fallback manuale: permettere modifica coordinate se geocoding fallisce
- [x] Gestire errori API (quota superata, indirizzo non trovato)


## Bug Fix - Algoritmo Proposta Slot
- [x] Correggere proposeOptimalSlots per considerare TUTTI slot liberi stesso giorno
- [x] Non saltare giorno se ci sono slot liberi disponibili
- [x] Priorità massima a slot stesso giorno + stessa città (distanza 0 km)
- [x] Solo se giorno completamente pieno → proporre giorni successivi
- [x] Testare caso: appuntamento 8:30 Nove, nuovo cliente Nove → deve proporre 9:30 stesso giorno

## Promemoria Automatici WhatsApp 48h Prima
- [x] Cron job esecuzione ogni giorno ore 9:00
- [x] Query appuntamenti tra 48h (2 giorni esatti)
- [x] Filtro solo appuntamenti con sendWhatsAppReminder = true
- [x] Invio messaggio WhatsApp con template selezionato
- [x] Link conferma presenza (opzionale)
- [x] Aggiornare campo whatsappReminderSent = true dopo invio
- [x] Salvare timestamp whatsappReminderSentAt
- [x] Gestire errori invio con retry
- [x] Log invii effettuati


## Bug Fix - Verifica Assenze in Proposta Slot
- [x] Modificare generateAvailableSlots per verificare assenze tecnico
- [x] Query tabella absences per ogni giorno nel range
- [x] **BUG RISOLTO: Normalizzare date a mezzanotte per confronto corretto**
- [x] Debug: Aggiungere log per verificare query assenze e confronto date
- [x] Correggere logica confronto date (timezone/formato)
- [x] Testare caso: Luca in ferie 14/01, nuovo cliente Nove → deve proporre 15/01 o successivi (NON 14/01)


## UX - Sfondo Rosso Riga Assente
- [x] Quando tecnico assente, applicare sfondo rosso (#FFE5E5) a tutta la colonna giorno
- [x] Stesso stile visivo di domeniche/festivi
- [x] Rendere immediatamente visibile che giorno non disponibile

## Bug - Ricerca Cliente per Nome Completo
- [x] Ricerca "Alessi Davide" (nome completo con spazio) non funziona
- [x] Query cerca in firstName e lastName separatamente, non gestisce "Nome Cognome"
- [x] Aggiungere ricerca in CONCAT(firstName, ' ', lastName) per gestire nome completo
- [x] Aggiungere anche CONCAT(lastName, ' ', firstName) per "Cognome Nome"
- [x] Testare ricerca con "alessi davide", "ALESSI DAVIDE", "davide alessi"

## Bug CRITICO - Algoritmo Non Prioritizza Stesso Giorno Stessa Città
- [x] Sistema propone slot giorni successivi anche quando ci sono slot liberi stesso giorno nella stessa città
- [x] Esempio: Appuntamento Nove 15/01 8:30, nuovo cliente Nove → sistema propone 14/01 invece di 15/01 9:30
- [x] Problema: logica scoring in calculateSlotDistances restituiva distanza 0 per giorni senza appuntamenti
- [x] Soluzione 1: distanza default 999 km invece di 0 quando non ci sono appuntamenti
- [x] Soluzione 2: penalizzazione +50 km virtuale per slot in giorni diversi dagli appuntamenti esistenti
- [x] Test: Appuntamento esistente Nove 15/01 8:30 → nuovo cliente Nove deve avere 15/01 9:30 come PRIMO slot proposto

## Bug - Salvataggio Assenze Non Funziona
- [x] Click destro header giorno → "Segna come Assente" mostra badge ma non salva in database
- [x] Aggiunto callback onError per catturare errori silenti
- [x] Aggiunto alert conferma successo salvataggio
- [x] Aggiunto log errori in console per debugging
- [ ] Test: Marcare Luca assente 14/01, verificare record in tabella absences e messaggio conferma

## Bug - Algoritmo Salta Slot Mattutini Disponibili
- [x] Sistema propone 14:00 come primo slot anche se 9:00, 9:30, 10:00 sono liberi
- [x] Esempio: Appuntamento Nove 8:30-9:00, sistema propone 14:00 invece di 9:30
- [x] Problema: generateAvailableSlots generava slot ogni ora invece di ogni 30 minuti
- [x] Soluzione: modificato ciclo for per generare slot ogni 30 minuti (8:00, 8:30, 9:00, 9:30...)
- [x] Test: Appuntamento 8:30-9:00 → primo slot proposto deve essere 9:00 o 9:30

## Bug UI - Contrasto Testo Pagina Appuntamenti
- [x] Testo sotto nome cliente (indirizzo/città) troppo chiaro su sfondo bianco
- [x] Non leggibile su mobile
- [x] Cambiato da text-primary a text-gray-700 (dark: text-gray-300) per miglior contrasto

## Feature - Pannello Debug Interfaccia per Log Algoritmo Slot
- [ ] Creare endpoint API che restituisce log debug insieme agli slot
- [ ] Aggiungere pannello collassabile in Dashboard Operatore
- [ ] Mostrare log generazione slot, sovrapposizioni, score calcolati
- [ ] Facilitare debugging senza dover aprire console browser

## Bug CRITICO - Visualizzazione Durata Appuntamenti nel Calendario
- [x] Appuntamento creato con durata 60 minuti (8:00-9:00) viene visualizzato solo fino alle 8:30
- [x] Il calendario mostra altezza sbagliata per gli appuntamenti
- [x] Problema era nel salvataggio: operator-dashboard.tsx usava duration hardcoded a 60 invece di selectedDuration
- [x] Correzione: sostituito duration: 60 con duration: selectedDuration nella conferma slot
- [x] Rendering calendario era corretto: calcola altezza = (duration/30) * 64px
- [ ] Test: Creare nuovo appuntamento 60 min ore 8:00 → deve visualizzare blocco fino alle 9:00

## Debug Approfondito - Slot Mattutini Non Proposti
- [x] Analizzare log server durante ricerca slot per vedere quali slot vengono generati
- [x] Verificare quali slot vengono marcati come OCCUPATI e perché
- [x] Identificare dove gli slot mattutini vengono filtrati/scartati
- [x] BUG TROVATO: logica sovrapposizione controllava TUTTI gli appuntamenti del periodo, non solo stesso giorno
- [x] CORREZIONE: aggiunto controllo slotDay !== aptDay per verificare sovrapposizione solo stesso giorno
- [x] Esempio: slot 17/01 9:00 NON deve essere marcato occupato da appuntamento 16/01 8:00-9:00

## Debug Approfondito - Durata Appuntamenti Sempre 30 Min
- [ ] Verificare valore campo duration nel form AppointmentFormWeb prima dell'invio
- [ ] Verificare log server per vedere quale valore duration viene ricevuto dall'API
- [ ] Identificare dove il valore viene modificato da 60 a 30
- [ ] Correggere il bug nel flusso dati form → API → database

## Bug CRITICO - Slot Proposti Oltre Orario di Lavoro
- [ ] Sistema propone slot alle 19:30, 20:00, 20:30
- [ ] Orario lavoro dovrebbe essere 8:00-18:00 (max 18:30 considerando durata intervento)
- [ ] Verificare costante workEndHour in generateAvailableSlots
- [ ] Test: Cerca slot → NON deve proporre slot dopo le 18:00

## Bug CRITICO - Durata Appuntamenti Creati da Calendario Sempre 30 Min
- [ ] Appuntamenti creati cliccando sul calendario mostrano sempre 30 min
- [ ] Anche selezionando 60 min nel form, viene salvato/visualizzato 30 min
- [ ] Verificare AppointmentFormWeb: valore campo duration prima invio API
- [ ] Verificare log server: quale valore duration riceve l'endpoint create
- [ ] Verificare rendering calendario: come calcola altezza blocco appuntamento
- [ ] Test: Creare appuntamento 60 min ore 8:00 → deve visualizzare fino alle 9:00

## Bug CRITICO - Proposta Pomeriggio Invece di Mattina
- [ ] Appuntamento 8:00-9:00, cerca slot → propone 14:00 invece di 9:00
- [ ] Logica sovrapposizione corretta (controllo stesso giorno aggiunto)
- [ ] Slot 9:00-10:00 NON si sovrappone con 8:00-9:00 (verificare con log)
- [ ] Possibile causa: algoritmo scoring penalizza troppo slot mattutini
- [ ] Test: Appuntamento 8:00-9:00 → primo slot proposto deve essere 9:00 o 9:30

## Analisi Bug Durata Appuntamenti - Flusso Completo
- [ ] Verificare valore campo duration in AppointmentFormWeb prima del submit
- [ ] Verificare payload inviato alla mutation trpc.appointments.create
- [ ] Verificare valore ricevuto nell'endpoint server appointments.create
- [ ] Verificare query SQL INSERT con valore duration
- [ ] Verificare valore salvato effettivamente nel database
- [ ] Identificare punto esatto dove 60 diventa 30
- [ ] Correggere il bug e testare end-to-end

## Bug Durata Appuntamenti
- [ ] Analisi flusso dati durata: frontend → API → database
- [ ] Verifica database: query diretta per vedere durata salvata
- [ ] Test creazione appuntamento con log dettagliati
- [ ] Correzione bug identificato
- [ ] Test finale e checkpoint

## Bug Attuali da Risolvere
- [ ] Bug visualizzazione durata: appuntamenti con 180 minuti mostrati come 150 minuti nel calendario
- [ ] Bug pulsante Menu: il pulsante Menu non si apre quando cliccato

## Miglioramenti UX Calendario
- [ ] Feature: Resize manuale durata appuntamenti trascinando bordo inferiore
- [ ] Bug: Pulsante Menu non si apre quando cliccato
- [x] Visualizzazione durata appuntamento nelle card calendario

## Miglioramenti UX Calendario

- [x] Visualizzazione durata appuntamento nel blocco calendario
- [x] Resize manuale durata appuntamento trascinando bordo inferiore
- [x] Fix pulsante Menu che non si apre


## Bug Fix - Calcolo Altezza Appuntamenti Calendario
- [x] Correggere formula calcolo altezza blocchi appuntamento (+1 slot per includere riquadro finale)
- [x] Testare visualizzazione appuntamenti 1h, 2h, 30min
- [x] Verificare allineamento con griglia oraria

## Bug Fix - Stampa PDF Timezone
- [x] Correggere problema timezone nella stampa PDF (orari sfasati di 6 ore)
- [x] Forzare timezone Europe/Rome per formattazione date
- [x] Testare stampa PDF con appuntamenti 22-01-2026

## Feature - Note Cliente in Stampa PDF
- [x] Aggiungere campo notes all'interfaccia customer in PDF export
- [x] Includere note cliente nel router exportDailyPDF
- [x] Visualizzare note cliente nel PDF con icona 📝 e colore blu

## Bug Fix - Menu Dropdown Amministrazione
- [x] Sostituire TouchableOpacity con button HTML nativo per web
- [x] Spostare rendering menu fuori dal container tab
- [x] Aggiungere overlay backdrop per chiudere menu cliccando fuori
- [x] Aumentare zIndex menu a 99999999 per stare sopra tutto
- [x] Implementare useEffect per gestire click outside
- [x] Testare apertura/chiusura menu su desktop

## Bug Fix - Scroll Mobile Calendario
- [x] Correggere overflow scroll su mobile
- [x] Cambiare height container da 100% a 100vh
- [x] Aggiungere -webkit-overflow-scrolling: touch per iOS

## Riorganizzazione Menu Amministrazione
- [x] Spostare pulsante "Importa da Excel" dal pannello laterale al menu dropdown
- [x] Spostare pulsante "Esporta Tutto Excel" dal pannello laterale al menu dropdown
- [x] Spostare pulsante "Backup e Cancella" dal pannello laterale al menu dropdown
- [x] Rimuovere pulsanti dal pannello laterale Ricerca Cliente
- [x] Testare apertura modali da menu dropdown

## Sistema Gestione Tipi Intervento Personalizzabili
- [x] Creare tabella database intervention_types (id, name, createdAt)
- [x] Popolare tabella con tipi intervento predefiniti iniziali
- [x] API CRUD per gestione tipi intervento (create, list, delete)
- [ ] Modificare form chiamata per usare dropdown invece di input testo
- [ ] Aggiungere opzione "+ Aggiungi nuovo" nel dropdown
- [ ] Modal inline per aggiungere nuovo tipo al volo
- [ ] Sezione "Gestione Tipi Intervento" nel menu amministrazione
- [ ] Interfaccia lista tipi con pulsante elimina
- [ ] Form aggiunta nuovo tipo nella sezione admin
- [ ] Testare creazione chiamata con dropdown
- [ ] Testare aggiunta nuovo tipo al volo
- [ ] Testare gestione tipi da sezione admin

## Ricerca Cliente per Nome/Cognome in Form Chiamata
- [x] API ricerca cliente per nome/cognome (LIKE query)
- [x] Modificare form chiamata con campo ricerca nome
- [x] Mostrare lista risultati ricerca con selezione
- [x] Bug fix: Pulsante "Chiudi" modal risultati non funzionava (parentesi mancante)
- [x] Bug fix: Cliente rimaneva in memoria dopo click "Annulla" (reset stati)
- [x] Testare ricerca per telefono (funziona correttamente)

## Debug Ricerca Cliente per Nome - Dropdown Non Appare
- [ ] Verificare z-index dropdown rispetto al modal chiamata
- [ ] Aggiungere console.log per vedere se query ritorna risultati
- [ ] Testare query searchCustomerByName direttamente nel database
- [ ] Verificare rendering condizionale dropdown (nameResults.length > 0)
- [ ] Posizionare dropdown con position absolute/fixed per uscire dal modal
- [ ] Testare ricerca con nome esistente nel database

## Dropdown Tipi Intervento nel Form Chiamata
- [ ] Modificare campo "Tipo Intervento" da TextInput a Select/Dropdown
- [ ] Caricare lista tipi intervento da API al mount componente
- [ ] Aggiungere opzione "+ Aggiungi Nuovo Tipo" in fondo al dropdown
- [ ] Modal inline per aggiungere nuovo tipo al volo
- [ ] Salvare nuovo tipo nel database e aggiornare lista
- [ ] Testare selezione tipo esistente
- [ ] Testare aggiunta nuovo tipo al volo

## Vista Mensile Calendario
- [ ] Progettare layout griglia mensile (7 colonne x 5 righe)
- [ ] Aggiungere toggle vista Settimanale/Mensile in alto
- [ ] Renderizzare giorni del mese con numero giorno
- [ ] Mostrare count appuntamenti per giorno (es: "3 appuntamenti")
- [ ] Click su giorno apre vista settimanale centrata su quel giorno
- [ ] Evidenziare giorno corrente
- [ ] Gestire cambio mese (frecce Precedente/Successivo)
- [ ] Testare navigazione tra vista mensile e settimanale

## Debug Ricerca Cliente per Nome - Dropdown Non Appare
- [ ] Verificare z-index dropdown rispetto al modal chiamata
- [ ] Aggiungere console.log per debug query risultati
- [ ] Testare con Modal React Native invece di View per dropdown
- [ ] Verificare rendering condizionale (nameResults?.length > 0)
- [ ] Testare ricerca con cliente esistente

## Dropdown Tipi Intervento Form Chiamata
- [ ] Modificare campo Tipo Intervento da TextInput a Picker/Select
- [ ] Query API per caricare lista tipi intervento
- [ ] Opzione "+ Aggiungi Nuovo" in fondo al dropdown
- [ ] Modal inline per nuovo tipo
- [ ] Testare selezione e aggiunta

## Vista Mensile Calendario
- [ ] Toggle Settimanale/Mensile in header
- [ ] Layout griglia 7x5 giorni
- [ ] Count appuntamenti per giorno
- [ ] Click giorno → vista settimanale
- [ ] Navigazione mesi

## Bug Critici - Modal Ricerca Cliente per Nome (22/01/2026)
- [x] Pulsante "Chiudi" nel modal risultati ricerca non funziona (click non risponde) - RISOLTO: aggiunto stopPropagation
- [x] Cliente selezionato rimane in memoria quando si clicca "Annulla" nel form chiamata - RISOLTO: reset completo tutti gli stati
- [x] Verificare handler onClick del pulsante Chiudi
- [x] Verificare reset completo stati nel pulsante Annulla

## Feature Richieste - 22/01/2026
- [x] Dropdown tipi intervento con valori predefiniti (Manutenzione, Riparazione, Installazione, Controllo, Assistenza, Sopralluogo)
- [x] Opzione "Altro" nel dropdown tipi intervento per inserimento personalizzato
- [x] Vista mensile calendario con conteggio appuntamenti per giorno
- [x] Navigazione mesi nella vista mensile (pulsanti Precedente/Successivo + Oggi)
- [x] Toggle Vista Settimanale/Mensile nel tab Calendario
- [x] Click su giorno nella vista mensile per passare alla vista settimanale
- [x] Filtro chiamate per stato (Tutte, In Attesa Pezzi, Completate, Solo Info)
- [x] Contatore chiamate per ogni filtro stato con colori distintivi

## Feature Richieste - 22/01/2026 (Batch 2)
- [x] Esportazione Excel chiamate filtrate con tutti i dettagli
- [x] Pulsante "Esporta Excel" nella sezione Chiamate
- [x] Sistema notifiche chiamate in attesa pezzi da più di X giorni (7 giorni)
- [x] Badge rosso nel tab Chiamate con contatore chiamate in attesa
- [x] Lista prioritaria chiamate in attesa nella sezione Chiamate (top 5 + contatore)
- [x] Statistiche tipi intervento con grafico distribuzione
- [x] Grafico a barre con percentuali nella sezione Statistiche
- [x] Filtro per mese/anno nelle statistiche tipi intervento
- [x] Toggle Panoramica/Tipi Intervento nella sezione Statistiche

## Bug Critici - Timbratura (23/01/2026)
- [x] Pulsante "Inizio Giornata" nella sezione Timbratura - MIGLIORATO: aggiunto logging dettagliato e messaggi errore più chiari
- [x] Pulsante "Sono arrivato dal cliente" negli appuntamenti - AGGIUNTO: nuovo pulsante che cambia stato a "in_progress"
- [x] Verificare handler onClick dei pulsanti timbratura - OK: handler correttamente implementato
- [x] Verificare chiamate API per registrazione timbrature - OK: endpoint API funzionante
- [x] Testare geolocalizzazione GPS per timbrature - MIGLIORATO: timeout 10s e messaggi errore dettagliati

## Bug UI Mobile - Modal Pagamento (23/01/2026)
- [x] Testo grigio chiaro quasi invisibile nel campo "Importo (€)" - RISOLTO: testo nero #000000
- [x] Testo grigio chiaro nei pulsanti non selezionati (Carta, Bonifico, Altro) - RISOLTO: testo nero #000000
- [x] Placeholder grigio chiaro nel campo "Note (opzionale)" - RISOLTO: placeholder grigio #9CA3AF
- [x] Cambiare tutti i testi in nero per migliorare leggibilità su mobile - COMPLETATO

## Bug UI Mobile - Schermata Appuntamenti Tecnici (23/01/2026)
- [x] Nome cliente (es. "Denis Corsi", "Baustianos") - RISOLTO: testo nero #000000
- [x] Indirizzo (es. "Via Chiuppani 60") - RISOLTO: testo nero #000000
- [x] Città (es. "Bassano del Grappa 36061") - RISOLTO: testo nero #000000
- [x] Telefono (es. "3474129120") - RISOLTO: testo nero #000000
- [x] Tipo intervento e note - RISOLTO: grigio scuro #4B5563 per distinguere da info principali
- [x] Testi vari nelle card appuntamenti - COMPLETATO: tutti i testi ora leggibili

## Feature Richieste - 23/01/2026 (Batch 3) - Timer Automatico e Mappa Percorso
- [x] Timer automatico durata intervento - start quando tecnico clicca "Sono arrivato" - IMPLEMENTATO: salva checkInTime + GPS
- [x] Timer automatico durata intervento - stop quando tecnico clicca "Completato" - IMPLEMENTATO: salva checkOutTime + GPS + calcola actualDuration
- [x] Salvare durata effettiva (actualDuration) nel database per statistiche - COMPLETATO
- [x] Mostrare timer in tempo reale nella card appuntamento durante intervento - IMPLEMENTATO: aggiornamento ogni minuto con useEffect
- [x] Mappa percorso giornaliero tecnico con pin appuntamenti del giorno - IMPLEMENTATO: componente TechnicianRouteMap
- [x] Calcolo percorso ottimizzato tra clienti nella mappa - IMPLEMENTATO: ordinamento per orario schedulato
- [x] Visualizzazione distanza totale km e tempo stimato nella mappa - IMPLEMENTATO: calcolo automatico con Haversine
- [x] Pulsante "Naviga al prossimo" per aprire Google Maps - IMPLEMENTATO: per ogni appuntamento nella mappa
- [x] Toggle "Appuntamenti"/"Mappa Percorso" nel tab Tecnici - IMPLEMENTATO: solo per vista Oggi
- [x] Correggere tipo checkInTime/checkOutTime nel router da string a date - COMPLETATO
- [x] Calcolo distanza totale km percorso giornaliero - IMPLEMENTATO (stima semplificata)
- [x] Calcolo tempo stimato totale percorso - IMPLEMENTATO (stima semplificata)
- [x] Pulsante "Naviga verso prossimo cliente" con Google Maps - IMPLEMENTATO (per ogni appuntamento)



## Performance Optimization (Batch 4)
- [x] Diagnosticare cause lentezza server (query database, polling troppo frequente, mancanza indici)
- [x] Configurare React Query cache (staleTime: 30s, gcTime: 5min) in app/_layout.tsx
- [x] Creare file SQL con indici database (drizzle/add_indexes.sql)
- [x] Creare script Node.js per applicazione indici (scripts/add-indexes.ts)
- [x] Documentare ottimizzazioni in PERFORMANCE_OPTIMIZATION.md
- [ ] Applicare indici database manualmente (da fare dall'amministratore)
- [ ] Testare performance dopo ottimizzazioni

## Bug Fixes (Batch 5)
- [ ] Risolvere bug ricerca clienti che non trova nessun risultato
- [ ] Verificare query database per ricerca clienti
- [ ] Testare ricerca con diversi criteri (nome, telefono, città)

## Bug Fixes (Batch 5)
- [ ] Risolvere bug ricerca clienti che non trova nessun risultato
- [ ] Verificare query database per ricerca clienti
- [ ] Testare ricerca con diversi criteri (nome, telefono, città)
- [x] Risolvere bug vista mensile che non mostra appuntamenti già fissati
- [x] Verificare query caricamento appuntamenti per mese
- [x] Testare visualizzazione appuntamenti in vista mensile

## Calendar Monthly View Enhancements (Batch 6)
- [x] Aggiungere indicatori visivi colorati sui giorni (verde 1-2, giallo 3-4, rosso 5+)
- [x] Implementare click su giorno per aprire vista dettagliata
- [x] Aggiungere filtro dropdown per tecnico nella vista mensile
- [x] Testare tutte le nuove funzionalità del calendario mensile

## Bug Fix - Calendar Day Click (Batch 7)
- [x] Risolvere bug click su giorno nel calendario mensile che non mostra appuntamenti
- [x] Implementare modal/drawer con lista appuntamenti del giorno selezionato
- [x] Mostrare dettagli: orario, cliente, tecnico, tipo intervento per ogni appuntamento
- [x] Testare funzionalità click e visualizzazione appuntamenti

## Bug Fix - React Hooks (Batch 8)
- [x] Correggere violazione regole hooks in DayDetailsModal (hooks chiamati dopo return condizionale)
- [x] Testare modal dopo correzione

## Bug Fix - Day Details Modal (Batch 9)
- [x] Risolvere "Cliente sconosciuto" nel modal - query clienti non carica dati
- [x] Implementare azione click su appuntamento nel modal
- [x] Testare visualizzazione nomi clienti e azione click

## Enhancement - Day Details Modal (Batch 10)
- [x] Aggiungere città cliente nel modal appuntamenti
- [x] Aggiungere indirizzo cliente nel modal appuntamenti
- [x] Testare visualizzazione città e indirizzo

## Bug Fix - Modal Loading (Batch 11)
- [x] Correggere timing caricamento query customers/technicians nel DayDetailsModal
- [x] Aggiungere loading state per evitare rendering prima del caricamento dati
- [x] Testare che tutti i clienti vengano visualizzati correttamente nel modal
- [x] Verificare che il problema "Cliente sconosciuto" sia risolto

## Bug Fix - Modal Customer Data (Batch 12)
- [x] Aggiungere console.log per debug dati customers nel modal
- [x] Verificare se customers array è vuoto o undefined
- [x] Identificato problema: customerId 66566 non esiste nel database
- [ ] Aggiungere campo "ID Cliente" visibile nel modal per debug
- [ ] Testare e identificare appuntamenti con customerId errato

## Enhancement - Show Customer ID (Batch 13)
- [x] Aggiungere campo "ID Cliente" visibile nel modal appuntamenti
- [x] Mostrare customerId accanto al nome cliente per debug
- [ ] Testare visualizzazione ID

## Enhancement - Customer ID in Detail Sheet (Batch 14)
- [x] Modificare titolo CustomerDetailSheet per includere ID cliente
- [x] Formato: "SCHEDA CLIENTE: Nome Cognome (ID 1234)"
- [ ] Testare visualizzazione

## Bug Fix - Customers List Limit (Batch 15)
- [x] Verificare query customers.list nel server per limite risultati
- [x] Clienti ID 66566 (Bau Gianna) e 68134 (Facchinello) non caricati
- [x] Rimuovere limite o aumentarlo per caricare tutti i clienti (da 100 a 10000)
- [ ] Testare che tutti i clienti vengano caricati nel modal

## Integration - Caminetti Montegrappa Price Catalog (Batch 16)
- [ ] Accedere area riservata Caminetti Montegrappa (https://areariservata.caminettimontegrappa.it/ita/)
- [ ] Esplorare struttura catalogo: modelli macchine, pezzi, codici, prezzi
- [ ] Analizzare come sono organizzate le pagine dei listini
- [ ] Progettare integrazione per recupero automatico prezzi pezzi
- [ ] Implementare funzione ricerca pezzo per codice articolo
- [ ] Implementare recupero prezzo in tempo reale da sito Montegrappa
- [ ] Testare integrazione con pezzi reali

## Integration - Caminetti Montegrappa Price List (Batch 14) - SEMPLIFICATO
- [ ] Implementare backend scraping login Montegrappa (username: 1203526, password: 78823056)
- [ ] Implementare navigazione catalogo (Brand → Category → Series → Model → Spare parts)
- [ ] Creare API `montegrappa.searchByCode` per ricerca in tempo reale per codice pezzo
- [ ] Creare API `montegrappa.searchByModel` per ricerca in tempo reale per modello stufa
- [ ] Implementare calcolo prezzi: basePrice + 5% = publicPrice, publicPrice + 22% IVA = priceWithVAT
- [ ] Creare nuovo tab "Listino Pezzi" nella bottom navigation
- [ ] Implementare UI ricerca per codice con loading e risultato singolo
- [ ] Implementare UI ricerca per modello con dropdown categorie/serie/modelli
- [ ] Mostrare tabella completa pezzi per modello selezionato con prezzi calcolati
- [ ] Aggiungere pulsante "Cerca Pezzo Montegrappa" nella scheda cliente
- [ ] Testare scraping e calcolo prezzi con pezzi reali
- [ ] Gestire errori di connessione e timeout

## Feature - Aggiunta Cliente da Modal Chiamata (Batch 17)
- [x] Modificare modal "Risultati Ricerca" per mostrare pulsante "Aggiungi Nuovo Cliente" quando nessun cliente trovato
- [x] Implementare form completo inserimento nuovo cliente nel modal chiamata
- [x] Aggiungere API endpoint `customers.checkDuplicateByAddress` per controllo duplicati indirizzo (città + via + numero civico)
- [x] Implementare alert avviso duplicato con dettagli cliente esistente (nome, telefono, indirizzo completo)
- [x] Permettere conferma creazione anche se duplicato trovato (caso marito/moglie stesso indirizzo)
- [x] Testare flusso completo: ricerca → non trovato → aggiungi → controllo duplicati → salva → crea chiamata
- [x] Gestire caso chiusura modal "Nessun cliente trovato" senza bloccare l'interfaccia

## Bug Fix - Modal Chiamata Aggiungi Cliente (Batch 18)
- [x] Debug: pulsante "Aggiungi Cliente" non apre form inserimento
- [x] Identificato problema: pulsante appariva solo in ricerca per nome, non per telefono
- [x] Aggiunto pulsante "Aggiungi Nuovo Cliente" anche quando ricerca per telefono non trova risultati
- [x] Fix modal ricerca per nome: reset nameSearchTerm alla chiusura per evitare blocco interfaccia
- [x] Testare tutti i flussi: ricerca telefono, ricerca nome, chiusura modal, compilazione manuale

## Miglioramenti Modal Nuova Chiamata (Batch 19)
- [x] Validazione campo telefono: accettare solo numeri (0-9), rimuovere automaticamente spazi, slash, trattini
- [x] Aggiungere controllo duplicati indirizzo anche quando si compila manualmente (non solo in form "Aggiungi Cliente")
- [x] Mostrare alert conferma se esiste già cliente con stesso indirizzo (città + numero civico)
- [x] Testare flusso: compila manualmente → salva → controllo duplicati → conferma/annulla

## Bug Fix - Controllo Duplicati Non Funziona (Batch 20)
- [x] Debug: controllo duplicati non viene eseguito quando si salva chiamata manualmente
- [x] Identificato problema: handleSave riceve evento click come primo parametro invece di force
- [x] Fix: modificare onPress per chiamare handleSave(() => handleSave(false)) senza passare evento
- [x] Testare con caso reale: stesso indirizzo + città, nome diverso

## Feature - Cancellazione Multipla Chiamate (Batch 21)
- [x] Aggiungere stato per tracciare chiamate selezionate (array di ID)
- [x] Implementare funzione toggle selezione checkbox
- [x] Aggiungere pulsante "Elimina Selezionate" nella toolbar (visibile solo se almeno 1 chiamata selezionata)
- [x] Implementare API endpoint per cancellazione multipla chiamate
- [x] Mostrare alert conferma con numero chiamate da cancellare
- [x] Aggiornare lista chiamate dopo cancellazione
- [x] Resettare selezioni dopo cancellazione

## Bug Fix - Controllo Duplicati Non Funziona in AddCustomerForm (Batch 24)
- [x] Debug: controllo duplicati non ha bloccato creazione "Luca Corsini" in Via Chiuppani 60, Bassano del Grappa
- [x] Esiste già "Denis Corsi" in Via Chiuppani 60 ma alert non è apparso
- [x] Verificare dati Denis Corsi nel database: città e indirizzo esatti
- [x] CAUSA IDENTIFICATA: Denis ha "Bassano del Grappa" (G maiuscola), Luca ha "Bassano del grappa" (g minuscola)
- [x] Confronto città è case-sensitive, quindi non trova match
- [x] Verificato: query SQL già usa LOWER() per confronto case-insensitive
- [x] Aggiunto log di debug in handleSaveCustomer per diagnosticare problema
- [x] Testare con caso reale: creare cliente con stesso indirizzo e verificare log console
- [x] PROBLEMA: chiamata API checkDuplicateByAddress non completa, log si fermano dopo parametri
- [x] Aggiungere log backend in routers.ts per verificare se richiesta arriva
- [x] Aggiungere log backend in db.ts checkDuplicateByAddress per vedere query e risultati
- [x] Testare e verificare log completi: frontend + backend + database
- [x] CAUSA IDENTIFICATA: checkDuplicateByAddress definito come .query() nel backend ma usato come .useMutation() nel frontend
- [x] FIX: cambiato da .query() a .mutation() in routers.ts
- [ ] Testare che controllo duplicati funzioni correttamente dopo fix

## Feature - Cancellazione Clienti (Batch 25)
- [x] Aggiungere pulsante "Elimina Cliente" nella scheda cliente (Dashboard Operatore)
- [x] API endpoint `customers.delete` già esistente
- [x] Mostrare alert conferma prima di cancellare con dettagli cliente
- [x] Verificare se cliente ha chiamate/appuntamenti associati
- [x] Se ha chiamate: mostrare warning nel messaggio di conferma
- [x] Cancellare cliente (backend gestisce automaticamente chiamate associate)
- [x] Chiudere scheda cliente dopo cancellazione
- [x] Testare cancellazione cliente senza chiamate
- [x] Testare cancellazione cliente con chiamate associate

## Miglioramento Controllo Duplicati - Ricerca Via + Numero (Batch 26)
- [x] Problema: controllo duplicati trova troppi match (es. "Via Villaggio Europa 260" matcha "60")
- [x] Modificare logica per estrarre nome via + numero civico separatamente
- [x] Estrazione numero civico: pattern `(\d+[a-zA-Z]?)\s*$` (fine stringa)
- [x] Estrazione nome via: rimuove numero civico e normalizza (rimuove prefissi via/strada/viale)
- [x] Query cerca: città + nome via normalizzato + numero civico
- [ ] Testare che "Via Chiuppani 60" trovi solo Denis Corsi, non altri con "60" in vie diverse

## Fix Creazione Automatica Cliente in handleSave (Batch 27)
- [ ] Problema: compilazione manuale campi non crea cliente in database
- [ ] Problema: controllo duplicati non viene eseguito in compilazione manuale
- [ ] Modificare handleSave per creare cliente se foundCustomer === null
- [ ] Eseguire controllo duplicati PRIMA di creare cliente
- [ ] Associare customerId appena creato alla chiamata
- [ ] Testare flusso completo: telefono nuovo → compila manualmente → salva → verifica cliente creato

## Aggiornamento Task Batch 27
- [x] Modificare handleSave per creare cliente se foundCustomer === null
- [x] Eseguire controllo duplicati PRIMA di creare cliente
- [x] Associare customerId appena creato alla chiamata
- [x] Split automatico customerName in firstName/lastName
- [x] Gestione errori creazione cliente con alert

## Bug Campi Form Non Salvano Dati (Batch 28)
- [ ] Problema: campi compilati nel modal "Nuova Chiamata" non vengono salvati negli stati React
- [ ] Log mostra customerName, address, city tutti vuoti anche dopo compilazione
- [ ] Verificare struttura form e binding onChangeText
- [ ] Correggere collegamento campi → stati React

## Fix Applicato Batch 28
- [x] Identificato problema: campo Nome Cliente collegato a nameSearchTerm invece di customerName
- [x] Modificato onChangeText per usare setCustomerName
- [x] Rimosso binding ricerca per nome (causava confusione)
- [x] Cambiato placeholder da "Cerca per nome" a "Inserisci nome e cognome"

## Bug Gestione Chiamate (Batch 29)
- [ ] Numeri data sopra calendario si leggono male (sovrapposizione)
- [ ] Icona omino (👤) non funziona - dovrebbe aprire scheda cliente
- [ ] Errore "setFoundCustomer is not defined" quando si clicca Annulla in modal Modifica Chiamata
- [ ] Correggere EditCallModal per non usare stati non definiti

## Fix Completati Batch 29
- [x] Errore "setFoundCustomer is not defined" risolto - rimosso codice non necessario nel pulsante Annulla
- [x] Icona omino (👤) ora funziona - apre CustomerDetailSheet quando call ha customerId
- [x] Alert se chiamata senza cliente associato
- [x] Import CustomerDetailSheet aggiunto
- [x] Stati selectedCustomerId e showCustomerDetail aggiunti

## Tutti i Fix Batch 29 Completati
- [x] Numeri data sopra calendario - Aumentata larghezza colonna Azioni da 80/120 a 160px
- [x] Icona omino (👤) funzionante - Apre CustomerDetailSheet
- [x] Errore Annulla in Modifica Chiamata risolto

## Bug Timbratura Mobile (Batch 30)
- [ ] Login tecnico non funziona su mobile - link diretto non richiede credenziali
- [ ] Timbratura non funzionante senza login tecnico
- [ ] Verificare sistema autenticazione tecnici
- [ ] Implementare login semplice per tecnici su mobile

## Implementazione Login Tecnico Completata (Batch 30)
- [x] Aggiunto import AsyncStorage
- [x] Creati stati per login: technicianId, technicianName, isLoggedIn, selectedTechId
- [x] Implementata funzione loadTechnicians per caricare lista tecnici
- [x] Implementata funzione loadSession per recuperare sessione salvata
- [x] Implementata funzione handleLogin con salvataggio in AsyncStorage
- [x] Implementata funzione handleLogout con conferma
- [x] Creata schermata login con selezione tecnico
- [x] Aggiunto nome tecnico e pulsante Esci nell'header
- [x] Modificato useEffect per caricare timbrature solo se loggato

## Feature Appuntamenti Mobile per Tecnici (Batch 31)
- [ ] Creare pagina app/(tabs)/appuntamenti.tsx
- [ ] Implementare caricamento appuntamenti del tecnico loggato
- [ ] Mostrare lista appuntamenti di oggi con card
- [ ] Aggiungere informazioni cliente (nome, telefono, indirizzo)
- [ ] Implementare pulsanti "Sono Arrivato" e "Completato"
- [ ] Aggiungere timer automatico durata intervento
- [ ] Aggiungere tab "Appuntamenti" nella bottom navigation
- [ ] Aggiungere icona calendario nel tab
- [ ] Implementare badge con numero appuntamenti

- [x] Creare pagina app/(tabs)/appuntamenti.tsx
- [x] Implementare caricamento appuntamenti del tecnico loggato
- [x] Mostrare lista appuntamenti di oggi con card
- [x] Aggiungere informazioni cliente (nome, telefono, indirizzo)
- [x] Implementare pulsanti "Sono Arrivato" e "Completato"
- [x] Aggiungere timer automatico durata intervento
- [x] Aggiungere pulsanti Chiama e Naviga

- [x] Aggiungere tab "Appuntamenti" nella bottom navigation
- [x] Aggiungere icona calendario nel tab (calendar.fill)

- [x] Correggere chiamate mutation da updateStatus a update
- [x] Usare checkInTime e checkOutTime invece di startTime/endTime
- [x] Calcolare actualDuration correttamente

## Bug Appuntamenti Non Visualizzati (Batch 32)
- [ ] Denis Corsi ha appuntamenti oggi ma la pagina mostra "Nessun appuntamento"
- [ ] Verificare campo data corretto (appointmentDate vs scheduledDate)
- [ ] Verificare filtro data funzionante
- [ ] Verificare technicianId corretto
- [ ] Aggiungere log debug per capire cosa viene filtrato

- [x] Correggere campo da appointmentDate a scheduledDate in interface
- [x] Correggere filtro data per usare scheduledDate
- [x] Correggere ordinamento per usare scheduledDate
- [x] Correggere visualizzazione orario per usare scheduledDate

## Bug Dati Cliente Mancanti Appuntamenti (Batch 33)
- [ ] Nome cliente mostra "Cliente sconosciuto" invece del nome reale
- [ ] Pulsante "Naviga" non funziona (manca indirizzo)
- [ ] Query appuntamenti non include JOIN con tabella customers
- [ ] Aggiungere campi firstName, lastName, phone, address, city da customers

- [x] Aggiornare interface Appointment con oggetto customer
- [x] Correggere rendering nome cliente usando customer.firstName + customer.lastName
- [x] Correggere rendering indirizzo usando customer.address + customer.city
- [x] Correggere rendering telefono usando customer.phone
- [x] Correggere pulsante Chiama per usare customer.phone
- [x] Correggere pulsante Naviga per usare customer.address + customer.city
- [x] Cambiare interventionType in serviceType

## Feature Scheda Cliente da Appuntamento (Batch 34)
- [ ] Rendere nome cliente cliccabile negli appuntamenti
- [ ] Aprire CustomerDetailSheet quando si clicca sul nome
- [ ] Permettere al tecnico di vedere storico interventi
- [ ] Permettere al tecnico di aggiungere note intervento

- [x] Aggiungere import CustomerDetailSheet
- [x] Aggiungere stati selectedCustomerId e showCustomerSheet
- [x] Rendere nome cliente cliccabile con TouchableOpacity
- [x] Aprire CustomerDetailSheet quando si clicca sul nome
- [x] Aggiungere callback onClose per ricaricare appuntamenti

## Feature Geolocalizzazione Check-in (Batch 35)
- [ ] Installare expo-location per accesso GPS
- [ ] Richiedere permessi location quando tecnico clicca "Sono Arrivato"
- [ ] Salvare coordinate GPS (latitude, longitude) in database
- [ ] Aggiungere campi checkInLatitude, checkInLongitude in tabella appointments
- [ ] Calcolare distanza tra posizione tecnico e indirizzo cliente
- [ ] Mostrare indicatore visivo se tecnico è sul posto

## Feature Modalità Offline (Batch 36)
- [ ] Salvare appuntamenti in AsyncStorage all'avvio
- [ ] Caricare appuntamenti da AsyncStorage se offline
- [ ] Sincronizzare con server quando torna connessione
- [ ] Aggiungere indicatore stato connessione
- [ ] Salvare modifiche localmente e sincronizzare dopo

- [x] Installare expo-location
- [x] Aggiungere plugin expo-location in app.config.ts
- [x] Aggiungere permessi ACCESS_FINE_LOCATION e ACCESS_COARSE_LOCATION
- [x] Implementare richiesta permessi GPS in handleArrived
- [x] Salvare coordinate checkInLatitude e checkInLongitude quando tecnico clicca "Sono Arrivato"
- [x] Mostrare coordinate in alert di conferma
- [x] Convertire coordinate da number a string prima di inviarle al backend

- [x] Implementare cache AsyncStorage per appuntamenti
- [x] Caricare prima da cache poi da server
- [x] Gestire fallback a cache se server offline
- [x] Aggiungere stato isOnline
- [x] Mostrare indicatore "✅ Online" / "⚠️ Offline" nell'header
- [x] Alert "Modalità Offline" quando usa solo cache

## Fix CustomerDetailSheet Mobile (Batch 37)
- [ ] Analizzare CustomerDetailSheet attuale per problemi mobile
- [ ] Creare layout responsive con Platform.OS detection
- [ ] Ottimizzare font size e spacing per mobile
- [ ] Rendere pulsanti touch-friendly (min 44px height)
- [ ] Testare scroll e usabilità su mobile

- [x] Creare CustomerDetailSheetMobile.tsx ottimizzato per React Native
- [x] Layout verticale con ScrollView
- [x] Font size 16-18px per leggibilità mobile
- [x] Pulsanti touch-friendly (44px+ height)
- [x] Modal fullscreen con presentationStyle pageSheet
- [x] Pulsanti Chiama e Naviga prominenti
- [x] Modalità modifica con TextInput nativi
- [x] Sostituire import in appuntamenti.tsx con versione mobile

## Calcolo Automatico Durata Intervento (Batch 38)
- [ ] Verificare campo duration nel database appointments
- [ ] Implementare calcolo durata in handleCompleted (checkOutTime - checkInTime)
- [ ] Convertire durata in minuti e salvare nel database
- [ ] Mostrare durata calcolata nella card appuntamento completato
- [ ] Testare con intervento reale (Sono Arrivato → Completato)

## Feature Storico Interventi + Foto + GPS (Batch 39)
- [ ] Aggiungere sezione "Storico Interventi" in CustomerDetailSheetMobile
- [ ] Query getCustomerHistory per ultimi 5 interventi
- [ ] Mostrare data, durata, note tecniche per ogni intervento
- [ ] Installare expo-image-picker per foto
- [ ] Aggiungere pulsante "📷 Scatta Foto" nella card appuntamento
- [ ] Salvare foto in S3 e URL in database (campo photos)
- [ ] Mostrare foto in scheda cliente
- [ ] Calcolare distanza GPS tra tecnico e indirizzo cliente
- [ ] Mostrare badge "📍 Sei sul posto" (verde) se < 100m
- [ ] Mostrare badge "⚠️ Lontano" (giallo) se > 100m

## Feature Storico Interventi Completata (Batch 39.1)
- [x] Aggiungere sezione "Storico Interventi" in CustomerDetailSheetMobile
- [x] Query getCustomerHistory per ultimi 5 interventi
- [x] Mostrare data, durata, note tecniche per ogni intervento

## Bug Calcolo Durata Intervento (Batch 40)
- [ ] Verificare calcolo actualDuration in handleCompleted
- [ ] Correggere differenza tra checkInTime e checkOutTime
- [ ] Assicurare che actualDuration venga salvato correttamente nel database
- [ ] Testare con intervento di 2 minuti reali

## Fix Calcolo Durata Intervento Completato (Batch 40)
- [x] Verificare calcolo actualDuration in handleCompleted
- [x] Correggere da startTime a checkInTime per calcolo corretto
- [x] Assicurare che actualDuration venga salvato correttamente nel database

## Bug Stato Appuntamento Non Aggiornato (Batch 42)
- [ ] Verificare se handleCompleted salva correttamente status: "completed"
- [ ] Verificare se la card ricarica i dati dopo completamento
- [ ] Correggere visualizzazione badge stato "Completato"

## Fix Stato Appuntamento Completato (Batch 42)
- [x] Aggiungere invalidazione cache AsyncStorage prima di ricaricare
- [x] Aggiungere delay 500ms per assicurare sincronizzazione server
- [x] Applicare fix sia a handleCompleted che handleArrived

## Bug Sessione Login Non Condivisa (Batch 43)
- [ ] Verificare se Timbratura e Appuntamenti usano stesso AsyncStorage key
- [ ] Condividere sessione login tecnico tra tutte le tab
- [ ] Rimuovere schermata login da Appuntamenti se già loggato in Timbratura

## Fix Sessione Login Condivisa (Batch 43)
- [x] Aggiungere useFocusEffect per ricaricare sessione quando tab diventa attiva
- [x] Import React per usare React.useCallback

## Feature Galleria Foto Intervento (Batch 44)
- [ ] Implementare query per recuperare foto da tabella documents
- [ ] Aggiungere sezione galleria foto in CustomerDetailSheetMobile
- [ ] Mostrare foto nello storico interventi
- [ ] Implementare visualizzazione foto a schermo intero

## Feature Badge Distanza GPS (Batch 45)
- [ ] Implementare funzione calcolo distanza Haversine
- [ ] Aggiungere badge "📍 Sei sul posto" (verde) se ≤ 100m
- [ ] Aggiungere badge "⚠️ Lontano dal cliente" (giallo) se > 100m
- [ ] Mostrare distanza esatta in metri

- [x] Query documents.getByCustomer implementata
- [x] Query documents.getByAppointment implementata

- [x] Sezione galleria foto in CustomerDetailSheetMobile implementata
- [x] Modal visualizzazione foto a schermo intero implementato
- [x] Integrazione query listByCustomer completata

- [x] Funzione calcolo distanza Haversine implementata
- [x] Badge distanza GPS in card appuntamento implementato
- [x] Badge verde "📍 Sei sul posto" se ≤ 100m
- [x] Badge giallo "⚠️ Lontano" se > 100m con distanza esatta
- [x] BUG: Durata effettiva non visualizzata per appuntamenti completati (mostra solo durata prevista)
- [x] Mostrare durata effettiva nel calendario desktop per appuntamenti completati
- [x] Cambiare colore card appuntamenti completati nel calendario desktop (verde)
- [x] BUG: Errore React Native 'Text strings must be rendered within a Text component' nella pagina Appuntamenti
- [x] Implementare geocoding automatico per popolare coordinate GPS clienti esistenti
- [x] BUG: Calendario desktop non mostra colore verde e durata effettiva per appuntamento completato Denis Corsi
- [x] BUG: Appuntamenti di domani non visibili nell'agenda tecnico mobile
- [x] BUG: Tab Tecnici mobile non mostra appuntamenti mentre tab Appuntamenti funziona correttamente

- [x] BUG: Pagina timbrature PC bloccata, non permette scroll
- [x] FEATURE: Aggiungere pulsante elimina per ogni timbratura (correggere errori/duplicati)
- [ ] Unificare tab Appuntamenti e Tecnici in unica interfaccia completa
- [ ] Implementare notifiche push 30 minuti prima appuntamento con pulsante Naviga
- [ ] Creare widget home screen iOS/Android con countdown e azione Sono Arrivato
- [x] BUG: App mobile mostra "offline" nonostante connessione internet attiva (5 tacche)
- [ ] BUG: Durata effettiva non calcolata dopo completamento intervento mobile (mostra durata prevista invece di minuti reali)
- [x] Aggiungere cliente Zen Giada e creare appuntamento immediato per Denis
- [x] BUG: Pulsante Naviga mostra solo via senza città (navigazione incompleta)
- [x] BUG CRITICO: Durata effettiva ancora mostra 60 min invece di tempo reale (fix completo: checkInTime in interface + query getAllAppointments)

## Dettaglio Intervento Completato Mobile
- [x] Aggiungere campi database: workDescription, laborPrice, partsPrice, partsCode
- [x] API backend per salvare dettagli intervento completato
- [x] Schermata mobile dettaglio intervento con tap su nome cliente
- [x] Campo textarea "Lavoro Svolto"
- [x] Campo prezzo manodopera con calcolo automatico da tempo effettivo
- [x] Campo prezzo materiali/pezzi con codice pezzo
- [x] Salvataggio dettagli intervento al completamento
- [x] Visualizzazione dettagli intervento salvati


## Fix Salvataggio e IVA Automatica
- [x] Aggiungere colonne ivaRate e totalPrice al database
- [x] Aggiungere campi ivaRate e totalPrice all'API backend
- [x] Implementare selezione IVA (10% o 22%) nel modal
- [x] Calcolo automatico IVA e totale con visualizzazione dettagliata
- [x] Fix bug salvataggio dettagli intervento
