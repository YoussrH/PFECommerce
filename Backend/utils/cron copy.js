// jobs/cron.js
const cron = require('node-cron');
const axios = require('axios');

// 🧠 Change selon ton port ou domaine si nécessaire
const BASE_URL = 'http://localhost:5000';

const lancerImportAutomatique = () => {
  const annee = new Date().getFullYear();

  console.log(`📅 Cron - Tentative d'import pour ${annee}...`);

  axios.get(`${BASE_URL}/evenements/importer-evenements/${annee}`)
    .then(res => {
      console.log(`✅ Importation automatique réussie :`, res.data.message);
    })
    .catch(err => {
      console.error('❌ Erreur lors de l’importation automatique :', err.response?.data || err.message);
    });
};

// 🕐 Cron : tous les 1er janvier à 00h00
cron.schedule('0 0 1 1 *', () => {
  lancerImportAutomatique();
  console.log('🚀 Cron exécuté automatiquement (1er janvier).');
});
