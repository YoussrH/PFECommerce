// services/orderReferenceService.js
const { sequelize } = require('../models');

// Simple random string generator (no external dependencies needed)
const generateRandomString = (length) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateOrderReference = async (sequelize) => {
  const datePart = new Date()
    .toLocaleDateString('fr-FR', { 
      year: '2-digit', 
      month: '2-digit', 
      day: '2-digit' 
    })
    .replace(/\//g, '');
  
  const randomPart = generateRandomString(6);
  const reference = `CMD-${datePart}-${randomPart}`;
  
  // Verify uniqueness using raw query to avoid model dependency
  const [result] = await sequelize.query(
    'SELECT 1 FROM commande WHERE reference = :reference LIMIT 1',
    {
      replacements: { reference },
      type: sequelize.QueryTypes.SELECT
    }
  );
  
  if (result) {
    return generateOrderReference(sequelize); // Regenerate if collision
  }
  
  return reference;
};

module.exports = { generateOrderReference };