//routes/expeditionRoutes.js
const express = require('express');
const router = express.Router();
const expeditionController = require('../controllers/expeditionController');
const { authentifier, verifierAdmin } = require('../middleware/authMiddleware');

// Expedition tracking
router.get('/', authentifier, expeditionController.suivreExpeditions);//est3mltha web
router.put('/expeditions/:id/statut', authentifier, verifierAdmin, expeditionController.mettreAJourStatutExpedition);//est3mltha web
// Package management
router.get('/colis', authentifier, expeditionController.listerColis);//est3mltha web
router.post('/colis', authentifier, verifierAdmin, expeditionController.gererColis);//est3mltha web
router.put('/colis/:id', authentifier, verifierAdmin, expeditionController.gererColis);//est3mltha web
router.post('colis/scanner-qr', authentifier, expeditionController.scannerQRCodeColis);//est3mltha mob
// Returns management
router.get('/retours', authentifier, expeditionController.listerRetours);//est3mltha web
router.put('/retours/:id/traiter', authentifier, verifierAdmin, expeditionController.traiterRetour);//est3mltha web

module.exports = router;