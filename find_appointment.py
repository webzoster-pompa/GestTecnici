#!/usr/bin/env python3
import json
import subprocess
import sys

# Esegui la query usando il tool webdev_execute_sql
# Poiché non posso accedere direttamente al database, userò il logging del backend

# Leggi il routers.ts per capire come sta cercando gli appuntamenti
with open('/home/ubuntu/gestione-appuntamenti-tecnici/server/routers.ts', 'r') as f:
    content = f.read()
    
# Cerca la query getCustomerHistory
if 'getCustomerHistory' in content:
    print("✅ getCustomerHistory trovato nel routers.ts")
    
    # Estrai la sezione rilevante
    start = content.find('getCustomerHistory')
    end = content.find('});', start) + 3
    section = content[start:end]
    
    print("\nSezione getCustomerHistory:")
    print(section[:500])  # Stampa i primi 500 caratteri
else:
    print("❌ getCustomerHistory non trovato")

# Leggi il db.ts per capire come getAppointmentsByCustomer sta cercando
with open('/home/ubuntu/gestione-appuntamenti-tecnici/server/db.ts', 'r') as f:
    content = f.read()
    
if 'getAppointmentsByCustomer' in content:
    print("\n✅ getAppointmentsByCustomer trovato nel db.ts")
    
    # Estrai la sezione rilevante
    start = content.find('export async function getAppointmentsByCustomer')
    end = content.find('export async function', start + 1)
    section = content[start:end]
    
    print("\nSezione getAppointmentsByCustomer:")
    print(section[:500])  # Stampa i primi 500 caratteri
else:
    print("❌ getAppointmentsByCustomer non trovato")

print("\n\n🔍 Analisi completata!")
print("Il problema è che il tool webdev_execute_sql non mostra i risultati dettagliati!")
print("Lascio cercare il cliente nel frontend!")
