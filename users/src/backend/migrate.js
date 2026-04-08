const { query, pool } = require('./config/database');

async function migrate() {
    try {
        console.log('Tentative d\'ajout de la colonne reset_code...');
        await query('ALTER TABLE users ADD COLUMN reset_code VARCHAR(10) DEFAULT NULL AFTER status');
        console.log('Succès ! La colonne reset_code a été ajoutée.');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('La colonne reset_code existe déjà.');
        } else {
            console.error('Erreur lors de la migration:', error);
        }
    } finally {
        await pool.end();
        process.exit();
    }
}

migrate();
