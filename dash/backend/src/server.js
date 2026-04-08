// =============================================
// Main Server File
// =============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const { testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const rechargeRoutes = require('./routes/rechargeRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const challengeTemplateRoutes = require('./routes/challengeTemplateRoutes');
const statsRoutes = require('./routes/stats');
const paymentRoutes = require('./routes/paymentRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const gatewayRoutes = require('./routes/gatewayRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const settingsRoutes = require('./routes/settings');



// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Créer l'application Express
const app = express();

// =============================================
// MIDDLEWARES GLOBAUX
// =============================================

// Security headers
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger (development only)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// =============================================
// ROUTES
// =============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recharges', rechargeRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/challenge-templates', challengeTemplateRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/gateways', gatewayRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/settings', settingsRoutes);



// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler (doit être en dernier)
app.use(errorHandler);

// =============================================
// DÉMARRAGE DU SERVEUR
// =============================================

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Cannot start server: Database connection failed');
      process.exit(1);
    }

    // Start server
    app.listen(config.port, () => {
      console.log('');
      console.log('🚀 ===================================');
      console.log(`🚀 Blacksnack API Server`);
      console.log(`🚀 Environment: ${config.nodeEnv}`);
      console.log(`🚀 Port: ${config.port}`);
      console.log(`🚀 URL: http://localhost:${config.port}`);
      console.log('🚀 ===================================');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
