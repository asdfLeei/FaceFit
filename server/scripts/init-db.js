require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  const schema = await fs.readFile(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    await connection.query(schema);
    console.log(`Database ${process.env.DB_NAME || 'facefit'} initialized successfully.`);
  } finally {
    await connection.end();
  }
}

initializeDatabase().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
});
