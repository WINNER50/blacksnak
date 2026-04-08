const { query } = require('./config/database');

async function migrate() {
    try {
        console.log('--- Migration: Ajout Table Refresh Tokens ---');

        await query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

        console.log('Table refresh_tokens créée ou déjà existante.');

        console.log('Migration terminée avec succès.');
        process.exit(0);
    } catch (error) {
        console.error('Erreur migration:', error);
        process.exit(1);
    }
}

migrate();
