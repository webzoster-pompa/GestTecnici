# Bug Critici da Risolvere

## Bug 1: Visualizzazione Durata nel Calendario
- [x] Appuntamento Abaldini mostra "0.30 minuti" invece di "90 minuti"
- [x] Problema: altezza visiva blocco = 30 min invece di 90 min
- [x] Causa: durata salvata nel DB è 30 invece di 90
- [ ] DA TESTARE: creare nuovo appuntamento 90 min e verificare

## Bug 2: Proposta Slot Pomeriggio invece di Mattina ✅ RISOLTO
- [x] Cliente Baggio Manuela riceve solo slot 14:00, 14:30 (pomeriggio)
- [x] Problema identificato: timezone sbagliato in generateAvailableSlots
- [x] Causa: setHours() invece di setUTCHours() causava shift di 5 ore
- [x] Correzione: usato setUTCHours() e setUTCDate() per evitare problemi timezone
- [x] Test: verificato con test-slot-search.ts - ora propone 8:00, 10:00, 10:30
- [ ] DA TESTARE: cercare slot per Baggio Alessandro nell'app e verificare proposta 8:00

## Test Finale
- [ ] Testare proposta slot nell'app reale (dovrebbe proporre 8:00, 8:30, 9:00)
- [ ] Creare appuntamento test 60 minuti e verificare visualizzazione durata
- [ ] Checkpoint finale con bug proposta slot risolto

