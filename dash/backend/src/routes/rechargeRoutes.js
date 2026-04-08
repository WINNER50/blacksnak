// =============================================
// Recharge Routes
// =============================================

const express = require('express');
const router = express.Router();
const rechargeController = require('../controllers/rechargeController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// POST /api/recharges - Recharger un compte joueur
router.post('/', authorize('super_admin', 'admin', 'moderator'), rechargeController.rechargePlayer);

// GET /api/recharges - Historique des recharges
router.get('/', authorize('super_admin', 'admin', 'moderator'), rechargeController.getRechargeHistory);

// POST /api/recharges/system - Opération système (crédit/débit)
router.post('/system', authorize('super_admin', 'admin'), rechargeController.systemOperation);

// GET /api/recharges/system - Historique des opérations système
router.get('/system', authorize('super_admin', 'admin'), rechargeController.getSystemHistory);

// GET /api/recharges/system/balance - Solde système actuel
router.get('/system/balance', authorize('super_admin', 'admin'), rechargeController.getSystemBalance);

module.exports = router;
