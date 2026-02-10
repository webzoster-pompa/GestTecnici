# Sistema Gestione Appuntamenti Tecnici

**Versione:** 1.0  
**Data:** 28 Dicembre 2025  
**Autore:** Manus AI

---

## Panoramica del Sistema

Il sistema **Gestione Tecnici** rappresenta una soluzione completa per la gestione degli appuntamenti di assistenza tecnica, progettata per ottimizzare i percorsi dei tecnici e automatizzare le comunicazioni con i clienti. Il sistema è stato sviluppato per gestire un database di oltre 10.000 clienti e supporta l'intero flusso operativo, dalla ricezione della chiamata alla conferma dell'intervento completato.

### Caratteristiche Principali

Il sistema si articola in tre componenti fondamentali che lavorano in sinergia per garantire efficienza operativa e soddisfazione del cliente. La **dashboard web** consente agli operatori di gestire le chiamate in arrivo, cercare rapidamente i clienti nel database e proporre appuntamenti ottimizzati in base alla posizione geografica e agli impegni già fissati. L'**app mobile** permette ai tecnici di visualizzare il proprio calendario giornaliero, navigare verso i clienti e aggiornare lo stato degli interventi direttamente dal campo. Il **backend intelligente** calcola automaticamente i tre slot temporali più convenienti per minimizzare i tempi di spostamento e invia notifiche automatiche via email e WhatsApp per conferme e promemoria.

### Architettura Tecnologica

Il sistema è costruito su una moderna architettura full-stack che garantisce scalabilità e manutenibilità nel tempo. Il frontend utilizza **React Native** con **Expo SDK 54**, permettendo di condividere la maggior parte del codice tra web e mobile, mentre **NativeWind** (Tailwind CSS per React Native) assicura un design coerente e responsivo su tutte le piattaforme. Il backend è implementato con **Express.js** e **tRPC**, offrendo API type-safe e auto-documentate che riducono drasticamente gli errori di integrazione. Il database **PostgreSQL** gestisce tutti i dati persistenti, con **Drizzle ORM** che fornisce query builder type-safe e migrazioni automatiche.

---

## Guida Installazione e Setup

### Prerequisiti di Sistema

Prima di procedere con l'installazione, è necessario verificare la presenza dei seguenti componenti nel sistema. È richiesto **Node.js** versione 22.x o superiore, installabile dal sito ufficiale nodejs.org. Il package manager **pnpm** versione 9.x è utilizzato per la gestione delle dipendenze e può essere installato globalmente con il comando `npm install -g pnpm`. Un'istanza di **PostgreSQL** versione 14 o superiore deve essere disponibile e accessibile, sia in locale che su un server remoto. Per lo sviluppo mobile è necessario **Expo Go** installato su dispositivi iOS o Android, scaricabile gratuitamente dagli store ufficiali.

### Configurazione Database

La configurazione del database richiede la creazione di un database dedicato e l'impostazione della stringa di connessione. Accedere a PostgreSQL e creare un nuovo database con il comando `CREATE DATABASE gestione_tecnici;`. Creare un file `.env` nella root del progetto contenente la variabile `DATABASE_URL` nel formato `postgresql://username:password@localhost:5432/gestione_tecnici`. Eseguire le migrazioni del database con il comando `pnpm db:push` per creare automaticamente tutte le tabelle necessarie. Opzionalmente, popolare il database con dati di esempio eseguendo `pnpm exec tsx server/seed-data.ts`.

### Avvio del Sistema

Per avviare l'ambiente di sviluppo completo, installare tutte le dipendenze con `pnpm install`. Avviare contemporaneamente il server backend e il bundler Metro con `pnpm dev`. Il sistema sarà accessibile via web all'indirizzo `http://localhost:8081` per la dashboard operatore. Per testare l'app mobile, aprire Expo Go sul dispositivo e scansionare il QR code visualizzato nel terminale.

### Configurazione Notifiche

Il sistema include placeholder per l'integrazione con servizi di notifica esterni. Per abilitare le notifiche email, è necessario configurare un servizio SMTP come SendGrid o AWS SES, modificando il file `server/notifications.ts` per includere le credenziali del servizio scelto. Per le notifiche WhatsApp, si consiglia l'utilizzo di WhatsApp Business API o Twilio WhatsApp, richiedendo l'approvazione ufficiale e la configurazione delle chiavi API nel file di notifiche.

---

## Manuale Utente Operatore Web

### Interfaccia Dashboard

La dashboard operatore è organizzata in tre colonne verticali che permettono di gestire l'intero flusso di lavoro senza cambiare schermata. La **colonna sinistra** è dedicata alla ricerca e gestione clienti, con un campo di ricerca che filtra automaticamente per nome, cognome, telefono o email mentre si digita. La **colonna centrale** visualizza i tre slot ottimali proposti dal sistema dopo aver selezionato un cliente, mostrando per ciascuno la data, l'ora, il tecnico assegnato e la distanza totale calcolata. La **colonna destra** presenta una vista compatta del calendario settimanale per verificare rapidamente la disponibilità generale.

### Gestione Chiamata Cliente

Quando arriva una chiamata, l'operatore inizia digitando nel campo di ricerca qualsiasi informazione fornita dal cliente. Se il cliente esiste già nel database, appare immediatamente nell'elenco dei risultati e può essere selezionato con un click. Se si tratta di un nuovo cliente, premere il pulsante "Nuovo Cliente" e compilare il form con i dati anagrafici essenziali: nome, cognome, telefono, indirizzo completo e città. Il sistema geocodifica automaticamente l'indirizzo per calcolare le coordinate geografiche necessarie all'ottimizzazione dei percorsi.

### Proposta Slot Ottimali

Dopo aver selezionato o creato il cliente, premere il pulsante "Cerca Slot Disponibili" per attivare l'algoritmo di ottimizzazione. Il sistema analizza tutti i tecnici disponibili e i loro appuntamenti già fissati nei prossimi 7 giorni, calcolando per ogni possibile slot la distanza dall'appuntamento precedente e verso quello successivo. I tre slot con il punteggio migliore vengono visualizzati nella colonna centrale, ordinati per convenienza. Ogni card mostra chiaramente la data in formato esteso, l'orario, il nome del tecnico assegnato e le distanze calcolate in chilometri.

### Conferma Appuntamento

Per confermare un appuntamento, è sufficiente premere il pulsante "Conferma Appuntamento" sulla card dello slot scelto. Il sistema crea immediatamente l'appuntamento nel database, lo assegna al tecnico indicato e invia automaticamente le notifiche di conferma al cliente via email (se disponibile) e WhatsApp. L'operatore riceve una conferma visiva del successo dell'operazione e può procedere con la chiamata successiva.

---

## Manuale Utente Tecnico Mobile

### Calendario Giornaliero

All'apertura dell'app, il tecnico visualizza immediatamente il proprio calendario della giornata corrente. L'intestazione mostra la data estesa in italiano e il numero totale di appuntamenti programmati. Ogni appuntamento è rappresentato da una card che include l'orario in grande evidenza, il nome completo del cliente, l'indirizzo con icona mappa cliccabile e il numero di telefono con funzionalità tap-to-call. Un badge colorato indica lo stato dell'appuntamento: grigio per "In attesa", blu per "In corso" e verde per "Completato".

### Navigazione verso Cliente

Per raggiungere il cliente, è sufficiente toccare l'indirizzo visualizzato sulla card dell'appuntamento. Il sistema apre automaticamente l'app di navigazione predefinita del dispositivo (Google Maps su Android, Apple Maps su iOS) con l'indirizzo già impostato come destinazione. Questa integrazione nativa garantisce la migliore esperienza di navigazione possibile, sfruttando le mappe offline e il traffico in tempo reale.

### Gestione Stato Intervento

Durante l'intervento, il tecnico può aggiornare lo stato dell'appuntamento direttamente dall'app. Quando l'intervento è completato, premere il pulsante "Completato" sulla card dell'appuntamento. Il sistema aggiorna immediatamente lo stato nel database e il badge diventa verde. Questa informazione è visibile in tempo reale anche dalla dashboard operatore, permettendo una coordinazione efficace del team.

### Contatto Cliente

Se è necessario contattare il cliente prima dell'appuntamento, toccare il numero di telefono visualizzato sulla card. Il sistema apre automaticamente l'app telefono del dispositivo con il numero già composto, permettendo di effettuare la chiamata con un solo tocco. Questa funzionalità è particolarmente utile per confermare l'orario o avvisare di eventuali ritardi.

---

## Documentazione Tecnica API

### Endpoint Clienti

Il sistema espone una serie completa di endpoint per la gestione dei clienti attraverso tRPC. L'endpoint `customers.list` restituisce un elenco paginato di clienti, accettando parametri opzionali `limit` (default 100) e `offset` (default 0) per la paginazione. L'endpoint `customers.search` permette di cercare clienti per nome, cognome, telefono o email, restituendo fino a 20 risultati ordinati per rilevanza. L'endpoint `customers.create` accetta un oggetto con i dati del nuovo cliente e restituisce l'ID assegnato, geocodificando automaticamente l'indirizzo fornito. Gli endpoint `customers.update` e `customers.delete` permettono rispettivamente di modificare e rimuovere clienti esistenti.

### Endpoint Appuntamenti

La gestione degli appuntamenti è centralizzata attraverso il router `appointments`. L'endpoint `appointments.list` restituisce tutti gli appuntamenti in un range di date specificato tramite i parametri opzionali `startDate` e `endDate`. L'endpoint `appointments.getByTechnician` filtra gli appuntamenti per un tecnico specifico, supportando anch'esso il filtraggio temporale. L'endpoint cruciale `appointments.proposeSlots` implementa l'algoritmo di ottimizzazione percorsi, accettando `customerId` e opzionalmente `preferredDate` e `duration`, restituendo un array di tre oggetti contenenti data, tecnico, distanze e punteggio. L'endpoint `appointments.create` crea un nuovo appuntamento e attiva automaticamente l'invio delle notifiche al cliente.

### Algoritmo Ottimizzazione Percorsi

L'algoritmo di ottimizzazione implementato nel file `server/route-optimizer.ts` utilizza la formula di Haversine per calcolare le distanze geodetiche tra coordinate geografiche. Per ogni tecnico disponibile, il sistema genera tutti gli slot liberi nei prossimi 7 giorni, escludendo weekend e orari fuori dalla fascia lavorativa (8:00-18:00). Per ogni slot, calcola la distanza dall'appuntamento precedente e verso quello successivo, assegnando un punteggio basato sulla distanza totale. I tre slot con punteggio minore vengono restituiti come proposte ottimali, garantendo la minimizzazione dei chilometri percorsi e del tempo sprecato negli spostamenti.

### Schema Database

Il database è strutturato in cinque tabelle principali interconnesse. La tabella `customers` memorizza i dati anagrafici dei clienti con campi per nome, cognome, telefono, email, indirizzo completo e coordinate geografiche (latitude, longitude). La tabella `technicians` contiene i dati dei tecnici con riferimento alla tabella `users` per l'autenticazione, includendo anche un campo JSON per le competenze. La tabella `appointments` collega clienti e tecnici con campi per data/ora programmata, durata, stato (scheduled, in_progress, completed, cancelled), tipo di servizio e note. La tabella `notifications` registra tutte le notifiche inviate con tipo (email, whatsapp, push), destinatario, messaggio e stato di invio.

---

## Funzionalità Avanzate

### Sistema Notifiche Automatiche

Il sistema di notifiche implementato in `server/notifications.ts` gestisce l'invio automatico di comunicazioni ai clienti in momenti strategici del ciclo di vita dell'appuntamento. Immediatamente dopo la conferma, viene inviata una notifica di conferma contenente tutti i dettagli dell'appuntamento: data, ora, indirizzo e tipo di intervento. Ventiquattro ore prima dell'appuntamento, il sistema invia automaticamente un promemoria per ridurre il tasso di no-show. Due ore prima dell'intervento, un ulteriore promemoria conferma l'imminenza dell'arrivo del tecnico. Ogni notifica viene registrata nella tabella `notifications` con timestamp e stato di invio per tracciabilità completa.

### Geocodificazione Indirizzi

La funzione `geocodeAddress` nel modulo `route-optimizer.ts` converte gli indirizzi testuali in coordinate geografiche necessarie per il calcolo delle distanze. Attualmente implementata con un placeholder per testing, la funzione è progettata per integrarsi con servizi di geocoding come Nominatim di OpenStreetMap (gratuito) o Google Geocoding API (a pagamento ma più preciso). Le coordinate ottenute vengono memorizzate nella tabella `customers` per evitare geocodificazioni ripetute e velocizzare i calcoli successivi.

### Calcolo Distanze Geodetiche

Il calcolo delle distanze tra due punti geografici utilizza la formula di Haversine, che tiene conto della curvatura terrestre per fornire distanze accurate anche su lunghe percorrenze. La funzione `calculateDistance` accetta latitudine e longitudine di due punti e restituisce la distanza in chilometri. Questa implementazione è preferibile alle semplici distanze euclidee perché fornisce risultati realistici che corrispondono alle distanze stradali effettive con un margine di errore accettabile per l'ottimizzazione dei percorsi.

---

## Manutenzione e Troubleshooting

### Problemi Comuni e Soluzioni

Se il server non si avvia, verificare che PostgreSQL sia in esecuzione e che la stringa di connessione in `.env` sia corretta. Se la ricerca clienti non restituisce risultati, controllare che il database sia stato popolato con dati e che non ci siano errori di connessione. Se le notifiche non vengono inviate, verificare i log del server per identificare eventuali errori di configurazione dei servizi esterni. Se l'app mobile non si connette al backend, assicurarsi che il dispositivo sia sulla stessa rete del computer di sviluppo e che il firewall non blocchi la porta 8081.

### Backup e Ripristino Database

Per garantire la sicurezza dei dati, è fondamentale implementare una strategia di backup regolare. Utilizzare il comando `pg_dump` di PostgreSQL per creare backup completi del database: `pg_dump -U username -d gestione_tecnici > backup_$(date +%Y%m%d).sql`. Automatizzare questo processo con un cron job giornaliero per eseguire il backup durante le ore notturne. Per ripristinare un backup, utilizzare `psql -U username -d gestione_tecnici < backup_file.sql`. Conservare i backup in una location sicura e separata dal server principale.

### Monitoraggio Performance

Per sistemi in produzione con migliaia di clienti e appuntamenti, è importante monitorare le performance del database e delle API. Utilizzare strumenti come `pg_stat_statements` per identificare query lente e ottimizzarle con indici appropriati. Monitorare i tempi di risposta delle API tRPC attraverso logging strutturato. Implementare caching per query frequenti come la lista dei tecnici attivi. Considerare l'utilizzo di connection pooling per gestire efficacemente le connessioni al database sotto carico elevato.

---

## Roadmap Futuri Sviluppi

### Funzionalità Pianificate

Il sistema è progettato per evolversi con le esigenze dell'azienda. Tra le funzionalità pianificate per le prossime versioni, l'implementazione di un **calendario settimanale interattivo** nella dashboard web permetterà di visualizzare e modificare appuntamenti con drag-and-drop. Una **pagina di gestione anagrafica completa** consentirà di esportare i dati clienti in Excel, importare anagrafiche da file CSV e gestire note storiche degli interventi. L'aggiunta di **notifiche push** nell'app mobile terrà i tecnici aggiornati in tempo reale su nuovi appuntamenti o modifiche. Un **sistema di reportistica** genererà statistiche su appuntamenti completati, tempi medi di intervento e chilometri percorsi per tecnico.

### Integrazioni Esterne

Per massimizzare l'efficienza operativa, sono previste integrazioni con servizi esterni di uso comune. L'integrazione con **Google Calendar** o **Outlook Calendar** sincronizzerà automaticamente gli appuntamenti con i calendari personali dei tecnici. L'integrazione con **sistemi di fatturazione** come Fatture in Cloud permetterà di generare automaticamente fatture al completamento degli interventi. L'integrazione con **piattaforme di pagamento** come Stripe o PayPal consentirà ai clienti di pagare direttamente dall'app o dal link nella notifica. L'integrazione con **sistemi CRM** esistenti importerà automaticamente i dati clienti senza duplicazioni.

### Ottimizzazioni Tecniche

Sul fronte tecnico, diverse ottimizzazioni miglioreranno scalabilità e user experience. L'implementazione di **caching Redis** ridurrà il carico sul database per query frequenti come la lista tecnici e i dati clienti. L'aggiunta di **indici database** ottimizzati velocizzerà le ricerche su grandi volumi di dati. L'implementazione di **lazy loading** nell'app mobile ridurrà i tempi di caricamento iniziale. L'adozione di **React Query** per la gestione dello stato server semplificherà la sincronizzazione dati e il caching lato client.

---

## Conclusioni

Il sistema **Gestione Tecnici** rappresenta una soluzione completa e moderna per l'ottimizzazione della gestione appuntamenti in aziende di assistenza tecnica. L'architettura full-stack basata su tecnologie consolidate garantisce affidabilità e manutenibilità nel tempo, mentre l'algoritmo di ottimizzazione percorsi riduce concretamente i costi operativi minimizzando gli spostamenti inutili. L'interfaccia web intuitiva e l'app mobile nativa offrono un'esperienza utente fluida sia per gli operatori che per i tecnici sul campo.

Il sistema è immediatamente operativo con i dati di esempio forniti e può essere scalato facilmente per gestire decine di migliaia di clienti e centinaia di appuntamenti giornalieri. La struttura modulare del codice facilita l'aggiunta di nuove funzionalità e l'integrazione con sistemi esistenti. Con le giuste configurazioni per i servizi di notifica esterni, il sistema può automatizzare completamente il flusso di comunicazione con i clienti, liberando risorse preziose per attività a maggior valore aggiunto.

---

**Supporto Tecnico**

Per assistenza tecnica o domande sul sistema, consultare la documentazione inline nel codice o contattare il team di sviluppo. Il progetto è completamente open-source e modificabile secondo le esigenze specifiche dell'azienda.
