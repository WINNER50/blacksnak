const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration pour MySQL (XAMPP par défaut)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-winner55.alwaysdata.net',
  user: process.env.DB_USER || 'winner55',
  password: process.env.DB_PASSWORD || 'SUPERface22',
  database: process.env.DB_NAME || 'winner55_snak',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Fonction helper pour les queries (Compatibilité PG -> MySQL)
 */
const query = async (text, params = []) => {
  try {
    const safeParams = Array.isArray(params) ? params : [params];
    let mysqlText = text;
    let actualParams = [];

    // Check if text has $1, $2, etc. If so, parse them.
    if (/\$(\d+)/.test(text)) {
      mysqlText = text.replace(/\$(\d+)/g, (match, number) => {
        const index = parseInt(number, 10) - 1;
        const val = safeParams[index];
        actualParams.push(val === undefined ? null : val);
        return '?';
      });
    } else {
      // If no $ placeholders, assume it already uses ? and pass params as is
      actualParams = safeParams.map(val => val === undefined ? null : val);
    }

    const hasReturning = /returning\s+/i.test(mysqlText);
    if (hasReturning) {
      mysqlText = mysqlText.replace(/returning\s+.*$/i, '');
    }

    const [result] = await pool.execute(mysqlText, actualParams);

    if (hasReturning && result.insertId) {
      const match = /insert\s+into\s+(\w+)/i.exec(mysqlText);
      const tableName = (match && match[1]) ? match[1] : 'users';
      const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [result.insertId]);
      return { rows, rowCount: rows.length };
    }

    const rows = Array.isArray(result) ? result : [];
    return {
      rows: rows,
      rowCount: rows.length,
      insertId: result.insertId,
      affectedRows: result.affectedRows
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

    const result = await callback({
      query: async (text, params = []) => {
        const safeParams = Array.isArray(params) ? params : [params];
        let mysqlText = text;
        let actualParams = [];

        // Check if text has $1, $2, etc. If so, parse them.
        if (/\$(\d+)/.test(text)) {
          mysqlText = text.replace(/\$(\d+)/g, (match, number) => {
            const index = parseInt(number, 10) - 1;
            const val = safeParams[index];
            actualParams.push(val === undefined ? null : val);
            return '?';
          });
        } else {
          // If no $ placeholders, assume it already uses ? and pass params as is
          actualParams = safeParams.map(val => val === undefined ? null : val);
        }

        const hasReturning = /returning\s+/i.test(mysqlText);
        if (hasReturning) {
          mysqlText = mysqlText.replace(/returning\s+.*$/i, '');
        }

        const [result] = await connection.execute(mysqlText, actualParams);

        if (hasReturning && result.insertId) {
          const match = /insert\s+into\s+(\w+)/i.exec(mysqlText);
          const tableName = (match && match[1]) ? match[1] : 'users';
          const [resultRows] = await connection.execute(`SELECT * FROM ${tableName} WHERE id = ?`, [result.insertId]);
          return { rows: resultRows, rowCount: resultRows.length, insertId: result.insertId };
        }

        const rows = Array.isArray(result) ? result : [];
        return {
          rows: rows,
          rowCount: rows.length,
          insertId: result.insertId,
          affectedRows: result.affectedRows
        };
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
  getConnection: () => pool.getConnection()
};
