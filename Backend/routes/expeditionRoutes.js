const express = require('express');
const router = express.Router();
const expeditionController = require('../controllers/expeditionController');
const { authentifier, verifierAdmin } = require('../middleware/authMiddleware');

// Suivi des expéditions
router.get('/expeditions', authentifier, expeditionController.suivreExpeditions);
router.put('/expeditions/:id/statut', authentifier, verifierAdmin, expeditionController.mettreAJourStatutExpedition);

// Gestion des colis
router.get('/colis', authentifier, expeditionController.listerColis);
router.post('/colis', authentifier, verifierAdmin, expeditionController.gererColis);
router.put('/colis/:id', authentifier, verifierAdmin, expeditionController.gererColis);

// Gestion des retours
router.get('/retours', authentifier, expeditionController.listerRetours);
router.put('/retours/:id/traiter', authentifier, verifierAdmin, expeditionController.traiterRetour);

module.exports = router;