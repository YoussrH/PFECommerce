// File: controllers/livraisonController.js
const { Op, Sequelize } = require('sequelize');

const { Livraison, Commande,Retour, CommandeArticle, CommandeHistorique ,Article, Client, Livreur, Utilisateur, Adresse, Colis } = require('../models');

const {envoyerEmail} = require('../services/emailService');
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



/* const assignerLivraison = async (req, res) => {
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
}; */

const assignerLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { livreur_id } = req.body;

    const livraison = await Commande.findByPk(id, { 
      transaction,
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ]
    });
    
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

    // Send notification to the delivery person
    try {
      await envoyerEmail({
        to: livreur.utilisateur.email,
        template: 'livraisonAssignee',
        subject: 'Nouvelle livraison assignée - ' + livraison.reference,
        context: {
          livreurPrenom: livreur.utilisateur.prenom,
          reference: livraison.reference,
          clientNom: `${livraison.client.utilisateur.prenom} ${livraison.client.utilisateur.nom}`,
          adresseLivraison: livraison.adresse?.adresse || 'Adresse non spécifiée',
          dateCreation: new Date(livraison.created_at).toLocaleDateString('fr-FR'),
          statut: 'En préparation',
          appLink: `${process.env.APP_URL}/livreur/livraisons/${livraison.id}`
        }
      });
    } catch (emailError) {
      console.error('Failed to send assignment notification:', emailError);
      // Don't fail the whole operation if email fails
    }

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

    // Find commandes that:
    // 1. Are assigned to this delivery person
    // 2. Are not completed (status is not 'livree')
    // 3. Either:
    //    a) Were shipped today, OR
    //    b) Were shipped before today but not yet delivered
    const livraisons = await Commande.findAll({
      where: {
        livreur_id: livreurId,
        statut: {
          [Op.in]: ['en_preparation', 'expediee'] // Only include not-yet-delivered
        },
        [Op.or]: [
          // Shipments from today
          {
            '$colis.date_expedition$': {
              [Op.between]: [todayStart, todayEnd]
            }
          },
          // OR shipments from before today that aren't delivered
          {
            '$colis.date_expedition$': {
              [Op.lt]: todayStart
            },
            '$colis.date_livraison$': null
          }
        ]
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
          required: true // Ensure only commandes with colis are returned
        }
      ],
      order: [
        ['statut', 'ASC'], // 'en_preparation' first, then 'expediee'
        ['created_at', 'DESC'] // Newer ones first within same status
      ]
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

const mettreAJourStatutLivraison = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params; // commande_id
    const { statut } = req.body;
    const livreurId = req.livreur?.utilisateur_id;

    if (!livreurId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['id', 'prenom', 'nom', 'email']
          }]
        }
      ]
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    if (commande.livreur_id !== livreurId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Accès refusé : vous n’êtes pas le livreur assigné à cette commande.'
      });
    }

    const ancienStatut = commande.statut;

    // Autoriser uniquement certains statuts pour le livreur
    const statutsAutorisés = ['recuperee', 'livree', 'annulee'];
    if (!statutsAutorisés.includes(statut)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Statut '${statut}' non autorisé pour le livreur.`
      });
    }

    // Mettre à jour la commande
    await commande.update({ statut }, { transaction });

    const colis = await sequelize.models.Colis.findOne({
      where: { commande_id: id },
      transaction
    });

    if (colis) {
      await colis.update({
        statut,
        ...(statut === 'livree' && { date_livraison: new Date() })
      }, { transaction });
    }

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: livreurId,
      action: 'changement_statut',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: statut,
      details: `Livreur a changé le statut de ${ancienStatut} à ${statut}`
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: {
        commandeId: commande.id,
        ancienStatut,
        nouveauStatut: statut
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Erreur changement statut par livreur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne lors du changement de statut'
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

      // Colis livrés (via commande livrée OU colis livré)
      const completees = await Colis.count({
        include: [{
          model: Commande,
          as: 'commande',
          where: { 
            statut: 'livree'
          },
          required: false
        }],
        where: { 
          livreur_id: livreurId,
          [Op.or]: [
            { statut: 'livree' },
            { '$commande.statut$': 'livree' }
          ]
        },
        transaction
      });

      // Colis en cours (statut = en_preparation ou expedie)
      const enCours = await Colis.count({
        where: {
          livreur_id: livreurId,
          statut: { [Op.in]: ['en_preparation', 'expediee'] }
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

      // Colis livrés aujourd'hui (via commande livrée OU colis livré aujourd'hui)
      const livraisonsDuJourCompletees = await Colis.count({
        include: [{
          model: Commande,
          as: 'commande',
          required: false
        }],
        where: { 
          livreur_id: livreurId,
          [Op.or]: [
            { 
              statut: 'livree',
              date_livraison: { [Op.between]: [todayStart, todayEnd] }
            },
            { 
              '$commande.statut$': 'livree',
              '$commande.updated_at$': { [Op.between]: [todayStart, todayEnd] }
            }
          ]
        },
        transaction
      });

      // Colis livrés ce mois-ci
      const colisLivresCeMois = await Colis.count({
        include: [{
          model: Commande,
          as: 'commande',
          required: false
        }],
        where: { 
          livreur_id: livreurId,
          [Op.or]: [
            { 
              statut: 'livree',
              date_livraison: { [Op.between]: [startOfMonth, endOfMonth] }
            },
            { 
              '$commande.statut$': 'livree',
              '$commande.updated_at$': { [Op.between]: [startOfMonth, endOfMonth] }
            }
          ]
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

const obtenirLivraisonParId = async (req, res) => {
  try {
    const { id } = req.params;
    const livreurId = req.livreur?.utilisateur_id;

    const livraison = await Commande.findOne({
      where: { 
        id,
        ...(livreurId && { livreur_id: livreurId }) // Only filter by livreur if authenticated as one
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom'] // Removed telephone from here
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse', 'ville', 'code_postal']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison']
        },
        {
          model: Livreur,
          as: 'livreur',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        }
      ]
    });

    if (!livraison) {
      return res.status(404).json({ 
        success: false,
        message: 'Livraison non trouvée' 
      });
    }

    const result = {
      livraison_id: livraison.id,
      reference: livraison.reference,
      date_creation: livraison.created_at,
      date_livraison: livraison.date_livraison,
      statut: livraison.statut,
      montant_total: livraison.prix_total, // Changed from montant_total to prix_total
      instructions: livraison.notes_admin, // Assuming notes_admin contains delivery instructions
      client_nom: livraison.client?.utilisateur 
        ? `${livraison.client.utilisateur.prenom} ${livraison.client.utilisateur.nom}`
        : 'Client inconnu',
      client_telephone: livraison.client?.telephone || 'N/A', // Get phone directly from client
      adresse_livraison: livraison.adresse?.adresse 
        ? `${livraison.adresse.adresse}, ${livraison.adresse.code_postal} ${livraison.adresse.ville}`
        : 'Adresse non disponible',
      livreur: livraison.livreur?.utilisateur
        ? `${livraison.livreur.utilisateur.prenom} ${livraison.livreur.utilisateur.nom}`
        : null,
      colis: livraison.colis || []
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirLivraisonParId:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la livraison',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};


const obtenirLivraisonsParDate = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;
    const { dateDebut, dateFin } = req.query;

    if (!dateDebut || !dateFin) {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres dateDebut et dateFin sont requis.'
      });
    }

    const startDate = new Date(dateDebut);
    const endDate = new Date(dateFin);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date invalide. Utilisez le format ISO (YYYY-MM-DD).'
      });
    }

    const livraisons = await Commande.findAll({
      where: {
        livreur_id: livreurId,
        [Op.or]: [
          {
            '$colis.date_livraison$': {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            '$colis.date_expedition$': {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            [Op.and]: [
              { '$colis.date_livraison$': null },
              { '$colis.date_expedition$': null },
              {
                created_at: {
                  [Op.between]: [startDate, endDate]
                }
              }
            ]
          }
        ]
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
          required: false // Important pour inclure même les commandes sans colis
        }
      ],
      order: [
        [{ model: Colis, as: 'colis' }, 'date_livraison', 'DESC'],
        [{ model: Colis, as: 'colis' }, 'date_expedition', 'DESC'],
        ['created_at', 'DESC']
      ]
    });

    const result = livraisons.map(l => {
      const colis = Array.isArray(l.colis) ? l.colis[0] : l.colis;

      let displayDate =
        colis?.date_livraison ||
        colis?.date_expedition ||
        l.created_at;

      return {
        livraison_id: l.id,
        reference: l.reference,
        date_creation: l.created_at,
        date_livraison: colis?.date_livraison || null,
        displayDate,
        adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
        client_nom: l.client?.utilisateur
          ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
          : 'Client inconnu',
        statut: l.statut,
        colis: l.colis || []
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirLivraisonsParDate:', error);
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


const modifierLivreurLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { livreur_id } = req.body;

    if (!livreur_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'L\'identifiant du nouveau livreur est requis'
      });
    }

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [
        {
          model: Livreur,
          as: 'livreur',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ]
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Check if commande status is "en_preparation"
    if (commande.statut !== 'en_preparation') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Seules les commandes en préparation peuvent être réassignées'
      });
    }

    if (commande.livreur_id === livreur_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cette commande est déjà assignée à ce livreur'
      });
    }

    const nouveauLivreur = await Livreur.findByPk(livreur_id, {
      include: [{ model: Utilisateur, as: 'utilisateur' }],
      transaction
    });

    if (!nouveauLivreur) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Nouveau livreur non trouvé'
      });
    }

    const ancienLivreurId = commande.livreur_id;

    await commande.update({ livreur_id }, { transaction });
    await Colis.update({ livreur_id }, { where: { commande_id: id }, transaction });

    // Prepare common email context
    const emailContext = {
      reference: commande.reference || 'N/A',
      clientNom: commande.client?.utilisateur 
        ? `${commande.client.utilisateur.prenom || ''} ${commande.client.utilisateur.nom || ''}`.trim()
        : 'Client inconnu',
      adresseLivraison: commande.adresse?.adresse || 'Adresse non spécifiée',
      dateCreation: commande.created_at 
        ? new Date(commande.created_at).toLocaleDateString('fr-FR') 
        : new Date().toLocaleDateString('fr-FR'),
      statut: commande.statut || 'N/A',
      CURRENT_YEAR: new Date().getFullYear(),
      currentYear: new Date().getFullYear(), // Both versions for compatibility
      appLink: `${process.env.APP_URL || 'https://yourdomain.com'}/livreur/livraisons/${commande.id}`
    };

    // Send email to new delivery person
    if (nouveauLivreur.utilisateur?.email) {
      try {
        await envoyerEmail({
          to: nouveauLivreur.utilisateur.email,
          template: 'livraison-assignee', // Match the template file name
          subject: `Nouvelle livraison assignée - ${emailContext.reference}`,
          context: {
            ...emailContext,
            livreurPrenom: nouveauLivreur.utilisateur.prenom || 'Livreur'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email to new delivery person:', emailError.message);
      }
    }

    // Send email to old delivery person if exists
    if (commande.livreur?.utilisateur?.email) {
      try {
        await envoyerEmail({
          to: commande.livreur.utilisateur.email,
          template: 'livraison-unassigned', // Match the template file name
          subject: `Livraison réassignée - ${emailContext.reference}`,
          context: {
            ...emailContext,
            livreurPrenom: commande.livreur.utilisateur.prenom || 'Livreur',
            nouveauLivreur: `${nouveauLivreur.utilisateur.prenom || ''} ${nouveauLivreur.utilisateur.nom || ''}`.trim() || 'Nouveau Livreur'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email to old delivery person:', emailError.message);
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Livreur modifié avec succès',
      data: {
        ancien_livreur_id: ancienLivreurId,
        nouveau_livreur_id: livreur_id,
        nouveau_livreur_nom: `${nouveauLivreur.utilisateur.prenom || ''} ${nouveauLivreur.utilisateur.nom || ''}`.trim(),
        commande_id: commande.id,
        reference: commande.reference
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in modifierLivreurLivraison:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de livreur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const signalerProblemeLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    console.log('Starting problem reporting process...');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Authenticated livreur:', req.livreur);

    const { id } = req.params; // commande_id
    const { type, notes } = req.body;
    const livreurId = req.livreur?.utilisateur_id;

    // Validate required fields
    if (!type) {
      console.error('Missing problem type');
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Le type de problème est requis',
        details: {
          received_body: req.body,
          required_fields: ['type']
        }
      });
    }

    // Validate problem type
    const validProblemTypes = ['livraison_echouee', 'produit_endommage', 'adresse_incorrecte'];
    if (!validProblemTypes.includes(type)) {
      console.error('Invalid problem type:', type);
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Type de problème invalide',
        details: {
          received_type: type,
          valid_types: validProblemTypes
        }
      });
    }

    console.log('Fetching commande...');
    const commande = await Commande.findByPk(id, {
      transaction,
      include: [{
        model: Colis,
        as: 'colis'
      }]
    });

    if (!commande) {
      console.error('Commande not found:', id);
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée',
        details: {
          commande_id: id
        }
      });
    }

    // Verify the delivery person is assigned to this command
    if (commande.livreur_id !== livreurId) {
      console.error('Livreur mismatch:', {
        commande_livreur: commande.livreur_id,
        authenticated_livreur: livreurId
      });
      await transaction.rollback();
      return res.status(403).json({ 
        success: false,
        message: 'Vous n\'êtes pas assigné à cette commande',
        details: {
          commande_id: id,
          livreur_id: livreurId
        }
      });
    }

    // Determine new status based on problem type
    let newOrderStatus = 'remplacee'; // Default to replaced for failed deliveries
    let shouldCreateReplacement = true;
    let action = 'signalement_probleme';

    if (type === 'adresse_incorrecte') {
      newOrderStatus = 'annulee';
      shouldCreateReplacement = false;
    }

    console.log('Creating return record...');
    const retour = await Retour.create({
      commande_id: commande.id,
      colis_id: commande.colis?.[0]?.id || null,
      motif: type,
      type: 'livreur',
      statut: 'en_attente',
      notes_livreur: notes,
      date_demande: new Date()
    }, { transaction });

    console.log('Updating command and colis status...');
    await commande.update({
      statut: newOrderStatus,
      notes_admin: `Problème signalé: ${type} - ${notes || 'Aucun détail fourni'}`
    }, { transaction });

    if (commande.colis && commande.colis.length > 0) {
      await Promise.all(commande.colis.map(colis => 
        colis.update({
          statut: 'retourne',
          date_retour: new Date(),
          notes: `Problème signalé: ${type}`
        }, { transaction })
      ));
    }

    // Create replacement order if needed
    let replacementOrder = null;
    if (shouldCreateReplacement) {
      console.log('Creating replacement order...');
      replacementOrder = await createReplacementOrder(commande, transaction);
    }

    console.log('Creating history record...');
    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: livreurId,
      action: action,
      details: notes || `Problème signalé: ${type}`,
      ancienne_valeur: commande.statut,
      nouvelle_valeur: newOrderStatus
    }, { transaction });

    await transaction.commit();
    console.log('Problem reported successfully');

    const responseData = {
      commande_id: commande.id,
      retour_id: retour.id,
      nouveau_statut: newOrderStatus
    };

    if (replacementOrder) {
      responseData.replacement_order_id = replacementOrder.id;
    }

    // Make sure to return here to prevent any further execution
    return res.status(200).json({ 
      success: true,
      message: 'Problème signalé avec succès',
      data: responseData
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in signalerProblemeLivraison:', {
      error: error.message,
      stack: error.stack,
      request: {
        params: req.params,
        body: req.body,
        user: req.livreur
      }
    });
    
    return res.status(500).json({ 
      success: false,
      message: 'Erreur lors du signalement du problème',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

async function createReplacementOrder(originalCommande, transaction) {
  const nouvelleCommande = await Commande.create({
    client_id: originalCommande.client_id,
    adresse_id: originalCommande.adresse_id,
    prix_total: originalCommande.prix_total,
    methode_livraison: originalCommande.methode_livraison,
    methode_paiement: originalCommande.methode_paiement,
    frais_livraison: originalCommande.frais_livraison,
    remplace_commande_id: originalCommande.id,
    statut: 'en_attente'
  }, { transaction });

  // Copy articles
  const articles = await originalCommande.getCommande_articles({ transaction });
  await Promise.all(articles.map(article => 
    nouvelleCommande.addCommande_articles(article, { transaction })
  ));

  return nouvelleCommande;
}


module.exports = {
  modifierLivreurLivraison,
  signalerProblemeLivraison,

  obtenirLivraisonParId,
  obtenirLivraisonsDisponibles,
  assignerLivraison,
  obtenirLivraisonsParLivreur,
  obtenirMesLivraisons,
  obtenirMesLivraisonsAujourdhui,
  mettreAJourStatutLivraison,
  obtenirMesStatistiquesLivraison,
  updateStatus,
  obtenirLivraisonsParDate
};

