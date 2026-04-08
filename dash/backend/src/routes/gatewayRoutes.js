const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');
const { authenticate } = require('../middleware/authMiddleware');

router.get('/', authenticate, gatewayController.getGateways);
router.post('/:slug', authenticate, gatewayController.updateGateway);

module.exports = router;
