const mysql = require('mysql2/promise');
async function run() {
    try {
        const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'blacksank' });
        const [r] = await c.execute("SELECT type, COUNT(*) as cnt, SUM(amount_usd) as total FROM transactions GROUP BY type");
        console.log('--- Transactions table stats ---');
        console.log(JSON.stringify(r, null, 2));

        const [t] = await c.execute("SELECT id, status, end_date FROM tournaments WHERE id = 8");
        console.log('--- Tournament 8 status ---');
        console.log(JSON.stringify(t, null, 2));

        const [u] = await c.execute("SELECT id, username, balance_usd, total_earnings FROM users WHERE id IN (1, 4)");
        console.log('--- Users balance ---');
        console.log(JSON.stringify(u, null, 2));

        await c.end();
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
run();
