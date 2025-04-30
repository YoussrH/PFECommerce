const axios = require('axios');
const { Op } = require('sequelize');
const { Evenement } = require('../models');

const VILLE = 'Tunis';
const PAYS = 'TN';
const METHODE_CALCUL = 3;

const getDateIslamique = async (date) => {
  try {
    const jsDate = new Date(date);
    const day = String(jsDate.getDate()).padStart(2, '0');
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const year = jsDate.getFullYear();

    const formattedDate = `${day}-${month}-${year}`;
    const response = await axios.get(`http://api.aladhan.com/v1/gToH/${formattedDate}?adjustment=0`);
    const hijri = response.data?.data?.hijri;

    if (!hijri || !hijri.date || !hijri.month?.number || !hijri.day) {
      console.warn(`⚠️ Invalid Hijri data for date ${date}:`, hijri);
      return null;
    }

    return {
      day: parseInt(hijri.day),
      month: hijri.month.number,
      year: hijri.year
    };
  } catch (error) {
    console.error(`Error fetching Islamic date (${date}):`, error.message);
    return null;
  }
};

const ajouterEvenement = async (evenement) => {
  try {
    const existingEvent = await Evenement.findOne({
      where: {
        nom: evenement.nom,
        annee: evenement.annee
      }
    });

    if (existingEvent) {
      existingEvent.date_debut = evenement.date_debut;
      existingEvent.date_fin = evenement.date_fin;
      existingEvent.type_evenement = evenement.type_evenement;
      existingEvent.recurrence = evenement.recurrence;
      await existingEvent.save();
      return existingEvent;
    } else {
      const newEvent = await Evenement.create(evenement);
      return newEvent;
    }
  } catch (error) {
    console.error("Error adding/updating event:", error.message);
    throw error;
  }
};

const importerEvenements = async (req, res) => {
  const annee = parseInt(req.params.annee);
  const eventsCree = [];

  try {
    const evenementsFixes = [
      {
        nom: 'Nouvel An',
        date_debut: `${annee}-01-01`,
        date_fin: `${annee}-01-01`,
        type_evenement: 'Fête nationale',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      },
      {
        nom: 'Saint Valentin',
        date_debut: `${annee}-02-14`,
        date_fin: `${annee}-02-14`,
        type_evenement: 'Événement commercial',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      },
      {
        nom: 'Rentrée scolaire',
        date_debut: `${annee}-09-01`,
        date_fin: `${annee}-09-15`,
        type_evenement: 'Rentrée scolaire',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      }
    ];

    for (const evt of evenementsFixes) {
      try {
        const created = await ajouterEvenement(evt);
        eventsCree.push(created);
      } catch (error) {
        console.error(`Failed to add fixed event ${evt.nom}:`, error.message);
      }
    }

    const debut = new Date(`${annee}-01-01`);
    const fin = new Date(`${annee}-12-31`);
    const jours = Math.floor((fin - debut) / (1000 * 60 * 60 * 24)) + 1;

    let ramadanAjoute = false;
    let aidFitrAjoute = false;
    let aidAdhaAjoute = false;

    for (let i = 0; i < jours; i++) {
      const date = new Date(debut);
      date.setDate(date.getDate() + i);

      const dateStr = date.toISOString().split('T')[0];
      const hijri = await getDateIslamique(dateStr);

      if (!hijri) continue;

      if (!ramadanAjoute && hijri.month === 9 && hijri.day === 1) {
        try {
          const evt = await ajouterEvenement({
            nom: 'Début Ramadan',
            date_debut: dateStr,
            date_fin: dateStr,
            type_evenement: 'Fête religieuse',
            recurrence: 'variable',
            annee: annee,
            est_actif: false
          });
          eventsCree.push(evt);
          ramadanAjoute = true;
        } catch (error) {
          console.error('Failed to add Ramadan start:', error.message);
        }
      }

      if (!aidFitrAjoute && hijri.month === 10 && hijri.day === 1) {
        try {
          const evt = await ajouterEvenement({
            nom: 'Aïd al-Fitr',
            date_debut: dateStr,
            date_fin: dateStr,
            type_evenement: 'Fête religieuse',
            recurrence: 'variable',
            annee: annee,
            est_actif: false
          });
          eventsCree.push(evt);
          aidFitrAjoute = true;
        } catch (error) {
          console.error('Failed to add Eid al-Fitr:', error.message);
        }
      }

      if (!aidAdhaAjoute && hijri.month === 12 && hijri.day === 10) {
        try {
          const evt = await ajouterEvenement({
            nom: 'Aïd al-Adha',
            date_debut: dateStr,
            date_fin: dateStr,
            type_evenement: 'Fête religieuse',
            recurrence: 'variable',
            annee: annee,
            est_actif: false
          });
          eventsCree.push(evt);
          aidAdhaAjoute = true;
        } catch (error) {
          console.error('Failed to add Eid al-Adha:', error.message);
        }
      }
    }

    res.status(200).json({
      message: `Events for year ${annee} imported successfully.`,
      eventsCreated: eventsCree
    });
  } catch (error) {
    console.error("Error importing events:", error);
    res.status(500).json({ 
      error: "An error occurred while importing events.",
      details: error.message 
    });
  }
};

module.exports = {
  importerEvenements
};