const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'mysql-winner55.alwaysdata.net',
    user: 'winner55',
    password: 'SUPERface22',
    database: 'winner55_snak'
  });

  try {
    console.log('Migrating recharge_history...');
    await connection.execute("ALTER TABLE recharge_history ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' AFTER balance_after_usd");
    console.log('Migrating withdrawal_history...');
    await connection.execute("ALTER TABLE withdrawal_history ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' AFTER balance_after_usd");
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
