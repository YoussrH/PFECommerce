const express = require('express');
const router = express.Router();
const evenementService = require('../services/evenementService');
const { Evenement } = require('../models');  // Consistent with your service
// Initialize events for a year
router.post('/initialiser/:annee', async (req, res) => {
  try {
    const { annee } = req.params;
    const results = await evenementService.initialiserEvenementsAnnuel(annee);
    
    const newEvents = results.filter(r => r.created).length;
    
    res.json({
      success: true,
      message: `${newEvents} new events initialized for ${annee}`,
      details: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize events',
      error: error.message
    });
  }
});

// List all events
router.get('/', async (req, res) => {
    try {
      const evenements = await Evenement.findAll({ 
        order: [['date_debut', 'ASC']]
      });
      res.json(evenements);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Error fetching events'
      });
    }
  });

module.exports = router;