const express = require('express');
const router = express.Router();
const avisController = require('../controllers/avisController');
const { authentifier } = require('../middleware/authMiddleware');
const { Avis } = require('../models');
// Create a review (authenticated users only)
router.post('/createAvis', authentifier, avisController.createAvis);

// Get product reviews (public)
router.get('/getProductReviews/:articleId', avisController.getProductReviews);

// Delete a review (authenticated users - only their own reviews or admin)
router.delete('/deleteReview/:id', authentifier, avisController.deleteReview);
// In your backend routes (avisRoutes.js)
router.get('/getReviewCount/:productId', async (req, res) => {
  try {
    const count = await Avis.count({
      where: { article_id: req.params.productId }
    });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error getting review count:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get review stats (average rating and count) for a product
router.get('/getReviewStats/:articleId', avisController.getReviewStats);


module.exports = router;