const express = require('express');
const router = express.Router();
const{
    ajouterTaille,
    obtenirToutesTailles,
    obtenirTailleParId,
    modifierTaille,
    supprimerTaille,
    listerTaillesParCategorie,
    listerTaillesParGenre,
    ajouterTaillesMultiple,
    obtenirToutesTaillesFemme,
    obtenirToutesTaillesHomme 

} = require('../controllers/tailleController');
const { validerTaille } = require('../Middleware/validationMiddleware');
// Routes pour les tailles
router.post('/ajouterTaille', validerTaille, ajouterTaille);
router.get('/', obtenirToutesTailles);
router.get('obtenirTailleParId/:id', obtenirTailleParId);
router.put('modifierTaille/:id', validerTaille, modifierTaille);
router.delete('supprimerTaille/:id', supprimerTaille);

// Routes spécifiques
router.get('/listerTaillesParCategorie/:categorie_id',listerTaillesParCategorie);
router.get('/listerTaillesParGenre/:genre_id', listerTaillesParGenre);
router.post('/multiple', ajouterTaillesMultiple);
router.get('/femme', obtenirToutesTaillesFemme);
router.get('/homme', obtenirToutesTaillesHomme);
module.exports = router;