const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'C:/xampp/htdocs/blacksanck/dash/backend/.env' });

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Adding Shwary aggregator...');
    
    const [rows] = await connection.execute('SELECT id FROM payment_gateways WHERE slug = "shwary"');
    if (rows.length === 0) {
      await connection.execute(`
        INSERT INTO payment_gateways (name, slug, is_active) 
        VALUES ("Shwary", "shwary", 0)
      `);
      console.log('Shwary added!');
    } else {
      console.log('Shwary already exists.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

run();
