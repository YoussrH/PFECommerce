// controllers/CouponController.js
const LoyaltyService = require('../services/loyaltyService');
const { Coupon, Client } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models').sequelize;

module.exports = {
  async getUserCoupons(req, res) {
    try {
      const coupons = await Coupon.findAll({
        where: {
          client_id: req.utilisateur.id,
          is_used: false,
          expires_at: { [Op.gt]: new Date() }
        }
      });
      res.json(coupons);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async validateCoupon(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { code } = req.body;
      const coupon = await LoyaltyService.validateCoupon(
        code, 
        req.utilisateur.id,
        transaction
      );
      await transaction.commit();
      res.json(coupon);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },

async getCouponStatistics(req, res) {
  try {
    // Overall coupon statistics
    const overallStats = await Coupon.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Coupon.id')), 'totalCoupons'],
        [sequelize.fn('SUM', sequelize.col('Coupon.value')), 'totalCreatedValue'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "Coupon"."is_used" THEN "Coupon"."value" ELSE 0 END')), 'usedValue'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN NOT "Coupon"."is_used" THEN 1 END')), 'activeCouponsCount'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN NOT "Coupon"."is_used" THEN "Coupon"."value" ELSE 0 END')), 'activeCouponsValue']
      ],
      raw: true
    });

    // Statistics per client (with client details)
    const clientStats = await Coupon.findAll({
      attributes: [
        'client_id',
        [sequelize.fn('COUNT', sequelize.col('Coupon.id')), 'totalCoupons'],
        [sequelize.fn('SUM', sequelize.col('Coupon.value')), 'totalPoints'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN "Coupon"."is_used" THEN "Coupon"."value" ELSE 0 END')), 'usedPoints'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN NOT "Coupon"."is_used" THEN "Coupon"."value" ELSE 0 END')), 'activePoints']
      ],
      include: [{
        model: Client,
        as: 'client',
        attributes: ['utilisateur_id'],
        include: [{
          association: 'utilisateur',
          attributes: ['nom', 'prenom', 'email']
        }]
      }],
      group: ['Coupon.client_id', 'client.utilisateur_id', 'client->utilisateur.id'],
      raw: true,
      nest: true
    });

    res.json({
      overall: overallStats[0],
      byClient: clientStats
    });
  } catch (error) {
    console.error('Error in getCouponStatistics:', error);
    res.status(500).json({ error: error.message });
  }
}

  
};

