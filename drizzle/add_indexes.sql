-- Ottimizzazione Performance Database
-- Aggiunta indici sulle colonne più frequentemente interrogate

-- Indici per tabella appointments
CREATE INDEX IF NOT EXISTS idx_appointments_technician ON appointments(technicianId);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customerId);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointmentDate);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_tech_date ON appointments(technicianId, appointmentDate);

-- Indici per tabella customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_zone ON customers(zone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(firstName, lastName);

-- Indici per tabella calls
CREATE INDEX IF NOT EXISTS idx_calls_customer ON calls(customerId);
CREATE INDEX IF NOT EXISTS idx_calls_phone ON calls(customerPhone);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(callDate);
CREATE INDEX IF NOT EXISTS idx_calls_technician ON calls(technicianId);

-- Indici per tabella time_entries
CREATE INDEX IF NOT EXISTS idx_time_entries_technician ON time_entries(technicianId);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_type ON time_entries(type);

-- Indici per tabella notifications
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON notifications(appointmentId);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
