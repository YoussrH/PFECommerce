// controllers/paiementController.js
const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const Commande = db.Commande;
const Facture = db.Facture;
const Client = db.Client;
const Utilisateur = db.Utilisateur;

const listerPaiements = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, search, dateFrom, dateTo } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      paiement_recu: true // Only show paid orders
    };

    // Status filter
    if (statut && statut !== 'tous') {
      whereClause.statut = statut;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.date_paiement = {};
      if (dateFrom) whereClause.date_paiement[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.date_paiement[Op.lte] = new Date(dateTo);
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { reference: { [Op.iLike]: `%${search}%` } },
        Sequelize.where(
          Sequelize.fn('concat', Sequelize.col('client.utilisateur.prenom'), ' ', Sequelize.col('client.utilisateur.nom')),
          { [Op.iLike]: `%${search}%` }
        )
      ];
    }

    const { count, rows } = await Commande.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Client,
          as: 'client',
          include: [{ 
            model: Utilisateur, 
            as: 'utilisateur',
            attributes: ['id', 'prenom', 'nom']
          }]
        },
        {
          model: Facture,
          as: 'facture',
          attributes: ['id', 'numero', 'date_emission']
        }
      ],
      order: [['date_paiement', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format response data
    const paiements = rows.map(commande => ({
      id: `PAY-${commande.reference}`,
      commande_ref: commande.reference,
      client: `${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`,
      montant: commande.prix_total,
      methode: commande.methode_paiement,
      date_paiement: commande.date_paiement.toISOString().split('T')[0],
      statut: commande.statut,
      facture_numero: commande.facture?.numero
    }));

    // Get stats for cards
    const totalPaiements = await Commande.count({ 
      where: { paiement_recu: true } 
    });
    
    const montantTotal = await Commande.sum('prix_total', { 
      where: { paiement_recu: true } 
    });
    
    const totalRetournes = await Commande.count({ 
      where: { 
        paiement_recu: true,
        statut: 'retourne' 
      } 
    });

    res.status(200).json({
      success: true,
      data: {
        paiements,
        stats: {
          totalPaiements,
          montantTotal: montantTotal || 0,
          totalRetournes
        },
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in listerPaiements:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des paiements'
    });
  }
};

// Get payment methods stats
const getPaymentMethodsStats = async (req, res) => {
  try {
    const stats = await Commande.findAll({
      attributes: [
        'methode_paiement',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('prix_total')), 'total']
      ],
      where: { paiement_recu: true },
      group: ['methode_paiement']
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getPaymentMethodsStats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};
module.exports = {
    listerPaiements,
    getPaymentMethodsStats
    };