const mysql = require('mysql2/promise');
async function init() {
    try {
        const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'blacksank' });

        console.log('Creating table personal_challenge_templates...');
        await c.execute(`
      CREATE TABLE IF NOT EXISTS \`personal_challenge_templates\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`title\` varchar(100) NOT NULL,
        \`description\` text DEFAULT NULL,
        \`entry_fee_usd\` decimal(10,2) NOT NULL,
        \`prize_usd\` decimal(10,2) NOT NULL,
        \`target_score\` int(11) NOT NULL,
        \`time_limit_seconds\` int(11) NOT NULL,
        \`difficulty\` enum('easy','medium','hard','expert') NOT NULL,
        \`is_active\` tinyint(1) DEFAULT 1,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1
    `);

        console.log('Inserting initial templates...');
        const [existing] = await c.execute("SELECT COUNT(*) as count FROM personal_challenge_templates");
        if (existing[0].count === 0) {
            await c.execute(`
        INSERT INTO \`personal_challenge_templates\` (\`title\`, \`description\`, \`entry_fee_usd\`, \`prize_usd\`, \`target_score\`, \`time_limit_seconds\`, \`difficulty\`) VALUES
        ('Défi Débutant', 'Atteignez 50 points en moins de 60 secondes.', 1.00, 1.80, 50, 60, 'easy'),
        ('Chasseur d\\'Or', 'Un score de 150 requis pour doubler votre mise.', 5.00, 10.00, 150, 120, 'medium'),
        ('Maître du Snake', 'Le défi ultime : 300 points en 180 secondes.', 10.00, 25.00, 300, 180, 'hard')
      `);
            console.log('Initial templates inserted.');
        } else {
            console.log('Table already contains data, skipping insertion.');
        }

        await c.end();
        console.log('Database initialization complete.');
    } catch (e) {
        console.error('Initialisation failed:', e);
    }
}
init();
