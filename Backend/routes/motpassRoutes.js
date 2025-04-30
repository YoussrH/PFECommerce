const express = require("express");
const router = express.Router();
const motpassController = require("../controllers/motpassController");

router.post("/mot-de-passe-oublie", motpassController.motDePasseOublie);
router.post("/verifier-code-reinitialisation", motpassController.verifierCodeReinitialisation);
router.post("/reinitialiser-mot-de-passe", motpassController.reinitialiserMotDePasse);

module.exports = router;