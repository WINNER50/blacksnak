const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: 'C:/xampp/htdocs/blacksanck/dash/backend/.env' });

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'blacksank'
    });

    try {
        console.log('Step 1: Checking missing entries...');
        const [missing] = await pool.query(`
      SELECT tp.user_id, t.entry_fee_usd, t.name, tp.joined_at, tp.tournament_id
      FROM tournament_participants tp
      JOIN tournaments t ON tp.tournament_id = t.id
      LEFT JOIN transactions trans ON tp.user_id = trans.user_id 
           AND trans.type = 'tournament_entry' 
           AND ABS(TIMESTAMPDIFF(SECOND, trans.created_at, tp.joined_at)) < 600
      WHERE trans.id IS NULL
    `);
        console.log('Missing entries count:', missing.length);
        if (missing.length > 0) console.table(missing);

        console.log('\nStep 2: Checking unpaid tournaments...');
        const [unpaid] = await pool.query(`
      SELECT t.id, t.name, t.prize_pool_usd, t.status, t.end_date 
      FROM tournaments t
      WHERE (t.status = 'completed' OR t.end_date < NOW())
      AND NOT EXISTS (
        SELECT 1 FROM tournament_participants tp WHERE tp.tournament_id = t.id AND tp.prize_won_usd > 0
      )
    `);
        console.log('Unpaid tournaments count:', unpaid.length);
        if (unpaid.length > 0) console.table(unpaid);

        if (unpaid.length > 0) {
            for (const t of unpaid) {
                const [winners] = await pool.query(
                    "SELECT user_id, score FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC, joined_at ASC LIMIT 1",
                    [t.id]
                );
                console.log(`\nPotential winner for tournament ${t.id} (${t.name}):`, winners[0]);
            }
        }

        console.log('\nStep 3: Checking System Balance...');
        const [sysBalance] = await pool.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
        console.log('System Balance:', sysBalance[0].balance);

        console.log('\nStep 4: Checking User 1 balance and earnings...');
        const [user1] = await pool.query("SELECT id, username, balance_usd, total_earnings FROM users WHERE id = 1");
        console.table(user1);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}
run();
