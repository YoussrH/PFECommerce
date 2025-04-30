const axios = require('axios');
const { Op } = require('sequelize');
const { Evenement, Utilisateur } = require('../models');
const cron = require('node-cron');
const nodemailer = require('nodemailer');

class EvenementService {
  constructor() {
    this.aladhanClient = axios.create({
      baseURL: 'https://api.aladhan.com/v1',
      timeout: 8000
    });

    // Email transporter setup
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Schedule yearly updates
    this.scheduleYearlyUpdates();
  }

  async initialiserEvenementsAnnuel(annee) {
    try {
      const existingEvents = await this._getEventsFromDB(annee);
      if (existingEvents.length >= 6) { // 3 fixed + 3 religious (Fitr, Adha, Ramadan)
        console.log(`Using DB-cached events for ${annee}`);
        return existingEvents;
      }

      const anneeHijri = Math.floor((annee - 622) * (33 / 32));

      const [fixedEvents, eidFitr, eidAdha, ramadan] = await Promise.all([
        this._getFixedEvents(annee),
        this._getIslamicDate(anneeHijri, 10, 1, 'Eid al-Fitr'),
        this._getIslamicDate(anneeHijri, 12, 10, 'Eid al-Adha'),
        this._getRamadanDates(anneeHijri)
      ]);

      const allEvents = [...fixedEvents, eidFitr, eidAdha, ramadan];
      const results = await this._forceSaveEvents(allEvents);

      await this._sendNewEventNotifications(allEvents);

      return results.map(r => r.instance || r); // return event instances
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  async _getIslamicDate(hijriYear, hijriMonth, hijriDay, eventName) {
    const specialDates = {
      1446: {
        'Eid al-Fitr': { start: '2025-04-01', end: '2025-04-01' },
        'Eid al-Adha': { start: '2025-06-07', end: '2025-06-07' },
        'Ramadan': { start: '2025-03-01', end: '2025-03-29' }
      }
    };

    if (specialDates[hijriYear]?.[eventName]) {
      const dates = specialDates[hijriYear][eventName];
      return this._createEvent(eventName, dates.start, dates.end);
    }

    try {
      const response = await this.aladhanClient.get(
        `/hToG?date=${hijriDay}-${hijriMonth}-${hijriYear}`
      );
      const gregorianDate = this._parseApiDate(response.data.data.gregorian.date);
      return this._createEvent(eventName, gregorianDate, gregorianDate);
    } catch (error) {
      console.warn(`API failed for ${eventName}, using fallback`, error);
      return this._calculateIslamicDate(hijriYear, hijriMonth, hijriDay, eventName);
    }
  }

  async _getRamadanDates(hijriYear) {
    if (hijriYear === 1446) {
      return this._createEvent('Ramadan', '2025-03-01', '2025-03-29');
    }

    try {
      const start = await this.aladhanClient.get(`/hToG?date=01-09-${hijriYear}`);
      const dateDebut = this._parseApiDate(start.data.data.gregorian.date);

      let duration = 29;
      try {
        const endCheck = await this.aladhanClient.get(`/hToG?date=30-09-${hijriYear}`);
        if (endCheck.data.data) duration = 30;
      } catch (error) {
        console.log('Defaulting to 29-day Ramadan');
      }

      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + duration - 1);

      return this._createEvent('Ramadan', dateDebut, this._formatDate(dateFin));
    } catch (error) {
      console.warn('API failed for Ramadan, using fallback', error);
      return this._calculateRamadanDates(hijriYear);
    }
  }

  _calculateIslamicDate(hijriYear, hijriMonth, hijriDay, eventName) {
    const gregorianYear = hijriYear + 622 - Math.floor(hijriYear / 33);
    const monthOffset = Math.floor(hijriMonth * 0.97) + 1;
    const gregorianMonth = ((monthOffset - 1) % 12) + 1;

    const date = `${gregorianYear}-${String(gregorianMonth).padStart(2, '0')}-${String(hijriDay).padStart(2, '0')}`;
    return this._createEvent(eventName, date, date, true);
  }

  _calculateRamadanDates(hijriYear) {
    const debut = this._calculateIslamicDate(hijriYear, 9, 1, 'Ramadan');
    const fin = new Date(debut.date_debut);
    fin.setDate(fin.getDate() + 29);
    return {
      ...debut,
      date_fin: this._formatDate(fin)
    };
  }

  _getFixedEvents(annee) {
    return [
      {
        nom: 'Rentrée scolaire',
        date_debut: `${annee}-09-01`,
        date_fin: `${annee}-09-15`,
        type_evenement: 'Rentrée scolaire',
        recurrence: 'fixe'
      },
      {
        nom: 'Saint Valentin',
        date_debut: `${annee}-02-14`,
        date_fin: `${annee}-02-14`,
        type_evenement: 'Événement commercial',
        recurrence: 'fixe'
      },
      {
        nom: 'Nouvel Année',
        date_debut: `${annee}-01-01`,
        date_fin: `${annee}-01-01`,
        type_evenement: 'Fête nationale',
        recurrence: 'fixe'
      }
    ];
  }

  _createEvent(nom, date_debut, date_fin, estApproximatif = false) {
    return {
      nom,
      date_debut,
      date_fin,
      type_evenement: 'Fête religieuse',
      recurrence: 'variable',
      est_approximatif: estApproximatif,
      est_actif: true
    };
  }

  _parseApiDate(apiDate) {
    const [day, month, year] = apiDate.split('-');
    return `${year}-${month}-${day}`;
  }

  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  async _forceSaveEvents(events) {
    const results = [];
    for (const event of events) {
      try {
        await Evenement.destroy({
          where: {
            nom: event.nom,
            date_debut: event.date_debut
          }
        });

        const instance = await Evenement.create(event);
        results.push({
          instance,
          created: true
        });
      } catch (error) {
        console.error(`Error saving ${event.nom}:`, error);
        results.push({
          error: error.message,
          created: false
        });
      }
    }
    return results;
  }

      async _sendNewEventNotifications(events) {
        // ✅ Fetch all admins and super_admins
        const adminUsers = await Utilisateur.findAll({
          where: {
            role: {
              [Op.in]: ['admin', 'super_admin']
            }
          }
        });
      
        const adminEmails = adminUsers.map(u => u.email);
      
        if (!adminEmails.length) {
          console.warn('No admin emails found to notify.');
          return;
        }
      
        // ✅ Now send for ALL events (not just religious)
        for (const event of events) {
          try {
            await this.transporter.sendMail({
              from: process.env.EMAIL_FROM || 'system@mgme-commerce.com',
              to: adminEmails,
              subject: `[MGME] Nouvel événement: ${event.nom}`,
              html: `
                <h2>${event.nom}</h2>
                <p><strong>Dates:</strong> ${event.date_debut} au ${event.date_fin}</p>
                <p><strong>Type:</strong> ${event.type_evenement}</p>
                ${event.est_approximatif ? 
                  '<p style="color: orange;">Dates approximatives</p>' : 
                  '<p style="color: green;">Dates confirmées</p>'}
              `
            });
          } catch (error) {
            console.error(`Failed to send email for ${event.nom}:`, error);
          }
        }
      }
  
      

  async _getEventsFromDB(year) {
    return await Evenement.findAll({
      where: {
        date_debut: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`]
        }
      }
    });
  }

  scheduleYearlyUpdates() {
    cron.schedule('0 0 1 1 *', async () => {
      const year = new Date().getFullYear();
      console.log(`Auto-updating events for ${year}`);
      try {
        await this.initialiserEvenementsAnnuel(year);
        console.log(`Successfully updated events for ${year}`);
      } catch (error) {
        console.error(`Failed to auto-update events: ${error.message}`);
      }
    });
  }
}

module.exports = new EvenementService();
