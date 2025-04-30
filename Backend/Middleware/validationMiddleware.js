const { body, validationResult } = require('express-validator');

const validerTaille = [
  body('libelle').notEmpty().withMessage('Le libellé est requis'),
  body('categorie_id').isInt().withMessage('L\'ID de catégorie doit être un nombre entier'),
  body('genre_id').isInt().withMessage('L\'ID de genre doit être un nombre entier'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validerTaille
};