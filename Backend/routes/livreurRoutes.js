const express = require('express');
const router = express.Router();
const livreurController = require('../controllers/livreurController');
const { authentifierLivreur } = require('../middleware/authMiddleware');

// Use authentifierLivreur for all livreur routes
router.get('/obtenirLivreur/:id', authentifierLivreur, livreurController.obtenirLivreur);
router.put('/mettreAJourLivreur/:id', authentifierLivreur, livreurController.mettreAJourLivreur);

module.exports = router;