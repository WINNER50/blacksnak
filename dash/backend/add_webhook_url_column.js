const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Adding webhook_url column to payment_gateways table...');
    await connection.execute(`
      ALTER TABLE \`payment_gateways\` 
      ADD COLUMN IF NOT EXISTS \`webhook_url\` text DEFAULT NULL AFTER \`webhook_secret\`;
    `);
    console.log('Column added successfully!');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    process.exit();
  }
}

run();
