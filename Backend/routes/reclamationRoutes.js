const express = require("express");
const router = express.Router();
const { 
  creerReclamation,
  obtenirToutesReclamations,
  obtenirMesReclamations,
  obtenirReclamationParId,
  mettreAJourReclamation
} = require("../controllers/reclamationController");
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Create reclamation route - NO AUTH REQUIRED
router.post("/creerReclamation", upload.array('fichiers', 2), creerReclamation);

// Protected routes below
router.get("/", authentifier, verifierAdmin, obtenirToutesReclamations);
router.get("/mes-reclamations", authentifier, obtenirMesReclamations);
router.get("/obtenirReclamationParId/:id", authentifier, obtenirReclamationParId);
router.put("/mettreAJourReclamation/:id", authentifier, verifierAdmin, mettreAJourReclamation);

module.exports = router;