//routes/commandeRoutes.js
const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');
const {authentifier,verifierAdmin}= require('../middleware/authMiddleware');

router.get('/:reference/facture', commandeController.genererFacturePDF);


// Routes pour l'administration des commandes
router.get("/", authentifier, commandeController.listerCommandes);//est3mltha web
router.get("/obtenirDetailsCommande/:id", authentifier, commandeController.obtenirDetailsCommande);//est3mltha web
router.put("/mettreAJourStatut/:id/statut", authentifier, commandeController.mettreAJourStatut);//est3mltha web
router.put("/modifierAdresseLivraison/:id/adresse", authentifier, commandeController.modifierAdresseLivraison);
router.delete("/annulerCommande/:id", authentifier, commandeController.annulerCommande);//est3mltha web
router.post('/remplacerCommande/:id', authentifier, commandeController.remplacerCommande);
// In your routes file
router.post("/ajouterNoteAdmin/:id/notes", authentifier, commandeController.ajouterNoteAdmin);//est3mltha web
router.get("/genererFacture/:id/facture", authentifier, commandeController.genererFacture);//est3mltha web
router.get("/:id/historique", authentifier, commandeController.obtenirHistorique);//est3mltha web
router.post("/:id/notifier", authentifier, commandeController.envoyerNotificationClient);
router.get("/commandes-a-livrer", authentifier, verifierAdmin, commandeController.obtenirCommandesALivrer);

module.exports = router;