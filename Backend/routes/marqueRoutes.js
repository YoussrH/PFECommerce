const express = require("express");
const router = express.Router();
const marqueController = require('../controllers/marqueController');
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");

// Routes publiques
router.get('/', marqueController.obtenirToutesLesMarques);
router.get('/obtenirMarqueParId/:id', marqueController.obtenirMarqueParId);

// Routes protégées (authentification requise)
router.post('/ajouterMarque', authentifier, verifierAdmin, marqueController.ajouterMarque);
router.put('/mettreAJourMarque/:id', authentifier, verifierAdmin, marqueController.mettreAJourMarque);
router.delete('/supprimerMarque/:id', authentifier, verifierAdmin, marqueController.supprimerMarque);
router.delete('/supprimerToutesLesMarques', authentifier, verifierAdmin, marqueController.supprimerToutesLesMarques);

router.get('/marques-populaires', marqueController.obtenirMarquesPopulaires);
router.get('/par-genre/:genre', marqueController.obtenirMarquesParGenre);
module.exports = router;