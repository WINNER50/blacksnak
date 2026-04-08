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
    console.log('Creating payment_gateways table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`payment_gateways\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`slug\` varchar(50) NOT NULL,
        \`api_key_public\` text DEFAULT NULL,
        \`api_key_secret\` text DEFAULT NULL,
        \`merchant_id\` varchar(100) DEFAULT NULL,
        \`environment\` enum('sandbox', 'live') DEFAULT 'sandbox',
        \`webhook_secret\` varchar(255) DEFAULT NULL,
        \`is_active\` tinyint(1) DEFAULT 0,
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`slug\` (\`slug\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert PawaPay if not exists
    const [rows] = await connection.execute('SELECT id FROM payment_gateways WHERE slug = "pawapay"');
    if (rows.length === 0) {
      console.log('Inserting PawaPay record...');
      await connection.execute(`
        INSERT INTO payment_gateways (name, slug, is_active) 
        VALUES ("PawaPay", "pawapay", 0)
      `);
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

run();
