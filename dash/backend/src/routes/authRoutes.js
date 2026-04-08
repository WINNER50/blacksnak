// =============================================
// Auth Routes
// =============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// POST /api/auth/login - Connexion admin
router.post('/login', authController.login);

// POST /api/auth/logout - Déconnexion
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me - Profil actuel
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/refresh - Rafraîchir le token
router.post('/refresh', authenticate, authController.refreshToken);

module.exports = router;
