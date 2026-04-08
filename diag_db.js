const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Charger .env depuis le backend admin
dotenv.config({ path: 'C:/xampp/htdocs/blacksanck/dash/backend/.env' });

async function diagnose() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'blacksank'
    });

    try {
        const [tournaments] = await pool.query('SELECT id, name, status, end_date FROM tournaments');
        console.log('--- Tournaments ---');
        console.table(tournaments);

        const [participants] = await pool.query('SELECT tournament_id, user_id, joined_at FROM tournament_participants');
        console.log('--- Tournament Participants ---');
        console.table(participants);

        const [transactions] = await pool.query("SELECT id, user_id, type, amount_usd, created_at FROM transactions WHERE type IN ('tournament_entry', 'tournament_prize')");
        console.log('--- Relevant Transactions ---');
        console.table(transactions);

        const [balance] = await pool.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
        console.log('--- System Balance ---');
        console.log(balance[0]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

diagnose();
