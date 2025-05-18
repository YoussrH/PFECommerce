// controllers/factureController.js
const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const Commande = db.Commande;
const Facture = db.Facture;
const Client = db.Client;
const Utilisateur = db.Utilisateur;
const Adresse = db.Adresse;
const fs = require('fs');
const path = require('path');

// Get all invoices with filters
/* const listerFactures = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, search, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Status filter
    if (statut && statut !== 'tous') {
      whereClause.statut = statut;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date_emission = {};
      if (dateFrom) whereClause.date_emission[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.date_emission[Op.lte] = new Date(dateTo);
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { '$commande.reference$': { [Op.iLike]: `%${search}%` } },
        { numero: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(
          Sequelize.fn('concat', Sequelize.col('commande.client.utilisateur.prenom'), ' ', Sequelize.col('commande.client.utilisateur.nom')),
          { [Op.iLike]: `%${search}%` }
        )
      ];
    }

    const { count, rows } = await Facture.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Commande,
          as: 'commande',
          include: [
            { 
              model: Client,
              as: 'client',
              include: [{ 
                model: Utilisateur, 
                as: 'utilisateur',
                attributes: ['id', 'prenom', 'nom']
              }]
            }
          ]
        }
      ],
      order: [['date_emission', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response data
    const factures = rows.map(facture => ({
      id: facture.numero,
      commande_ref: facture.commande.reference,
      client: `${facture.commande.client.utilisateur.prenom} ${facture.commande.client.utilisateur.nom}`,
      montant: facture.montant_ttc,
      date: facture.date_emission.toISOString().split('T')[0],
      statut: facture.commande.statut,
      fichier_url: facture.fichier_url,
      est_payee: facture.est_payee
    }));

    // Get stats for cards
    const totalFactures = await Facture.count();
    const montantTotal = await Facture.sum('montant_ttc');
    const totalEnAttente = await Facture.count({ 
      where: { est_payee: false } 
    });

    res.status(200).json({
      success: true,
      data: {
        factures,
        stats: {
          totalFactures,
          montantTotal: montantTotal || 0,
          totalEnAttente
        },
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in listerFactures:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des factures'
    });
  }
}; */

// controllers/factureController.js
const listerFactures = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, search, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    const commandeWhere = {};
    
    // Status filter - now checking commande.statut instead of facture.statut
    if (statut && statut !== 'tous') {
      commandeWhere.statut = statut;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date_emission = {};
      if (dateFrom) whereClause.date_emission[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.date_emission[Op.lte] = new Date(dateTo);
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { '$commande.reference$': { [Op.iLike]: `%${search}%` } },
        { numero: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(
          Sequelize.fn('concat', Sequelize.col('commande.client.utilisateur.prenom'), ' ', 
          Sequelize.col('commande.client.utilisateur.nom')),
          { [Op.iLike]: `%${search}%` }
        )
      ];
    }

    const { count, rows } = await Facture.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Commande,
          as: 'commande',
          where: commandeWhere, // Apply commande filters here
          include: [
            { 
              model: Client,
              as: 'client',
              include: [{ 
                model: Utilisateur, 
                as: 'utilisateur',
                attributes: ['id', 'prenom', 'nom']
              }]
            }
          ]
        }
      ],
      order: [['date_emission', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get stats
    const totalFactures = await Facture.count();
    const montantTotal = await Facture.sum('montant_ttc');
    const totalEnAttente = await Facture.count({ 
      where: { est_payee: false } 
    });

    // Format response
    const factures = rows.map(facture => ({
      id: facture.numero,
      commande_ref: facture.commande.reference,
      client: `${facture.commande.client.utilisateur.prenom} ${facture.commande.client.utilisateur.nom}`,
      montant: facture.montant_ttc,
      date: facture.date_emission.toISOString().split('T')[0],
      statut: facture.commande.statut, // Get status from commande
      fichier_url: facture.fichier_url,
      est_payee: facture.est_payee
    }));

    res.status(200).json({
      success: true,
      data: {
        factures,
        stats: {
          totalFactures,
          montantTotal: montantTotal || 0,
          totalEnAttente
        },
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in listerFactures:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur récupération factures',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const downloadFacture = async (req, res) => {
  try {
    const { id } = req.params;
    
    const facture = await Facture.findOne({
      where: { numero: id },
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
            { model: Adresse, as: 'adresse' }
          ]
        }
      ]
    });

    if (!facture) {
      return res.status(404).json({ 
        success: false,
        message: 'Facture non trouvée'
      });
    }

    const filePath = path.join(__dirname, '../../public', facture.fichier_url);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'Fichier facture non trouvé'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${facture.numero}.pdf`);
    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error('Error in downloadFacture:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du téléchargement de la facture'
    });
  }
};
module.exports = {
    listerFactures,
    downloadFacture
    };