const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Creating settings table...');
        await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` TEXT,
        \`description\` TEXT,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

        const initialSettings = [
            ['whatsapp_group_link', 'https://chat.whatsapp.com/example', 'Lien du groupe WhatsApp communautaire'],
            ['whatsapp_support_number', '+243000000000', 'Numéro de support client WhatsApp'],
            ['whapi_api_token', '', 'Token API Whapi.cloud pour les notifications'],
            ['exchange_rate_usd_cdf', '2500', 'Taux de change dynamique USD vers CDF'],
            ['beginner_guide_content', '', 'Contenu du guide du débutant (format Markdown)']
        ];

        for (const [key, value, description] of initialSettings) {
            console.log('Inserting/Updating setting: ' + key);
            await db.query(
                'INSERT IGNORE INTO settings (`key`, value, description) VALUES (?, ?, ?)',
                [key, value, description]
            );
        }

        console.log('Database updated successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error updating database:', err);
        process.exit(1);
    }
})();
