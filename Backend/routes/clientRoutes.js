
const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");

router.put("/mettreAJourProfil", authentifier, clientController.mettreAJourProfil);
router.get("/obtenirCommandesClient", authentifier, clientController.obtenirCommandesClient);
router.get("/filtrerCommandesParStatut", authentifier, clientController.filtrerCommandesParStatut);
router.get("/filtrerCommandesParDate", authentifier, clientController.filtrerCommandesParDate);
router.get("/obtenirRetoursClient", authentifier, clientController.obtenirRetoursClient);
router.get("/obtenirRemplacementsClient", authentifier, clientController.obtenirRemplacementsClient);
router.get("/obtenirDetailsCommandeClient/:id", authentifier, clientController.obtenirDetailsCommandeClient);

router.get("/obtenirAdresses", authentifier, clientController.obtenirAdresses);
router.put("/marquerAdressePrincipale/:adresseId", authentifier, clientController.marquerAdressePrincipale);
router.put("/mettreAJourAdresse/:adresseId", authentifier, clientController.mettreAJourAdresse);
router.delete("/supprimerAdresse/:adresseId", authentifier, clientController.supprimerAdresse);
router.get('/coupons', authentifier, clientController.obtenirCouponsClient);

module.exports = router;