// routes/paiementRoutes.js
const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const { authentifier,verifierAdmin } = require('../middleware/authMiddleware');

// Get all payments
router.get('/', authentifier,verifierAdmin, paiementController.listerPaiements);

// Get payment methods stats
router.get('/stats/methodes',authentifier,verifierAdmin, paiementController.getPaymentMethodsStats);

module.exports = router;