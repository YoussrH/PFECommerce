//controller/expeditionController.js
const { Op, Sequelize } = require('sequelize');
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

const STATUTS_COLIS = {
  PREPARATION: 'en_preparation',
  EXPEDIE: 'expedie',
  LIVRE: 'livree'
};

// Generate QR Code for package
const generateQRCode = async (data) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (err) {
    console.error('QR Code generation error:', err);
    return null;
  }
};

// Expedition tracking
const suivreExpeditions = async (req, res) => {
    try {
      const { page = 1, limit = 10, statut, livreur_id, date_debut, date_fin } = req.query;
      const offset = (page - 1) * limit;
  
      const whereClause = {
        statut: ['expediee', 'livree'] // Order status filter
      };
  
      // Package status filter (now checking Colis table)
      const colisWhere = {};
      if (statut && statut !== 'all') {
        colisWhere.statut = statut === 'Préparée' ? 'preparation' : 
                           statut === 'En route' ? 'expedie' :
                           statut === 'Livrée' ? 'livre' :
                           statut === 'Échec de livraison' ? 'echec' : statut;
      }
  
      if (livreur_id) {
        colisWhere.livreur_id = livreur_id;
      }
  
      if (date_debut && date_fin) {
        colisWhere.date_expedition = {
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
          { model: Adresse, as: 'adresse' },
          {
            model: Colis,
            as: 'colis',
            where: colisWhere,
            required: true, // Only include orders that have matching packages
            attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison']
          }
        ],
        order: [[{ model: Colis, as: 'colis' }, 'date_expedition', 'DESC']],
        distinct: true, // Important for correct count with joins
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
  
      // Transform the data to match frontend expectations
      const expeditions = rows.map(commande => {
        // Get the most recent package for display purposes
        const recentColis = commande.colis[0];
        
        return {
          ...commande.toJSON(),
          statut_expedition: mapColisStatusToDisplay(recentColis.statut),
          date_expedition: recentColis.date_expedition,
          date_livraison: recentColis.date_livraison
        };
      });
  
      res.status(200).json({
        success: true,
        data: {
          expeditions,
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
  
  // Helper function to map package status to display text
  const mapColisStatusToDisplay = (colisStatus) => {
    switch(colisStatus) {
      case 'preparation': return 'Préparée';
      case 'expedie': return 'En route';
      case 'livree': return 'Livrée';
      case 'echec': return 'Échec de livraison';
      default: return colisStatus;
    }
  };

  const mettreAJourStatutExpedition = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params; // This should be colis ID now
      const { statut_expedition, notes } = req.body;
      const utilisateurId = req.utilisateur.id;
  
      // Map display status to colis status
      const colisStatut = statut_expedition === 'Préparée' ? 'preparation' :
                         statut_expedition === 'En route' ? 'expedie' :
                         statut_expedition === 'Livrée' ? 'livree' :
                         statut_expedition === 'Échec de livraison' ? 'echec' : statut_expedition;
  
      const colis = await Colis.findByPk(id, {
        transaction,
        include: [
          {
            model: Commande,
            as: 'commande'
          },
          {
            model: Livreur,
            as: 'livreur',
            include: [{ model: Utilisateur, as: 'utilisateur' }]
          }
        ]
      });
  
      if (!colis) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Colis non trouvé'
        });
      }
  
      const ancienStatut = colis.statut;
      const updateData = { statut: colisStatut };
  
      // Handle status-specific updates
      if (colisStatut === 'expedie') {
        updateData.date_expedition = new Date();
      } else if (colisStatut === 'livree') {
        updateData.date_livraison = new Date();
      }
  
      await colis.update(updateData, { transaction });
  
      // Update order status if all packages are delivered
      if (colisStatut === 'livree') {
        const remainingColis = await Colis.count({
          where: { 
            commande_id: colis.commande_id,
            statut: { [Op.not]: 'livree' }
          },
          transaction
        });
  
        if (remainingColis === 0) {
          await Commande.update(
            { statut: 'livree' },
            { where: { id: colis.commande_id }, transaction }
          );
        }
      }
  
      await CommandeHistorique.create({
        commande_id: colis.commande_id,
        utilisateur_id: utilisateurId,
        action: 'maj_statut_colis',
        ancienne_valeur: ancienStatut,
        nouvelle_valeur: colisStatut,
        details: notes || `Statut du colis mis à jour`
      }, { transaction });
  
      await transaction.commit();
  
      res.status(200).json({ 
        success: true,
        message: 'Statut du colis mis à jour',
        data: { 
          ancien_statut: mapColisStatusToDisplay(ancienStatut),
          nouveau_statut: statut_expedition,
          livreur: colis.livreur 
        }
      });
    } catch (error) {
      await transaction.rollback();
      const errorInfo = debugError('mettreAJourStatutExpedition', error, {
        colisId: req.params.id,
        body: req.body
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur lors de la mise à jour du statut du colis',
        debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
      });
    }
  };

  const listerColis = async (req, res) => {
    try {
      const { page = 1, limit = 10, statut, commande_id, livreur_id } = req.query;
      const offset = (page - 1) * limit;
  
      const whereClause = {};
      if (statut && statut !== 'all') whereClause.statut = statut;
      if (commande_id) whereClause.commande_id = commande_id;
      if (livreur_id) whereClause.livreur_id = livreur_id;
  
      const { count, rows } = await Colis.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Commande,
            as: 'commande',
            attributes: ['id', 'reference', 'created_at'],
            include: [{
              model: Client,
              as: 'client',
              attributes: ['utilisateur_id'], // Only include utilisateur_id as it's the primary key
              include: [{
                model: Utilisateur,
                as: 'utilisateur',
                attributes: ['id', 'nom', 'prenom', 'email']
              }]
            }]
          },
          {
            model: Livreur,
            as: 'livreur',
            attributes: ['utilisateur_id'], // Only include utilisateur_id as it's the primary key
            include: [{
              model: Utilisateur,
              as: 'utilisateur',
              attributes: ['id', 'nom', 'prenom']
            }]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison', 'created_at', 'transporteur', 'qr_code_data']
      });
  
      res.status(200).json({
        success: true,
        data: {
          colis: rows,
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          statuts: Object.values(STATUTS_COLIS)
        }
      });
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching packages',
        error: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      });
    }
  };
  // Create/update package
  const gererColis = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { commande_id, livreur_id } = req.body;
      const utilisateurId = req.utilisateur.id;
  
      if (id) {
        // Update existing package
        const colis = await Colis.findByPk(id, { transaction });
        if (!colis) {
          await transaction.rollback();
          return res.status(404).json({ 
            success: false,
            message: 'Package not found'
          });
        }
  
        await colis.update({
          livreur_id,
          statut: req.body.statut || colis.statut
        }, { transaction });
  
        await transaction.commit();
        return res.status(200).json({ 
          success: true,
          message: 'Package updated successfully',
          data: colis
        });
      } else {
        // Create new package
        const colis = await Colis.create({
          commande_id,
          livreur_id,
          statut: STATUTS_COLIS.PREPARATION
        }, { transaction });
  
        await transaction.commit();
        return res.status(201).json({ 
          success: true,
          message: 'Package created successfully',
          data: colis
        });
      }
    } catch (error) {
      await transaction.rollback();
      console.error('Error managing package:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error managing package'
      });
    }
  };

// List returns
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
              },
              {
                model: Colis,
                as: 'colis',
                attributes: ['id', 'numero_suivi']
              }
            ]
          },
          {
            model: Utilisateur,
            as: 'traite_par_admin',  // Changed from 'traite_par_utilisateur' to match association
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

// Process return
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
          },
          {
            model: Utilisateur,
            as: 'traite_par_admin',  // Ensure this matches your association
            attributes: ['id', 'nom', 'prenom', 'email']
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


  
  const mettreAJourStatutColis = async (req, res) => {
    let transaction;
    try {
      const { id } = req.params;
      const { statut } = req.body;
      const utilisateurId = req.utilisateur.id;
  
      transaction = await sequelize.transaction();
  
      const colis = await Colis.findByPk(id, { 
        transaction,
        include: [Commande]
      });
  
      if (!colis) {
        await transaction.rollback();
        return res.status(404).json({ 
          success: false,
          message: 'Colis non trouvé'
        });
      }
  
      const ancienStatut = colis.statut;
      const updateData = { statut };
  
      // Handle status-specific updates
      if (statut === 'expedie') {
        updateData.date_expedition = new Date();
        
        // Update order status if not already expediee
        if (colis.commande.statut !== 'expediee') {
          await colis.commande.update({ statut: 'expediee' }, { transaction });
        }
      } else if (statut === 'livree') {
        updateData.date_livraison = new Date();
      }
  
      await colis.update(updateData, { transaction });
  
      // Log history
      await CommandeHistorique.create({
        commande_id: colis.commande_id,
        utilisateur_id: utilisateurId,
        action: 'maj_statut_colis',
        ancienne_valeur: ancienStatut,
        nouvelle_valeur: statut,
        details: `Statut colis changé de ${ancienStatut} à ${statut}`
      }, { transaction });
  
      await transaction.commit();
  
      res.status(200).json({
        success: true,
        message: 'Statut colis mis à jour',
        data: colis
      });
  
    } catch (error) {
      if (transaction) await transaction.rollback();
      
      const errorInfo = debugError('mettreAJourStatutColis', error, {
        colisId: req.params.id,
        body: req.body
      });
      res.status(500).json({ 
        success: false,
        message: 'Erreur mise à jour statut colis',
        debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
      });
    }
  };
  
  const scannerQRCodeColis = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { code } = req.body;
      const utilisateurId = req.utilisateur?.id || null;
  
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'QR code invalide ou manquant.'
        });
      }
  
      // Extract colis ID from the QR code (expected format: colis:<id>)
      const match = code.match(/^colis:(\d+)$/);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'QR code non reconnu.'
        });
      }
  
      const colisId = match[1];
  
      const colis = await Colis.findByPk(colisId, {
        transaction,
        include: [
          {
            model: Commande,
            as: 'commande'
          },
          {
            model: Livreur,
            as: 'livreur',
            include: [{ model: Utilisateur, as: 'utilisateur' }]
          }
        ]
      });
  
      if (!colis) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Colis introuvable.'
        });
      }
  
      if (colis.statut === 'livree') {
        await transaction.rollback();
        return res.status(200).json({
          success: true,
          message: 'Ce colis a déjà été livré.',
          data: { colis }
        });
      }
  
      const ancienStatut = colis.statut;
      await colis.update({
        statut: 'livree',
        date_livraison: new Date()
      }, { transaction });
  
      // If all colis in this order are delivered, update Commande status
      const nonDelivered = await Colis.count({
        where: {
          commande_id: colis.commande_id,
          statut: { [Op.not]: 'livree' }
        },
        transaction
      });
  
      if (nonDelivered === 0) {
        await Commande.update(
          { statut: 'livree' },
          { where: { id: colis.commande_id }, transaction }
        );
      }
  
      await CommandeHistorique.create({
        commande_id: colis.commande_id,
        utilisateur_id: utilisateurId,
        action: 'livraison_via_qr',
        ancienne_valeur: ancienStatut,
        nouvelle_valeur: 'livree',
        details: 'Livraison confirmée via QR code.'
      }, { transaction });
  
      // Optional: notify client or livreur here
  
      await transaction.commit();
  
      res.status(200).json({
        success: true,
        message: 'Colis marqué comme livré.',
        data: {
          colis_id: colis.id,
          nouveau_statut: 'Livrée',
          date_livraison: colis.date_livraison
        }
      });
    } catch (error) {
      await transaction.rollback();
      const errorInfo = debugError('scannerQRCodeColis', error, { body: req.body });
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du QR code.',
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
  traiterRetour,
mettreAJourStatutColis,
    scannerQRCodeColis
};