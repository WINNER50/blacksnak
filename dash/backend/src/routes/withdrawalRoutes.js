// =============================================
// Withdrawal Routes
// =============================================

const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/withdrawals - Effectuer un retrait pour un joueur
router.post('/', authorize('super_admin', 'admin'), withdrawalController.withdrawPlayer);

// GET /api/withdrawals - Historique des retraits joueurs
router.get('/', authorize('super_admin', 'admin', 'moderator'), withdrawalController.getWithdrawalHistory);

module.exports = router;
