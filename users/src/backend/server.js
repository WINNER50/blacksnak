const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const tournamentRoutes = require('./routes/tournaments');
const challengeRoutes = require('./routes/challenges');
const webhookRoutes = require('./routes/webhooks');
const settingsRoutes = require('./routes/settings');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/settings', settingsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: '🐍 Bienvenue sur l\'API Blacksnack',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      transactions: '/api/transactions',
      tournaments: '/api/tournaments',
      challenges: '/api/challenges'
    }
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
  console.warn(`[404 NOT FOUND] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    path: req.originalUrl
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🐍 Serveur Blacksnack démarré       ║
║   Port: ${PORT}                        ║
║   Environnement: ${process.env.NODE_ENV || 'development'}      ║
║   URL: http://localhost:${PORT}        ║
╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
