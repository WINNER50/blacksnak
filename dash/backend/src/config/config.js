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
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*', // Allow all by default or specify for security
    credentials: true,
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
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
