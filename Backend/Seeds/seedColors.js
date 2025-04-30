const Couleur = require("../models/Couleur");

const seedColors = async () => {
  const colors = [
    { libelle: 'ROUGE', hexcode: '#FF0000' },
    { libelle: 'BLEU', hexcode: '#0000FF' },
    { libelle: 'MINT GREEN', hexcode: '#BFE3DD' },
    { libelle: 'JAUNE', hexcode: '#FFFF00' },
    { libelle: 'NOIR', hexcode: '#000000' },
    { libelle: 'BLANC', hexcode: '#FFFFFF' },
    { libelle: 'GRIS', hexcode: '#808080' },
    { libelle: 'BURGUNDY', hexcode: '#A51C29' },
    { libelle: 'BLEU CLAIR', hexcode: '#ADD8E6' },
    { libelle: 'BLANCHE', hexcode: '#FFFFFF' },
    { libelle: 'BEIGE', hexcode: '#DDAD87' },
    { libelle: 'PEACH', hexcode: '#F8BCA3' },
    { libelle: 'ROSE', hexcode: '#FF478C' },
    { libelle: 'ROSE CLAIR', hexcode: '#FFE1EC' },
    { libelle: 'TURQUOISE', hexcode: '#5F9DB3' },
    { libelle: 'BLEU FONCÉ', hexcode: '#32374C' },
    { libelle: 'MAUVE', hexcode: '#9370DB' },
    { libelle: 'BLANC CASSÉ', hexcode: '#EEE6DC' },
    { libelle: 'ORANGE', hexcode: '#C0371C' },
    { libelle: 'PAYNE\'S GRAY', hexcode: '#515A68' },
    { libelle: 'COOL GRAY', hexcode: '#8092AF' },
    { libelle: 'TEA ROSE', hexcode: '#EBC6CA' }
  ];

  for (const color of colors) {
    await Couleur.findOrCreate({ 
      where: { libelle: color.libelle },
      defaults: color
    });
  }
  console.log("Colors inserted!");
};

seedColors();