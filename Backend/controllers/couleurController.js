const { Couleur } = require("../models");
const path = require('path');
const getColors = require('get-image-colors');
const { getMatchingColorsFromText, getClosestColor } = require('../services/xkcdColorService');
const fs = require('fs');

const ajouterCouleur = async (req, res) => {
  try {
    const { libelle, hexcode } = req.body;
    
    if (!libelle || !hexcode) {
      return res.status(400).json({ error: 'Libelle and hexcode are required' });
    }

    const nouvelleCouleur = await Couleur.create({
      libelle,
      hexcode,
      popularite: 0,
    });

    res.status(201).json(nouvelleCouleur);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenirToutesCouleurs = async (req, res) => {
  try {
    const couleurs = await Couleur.findAll({
      order: [['popularite', 'DESC']]
    });
    res.json(couleurs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const suggestColorsFromText = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const suggestions = getMatchingColorsFromText(text);
  res.json(suggestions);
};

const extractFromImage = async (req, res) => {
  try {
    const imagePath = req.file.path;
    const colors = await getColors(imagePath);
    const hexPalette = colors.map(color => color.hex());
    const namedPalette = hexPalette.map(hex => getClosestColor(hex));

    fs.unlink(imagePath, (err) => {
      if (err) {
        console.warn('Image deletion failed:', err.message);
      } else {
        console.log(`Deleted image: ${imagePath}`);
      }
    });

    res.json(namedPalette);
  } catch (err) {
    console.error("Color extraction failed:", err);
    res.status(500).json({ error: 'Color extraction failed' });
  }
};


module.exports = {
  obtenirToutesCouleurs,
  suggestColorsFromText,
  extractFromImage,
  ajouterCouleur
};
