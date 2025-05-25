const express = require('express');
const router = express.Router();
const reclamationController = require('../controllers/reclamationController');
const { authentifier,verifierAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
// ➕ Public Route - User submits a new reclamation
router.post('/creerReclamation', 
  upload.array('fichiers'), // Handle file uploads
  reclamationController.creerReclamation
);
router.post('/fichiers/upload', upload.array('files'), reclamationController.uploadFichiers);
// 🔍 Admin Routes (all require admin auth)
router.get('/lister', verifierAdmin, reclamationController.listerReclamations);
router.get('/consulter/:id', verifierAdmin, reclamationController.consulterReclamation);
router.post('/repondre/:id', verifierAdmin, reclamationController.repondreReclamation);
router.post('/archiver/:id', verifierAdmin, reclamationController.archiverReclamation);
router.post('/restaurer/:id', verifierAdmin, reclamationController.restaurerReclamation);

// ⚙️ Background Task Route (call via cron job)
router.post('/nettoyer', verifierAdmin, reclamationController.nettoyerReclamations);
router.post('/signed-url', verifierAdmin, reclamationController.generateSignedUrl);
module.exports = router;