// panierRoutes.js
const express = require('express');
const router = express.Router();
const panierController = require('../controllers/panierController');
const { optionalAuth, synchroniserTokenPanier } = require('../middleware/authMiddleware');

router.get('/obtenirPanier', optionalAuth, synchroniserTokenPanier, panierController.obtenirPanier);
router.post('/ajouterArticleAuPanier', optionalAuth, synchroniserTokenPanier, panierController.ajouterArticleAuPanier);
router.put('/mettreAJourQuantite/:article_panier_id', optionalAuth, synchroniserTokenPanier, panierController.mettreAJourQuantite);
router.delete('/supprimerArticleDuPanier/:article_panier_id', optionalAuth, synchroniserTokenPanier, panierController.supprimerArticleDuPanier);
router.delete('/viderPanier/:panierId', optionalAuth, synchroniserTokenPanier, panierController.viderPanier); 
module.exports = router;