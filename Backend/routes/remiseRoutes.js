const express = require('express');
const router = express.Router();
const remiseController = require('../controllers/remiseController');

// CRUD des remises
router.get('/', remiseController.listerRemises);
router.get('/getRemiseParId/:id', remiseController.getRemiseParId);
router.post('/creerRemise', remiseController.creerRemise);
router.put('/mettreAJourRemise/:id', remiseController.mettreAJourRemise);
router.delete('/supprimerRemise/:id', remiseController.supprimerRemise);
// Associer/remplacer les relations
router.put('/setArticles/:id', remiseController.setArticles);
router.put('/setCategories/:id', remiseController.setCategories);
router.put('/setGenres/:id', remiseController.setGenres);
router.put('/setTailles/:id', remiseController.setTailles);
router.put('/setUtilisateurs/:id', remiseController.setUtilisateurs);

module.exports = router;
