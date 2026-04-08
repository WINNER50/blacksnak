// =============================================
// Backend Configuration
// =============================================

require('dotenv').config();

module.exports = {
  // Server
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  db: {
    host: process.env.DB_HOST || 'mysql-winner55.alwaysdata.net',
    user: process.env.DB_USER || 'winner55',
    password: process.env.DB_PASSWORD || 'SUPERface22',
    database: process.env.DB_NAME || 'winner55_snak',
    connectionLimit: 10,
  },


  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Bcrypt
  bcrypt: {
    saltRounds: 10,
  },
};
