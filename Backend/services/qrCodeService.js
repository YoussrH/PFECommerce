const QRCode = require('qrcode');
const { Commande } = require('../models');

/**
 * Génère un QR code pour la confirmation de livraison
 * @param {string} commandeId - ID de la commande
 * @returns {Promise<Object>} - Contient token, URL et data URL du QR code
 */
const genererQRCodePourLivraison = async (commandeId) => {
  try {
    // Créer un token unique
    const token = `qr-confirm-${commandeId}-${Date.now()}`;
    const urlConfirmation = `${process.env.APP_URL}/api/commandes/${commandeId}/confirmer-livraison?token=${token}`;

    // Générer le QR code en base64
    const qrCodeDataURL = await QRCode.toDataURL(urlConfirmation);

    return {
      token,
      qrCodeDataURL,
      urlConfirmation,
      dateExpiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Valide 3 jours
    };
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    throw error;
  }
};

/**
 * Vérifie la validité d'un token QR code
 * @param {string} commandeId - ID de la commande
 * @param {string} token - Token à vérifier
 * @returns {Promise<boolean>} - True si valide, false sinon
 */
const verifierTokenQRCode = async (commandeId, token) => {
  try {
    const commande = await Commande.findByPk(commandeId);
    if (!commande || !commande.qr_token) {
      return false;
    }

    // Vérifier que le token correspond et n'est pas expiré
    return commande.qr_token === token && 
           (!commande.qr_expires || new Date(commande.qr_expires) > new Date());
  } catch (error) {
    console.error('Erreur lors de la vérification du token QR code:', error);
    return false;
  }
};

module.exports = {
  genererQRCodePourLivraison,
  verifierTokenQRCode
};