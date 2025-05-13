// routes/listeEnviesRoutes.js
const express = require('express');
const router = express.Router();
const listeEnviesController = require('../controllers/listeEnviesController');
const { requireAuth } = require('../middleware/authMiddleware');

// Ajouter un article à la liste d'envies
router.post('/ajouterAListeEnvies', requireAuth, listeEnviesController.ajouterAListeEnvies);

// Obtenir la liste d'envies de l'utilisateur
router.get('/', requireAuth, listeEnviesController.obtenirListeEnvies);

// Supprimer un article de la liste d'envies
router.delete('/supprimerDeListeEnvies/:id', requireAuth, listeEnviesController.supprimerDeListeEnvies);

// Vérifier si un article est dans la liste d'envies
router.get('/verifier/:article_id', requireAuth, listeEnviesController.verifierArticleDansListeEnvies);

module.exports = router;