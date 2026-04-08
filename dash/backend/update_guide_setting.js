const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

(async () => {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const guidePath = path.join(__dirname, '../../users/src/EXPLICATIONS.md');
        let guideContent = fs.readFileSync(guidePath, 'utf8');

        // Remove the dashboard admin part as it might be too long for mobile users
        const adminIndex = guideContent.indexOf('## 🎛️ Dashboard Administrateur');
        if (adminIndex !== -1) {
            guideContent = guideContent.substring(0, adminIndex);
        }

        console.log('Updating beginner_guide_content in database...');
        await db.query(
            'UPDATE settings SET value = ? WHERE `key` = "beginner_guide_content"',
            [guideContent]
        );

        console.log('Guide updated successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error updating guide:', err);
        process.exit(1);
    }
})();
