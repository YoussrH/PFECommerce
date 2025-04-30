const express = require("express");
const router = express.Router();
const {
  ajouterMarque,
  obtenirToutesLesMarques,
  obtenirMarqueParId,
  mettreAJourMarque,
  supprimerMarque,
  supprimerToutesLesMarques
} = require('../controllers/marqueController');
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");

// Routes publiques
router.get('/', obtenirToutesLesMarques);
router.get('/obtenirMarqueParId/:id', obtenirMarqueParId);

// Routes protégées (authentification requise)
router.post('/ajouterMarque', authentifier, verifierAdmin, ajouterMarque);
router.put('/mettreAJourMarque/:id', authentifier, verifierAdmin, mettreAJourMarque);
router.delete('/supprimerMarque/:id', authentifier, verifierAdmin, supprimerMarque);
router.delete('/supprimerToutesLesMarques', authentifier, verifierAdmin, supprimerToutesLesMarques);

module.exports = router;