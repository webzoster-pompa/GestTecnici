#!/bin/bash

###############################################################################
# Script Backup Automatico Database PostgreSQL
# Esegue backup giornaliero con rotazione settimanale
###############################################################################

# Configurazione
BACKUP_DIR="/home/ubuntu/backups/gestione-tecnici"
DB_NAME="gestione_tecnici"
DB_USER="postgres"
RETENTION_DAYS=7
LOG_FILE="/home/ubuntu/backups/backup.log"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

# Crea directory backup se non esiste
mkdir -p "$BACKUP_DIR"

# Log inizio
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup..." >> "$LOG_FILE"

# Esegui backup con pg_dump e comprimi
if pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_FILE" >> "$LOG_FILE"
    
    # Calcola dimensione backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup size: $BACKUP_SIZE" >> "$LOG_FILE"
    
    # Rotazione backup (elimina file più vecchi di RETENTION_DAYS giorni)
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Old backups cleaned (retention: $RETENTION_DAYS days)" >> "$LOG_FILE"
    
    # Conta backup rimanenti
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Total backups: $BACKUP_COUNT" >> "$LOG_FILE"
    
    exit 0
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Backup failed!" >> "$LOG_FILE"
    
    # TODO: Invia notifica email errore
    # echo "Backup failed for $DB_NAME" | mail -s "Backup Error" admin@esempio.it
    
    exit 1
fi
