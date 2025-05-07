const { Livreur, Utilisateur } = require('../models');

const obtenirLivreur = async (req, res) => {
  try {
    console.log('Authenticated user:', req.utilisateur); // Debug
    
    if (!req.utilisateur || req.utilisateur.role !== 'livreur') {
      console.log('Access denied - Not a livreur'); // Debug
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const livreur = await Livreur.findOne({
      where: { utilisateur_id: req.utilisateur.id },
      include: [{
        model: Utilisateur,
        as: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'est_verifie']
      }]
    });

    console.log('Found livreur:', livreur); // Debug

    if (!livreur) {
      console.log('No livreur found for user:', req.utilisateur.id); // Debug
      return res.status(404).json({
        success: false,
        message: 'Livreur non trouvé'
      });
    }

    res.json({
      success: true,
      livreur: {
        id: livreur.id,
        telephone: livreur.telephone,
        statut: livreur.statut,
        type_vehicule: livreur.type_vehicule,
        plaque_immatriculation: livreur.plaque_immatriculation,
        utilisateur: {
          id: livreur.utilisateur.id,
          nom: livreur.utilisateur.nom,
          prenom: livreur.utilisateur.prenom,
          email: livreur.utilisateur.email,
          est_verifie: livreur.utilisateur.est_verifie
        }
      }
    });
  } catch (error) {
    console.error('Error in obtenirLivreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

const mettreAJourLivreur = async (req, res) => {
  try {
    if (!req.utilisateur || req.utilisateur.role !== 'livreur') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { telephone, statut, type_vehicule, plaque_immatriculation } = req.body;
    const { nom, prenom, email } = req.body.utilisateur || {};

    // Find the livreur
    const livreur = await Livreur.findOne({
      where: { utilisateur_id: req.utilisateur.id },
      include: [{
        model: Utilisateur,
        as: 'utilisateur'
      }]
    });

    if (!livreur) {
      return res.status(404).json({
        success: false,
        message: 'Livreur non trouvé'
      });
    }

    // Update Livreur info
    await livreur.update({
      telephone,
      type_vehicule,
      plaque_immatriculation,
      ...(statut && { statut }) // Only update statut if provided
    });

    // Update Utilisateur info if provided
    if (nom || prenom || email) {
      await livreur.utilisateur.update({
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(email && { email })
      });
    }

    const updatedLivreur = await Livreur.findOne({
      where: { utilisateur_id: livreur.utilisateur_id },
      include: [{
        model: Utilisateur,
        as: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'est_verifie']
      }]
    });
    

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      livreur: {
        id: updatedLivreur.id,
        telephone: updatedLivreur.telephone,
        statut: updatedLivreur.statut,
        type_vehicule: updatedLivreur.type_vehicule,
        plaque_immatriculation: updatedLivreur.plaque_immatriculation,
        utilisateur: {
          id: updatedLivreur.utilisateur.id,
          nom: updatedLivreur.utilisateur.nom,
          prenom: updatedLivreur.utilisateur.prenom,
          email: updatedLivreur.utilisateur.email,
          est_verifie: updatedLivreur.utilisateur.est_verifie
        }
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour livreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

module.exports = {
  obtenirLivreur,
  mettreAJourLivreur
};