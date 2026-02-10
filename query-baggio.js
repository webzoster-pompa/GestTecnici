const mysql = require('mysql2/promise');

async function query() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gestione_appuntamenti'
  });

  const [rows] = await connection.execute(`
    SELECT 
      a.id,
      a.scheduledDate,
      a.duration,
      c.firstName,
      c.lastName
    FROM appointments a
    JOIN customers c ON a.customerId = c.id
    WHERE c.firstName LIKE '%Baggio%' OR c.lastName LIKE '%Baggio%'
    ORDER BY a.id DESC
    LIMIT 3
  `);

  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}

query().catch(console.error);
