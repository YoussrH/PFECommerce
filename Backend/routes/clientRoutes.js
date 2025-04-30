
const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const { authentifier, verifierAdmin } = require("../Middleware/authMiddleware");
router.put("/client", authentifier, clientController.mettreAJourClient);
router.get("/client/commandes", authentifier, clientController.obtenirHistoriqueCommandes);
module.exports = router;