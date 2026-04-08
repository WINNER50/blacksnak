const mysql = require('mysql2/promise');
async function check() {
    try {
        const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'blacksank' });
        const [r] = await c.execute("SHOW TABLES LIKE 'personal_challenge_templates'");
        console.log(r.length > 0 ? 'EXISTS' : 'MISSING');
        await c.end();
    } catch (e) {
        console.error(e);
    }
}
check();
