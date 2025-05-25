// controllers/adminDashboardController.js
const { Op, Sequelize } = require('sequelize');
const { Commande, Article, AjustementStock } = require('../models');

async function getGeneralStats(timePeriod = 'today') {
  // Définir les dates en fonction de la période
  let startDate, endDate = new Date();
  
  switch(timePeriod) {
    case 'today':
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'this_month':
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'this_year':
      startDate = new Date(new Date().getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
  }

  // Chiffre d'affaires et nombre de ventes
  const salesStats = await Commande.findAll({
    where: {
      statut: { [Op.in]: ['payée', 'expédiée', 'livrée'] },
      createdAt: { [Op.between]: [startDate, endDate] }
    },
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('prix_total')), 'totalRevenue'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalSales']
    ],
    raw: true
  });

  // Alertes stock faible
  const lowStockAlerts = await Article.findAll({
    include: [{
      model: ArticleTaille,
      as: 'inventory',
      where: {
        quantite: { [Op.lt]: 5 } // Seuil de 5 unités
      },
      required: true
    }],
    attributes: ['id', 'nom_produit'],
    group: ['Article.id']
  });

  return {
    totalRevenue: salesStats[0]?.totalRevenue || 0,
    totalSales: salesStats[0]?.totalSales || 0,
    lowStockAlerts: lowStockAlerts.length
  };
}


// controllers/adminDashboardController.js

async function getSalesPerformance(timeRange = '7d') {
  let groupBy, dateFormat;
  let where = { statut: { [Op.in]: ['payée', 'expédiée', 'livrée'] } };
  
  // Définir la période et le regroupement
  switch(timeRange) {
    case '7d':
      where.createdAt = { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      groupBy = 'day';
      dateFormat = '%Y-%m-%d';
      break;
    case '30d':
      where.createdAt = { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      groupBy = 'day';
      dateFormat = '%Y-%m-%d';
      break;
    case '3m':
      where.createdAt = { [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
      groupBy = 'week';
      dateFormat = '%Y-%u';
      break;
    case '1y':
      where.createdAt = { [Op.gte]: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
      groupBy = 'month';
      dateFormat = '%Y-%m';
      break;
    default:
      where.createdAt = { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      groupBy = 'day';
      dateFormat = '%Y-%m-%d';
  }

  const salesData = await Commande.findAll({
    where,
    attributes: [
      [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), dateFormat), 'period'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'salesCount'],
      [Sequelize.fn('SUM', Sequelize.col('prix_total')), 'totalRevenue']
    ],
    group: ['period'],
    order: [['period', 'ASC']],
    raw: true
  });

  // Pour comparaison avec la période précédente
  const comparisonData = await getComparisonData(timeRange);

  return {
    salesData,
    comparison: comparisonData
  };
}

async function getComparisonData(timeRange) {
  let startDate, endDate, previousStartDate, previousEndDate;
  
  switch(timeRange) {
    case '7d':
      endDate = new Date();
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      endDate = new Date();
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3m':
      endDate = new Date();
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      endDate = new Date();
      startDate = new Date(new Date().getFullYear(), 0, 1);
      previousStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
      previousEndDate = new Date(startDate.getFullYear() - 1, 11, 31);
      break;
    default:
      endDate = new Date();
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      previousEndDate = new Date(startDate);
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const currentStats = await Commande.findAll({
    where: {
      statut: { [Op.in]: ['payée', 'expédiée', 'livrée'] },
      createdAt: { [Op.between]: [startDate, endDate] }
    },
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'salesCount'],
      [Sequelize.fn('SUM', Sequelize.col('prix_total')), 'totalRevenue']
    ],
    raw: true
  });

  const previousStats = await Commande.findAll({
    where: {
      statut: { [Op.in]: ['payée', 'expédiée', 'livrée'] },
      createdAt: { [Op.between]: [previousStartDate, previousEndDate] }
    },
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'salesCount'],
      [Sequelize.fn('SUM', Sequelize.col('prix_total')), 'totalRevenue']
    ],
    raw: true
  });

  return {
    current: {
      salesCount: currentStats[0]?.salesCount || 0,
      totalRevenue: currentStats[0]?.totalRevenue || 0
    },
    previous: {
      salesCount: previousStats[0]?.salesCount || 0,
      totalRevenue: previousStats[0]?.totalRevenue || 0
    }
  };
}

module.exports = {
  getGeneralStats,
  getSalesPerformance
};
