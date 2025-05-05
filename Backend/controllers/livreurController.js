const { Livreur, Utilisateur } = require('../models');

const obtenirLivreur = async (req, res) => {
  try {
    const livreur = await Livreur.findOne({
      where: { utilisateur_id: req.params.id },
      include: [{
        model: Utilisateur,
        as: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'est_verifie']
      }]
    });

    if (!livreur) {
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
        utilisateur_id: livreur.utilisateur_id,
        utilisateur: livreur.utilisateur
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du livreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};


const mettreAJourLivreur = async (req, res) => {
    try {
      // We can now access req.livreur from the middleware
      const { telephone, statut, type_vehicule, plaque_immatriculation } = req.body;
      const { nom, prenom, email } = req.body.utilisateur || {};
  
      // Update Livreur info
      await req.livreur.update({
        telephone,
        statut,
        type_vehicule,
        plaque_immatriculation
      });
  
      // Update Utilisateur info if provided
      if (nom || prenom || email) {
        await req.utilisateur.update({
          ...(nom && { nom }),
          ...(prenom && { prenom }),
          ...(email && { email })
        });
      }
  
      // Return updated livreur info
      const livreur = await Livreur.findOne({
        where: { utilisateur_id: req.utilisateur.id },
        include: [{
          model: Utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email', 'est_verifie']
        }]
      });
  
      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        livreur
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