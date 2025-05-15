// routes/coupons.js
const router = require('express').Router();
const CouponController = require('../controllers/CouponController');

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

module.exports = router;