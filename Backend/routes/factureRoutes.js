// routes/factureRoutes.js
const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController');
const { authentifier, verifierAdmin } = require('../middleware/authMiddleware');

// Get all invoices
router.get('/', authentifier,verifierAdmin, factureController.listerFactures);

// Download invoice
router.get('/:id/download', authentifier,verifierAdmin, factureController.downloadFacture);

module.exports = router;