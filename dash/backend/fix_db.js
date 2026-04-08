const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Charger .env depuis le backend admin
dotenv.config({ path: path.join(__dirname, '.env') });

async function fix() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'blacksank'
    });

    try {
        console.log('Creating personal_challenges table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS \`personal_challenges\` (
              \`id\` int(11) NOT NULL AUTO_INCREMENT,
              \`user_id\` int(11) NOT NULL,
              \`template_id\` int(11) NOT NULL,
              \`bet_amount\` decimal(10,2) NOT NULL,
              \`target_score\` int(11) NOT NULL,
              \`score\` int(11) DEFAULT 0,
              \`status\` enum('ongoing','won','lost') DEFAULT 'ongoing',
              \`earnings\` decimal(10,2) DEFAULT 0.00,
              \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
              \`completed_at\` timestamp NULL DEFAULT NULL,
              PRIMARY KEY (\`id\`),
              KEY \`user_id\` (\`user_id\`),
              KEY \`template_id\` (\`template_id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
        `);

        console.log('Checking and adding constraints...');
        try {
            await pool.query('ALTER TABLE `personal_challenges` ADD CONSTRAINT `pc_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE');
        } catch (e) { console.log('Constraint pc_user_fk already exists or error:', e.message); }

        try {
            await pool.query('ALTER TABLE `personal_challenges` ADD CONSTRAINT `pc_template_fk` FOREIGN KEY (`template_id`) REFERENCES `personal_challenge_templates` (`id`) ON DELETE CASCADE');
        } catch (e) { console.log('Constraint pc_template_fk already exists or error:', e.message); }

        console.log('Successfully fixed database.');
    } catch (error) {
        console.error('Error fixing database:', error);
    } finally {
        await pool.end();
    }
}

fix();
