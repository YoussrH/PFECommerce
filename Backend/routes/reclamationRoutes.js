const express = require("express");
const router = express.Router();
const reclamationController =require("../controllers/reclamationController");
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Create reclamation route - NO AUTH REQUIRED
router.post("/creerReclamation", upload.array('fichiers', 2),reclamationController.creerReclamation);

// Protected routes below
router.get("/", authentifier, verifierAdmin, reclamationController.obtenirToutesReclamations);
router.get("/mes-reclamations", authentifier, reclamationController.obtenirMesReclamations);
router.get("/obtenirReclamationParId/:id", authentifier, reclamationController.obtenirReclamationParId);
router.put("/mettreAJourReclamation/:id", authentifier, verifierAdmin, reclamationController.mettreAJourReclamation);
router.put('/traiterReclamation/:id', authentifier, verifierAdmin, reclamationController.traiterReclamation);
module.exports = router;