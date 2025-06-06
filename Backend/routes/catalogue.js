// routes/catalogue.js
const express = require('express');
const router = express.Router();
const { Article } = require('../models');

router.get('/', async (req, res) => {
  try {
    const articles = await Article.scope([ 'avecQuantiteTotale', 'avecRemises', 'avecDetails']).findAll();
    res.json(articles);
  } catch (error) {
    console.error('Erreur lors de la récupération du catalogue :', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération du catalogue.' });
  }
});

module.exports = router;
