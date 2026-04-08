// =============================================
// Error Handler Middleware
// =============================================

const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur serveur interne';

  // Database errors
  if (err.code === '23505') {
    // Duplicate key
    statusCode = 409;
    message = 'Cette valeur existe déjà dans la base de données';
  } else if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    message = 'Référence invalide - Élément lié introuvable';
  } else if (err.code === '23502') {
    // Not null violation
    statusCode = 400;
    message = 'Champ requis manquant';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expiré';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Response
  const response = {
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { 
      stack: err.stack,
      error: err 
    })
  };

  res.status(statusCode).json(response);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
