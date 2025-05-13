const express = require("express");
const router = express.Router();
const controleurCaisse = require("../controllers/caisseController");
const { optionalAuth, requireAuth, authentifier } = require("../middleware/authMiddleware");

// Initialization can be accessed by guests or authenticated users
router.post('/initialiser', optionalAuth, controleurCaisse.initialiserCommande);

// All subsequent steps require authentication
router.post('/adresse', authentifier, controleurCaisse.sauvegarderAdresseLivraison);
router.post('/livraison', authentifier, controleurCaisse.sauvegarderMethodeLivraison);
router.post('/paiement', authentifier, controleurCaisse.traiterPaiement);
router.get('/confirmation/:reference', authentifier, controleurCaisse.obtenirConfirmationCommande);

// Address management
router.get('/obtenirAdresses', authentifier, controleurCaisse.obtenirAdresses);
router.put('/definirAdressePrincipale/:adresseId', authentifier, controleurCaisse.definirAdressePrincipale);



module.exports = router;
module.exports = router;