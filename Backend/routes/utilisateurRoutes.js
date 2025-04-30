const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateurController');
const { 
  authentifier, 
  verifierAdmin, 
  verifierSuperAdmin,
  requireAuth
} = require('../middleware/authMiddleware');

// Admin/SuperAdmin protected routes
router.get('/obtenirTousUtilisateurs', authentifier, verifierAdmin, utilisateurController.obtenirTousUtilisateurs);
router.get('/obtenirUtilisateurParId/:id', authentifier, verifierAdmin, utilisateurController.obtenirUtilisateurParId);
router.put('/mettreAJourUtilisateur/:id', authentifier, verifierAdmin, utilisateurController.mettreAJourUtilisateur);

// Livreur management routes
router.post('/creeLivreur', authentifier, verifierAdmin, utilisateurController.creeLivreur);
router.get('/obtenirTousLivreurs', authentifier, verifierAdmin, utilisateurController.obtenirTousLivreurs);
router.get('/obtenirLivreurParId/:id', authentifier, verifierAdmin, utilisateurController.obtenirLivreurParId);
router.put('/mettreAJourLivreur/:id', authentifier, verifierAdmin, utilisateurController.mettreAJourLivreur);
router.delete('/supprimerLivreur/:id', authentifier, verifierAdmin, utilisateurController.supprimerLivreur);

// Client management routes
router.get('/obtenirTousClients', authentifier, verifierAdmin, utilisateurController.obtenirTousClients);
router.get('/obtenirClientParId/:id', authentifier, verifierAdmin, utilisateurController.obtenirClientParId);
router.put('/mettreAJourClient/:id', authentifier, verifierAdmin, utilisateurController.mettreAJourClient);
// In routes/livreur.js or similar

router.get("/livreurs-disponibles", authentifier, verifierAdmin, utilisateurController.obtenirLivreursDisponibles);
// Self-service user route
router.get('/moi', authentifier, requireAuth, (req, res) => {
  const user = req.utilisateur;
  return res.json({
    success: true,
    data: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      est_verifie: user.est_verifie,
      prefix: user.prefix,
      newsletter: user.newsletter,
      createdAt: user.createdAt
    }
  });
});

module.exports = router;