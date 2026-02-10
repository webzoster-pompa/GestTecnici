const mysql = require('mysql2/promise');

async function queryAppointment() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestione_appuntamenti',
  });

  try {
    const [rows] = await connection.execute(
      'SELECT id, customerId, invoiceNumber, invoiceStatus FROM appointments WHERE id = 1140003'
    );
    console.log('Query result:', JSON.stringify(rows, null, 2));
  } finally {
    await connection.end();
  }
}

queryAppointment().catch(console.error);
