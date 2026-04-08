const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Adding gateway_reference and status columns to transactions table...');
    // check if columns exist first or just run and ignore error (IF NOT EXISTS is not standard for ADD COLUMN in older MariaDB/MySQL)
    try {
      await connection.execute('ALTER TABLE transactions ADD COLUMN gateway_reference VARCHAR(100) DEFAULT NULL');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('gateway_reference already exists');
      else throw e;
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

run();
