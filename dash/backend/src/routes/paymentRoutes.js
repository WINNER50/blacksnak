const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Get all payment methods
router.get('/methods', authorize('super_admin', 'admin', 'moderator'), paymentController.getPaymentMethods);

// Toggle payment method status
router.patch('/methods/:id/toggle', authorize('super_admin', 'admin'), paymentController.togglePaymentMethod);

module.exports = router;
