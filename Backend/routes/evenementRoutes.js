const express = require('express');
const router = express.Router();
const { importerEvenements ,getEvenements} = require('../controllers/evenementController');

router.get('/importer-evenements/:annee', importerEvenements);
router.get('/', getEvenements); 
module.exports = router;
