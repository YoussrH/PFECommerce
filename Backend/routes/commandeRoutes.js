const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');
const {authentifier,verifierAdmin}= require('../middleware/authMiddleware');

router.get('/:reference/facture', commandeController.genererFacturePDF);


// Routes pour l'administration des commandes
router.get("/", authentifier, commandeController.listerCommandes);
router.get("/obtenirDetailsCommande/:id", authentifier, commandeController.obtenirDetailsCommande);
router.put("/mettreAJourStatut/:id/statut", authentifier, commandeController.mettreAJourStatut);
router.put("/modifierAdresseLivraison/:id/adresse", authentifier, commandeController.modifierAdresseLivraison);
router.delete("/annulerCommande/:id", authentifier, commandeController.annulerCommande);
// In your routes file
router.post("/ajouterNoteAdmin/:id/notes", authentifier, commandeController.ajouterNoteAdmin);
router.get("/genererFacture/:id/facture", authentifier, commandeController.genererFacture);
router.get("/:id/historique", authentifier, commandeController.obtenirHistorique);
router.post("/:id/notifier", authentifier, commandeController.envoyerNotificationClient);

router.post( "/:id/confirmer-livraison", authentifier, commandeController.confirmerLivraisonQR );
router.get("/commandes-a-livrer", authentifier, verifierAdmin, commandeController.obtenirCommandesALivrer);

module.exports = router;