// routes/coupons.js
const router = require('express').Router();
const CouponController = require('../controllers/CouponController');
const { authentifier, verifierAdmin } = require('../middleware/authMiddleware');
// Récupérer les coupons valides du client
router.get('/mes-coupons', 
  authentifier, 
  CouponController.getUserCoupons
);

// Valider un coupon (pour le checkout)
router.post('/valider', 
  authentifier,
  CouponController.validateCoupon
);
router.get('/overview', authentifier, CouponController.getCouponStatistics);

module.exports = router;