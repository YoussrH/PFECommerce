// routes/livreurRoutes.js
const express = require('express');
const router = express.Router();
const livreurController = require('../controllers/livreurController');
const { authentifier } = require('../middleware/authMiddleware');

// Changed endpoint to not require ID in URL since we get it from token
router.get('/mon-profil', authentifier, livreurController.obtenirLivreur);
router.put('/mettre-a-jour', authentifier, livreurController.mettreAJourLivreur);

module.exports = router;