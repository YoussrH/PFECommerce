const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Envoie un SMS
 * @param {string} to - Numéro de téléphone du destinataire
 * @param {string} message - Message à envoyer
 * @returns {Promise}
 */
const envoyerSMS = async (to, message) => {
  try {
    // Formatage du numéro pour Twilio (ex: +21612345678)
    const formattedTo = to.startsWith('+') ? to : `+216${to}`;
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo
    });
    
    console.log(`SMS envoyé à ${formattedTo}: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    throw error;
  }
};

module.exports = {
  envoyerSMS
};