const express = require('express');
const router = express.Router();
const livraisonController = require('../controllers/livraisonController');
const { authentifier, verifierAdmin } = require('../middleware/authMiddleware');

// Get available deliveries for assignment
router.get("/disponibles", authentifier, verifierAdmin, livraisonController.obtenirLivraisonsDisponibles);

// Assign delivery to a delivery person
// routes/livraison.js
router.put("/:id/assigner", authentifier, verifierAdmin, livraisonController.assignerLivraison);
// Get deliveries by delivery person
router.get("/livreur/:id", authentifier, livraisonController.obtenirLivraisonsParLivreur);

module.exports = router;