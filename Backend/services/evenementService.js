// services/EvenementService.js
const axios = require('axios');
const { Op } = require('sequelize');
const { Evenement, Utilisateur, Remise } = require('../models'); // Import Remise model
const cron = require('node-cron');
const nodemailer = require('nodemailer');

const ALADHAN_BASE_URL = 'https://api.aladhan.com/v1';
const VILLE = 'Tunis'; // Default city for Aladhan API
const PAYS = 'TN';     // Default country for Aladhan API
const METHODE_CALCUL = 3; // Calculation method for Aladhan API

class EvenementService {
  constructor() {
    this.aladhanClient = axios.create({
      baseURL: ALADHAN_BASE_URL,
      timeout: 10000 // Increased timeout for API calls
    });

    // Email transporter setup
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Schedule yearly updates for events (e.g., on Jan 1st at midnight)
    this.scheduleYearlyUpdates();
    // Schedule daily check for event activation/deactivation
    this.scheduleDailyEventStatusUpdate();
  }

  // --- Core Event Initialization & Update Logic ---

  /**
   * Initializes all events for a given year, including fixed and religious events.
   * Fetches from DB cache first, then from APIs with fallbacks.
   * @param {number} annee - The year to initialize events for.
   * @returns {Promise<Array<Object>>} - An array of created/updated event instances.
   */
  async initialiserEvenementsAnnuel(annee) {
    try {
      const existingEvents = await this._getEventsFromDB(annee);
      if (existingEvents.length >= 6) { // Minimum expected events: 3 fixed + Ramadan, Eid al-Fitr, Eid al-Adha
        console.log(`Using DB-cached events for ${annee} (found ${existingEvents.length} events).`);
        return existingEvents;
      }

      console.log(`Initializing events for year: ${annee}.`);

      const anneeHijri = Math.floor((annee - 622) * (33 / 32)); // Approximate Hijri year

      // Fetch all event types concurrently
      const [
        fixedEvents,
        casualEvents, // New casual events
        eidFitr,
        eidAdha,
        ramadan
      ] = await Promise.all([
        this._getFixedEvents(annee),
        this._getCasualEvents(annee), // New casual events
        this._getIslamicDate(anneeHijri, 10, 1, 'Aïd al-Fitr'), // Correct name for Eid al-Fitr
        this._getIslamicDate(anneeHijri, 12, 10, 'Aïd al-Adha'), // Correct name for Eid al-Adha
        this._getRamadanDates(anneeHijri)
      ]);

      const allEventsToSave = [...fixedEvents, ...casualEvents, eidFitr, eidAdha, ramadan].filter(Boolean); // Filter out any nulls

      // Save/update all events in the database
      const results = await this._forceSaveEvents(allEventsToSave);
      console.log(`Successfully initialized/updated ${results.length} events for ${annee}.`);

      // Send notifications for new/updated events
      await this._sendNewEventNotifications(allEventsToSave);

      return results.map(r => r.instance || r); // Return event instances
    } catch (error) {
      console.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Fetches fixed Gregorian calendar events.
   * @param {number} annee
   * @returns {Array<Object>}
   */
  _getFixedEvents(annee) {
    return [
      {
        nom: 'Nouvel An',
        date_debut: `${annee}-01-01`,
        date_fin: `${annee}-01-01`,
        type_evenement: 'Fête nationale',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false // Default to inactive, can be activated later
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
        date_fin: `${annee}-09-15`, // Can be adjusted as needed
        type_evenement: 'Rentrée scolaire',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      }
    ];
  }

  /**
   * Fetches casual commercial events like Black Friday, Summer Sale.
   * Dates are fixed for simplicity.
   * @param {number} annee
   * @returns {Array<Object>}
   */
  _getCasualEvents(annee) {
    return [
      {
        nom: 'Black Friday',
        date_debut: `${annee}-11-29`, // Last Friday of November (approx, can be more dynamic)
        date_fin: `${annee}-12-02`, // Extends through Cyber Monday
        type_evenement: 'Événement commercial',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      },
      {
        nom: 'Soldes d\'Été',
        date_debut: `${annee}-07-01`,
        date_fin: `${annee}-07-31`, // Or specific period for summer sales
        type_evenement: 'Saison commercial', // Use the new ENUM value
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      },
       {
        nom: 'Cyber Monday',
        date_debut: `${annee}-12-02`,
        date_fin: `${annee}-12-02`,
        type_evenement: 'Événement commercial',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      },
      {
        nom: 'Soldes d\'Hiver',
        date_debut: `${annee}-01-15`, // Example date
        date_fin: `${annee}-02-15`,   // Example date
        type_evenement: 'Saison commercial',
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      },
      {
        nom: 'Fête des Mères',
        date_debut: `${annee}-05-25`, // Example: Last Sunday of May for France/Tunisia
        date_fin: `${annee}-05-25`,
        type_evenement: 'Événement commercial', // Or 'Fête nationale' if it's a public holiday
        recurrence: 'fixe',
        annee: annee,
        est_actif: false
      }
      // Add more as needed
    ];
  }

  /**
   * Fetches a specific Islamic date from Aladhan API or a fallback.
   * @param {number} hijriYear
   * @param {number} hijriMonth
   * @param {number} hijriDay
   * @param {string} eventName
   * @returns {Promise<Object>} Event object
   */
  async _getIslamicDate(hijriYear, hijriMonth, hijriDay, eventName) {
    const specialDates = { // Manual overrides for specific years if API is unreliable or for testing
      1446: { // For Gregorian year 2025
        'Aïd al-Fitr': { start: '2025-03-31', end: '2025-03-31' }, // Adjusted to typically match 1st Shawwal
        'Aïd al-Adha': { start: '2025-06-06', end: '2025-06-06' }, // Adjusted to typically match 10th Dhu al-Hijjah
        // Ramadan handled separately in _getRamadanDates
      }
    };

    if (specialDates[hijriYear]?.[eventName]) {
      const dates = specialDates[hijriYear][eventName];
      console.log(`Using manual override for ${eventName} ${hijriYear}: ${dates.start}`);
      return this._createEvent(eventName, dates.start, dates.end, false, hijriYear + 622); // Use annee for Gregorian year
    }

    try {
      // Use Aladhan API to convert Hijri to Gregorian
      const response = await this.aladhanClient.get(`/hToG?date=${hijriDay}-${hijriMonth}-${hijriYear}`);
      const gregorianDate = this._parseApiDate(response.data.data.gregorian.date);
      console.log(`API fetched ${eventName} for Hijri ${hijriYear}: ${gregorianDate}`);
      return this._createEvent(eventName, gregorianDate, gregorianDate, false, gregorianDate.split('-')[0]); // Extract year
    } catch (error) {
      console.warn(`API failed for ${eventName} (Hijri ${hijriYear}), using fallback calculation: ${error.message}`);
      // Fallback to approximate calculation if API fails
      return this._calculateIslamicDate(hijriYear, hijriMonth, hijriDay, eventName);
    }
  }

  /**
   * Fetches Ramadan dates from Aladhan API or a fallback.
   * @param {number} hijriYear
   * @returns {Promise<Object>} Ramadan Event object
   */
  async _getRamadanDates(hijriYear) {
    if (hijriYear === 1446) { // Manual override for 2025 (Hijri 1446)
      console.log('Using manual override for Ramadan 1446 (2025)');
      return this._createEvent('Ramadan', '2025-03-01', '2025-03-29', false, 2025);
    }

    try {
      // Get the start of Ramadan (1st of Shawwal)
      const startResponse = await this.aladhanClient.get(`/hToG?date=01-09-${hijriYear}`);
      const dateDebut = this._parseApiDate(startResponse.data.data.gregorian.date);

      // Determine Ramadan duration (29 or 30 days)
      let duration = 29;
      try {
        const endCheckResponse = await this.aladhanClient.get(`/hToG?date=30-09-${hijriYear}`);
        // If there's data for 30th of Ramadan, it means Ramadan has 30 days.
        if (endCheckResponse.data.data) {
          duration = 30;
          console.log(`API confirms 30-day Ramadan for Hijri ${hijriYear}`);
        } else {
          console.log(`API indicates 29-day Ramadan for Hijri ${hijriYear}`);
        }
      } catch (error) {
        // This usually means the 30th doesn't exist, so it's 29 days.
        console.log(`Could not check 30th Ramadan for Hijri ${hijriYear}, defaulting to 29 days.`);
      }

      const dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + duration - 1); // Add duration-1 days to get the end date

      console.log(`API fetched Ramadan for Hijri ${hijriYear}: ${dateDebut} to ${this._formatDate(dateFin)}`);
      return this._createEvent('Ramadan', dateDebut, this._formatDate(dateFin), false, dateDebut.split('-')[0]); // Extract year
    } catch (error) {
      console.warn(`API failed for Ramadan (Hijri ${hijriYear}), using fallback calculation: ${error.message}`);
      return this._calculateRamadanDates(hijriYear);
    }
  }

  /**
   * Approximates Gregorian date for a given Hijri date using a simple formula.
   * @param {number} hijriYear
   * @param {number} hijriMonth
   * @param {number} hijriDay
   * @param {string} eventName
   * @returns {Object} Event object with approximate dates
   */
  _calculateIslamicDate(hijriYear, hijriMonth, hijriDay, eventName) {
    // This is a very rough approximation. For better accuracy, external libraries or a more complex algorithm would be needed.
    // This formula tries to convert Hijri to Gregorian.
    // A more precise calculation would involve Julian Day Numbers.
    const approximateGregorianYear = hijriYear + 579; // A rough offset for 1st Muharram
    // Further refinement for month and day based on common yearly shifts.
    // For a real-world app, consider a proper Hijri-Gregorian conversion library or a more robust API.
    const monthLengthAvg = 29.53; // Average length of a lunar month

    // A simpler approximation for demonstration, just to prevent null
    const date = new Date(approximateGregorianYear, hijriMonth - 1, hijriDay); // Month is 0-indexed in JS Date

    const gregorianDate = this._formatDate(date);
    console.warn(`Approximate calculation for ${eventName}: ${gregorianDate}`);
    return this._createEvent(eventName, gregorianDate, gregorianDate, true, gregorianDate.split('-')[0]);
  }

  /**
   * Approximates Ramadan dates if API fails.
   * @param {number} hijriYear
   * @returns {Object} Ramadan Event object with approximate dates
   */
  _calculateRamadanDates(hijriYear) {
    const debutApproxEvent = this._calculateIslamicDate(hijriYear, 9, 1, 'Ramadan (Approximation)');
    const dateFin = new Date(debutApproxEvent.date_debut);
    dateFin.setDate(dateFin.getDate() + 29); // Assume 29 days for approximation

    return {
      ...debutApproxEvent,
      nom: 'Ramadan (Approximation)',
      date_fin: this._formatDate(dateFin),
      est_approximatif: true // Mark as approximate
    };
  }

  /**
   * Creates a standardized event object.
   * @param {string} nom
   * @param {string} date_debut (YYYY-MM-DD)
   * @param {string} date_fin (YYYY-MM-DD)
   * @param {boolean} estApproximatif
   * @param {number} annee - The Gregorian year of the event
   * @returns {Object}
   */
  _createEvent(nom, date_debut, date_fin, estApproximatif = false, annee) {
    return {
      nom,
      date_debut,
      date_fin,
      type_evenement: nom === 'Ramadan' || nom.includes('Aïd') ? 'Fête religieuse' : 'Événement commercial', // Dynamic type
      recurrence: 'variable', // Religious events are variable
      est_approximatif: estApproximatif,
      est_actif: false, // Default to inactive
      annee: annee || new Date(date_debut).getFullYear() // Ensure year is set
    };
  }

  /**
   * Parses API date format (DD-MM-YYYY) to YYYY-MM-DD.
   * @param {string} apiDate
   * @returns {string}
   */
  _parseApiDate(apiDate) {
    const [day, month, year] = apiDate.split('-');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formats a Date object to YYYY-MM-DD string.
   * @param {Date} date
   * @returns {string}
   */
  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Fetches events for a given year from the database.
   * @param {number} year
   * @returns {Promise<Array<Object>>}
   */
  async _getEventsFromDB(year) {
    return await Evenement.findAll({
      where: {
        annee: year // Query by the 'annee' field
      }
    });
  }

  /**
   * Forces saving/updating events in the database, destroying existing ones with the same name and year.
   * @param {Array<Object>} events - Array of event objects.
   * @returns {Promise<Array<Object>>} Results of save operations.
   */
  async _forceSaveEvents(events) {
    const results = [];
    for (const event of events) {
      try {
        // Important: Use nom AND annee for uniqueness to avoid deleting future/past events of the same name
        await Evenement.destroy({
          where: {
            nom: event.nom,
            annee: event.annee
          }
        });

        const instance = await Evenement.create(event);
        results.push({
          instance,
          created: true
        });
        console.log(`Event saved: ${event.nom} (${event.annee})`);
      } catch (error) {
        // Handle unique constraint errors gracefully if the event somehow already exists for the year
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.warn(`Event ${event.nom} for ${event.annee} already exists, skipping creation.`);
          const existing = await Evenement.findOne({ where: { nom: event.nom, annee: event.annee } });
          results.push({ instance: existing, created: false, message: 'Already exists' });
        } else {
          console.error(`Error saving ${event.nom} (${event.annee}):`, error);
          results.push({
            error: error.message,
            created: false
          });
        }
      }
    }
    return results;
  }

  // --- Notification Logic ---

  /**
   * Sends email notifications to admins about newly initialized/updated events.
   * @param {Array<Object>} events - Events to notify about.
   */
  async _sendNewEventNotifications(events) {
    const adminUsers = await Utilisateur.findAll({
      where: {
        role: {
          [Op.in]: ['admin', 'super_admin']
        }
      },
      attributes: ['email'] // Fetch only email
    });

    const adminEmails = adminUsers.map(u => u.email);

    if (!adminEmails.length) {
      console.warn('No admin emails found to notify about new events.');
      return;
    }

    for (const event of events) {
      try {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'system@mgme-commerce.com',
          to: adminEmails,
          subject: `[MGME] Nouvel événement annuel: ${event.nom} (${event.annee})`,
          html: `
            <h2>${event.nom}</h2>
            <p><strong>Dates:</strong> ${event.date_debut} au ${event.date_fin}</p>
            <p><strong>Type:</strong> ${event.type_evenement}</p>
            <p><strong>Année:</strong> ${event.annee}</p>
            ${event.est_approximatif ?
              '<p style="color: orange;">Les dates de cet événement sont approximatives et peuvent nécessiter une vérification.</p>' :
              '<p style="color: green;">Les dates de cet événement sont confirmées.</p>'}
            <p>Veuillez vérifier l'activité de cet événement sur le tableau de bord si nécessaire.</p>
          `
        });
        console.log(`Email notification sent for event: ${event.nom} (${event.annee})`);
      } catch (error) {
        console.error(`Failed to send email for ${event.nom} (${event.annee}):`, error);
      }
    }
  }

  // --- Scheduling ---

  /**
   * Schedules a cron job to update events yearly (e.g., on Jan 1st).
   */
  scheduleYearlyUpdates() {
    // This cron runs at 00:00 on January 1st every year
    cron.schedule('0 0 1 1 *', async () => {
      const year = new Date().getFullYear();
      console.log(`Cron job: Auto-initializing events for ${year}`);
      try {
        await this.initialiserEvenementsAnnuel(year);
        console.log(`Cron job: Successfully initialized/updated events for ${year}`);
      } catch (error) {
        console.error(`Cron job: Failed to auto-initialize events for ${year}: ${error.message}`);
      }
    });
    console.log('Yearly event update cron job scheduled.');
  }

  /**
   * Schedules a cron job to check and update event 'est_actif' status daily.
   * Events become active on their start date and inactive after their end date.
   */
  scheduleDailyEventStatusUpdate() {
    // This cron runs daily at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Cron job: Daily event status update started.');
      const today = this._formatDate(new Date()); // Get today's date in YYYY-MM-DD

      try {
        // Deactivate past events
        await Evenement.update(
          { est_actif: false },
          {
            where: {
              date_fin: { [Op.lt]: today }, // Events whose end date is before today
              est_actif: true // Only deactivate if currently active
            }
          }
        );
        console.log('Past events deactivated.');

        // Activate current events
        await Evenement.update(
          { est_actif: true },
          {
            where: {
              date_debut: { [Op.lte]: today }, // Events starting on or before today
              date_fin: { [Op.gte]: today },   // Events ending on or after today
              est_actif: false                  // Only activate if currently inactive
            }
          }
        );
        console.log('Current events activated.');
        console.log('Cron job: Daily event status update completed.');
      } catch (error) {
        console.error(`Cron job: Failed to update event statuses: ${error.message}`);
      }
    });
    console.log('Daily event status update cron job scheduled.');
  }
}

module.exports = new EvenementService();