const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authentifier } = require("../middleware/authMiddleware");

router.post("/inscription", authController.inscrireUtilisateur);
router.post("/verifier-otp", authController.verifierOTP);
router.post("/connexion", authController.connecterUtilisateur);
router.post("/connexion-admin", authController.connecterAdmin);
router.post("/deconnexion", authentifier, authController.deconnecterUtilisateur);
router.get("/utilisateur", authentifier, authController.obtenirUtilisateur);
router.post("/connexion-livreur", authController.connecterLivreur);
module.exports = router;