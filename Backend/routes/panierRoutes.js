// panierRoutes.js
const express = require('express');
const router = express.Router();
const panierController = require('../controllers/panierController');
const { optionalAuth, synchroniserTokenPanier } = require('../middleware/authMiddleware');

router.get('/obtenirPanier', optionalAuth, synchroniserTokenPanier, panierController.obtenirPanier);//est3mltha web
router.post('/ajouterArticleAuPanier', optionalAuth, synchroniserTokenPanier, panierController.ajouterArticleAuPanier);//est3mltha web
router.put('/mettreAJourQuantite/:article_panier_id', optionalAuth, synchroniserTokenPanier, panierController.mettreAJourQuantite);//est3mltha web
router.delete('/supprimerArticleDuPanier/:article_panier_id', optionalAuth, synchroniserTokenPanier, panierController.supprimerArticleDuPanier);//est3mltha web
router.delete('/viderPanier/:panierId', optionalAuth, synchroniserTokenPanier, panierController.viderPanier); //est3mltha web
module.exports = router; 