import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function addIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'gestione_appuntamenti',
  });

  const db = drizzle(connection);

  console.log('🔧 Aggiunta indici al database...');

  const indexes = [
    // Appointments
    'CREATE INDEX IF NOT EXISTS idx_appointments_technician ON appointments(technicianId)',
    'CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customerId)',
    'CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointmentDate)',
    'CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)',
    'CREATE INDEX IF NOT EXISTS idx_appointments_tech_date ON appointments(technicianId, appointmentDate)',
    
    // Customers
    'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)',
    'CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city)',
    'CREATE INDEX IF NOT EXISTS idx_customers_zone ON customers(zone)',
    'CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(firstName, lastName)',
    
    // Calls
    'CREATE INDEX IF NOT EXISTS idx_calls_customer ON calls(customerId)',
    'CREATE INDEX IF NOT EXISTS idx_calls_phone ON calls(customerPhone)',
    'CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status)',
    'CREATE INDEX IF NOT EXISTS idx_calls_date ON calls(callDate)',
    'CREATE INDEX IF NOT EXISTS idx_calls_technician ON calls(technicianId)',
    
    // Time Entries
    'CREATE INDEX IF NOT EXISTS idx_time_entries_technician ON time_entries(technicianId)',
    'CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date)',
    'CREATE INDEX IF NOT EXISTS idx_time_entries_type ON time_entries(type)',
    
    // Notifications
    'CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON notifications(appointmentId)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)',
  ];

  for (const sql of indexes) {
    try {
      await connection.execute(sql);
      console.log('✅', sql.split('idx_')[1]?.split(' ')[0]);
    } catch (error: any) {
      console.error('❌', sql.split('idx_')[1]?.split(' ')[0], error.message);
    }
  }

  await connection.end();
  console.log('✅ Indici aggiunti con successo!');
}

addIndexes().catch(console.error);
