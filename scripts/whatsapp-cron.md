# Cron Job WhatsApp Reminders - Guida Setup

## Descrizione

Script per inviare automaticamente promemoria WhatsApp ai clienti 2 giorni prima dell'appuntamento.

## Configurazione Cron Job

### Windows (Task Scheduler)

1. **Apri Task Scheduler** (Utilità di pianificazione)
2. **Crea Attività di Base**:
   - Nome: `WhatsApp Reminders`
   - Descrizione: `Invio automatico promemoria WhatsApp`
3. **Trigger**: Giornaliero alle 9:00
4. **Azione**: Avvia programma
   - Programma: `C:\Program Files\nodejs\node.exe`
   - Argomenti: `C:\gestione-tecnici\dist\cron-whatsapp.js`
   - Inizia in: `C:\gestione-tecnici`

### Linux/Mac (crontab)

```bash
# Modifica crontab
crontab -e

# Aggiungi questa riga (esegue alle 9:00 ogni giorno)
0 9 * * * cd /home/ubuntu/gestione-tecnici && node dist/cron-whatsapp.js >> logs/whatsapp-cron.log 2>&1
```

## Logica Funzionamento

1. **Ogni giorno alle 9:00**:
   - Script si connette al database
   - Cerca appuntamenti programmati tra 2 giorni
   - Filtra solo quelli con `whatsappEnabled = true`
   - Esclude quelli già inviati (`whatsappSent = true`)

2. **Per ogni appuntamento trovato**:
   - Recupera template WhatsApp selezionato
   - Sostituisce variabili: `{{cliente}}`, `{{data}}`, `{{ora}}`, `{{tecnico}}`
   - Invia messaggio tramite API WhatsApp Business
   - Segna come inviato (`whatsappSent = true`)

3. **Log operazioni**:
   - Successi e errori vengono registrati
   - File log: `logs/whatsapp-cron.log`

## Implementazione Manuale

Se preferisci gestire manualmente l'invio, puoi:

1. **Dalla Dashboard Web**:
   - Vai su "Appuntamenti"
   - Filtra per data (tra 2 giorni)
   - Clicca "Invia Promemoria WhatsApp" per ogni cliente

2. **API Endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/send-reminders
   ```

## Requisiti

- **WhatsApp Business API**: Credenziali configurate in `.env`
  ```
  WHATSAPP_API_URL=https://api.whatsapp.com/send
  WHATSAPP_API_TOKEN=your_token_here
  ```

- **Database**: Campo `whatsappSent` nella tabella `appointments`

## Testing

Esegui manualmente lo script per testare:

```bash
cd /home/ubuntu/gestione-tecnici
npm run whatsapp:test
```

Questo invierà promemoria per appuntamenti tra 2 giorni senza aspettare le 9:00.

## Troubleshooting

### Script non si esegue
- Verifica permessi esecuzione: `chmod +x scripts/whatsapp-cron.sh`
- Controlla log: `cat logs/whatsapp-cron.log`

### Messaggi non inviati
- Verifica credenziali WhatsApp Business API
- Controlla numeri telefono clienti (formato: +39...)
- Verifica saldo account WhatsApp Business

### Duplicati
- Lo script marca automaticamente come inviati (`whatsappSent = true`)
- Se ricevi duplicati, controlla che il campo venga aggiornato correttamente

## Note Importanti

⚠️ **Costi**: Ogni messaggio WhatsApp Business ha un costo (circa €0.01-0.05 per messaggio)

⚠️ **Rate Limiting**: L'API WhatsApp ha limiti di invio (es: 1000 msg/giorno). Lo script include pause tra invii.

⚠️ **Privacy**: Assicurati di avere consenso clienti per invio messaggi WhatsApp (GDPR).

## Prossimi Miglioramenti

- [ ] Retry automatico in caso di errore
- [ ] Dashboard monitoraggio invii
- [ ] Report giornaliero via email
- [ ] Personalizzazione orario invio per cliente
- [ ] A/B testing template messaggi
