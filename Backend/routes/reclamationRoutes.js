const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/reclamationController');
const { verifierAdmin } = require('../middleware/authMiddleware');

// ➕ Public Route - User submits a new reclamation
router.post('/creerReclamation', reclamationController.creerReclamation);

// 🔍 Admin Routes (all require admin auth)
router.get('/lister', verifierAdmin, reclamationController.listerReclamations);
router.get('/consulter/:id', verifierAdmin, reclamationController.consulterReclamation);
router.post('/repondre/:id', verifierAdmin, reclamationController.repondreReclamation);
router.post('/archiver/:id', verifierAdmin, reclamationController.archiverReclamation);
router.post('/restaurer/:id', verifierAdmin, reclamationController.restaurerReclamation);

// ⚙️ Background Task Route (call via cron job)
router.post('/nettoyer', verifierAdmin, reclamationController.nettoyerReclamations);

module.exports = router;