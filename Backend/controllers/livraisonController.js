// File: controllers/livraisonController.js
const { Op, Sequelize } = require('sequelize');

const { Livraison, Commande, CommandeArticle, CommandeHistorique ,Article, Client, Livreur, Utilisateur, Adresse, Colis } = require('../models');

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

    // Update all related colis records
    await db.Colis.update(
      { livreur_id },
      { 
        where: { commande_id: id },
        transaction
      }
    );

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
// Helper function for error handling
const debugError = (operation, error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    operation,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  };
  console.error('DEBUG ERROR:', JSON.stringify(errorInfo, null, 2));
  return errorInfo;
};

// Get deliveries by delivery person ID



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
    const errorInfo = debugError('obtenirLivraisonsParLivreur', error, { livreurId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

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
    const errorInfo = debugError('updateStatus', error, { livreurId: req.params.id, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const obtenirMesLivraisons = async (req, res) => {
  try {
    // Use req.livreur instead of req.utilisateur.livreur
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    const livraisons = await Commande.findAll({
      where: { 
        livreur_id: livreurId,
        statut: {
          [Op.in]: ['en_preparation', 'expediee', 'livree']
        }
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const result = livraisons.map(l => ({
      livraison_id: l.id,
      reference: l.reference,
      date_creation: l.created_at,
      adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
      client_nom: l.client?.utilisateur
        ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
        : 'Client inconnu',
      statut: l.statut,
      colis: l.colis || null
    }));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const errorInfo = debugError('obtenirMesLivraisons', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const obtenirMesLivraisonsAujourdhui = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    // Today date boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find commandes with colis shipped today
    const livraisons = await Commande.findAll({
      where: {
        livreur_id: livreurId,
        statut: {
          [Op.in]: ['en_preparation', 'expediee', 'livree']
        }
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison'],
          where: {
            date_expedition: {
              [Op.between]: [todayStart, todayEnd]
            }
          }
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const result = livraisons.map(l => ({
      livraison_id: l.id,
      reference: l.reference,
      date_creation: l.created_at,
      adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
      client_nom: l.client?.utilisateur
        ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
        : 'Client inconnu',
      statut: l.statut,
      colis: l.colis || null
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirMesLivraisonsAujourdhui:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};
 


/* const obtenirMesLivraisonsEnCours = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    // Fetch deliveries that are in progress (en_preparation, expediee) and not yet delivered
    const livraisons = await Commande.findAll({
      where: {
        livreur_id: livreurId,
        statut: {
          [Op.in]: ['en_preparation', 'expediee']
        },
        date_livraison: null  // Not yet delivered
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const result = livraisons.map(l => ({
      livraison_id: l.id,
      reference: l.reference,
      date_creation: l.created_at,
      adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
      client_nom: l.client?.utilisateur
        ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
        : 'Client inconnu',
      statut: l.statut,
      colis: l.colis || null
    }));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirMesLivraisonsEnCours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};
const obtenirMesLivraisonsCompletees = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    // Fetch completed deliveries (livree with date_livraison set)
    const livraisons = await Commande.findAll({
      where: {
        livreur_id: livreurId,
        statut: 'livree',
        date_livraison: { [Op.not]: null }  // Delivered deliveries
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison']
        }
      ],
      order: [['date_livraison', 'DESC']]  // Ordered by delivery date
    });

    const result = livraisons.map(l => ({
      livraison_id: l.id,
      reference: l.reference,
      date_creation: l.created_at,
      adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
      client_nom: l.client?.utilisateur
        ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
        : 'Client inconnu',
      statut: l.statut,
      colis: l.colis || null
    }));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirMesLivraisonsCompletees:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
}; */


/* const obtenirMesStatistiquesLivraison = async (req, res) => {
  try {
    // Use the same authentication pattern as obtenirMesLivraisons
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    // Get all counts in a single transaction for consistency
    const stats = await sequelize.transaction(async (transaction) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [
        totalLivraisons,
        livraisonsCompletees,
        livraisonsEnCours,
        livraisonsDuJour,
        livraisonsCompleteesAujourdhui,
        colisLivresCeMois
      ] = await Promise.all([
        // Total deliveries for the driver
        Commande.count({
          where: { livreur_id: livreurId },
          transaction
        }),
        // Completed deliveries in total
        Commande.count({
          where: {
            livreur_id: livreurId,
            statut: 'livree'
          },
          transaction
        }),
        // In progress deliveries (en_preparation or expediee)
        Commande.count({
          where: {
            livreur_id: livreurId,
            statut: {
              [Op.in]: ['en_preparation', 'expediee']
            }
          },
          transaction
        }),
        // Livraisons du jour
        Commande.count({
          where: {
            livreur_id: livreurId,
            created_at: {
              [Op.between]: [today, tomorrow]
            }
          },
          transaction
        }),
        // Livraisons complètes aujourd'hui (livree)
        Commande.count({
          where: {
            livreur_id: livreurId,
            statut: 'livree',
            created_at: {
              [Op.between]: [today, tomorrow]
            }
          },
          transaction
        }),
        // Livraisons complètes ce mois
        Commande.count({
          where: {
            livreur_id: livreurId,
            statut: 'livree',
            created_at: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          },
          transaction
        })
      ]);

      return {
        total: totalLivraisons,
        completees: livraisonsCompletees,
        enCours: livraisonsEnCours,
        livraisonsDuJour: {
          total: livraisonsDuJour,
          completees: livraisonsCompleteesAujourdhui
        },
        colisLivresCeMois: colisLivresCeMois
      };
    });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur obtenirMesStatistiquesLivraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};
 */




// Update delivery status (for delivery person)
const mettreAJourStatutLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const livreurId = req.utilisateur.livreur.id;

    const commande = await Commande.findOne({
      where: {
        id,
        livreur_id: livreurId
      },
      transaction
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée ou non assignée à vous' 
      });
    }

    const allowedStatuses = {
      'en_preparation': ['expediee'],
      'expediee': ['livree']
    };

    if (!allowedStatuses[commande.statut] || !allowedStatuses[commande.statut].includes(statut)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Transition de statut non autorisée'
      });
    }

    await commande.update({ statut }, { transaction });

    // If status is 'livree', update delivery date
    if (statut === 'livree') {
      await commande.update({ date_livraison: new Date() }, { transaction });
    }

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: req.utilisateur.id,
      action: 'changement_statut_livreur',
      ancienne_valeur: commande.statut,
      nouvelle_valeur: statut,
      details: `Statut changé par le livreur`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: {
        commande_id: commande.id,
        nouveau_statut: statut
      }
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('mettreAJourStatutLivraison', error, {
      commandeId: req.params.id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const obtenirMesStatistiquesLivraison = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    // Dates utiles
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const stats = await sequelize.transaction(async (transaction) => {
      // Total colis affectés à ce livreur
      const total = await Colis.count({
        where: { livreur_id: livreurId },
        transaction
      });

      // Colis livrés (statut = 'livree' dans colis)
      const completees = await Colis.count({
        where: { 
          livreur_id: livreurId,
          statut: 'livree'
        },
        transaction
      });

      // Colis en cours (statut = en_preparation ou expedie)
      const enCours = await Colis.count({
        where: {
          livreur_id: livreurId,
          statut: { [Op.in]: ['en_preparation', 'expedie'] }
        },
        transaction
      });

      // Colis expédiés aujourd'hui (date_expedition = aujourd'hui)
      const livraisonsDuJourTotal = await Colis.count({
        where: {
          livreur_id: livreurId,
          date_expedition: { [Op.between]: [todayStart, todayEnd] }
        },
        transaction
      });

      // Colis livrés aujourd'hui (date_livraison = aujourd'hui)
      const livraisonsDuJourCompletees = await Colis.count({
        where: { 
          livreur_id: livreurId,
          statut: 'livree',
          date_livraison: { [Op.between]: [todayStart, todayEnd] }
        },
        transaction
      });

      // Colis livrés ce mois-ci (date_livraison ce mois)
      const colisLivresCeMois = await Colis.count({
        where: { 
          livreur_id: livreurId,
          statut: 'livree',
          date_livraison: { [Op.between]: [startOfMonth, endOfMonth] }
        },
        transaction
      });

      return {
        total,
        completees,
        enCours,
        livraisonsDuJour: {
          total: livraisonsDuJourTotal,
          completees: livraisonsDuJourCompletees
        },
        colisLivresCeMois
      };
    });

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur obtenirMesStatistiquesLivraison:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};



module.exports = {
  obtenirLivraisonsDisponibles,
  assignerLivraison,
  obtenirLivraisonsParLivreur,
  obtenirMesLivraisons,
  obtenirMesLivraisonsAujourdhui,
  mettreAJourStatutLivraison,
  obtenirMesStatistiquesLivraison,
  updateStatus,
};

