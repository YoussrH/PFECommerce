// controllers/CouponController.js
const LoyaltyService = require('../services/loyaltyService');

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
  }
};