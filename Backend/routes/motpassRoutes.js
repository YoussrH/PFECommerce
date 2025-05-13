const express = require("express");
const router = express.Router();
const motpassController = require("../controllers/motpassController");
const { authentifier, authentifierLivreur, requireAuth } = require("../middleware/authMiddleware");
router.post("/mot-de-passe-oublie", motpassController.motDePasseOublie);
router.post("/verifier-code-reinitialisation", motpassController.verifierCodeReinitialisation);
router.post("/reinitialiser-mot-de-passe", motpassController.reinitialiserMotDePasse);

// For regular users:
router.post("/changer-mot-de-passe", requireAuth, motpassController.changerMotDePasse);

// For delivery persons:
router.post("/livreur/changer-mot-de-passe", authentifierLivreur, motpassController.changerMotDePasse);
module.exports = router;