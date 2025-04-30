const express = require('express');
const router = express.Router();
const { importerEvenements } = require('../controllers/evenementController');

router.get('/importer-evenements/:annee', importerEvenements);
module.exports = router;
