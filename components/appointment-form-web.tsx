import React, { useState, useEffect } from "react";
import { trpc, trpcClient } from "@/lib/trpc";

interface AppointmentFormWebProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialDate?: Date;
  initialTechnicianId?: number | null;
}

export function AppointmentFormWeb({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialTechnicianId,
}: AppointmentFormWebProps) {
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (!initialDate) return "";
    // Mantieni timezone locale invece di convertire in UTC
    const year = initialDate.getFullYear();
    const month = String(initialDate.getMonth() + 1).padStart(2, "0");
    const day = String(initialDate.getDate()).padStart(2, "0");
    const hours = String(initialDate.getHours()).padStart(2, "0");
    const minutes = String(initialDate.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [duration, setDuration] = useState("60");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");
  const [technicianId, setTechnicianId] = useState<number | null>(
    initialTechnicianId || null
  );
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingSlot, setIsSearchingSlot] = useState(false);

  const { data: technicians } = trpc.technicians.list.useQuery();
  const { data: appointments } = trpc.appointments.list.useQuery({});
  const { data: absences } = trpc.absences.list.useQuery({});
  const searchCustomerQuery = trpc.customers.searchByPhone.useQuery(
    { phone },
    { enabled: phone.length >= 8 }
  );

  // Gestione stato ricerca
  useEffect(() => {
    setIsSearching(searchCustomerQuery.isLoading);
  }, [searchCustomerQuery.isLoading]);

  // Pre-compilazione dati quando cliente trovato
  useEffect(() => {
    if (searchCustomerQuery.data) {
      setFoundCustomer(searchCustomerQuery.data);
      setCustomerName(
        `${searchCustomerQuery.data.firstName} ${searchCustomerQuery.data.lastName}`
      );
      setAddress(searchCustomerQuery.data.address || "");
      setCity(searchCustomerQuery.data.city || "");
    } else if (
      phone.length >= 8 &&
      !searchCustomerQuery.isLoading &&
      !searchCustomerQuery.data
    ) {
      setFoundCustomer(null);
      if (customerName) setCustomerName("");
      if (address) setAddress("");
      if (city) setCity("");
    }
  }, [searchCustomerQuery.data, searchCustomerQuery.isLoading, phone]);

  // Funzione Haversine per calcolo distanza GPS (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Raggio Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Funzione per trovare primo slot libero stesso giorno (pomeriggio se mattina piena)
  const findSmartSlot = () => {
    if (!technicianId) {
      alert('Seleziona prima un tecnico');
      return;
    }
    if (!initialDate) {
      alert('Nessuna data iniziale disponibile');
      return;
    }

    setIsSearchingSlot(true);

    try {
      const targetDay = new Date(initialDate);
      targetDay.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDay);
      dayEnd.setHours(23, 59, 59, 999);

      // Verifica se tecnico assente
      const techAbsent = absences?.some(abs => {
        const absDate = new Date(abs.date);
        absDate.setHours(0, 0, 0, 0);
        return absDate.getTime() === targetDay.getTime() && abs.technicianId === technicianId;
      });

      if (techAbsent) {
        alert('Il tecnico è assente in questo giorno.');
        setIsSearchingSlot(false);
        return;
      }

      // Recupera appuntamenti del tecnico per quel giorno
      const dayAppointments = (appointments || []).filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return (
          apt.technicianId === technicianId &&
          aptDate >= targetDay &&
          aptDate <= dayEnd
        );
      }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

      // Genera slot da 8:00 a 18:00 (ogni 30 minuti)
      const slotDuration = parseInt(duration) || 60;
      const slots: Date[] = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slot = new Date(targetDay);
          slot.setHours(hour, minute, 0, 0);
          slots.push(slot);
        }
      }

      // Funzione per verificare se slot è libero
      const isSlotFree = (slotStart: Date) => {
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        for (const apt of dayAppointments) {
          const aptStart = new Date(apt.scheduledDate);
          const aptEnd = new Date(aptStart);
          aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);

          // Verifica sovrapposizione
          if (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          ) {
            return false;
          }
        }
        return true;
      };

      // Ottimizzazione percorsi: ordina slot liberi per distanza
      const morningSlots = slots.filter(s => s.getHours() < 13);
      const afternoonSlots = slots.filter(s => s.getHours() >= 13);

      // Recupera coordinate cliente target
      const targetLat = foundCustomer?.latitude;
      const targetLon = foundCustomer?.longitude;

      // Funzione per trovare slot ottimale (più vicino)
      const findOptimalSlot = (slotList: Date[]): { slot: Date; distance: number } | null => {
        const freeSlots = slotList.filter(isSlotFree);
        if (freeSlots.length === 0) return null;

        // Se cliente ha coordinate, ordina per distanza
        if (targetLat && targetLon) {
          // Trova ultimo appuntamento prima dello slot per calcolare distanza
          const slotsWithDistance = freeSlots.map(slot => {
            // Trova appuntamento precedente più vicino
            const previousApt = dayAppointments
              .filter(apt => new Date(apt.scheduledDate) < slot)
              .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];

            let distance = 0;
            if (previousApt && previousApt.customer?.latitude && previousApt.customer?.longitude) {
              distance = calculateDistance(
                previousApt.customer.latitude,
                previousApt.customer.longitude,
                targetLat,
                targetLon
              );
            }
            return { slot, distance };
          });

          // Ordina per distanza minima
          slotsWithDistance.sort((a, b) => a.distance - b.distance);
          return slotsWithDistance[0];
        }

        // Fallback: primo slot libero
        return { slot: freeSlots[0], distance: 0 };
      };

      // Prova prima mattina
      let result = findOptimalSlot(morningSlots);

      // Se mattina piena, prova pomeriggio
      if (!result) {
        result = findOptimalSlot(afternoonSlots);
      }

      if (result) {
        const { slot: foundSlot, distance } = result;
        const year = foundSlot.getFullYear();
        const month = String(foundSlot.getMonth() + 1).padStart(2, '0');
        const day = String(foundSlot.getDate()).padStart(2, '0');
        const hours = String(foundSlot.getHours()).padStart(2, '0');
        const minutes = String(foundSlot.getMinutes()).padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        
        const distanceMsg = distance > 0 ? ` (${distance.toFixed(1)} km dall'ultimo appuntamento)` : '';
        alert(`Slot trovato: ${hours}:${minutes}${distanceMsg}`);
      } else {
        alert('Nessuno slot libero trovato per questo giorno.');
      }
    } catch (error) {
      console.error('Errore ricerca slot:', error);
      alert('Errore durante la ricerca dello slot.');
    } finally {
      setIsSearchingSlot(false);
    }
  };

  // Funzione per trovare slot alternativo più vicino (per notifica)
  const findBetterSlot = (selectedDate: Date, selectedTechId: number, selectedDuration: number) => {
    try {
      const targetDay = new Date(selectedDate);
      targetDay.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDay);
      dayEnd.setHours(23, 59, 59, 999);

      // Recupera appuntamenti del tecnico per quel giorno
      const dayAppointments = (appointments || []).filter(apt => {
        const aptDate = new Date(apt.scheduledDate);
        return (
          apt.technicianId === selectedTechId &&
          aptDate >= targetDay &&
          aptDate <= dayEnd
        );
      }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

      // Genera slot da 8:00 a 18:00 (ogni 30 minuti)
      const slots: Date[] = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slot = new Date(targetDay);
          slot.setHours(hour, minute, 0, 0);
          slots.push(slot);
        }
      }

      // Funzione per verificare se slot è libero
      const isSlotFree = (slotStart: Date) => {
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + selectedDuration);

        for (const apt of dayAppointments) {
          const aptStart = new Date(apt.scheduledDate);
          const aptEnd = new Date(aptStart);
          aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);

          // Verifica sovrapposizione
          if (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          ) {
            return false;
          }
        }
        return true;
      };

      const targetLat = foundCustomer?.latitude;
      const targetLon = foundCustomer?.longitude;

      // Se cliente non ha coordinate, non possiamo calcolare slot migliore
      if (!targetLat || !targetLon) return null;

      // Calcola distanza slot scelto
      const previousAptForSelected = dayAppointments
        .filter(apt => new Date(apt.scheduledDate) < selectedDate)
        .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];

      let selectedDistance = 0;
      if (previousAptForSelected && previousAptForSelected.customer?.latitude && previousAptForSelected.customer?.longitude) {
        selectedDistance = calculateDistance(
          previousAptForSelected.customer.latitude,
          previousAptForSelected.customer.longitude,
          targetLat,
          targetLon
        );
      }

      // Trova tutti gli slot liberi con distanza
      const freeSlots = slots.filter(isSlotFree);
      const slotsWithDistance = freeSlots.map(slot => {
        const previousApt = dayAppointments
          .filter(apt => new Date(apt.scheduledDate) < slot)
          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())[0];

        let distance = 0;
        if (previousApt && previousApt.customer?.latitude && previousApt.customer?.longitude) {
          distance = calculateDistance(
            previousApt.customer.latitude,
            previousApt.customer.longitude,
            targetLat,
            targetLon
          );
        }
        return { slot, distance };
      });

      // Ordina per distanza minima
      slotsWithDistance.sort((a, b) => a.distance - b.distance);
      const bestSlot = slotsWithDistance[0];

      // Se slot migliore è significativamente più vicino (almeno 1 km), suggerisci
      if (bestSlot && bestSlot.distance < selectedDistance - 1) {
        return {
          slot: bestSlot.slot,
          distance: bestSlot.distance,
          savedKm: selectedDistance - bestSlot.distance
        };
      }

      return null;
    } catch (error) {
      console.error('Errore ricerca slot migliore:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!phone) {
      alert("Inserisci il numero di telefono");
      return;
    }
    if (!scheduledDate) {
      alert("Seleziona data e ora");
      return;
    }
    if (!technicianId) {
      alert("Seleziona un tecnico");
      return;
    }

    // Verifica se esiste slot ottimale più vicino
    const selectedDate = new Date(scheduledDate);
    const selectedDuration = parseInt(duration) || 60;
    const betterSlot = findBetterSlot(selectedDate, technicianId, selectedDuration);

    if (betterSlot) {
      const hours = String(betterSlot.slot.getHours()).padStart(2, '0');
      const minutes = String(betterSlot.slot.getMinutes()).padStart(2, '0');
      const confirmed = window.confirm(
        `⚠️ Slot più vicino disponibile: ${hours}:${minutes}\n` +
        `Risparmio stimato: ${betterSlot.savedKm.toFixed(1)} km\n\n` +
        `Vuoi usare lo slot ottimale?\n` +
        `(Clicca OK per usare ${hours}:${minutes}, Annulla per mantenere l'orario scelto)`
      );

      if (confirmed) {
        // Applica slot ottimale
        const year = betterSlot.slot.getFullYear();
        const month = String(betterSlot.slot.getMonth() + 1).padStart(2, '0');
        const day = String(betterSlot.slot.getDate()).padStart(2, '0');
        setScheduledDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        // Non salvare subito, lascia che l'utente veda il nuovo orario e salvi manualmente
        return;
      }
    }

    setIsSaving(true);

    try {
      let customerId = foundCustomer?.id;

      // Se cliente non trovato, crealo
      if (!customerId && customerName) {
        const [firstName, ...lastNameParts] = customerName.split(" ");
        const lastName = lastNameParts.join(" ") || firstName;

        const newCustomer = await trpcClient.customers.create.mutate({
          firstName,
          lastName,
          phone,
          address: address || "",
          city: city || "",
        });

        customerId = newCustomer.id;
      }

      if (!customerId) {
        alert("Inserisci il nome del cliente");
        setIsSaving(false);
        return;
      }

      // Crea appuntamento
      await trpcClient.appointments.create.mutate({
        customerId,
        technicianId,
        scheduledDate: new Date(scheduledDate),
        duration: parseInt(duration),
        serviceType: serviceType || undefined,
        notes: notes || undefined,
      });

      // Reset form
      setPhone("");
      setCustomerName("");
      setAddress("");
      setCity("");
      setScheduledDate(initialDate ? initialDate.toISOString().slice(0, 16) : "");
      setDuration("60");
      setServiceType("");
      setNotes("");
      setTechnicianId(initialTechnicianId || null);
      setFoundCustomer(null);

      onSave();
    } catch (error: any) {
      alert("Errore durante il salvataggio: " + error.message);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "24px",
          width: "600px",
          maxWidth: "95%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
            📅 Nuovo Appuntamento
          </h3>
          <button
            onClick={onClose}
            style={{
              fontSize: "24px",
              color: "#666",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Telefono con ricerca automatica */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Telefono *{" "}
              {isSearching && (
                <span style={{ color: "#0066CC" }}>(Ricerca in corso...)</span>
              )}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Es. 3287632299"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: `2px solid ${foundCustomer ? "#00CC66" : "#E5E7EB"}`,
                borderRadius: "8px",
                backgroundColor: foundCustomer ? "#F0FDF4" : "#fff",
              }}
            />
            {foundCustomer && (
              <div style={{ fontSize: "13px", color: "#00CC66", marginTop: "4px" }}>
                ✓ Cliente trovato: {foundCustomer.firstName} {foundCustomer.lastName}
              </div>
            )}
          </div>

          {/* Nome Cliente */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Nome Cliente
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome e cognome"
              disabled={!!foundCustomer}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                backgroundColor: foundCustomer ? "#f5f5f5" : "#fff",
              }}
            />
          </div>

          {/* Indirizzo */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Indirizzo
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Via, numero civico"
              disabled={!!foundCustomer}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                backgroundColor: foundCustomer ? "#f5f5f5" : "#fff",
              }}
            />
          </div>

          {/* Città */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Città
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lucca, Pisa, etc."
              disabled={!!foundCustomer}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                backgroundColor: foundCustomer ? "#f5f5f5" : "#fff",
              }}
            />
          </div>

          {/* Data e Ora */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Data e Ora *
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            />
          </div>

          {/* Durata */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Durata (minuti)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="15"
              step="15"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            />
          </div>

          {/* Tecnico */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Tecnico *
            </label>
            <select
              value={technicianId || ""}
              onChange={(e) => setTechnicianId(parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            >
              <option value="">Seleziona tecnico</option>
              {technicians?.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.firstName} {tech.lastName}
                </option>
              ))}
            </select>
            {/* Pulsante Slot Intelligente */}
            <button
              type="button"
              onClick={findSmartSlot}
              disabled={!technicianId || isSearchingSlot}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                backgroundColor: technicianId ? '#0066CC' : '#ccc',
                border: 'none',
                borderRadius: '8px',
                cursor: technicianId ? 'pointer' : 'not-allowed',
                opacity: isSearchingSlot ? 0.6 : 1,
              }}
            >
              {isSearchingSlot ? '⏳ Ricerca...' : '🧠 Trova Slot Intelligente'}
            </button>
          </div>

          {/* Tipo Servizio */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Tipo Servizio
            </label>
            <input
              type="text"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              placeholder="Es. Manutenzione, Riparazione, etc."
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            />
          </div>

          {/* Note */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note aggiuntive..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "15px",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                resize: "vertical",
              }}
            />
          </div>

          {/* Pulsanti */}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "15px",
                fontWeight: "600",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: "12px",
                fontSize: "15px",
                fontWeight: "600",
                border: "none",
                borderRadius: "8px",
                backgroundColor: isSaving ? "#ccc" : "#0066CC",
                color: "#fff",
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              {isSaving ? "Salvataggio..." : "Salva Appuntamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
