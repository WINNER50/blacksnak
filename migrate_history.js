const { query } = require('./database');

async function migrate() {
  try {
    console.log('Migrating recharge_history...');
    await query("ALTER TABLE recharge_history ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' AFTER balance_after_usd");
    console.log('Migrating withdrawal_history...');
    await query("ALTER TABLE withdrawal_history ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'failed') DEFAULT 'completed' AFTER balance_after_usd");
    console.log('Migration successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
