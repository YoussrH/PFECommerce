const Fuse = require('fuse.js');
const chroma = require('chroma-js');
const xkcdColors = require('../utils/xkcdColors.json'); // XKCD list with libelle & hexcode

const fuse = new Fuse(xkcdColors, {
  keys: ['libelle'],
  threshold: 0.3,
});

function getMatchingColorsFromText(text) {
  const exactMatch = xkcdColors.filter(color =>
    color.libelle.toLowerCase().includes(text.toLowerCase())
  );
  if (exactMatch.length > 0) return exactMatch;

  const results = fuse.search(text);
  return results.map(result => result.item);
}

function getClosestColor(hex) {
  let closest = null;
  let smallestDistance = Infinity;

  for (const color of xkcdColors) {
    const distance = chroma.deltaE(hex, color.hexcode);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      closest = color;
    }
  }

  return closest || { libelle: '', hexcode: hex };
}

module.exports = { getMatchingColorsFromText, getClosestColor };
