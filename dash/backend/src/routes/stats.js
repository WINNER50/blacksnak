const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);


// Get system balance (total credits - total debits)
router.get('/system-balance', authorize('super_admin', 'admin'), statsController.getSystemBalance);


// Get revenue for the last 7 days
router.get('/revenue-7days', authorize('super_admin', 'admin'), statsController.getRevenue7Days);

// Get revenue for the last 30 days
router.get('/revenue-30days', authorize('super_admin', 'admin'), statsController.getRevenue30Days);

// Get advanced stats
router.get('/advanced', authorize('super_admin', 'admin'), statsController.getAdvancedStats);

// Get global stats
router.get('/global', authorize('super_admin', 'admin'), statsController.getGlobalStats);

// Get recent transactions
router.get('/recent-transactions', authorize('super_admin', 'admin'), statsController.getRecentTransactions);

// Get recent users
router.get('/recent-users', authorize('super_admin', 'admin'), statsController.getRecentUsers);

// Get recharge history
router.get('/recharge-history', authorize('super_admin', 'admin', 'moderator'), statsController.getRechargeHistory);

// Get system operations
router.get('/system-operations', authorize('super_admin', 'admin'), statsController.getSystemOperations);

// Create new system operation
router.post('/system-operations', authorize('super_admin', 'admin'), statsController.createSystemOperation);

// Recharge a user's account
router.post('/recharge', authorize('super_admin', 'admin', 'moderator'), statsController.rechargeUser);

module.exports = router;

