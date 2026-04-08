// =============================================
// Database Connection Pool (MySQL Compatibility Layer)
// =============================================

const mysql = require('mysql2/promise');
const config = require('./config');

// Créer le pool de connexions MySQL
const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful (MySQL)');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Fonction helper pour les queries (Compatibilité PG -> MySQL)
 * Convertit les placeholders $1, $2 en ?
 * Retourne un objet avec une propriété 'rows' pour rester compatible avec le code PG
 */
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    // Conversion des placeholders PostgreSQL ($1, $2...) en placeholders MySQL (?)
    const mysqlText = text.replace(/\$\d+/g, '?');

    const [rows, fields] = await pool.execute(mysqlText, params);

    const duration = Date.now() - start;
    // console.log('Executed query', { text: mysqlText, duration, rows: rows.length });

    // Adaptation du résultat pour compatibilité avec le code de l'application (qui attend .rows)
    // Pour MySQL, les UPDATE/INSERT retournent un objet ResultSetHeader au lieu d'un tableau
    const isArray = Array.isArray(rows);
    return {
      rows: isArray ? rows : [],
      rowCount: isArray ? rows.length : (rows.affectedRows || 0),
      insertId: rows.insertId,
      fields
    };
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

/**
 * Fonction pour les transactions (Compatibilité MySQL)
 */
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Le callback doit utiliser la connexion spécifique pour la transaction
    // Note: Pour une compatibilité parfaite, il faudrait passer une version "query" liée à la connexion
    const result = await callback({
      query: (text, params) => {
        const mysqlText = text.replace(/\$\d+/g, '?');
        return connection.execute(mysqlText, params).then(([rows, fields]) => {
          const isArray = Array.isArray(rows);
          return {
            rows: isArray ? rows : [],
            rowCount: isArray ? rows.length : (rows.affectedRows || 0),
            insertId: rows.insertId,
            fields
          };
        });
      }

    });

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
};
