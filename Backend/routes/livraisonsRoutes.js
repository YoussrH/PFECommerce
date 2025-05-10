// File: routes/livraisonsRoutes.js
const express = require('express');
const router = express.Router();
const livraisonController = require('../controllers/livraisonController');
const { authentifier, verifierAdmin ,authentifierLivreur} = require('../middleware/authMiddleware');

// Get available deliveries for assignment
router.get("/disponibles", authentifier, verifierAdmin, livraisonController.obtenirLivraisonsDisponibles);

// Assign delivery to a delivery person
router.put("/:id/assigner", authentifier, verifierAdmin, livraisonController.assignerLivraison);
router.put("/:id/modifierLivreurLivraison", authentifier, verifierAdmin, livraisonController.modifierLivreurLivraison);

// Get deliveries by delivery person ID
router.get("/livreur/:id", authentifier, livraisonController.obtenirLivraisonsParLivreur);

// Get all deliveries for current delivery person
router.get("/mes-livraisons", authentifierLivreur, livraisonController.obtenirMesLivraisons);

// Update delivery status (for delivery person)
router.put("/:id/statut", authentifierLivreur, livraisonController.mettreAJourStatutLivraison);

// Get today's deliveries for current delivery person
router.get("/mes-livraisons/aujourdhui", authentifierLivreur, livraisonController.obtenirMesLivraisonsAujourdhui);

// Get delivery statistics for current delivery person
router.get("/mes-statistiques", authentifierLivreur, livraisonController.obtenirMesStatistiquesLivraison);
router.get("/obtenirLivraisonParId/:id", authentifier, livraisonController.obtenirLivraisonParId);
router.get("/mes-livraisons/par-date", authentifierLivreur, livraisonController.obtenirLivraisonsParDate);
router.post('/signaler-probleme/:id', authentifierLivreur, livraisonController.signalerProblemeLivraison);
module.exports = router;