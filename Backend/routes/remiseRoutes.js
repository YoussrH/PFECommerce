// routes/remiseRoutes.js
const express = require('express');
const router = express.Router();
const remiseController = require('../controllers/remiseController');
const { authentifier, verifierAdmin } = require("../middleware/authMiddleware");

// Create a new discount
router.post('/createRemise',  authentifier, verifierAdmin,remiseController.createRemise);

// Get all active discounts
router.get('/getActiveRemises', authentifier, verifierAdmin, remiseController.getActiveRemises);
router.get('/', authentifier, remiseController.getAllRemises);
// Apply discount to articles
router.post('/:remiseId/applyRemiseToArticles', authentifier, verifierAdmin, remiseController.applyRemiseToArticles);

// Remove discount from articles
router.post('/:remiseId/removeRemiseFromArticles', authentifier, verifierAdmin, remiseController.removeRemiseFromArticles);

// Update a discount
router.put('/updateRemise/:id',  authentifier, verifierAdmin,remiseController.updateRemise);

// Delete a discount
router.delete('/deleteRemise/:id',  authentifier, verifierAdmin,remiseController.deleteRemise);
// Add this route before the other routes
router.get('/:id', authentifier, verifierAdmin, remiseController.getRemiseById);

// The rest of your existing routes...
module.exports = router;