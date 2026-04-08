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
    console.log('Adding status and gateway_reference to system_transactions table...');
    try {
      await connection.execute('ALTER TABLE system_transactions ADD COLUMN status ENUM("pending", "completed", "failed") DEFAULT "completed"');
    } catch (e) {
       if (e.code === 'ER_DUP_FIELDNAME') console.log('status already exists');
       else throw e;
    }
    
    try {
       await connection.execute('ALTER TABLE system_transactions ADD COLUMN gateway_reference VARCHAR(100) DEFAULT NULL');
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
