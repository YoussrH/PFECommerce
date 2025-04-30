const cron = require('node-cron');
const axios = require('axios');

// URL de base
const BASE_URL = 'http://localhost:5000';

// Lancer l’import automatique pour l’année donnée
const lancerImportAutomatique = async (annee) => {
  try {
    await axios.get(`${BASE_URL}/evenements/importer/evenements/${annee}`);
  } catch (err) {
    console.error(`Erreur lors de l'import pour ${annee}:`, err.message);
  }
};

// Cron : chaque 1er janvier à 00:00
cron.schedule('0 0 1 1 *', () => {
  const annee = new Date().getFullYear();
  lancerImportAutomatique(annee);
}, {
  scheduled: true,
  timezone: "Africa/Tunis"
});
