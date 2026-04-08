const { query } = require('./config/database');

async function check() {
    try {
        const res = await query("SHOW TABLES LIKE 'settings'");
        console.log('Tables found:', res.rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
