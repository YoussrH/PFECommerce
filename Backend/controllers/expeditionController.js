const { Op, Sequelize } = require('sequelize');
const { isUUID } = require('validator');
const QRCode = require('qrcode');
const db = require('../models');
const sequelize = db.sequelize;

const {
  Commande,
  Client,
  Adresse,
  Livreur,
  Utilisateur,
  CommandeHistorique,
  Colis,
  Retour
} = db;

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

const STATUTS_EXPEDITION = {
  PREPAREE: 'Préparée',
  EN_ROUTE: 'En route',
  LIVREE: 'Livrée',
  ECHEC: 'Échec de livraison'
};

const suivreExpeditions = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, livreur_id, date_debut, date_fin } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      statut: ['expediee', 'livree']
    };

    if (statut && statut !== 'all') {
      whereClause.statut_expedition = statut;
    }

    if (livreur_id) {
      whereClause.livreur_id = livreur_id;
    }

    if (date_debut && date_fin) {
      whereClause.date_expedition = {
        [Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    }

    const { count, rows } = await Commande.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        {
          model: Livreur,
          as: 'livreur',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ],
      order: [['date_expedition', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        expeditions: rows,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        statuts: Object.values(STATUTS_EXPEDITION)
      }
    });
  } catch (error) {
    const errorInfo = debugError('suivreExpeditions', error, { query: req.query });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des expéditions',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const mettreAJourStatutExpedition = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { statut_expedition, notes } = req.body;
    const utilisateurId = req.utilisateur.id;

    if (!Object.values(STATUTS_EXPEDITION).includes(statut_expedition)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Statut d\'expédition invalide',
        statuts_valides: Object.values(STATUTS_EXPEDITION)
      });
    }

    const commande = await Commande.findByPk(id, { 
      transaction,
      include: [
        {
          model: Livreur,
          as: 'livreur',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
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

    if (!['expediee', 'livree'].includes(commande.statut)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'La commande doit être expédiée pour mettre à jour le statut d\'expédition'
      });
    }

    const ancienStatut = commande.statut_expedition;
    await commande.update({ statut_expedition }, { transaction });

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: 'maj_statut_expedition',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: statut_expedition,
      details: notes || `Statut d'expédition mis à jour`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Statut d\'expédition mis à jour',
      data: { 
        ancien_statut: ancienStatut,
        nouveau_statut: statut_expedition,
        livreur: commande.livreur 
      }
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('mettreAJourStatutExpedition', error, {
      commandeId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour du statut d\'expédition',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const listerColis = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, commande_id } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (statut && statut !== 'all') whereClause.statut = statut;
    if (commande_id) whereClause.commande_id = commande_id;

    const { count, rows } = await Colis.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Commande,
          as: 'commande',
          include: [
            {
              model: Client,
              as: 'client',
              include: [{ model: Utilisateur, as: 'utilisateur' }]
            }
          ]
        },
        {
          model: Livreur,
          as: 'livreur',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        colis: rows,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    const errorInfo = debugError('listerColis', error, { query: req.query });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des colis',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const gererColis = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { commande_id, poids, dimensions, contenu, livreur_id } = req.body;
    const utilisateurId = req.utilisateur.id;

    const commande = await Commande.findByPk(commande_id, { transaction });
    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée'
      });
    }

    let colis;
    if (id) {
      colis = await Colis.findByPk(id, { transaction });
      if (!colis) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Colis non trouvé'
        });
      }

      await colis.update({
        poids,
        dimensions,
        contenu,
        livreur_id
      }, { transaction });
    } else {
      colis = await Colis.create({
        commande_id,
        poids,
        dimensions,
        contenu,
        livreur_id,
        statut: 'En préparation',
        code_colis: `COL-${Date.now().toString(36).toUpperCase()}`
      }, { transaction });
    }

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: id ? 'modification_colis' : 'creation_colis',
      details: id ? 'Colis modifié' : 'Colis créé'
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: id ? 'Colis mis à jour avec succès' : 'Colis créé avec succès',
      data: colis
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('gererColis', error, {
      colisId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: `Erreur lors de ${req.params.id ? 'la modification' : 'la création'} du colis`,
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const listerRetours = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (statut && statut !== 'all') whereClause.statut = statut;
    if (type && type !== 'all') whereClause.type = type;

    const { count, rows } = await Retour.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Commande,
          as: 'commande',
          include: [
            {
              model: Client,
              as: 'client',
              include: [{ model: Utilisateur, as: 'utilisateur' }]
            }
          ]
        },
        {
          model: Utilisateur,
          as: 'traite_par_utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        retours: rows,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    const errorInfo = debugError('listerRetours', error, { query: req.query });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des retours',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const traiterRetour = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { decision, motif_refus, notes } = req.body;
    const utilisateurId = req.utilisateur.id;

    const retour = await Retour.findByPk(id, { 
      transaction,
      include: [
        {
          model: Commande,
          as: 'commande',
          include: [
            {
              model: Client,
              as: 'client',
              include: [{ model: Utilisateur, as: 'utilisateur' }]
            }
          ]
        }
      ]
    });

    if (!retour) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Retour non trouvé'
      });
    }

    if (retour.statut !== 'En cours') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Ce retour a déjà été traité'
      });
    }

    let nouveauStatut, action;
    if (decision === 'accepter') {
      nouveauStatut = 'Accepté';
      action = 'retour_accepte';
      
      if (retour.type === 'Remplacement') {
        await Commande.update(
          { statut: 'remplacee' },
          { where: { id: retour.commande_id }, transaction }
        );
      }
    } else {
      nouveauStatut = 'Refusé';
      action = 'retour_refuse';
    }

    await retour.update({
      statut: nouveauStatut,
      motif_refus: decision === 'refuser' ? motif_refus : null,
      notes_admin: notes || null,
      date_traitement: new Date(),
      traite_par: utilisateurId
    }, { transaction });

    await CommandeHistorique.create({
      commande_id: retour.commande_id,
      utilisateur_id: utilisateurId,
      action,
      details: `Retour ${nouveauStatut.toLowerCase()}: ${notes || ''}`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: `Retour ${nouveauStatut.toLowerCase()} avec succès`,
      data: retour
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('traiterRetour', error, {
      retourId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du traitement du retour',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

module.exports = {
  suivreExpeditions,
  mettreAJourStatutExpedition,
  listerColis,
  gererColis,
  listerRetours,
  traiterRetour
};