// File: controllers/livraisonController.js
const { Livraison, Commande, Client, Livreur, Utilisateur, Adresse } = require('../models');
const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const sequelize = db.sequelize;

// Get available deliveries for assignment
const obtenirLivraisonsDisponibles = async (req, res) => {
  try {
    const livraisons = await Commande.findAll({
      where: {
        statut: 'en_attente',
        livreur_id: null
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: livraisons.map(l => ({
        livraison_id: l.id,
        reference: l.reference,
        date_creation: l.created_at,
        adresse_livraison: l.adresse?.adresse || 'N/A',
        client_nom: `${l.client?.utilisateur?.prenom} ${l.client?.utilisateur?.nom}`,
        statut: l.statut
      }))
    });
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons disponibles'
    });
  }
};


const assignerLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { livreur_id } = req.body;

    const livraison = await Commande.findByPk(id, { transaction });
    if (!livraison) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    const livreur = await Livreur.findByPk(livreur_id, {
      include: [{ model: Utilisateur, as: 'utilisateur' }],
      transaction
    });
    if (!livreur) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Livreur non trouvé' 
      });
    }

    await livraison.update({
      livreur_id,
      statut: 'en_preparation'
    }, { transaction });

    await livreur.update({
      nombre_livraisons: (livreur.nombre_livraisons || 0) + 1
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Livreur assigné avec succès',
      data: {
        livreur_id,
        livreur_nom: `${livreur.utilisateur.prenom} ${livreur.utilisateur.nom}`,
        commande: {
          id: livraison.id,
          reference: livraison.reference,
          statut: livraison.statut
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error assigning delivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation du livreur'
    });
  }
};

// Get deliveries by delivery person
const obtenirLivraisonsParLivreur = async (req, res) => {
  try {
    const { id } = req.params;

    const livraisons = await Commande.findAll({
      where: { livreur_id: id },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: livraisons.map(l => ({
        livraison_id: l.id,
        reference: l.reference,
        date_creation: l.created_at,
        adresse_livraison: l.adresse?.adresse || 'N/A',
        client_nom: `${l.client?.utilisateur?.prenom} ${l.client?.utilisateur?.nom}`,
        statut: l.statut
      }))
    });
  } catch (error) {
    console.error('Error fetching deliveries by delivery person:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons'
    });
  }
};
// Add to your existing controllers/livraisonController.js

// Update delivery person status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { enService } = req.body;

    const livreur = await Livreur.findByPk(id, {
      include: [{ model: Utilisateur, as: 'utilisateur' }]
    });

    if (!livreur) {
      return res.status(404).json({ 
        success: false,
        message: 'Livreur non trouvé' 
      });
    }

    await livreur.update({ enService });

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour',
      data: {
        enService: livreur.enService
      }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut'
    });
  }
};

// Get today's stats for a delivery person
const getTodayStats = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalLivraisons = await Commande.count({
      where: {
        livreur_id: id,
        created_at: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    const livraisonsCompletees = await Commande.count({
      where: {
        livreur_id: id,
        statut: 'livree',
        created_at: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    const livraisonsEnCours = await Commande.count({
      where: {
        livreur_id: id,
        statut: 'en_cours',
        created_at: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalLivraisons,
        livraisonsCompletees,
        livraisonsEnCours
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// Get assigned deliveries for a delivery person
const getAssignedDeliveries = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const commandes = await Commande.findAll({
      where: {
        livreur_id: id,
        created_at: {
          [Op.between]: [today, tomorrow]
        },
        statut: {
          [Op.in]: ['en_attente', 'en_cours']
        }
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ 
            model: Utilisateur, 
            as: 'utilisateur',
            attributes: ['id', 'prenom', 'nom', 'email']
          }]
        },
        { 
          model: Adresse, 
          as: 'adresse',
          attributes: ['id', 'adresse', 'complement', 'code_postal', 'ville', 'gouvernorat']
        },
        {
          model: Article,
          as: 'articles',
          through: { 
            model: CommandeArticle,
            attributes: ['quantite', 'prix_unitaire', 'taille_id', 'couleur_id']
          }
        }
      ],
      order: [
        ['statut', 'DESC'], // 'en_cours' first
        ['date_livraison_prevue', 'ASC'] // Then by delivery time
      ]
    });

    res.status(200).json({
      success: true,
      data: commandes
    });
  } catch (error) {
    console.error('Error fetching assigned deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons'
    });
  }
};
module.exports = {
  obtenirLivraisonsDisponibles,
  assignerLivraison,
  obtenirLivraisonsParLivreur,
  updateStatus,
  getTodayStats,
  getAssignedDeliveries
};