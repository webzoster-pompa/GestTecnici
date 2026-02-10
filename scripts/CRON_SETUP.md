# Configurazione Cron Jobs

## Backup Automatico Database

Per configurare il backup automatico giornaliero alle 2:00 AM:

### 1. Apri crontab
```bash
crontab -e
```

### 2. Aggiungi questa riga
```
0 2 * * * /home/ubuntu/gestione-appuntamenti-tecnici/scripts/backup-database.sh
```

### 3. Salva e chiudi

### Verifica cron attivo
```bash
sudo systemctl status cron
```

### Visualizza log backup
```bash
tail -f /home/ubuntu/backups/backup.log
```

---

## Report Mensile Automatico

Per configurare l'invio automatico del report il primo giorno di ogni mese alle 9:00 AM:

### 1. Crea script wrapper Node.js

File: `/home/ubuntu/gestione-appuntamenti-tecnici/scripts/send-monthly-report.js`

```javascript
const { runMonthlyReportJob } = require("../server/monthly-report");

runMonthlyReportJob()
  .then(() => {
    console.log("Monthly report sent successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error sending monthly report:", error);
    process.exit(1);
  });
```

### 2. Aggiungi a crontab
```
0 9 1 * * cd /home/ubuntu/gestione-appuntamenti-tecnici && node scripts/send-monthly-report.js
```

---

## Test Manuale

### Test backup
```bash
/home/ubuntu/gestione-appuntamenti-tecnici/scripts/backup-database.sh
```

### Test report mensile
```bash
cd /home/ubuntu/gestione-appuntamenti-tecnici
node scripts/send-monthly-report.js
```

---

## Ripristino Backup

Per ripristinare un backup:

```bash
# Decomprimi backup
gunzip /home/ubuntu/backups/gestione-tecnici/backup_YYYYMMDD_HHMMSS.sql.gz

# Ripristina database
psql -U postgres -d gestione_tecnici < /home/ubuntu/backups/gestione-tecnici/backup_YYYYMMDD_HHMMSS.sql
```

---

## Monitoraggio

### Verifica backup recenti
```bash
ls -lh /home/ubuntu/backups/gestione-tecnici/
```

### Verifica spazio disco
```bash
df -h /home/ubuntu/backups
```

### Verifica log errori
```bash
grep ERROR /home/ubuntu/backups/backup.log
```
