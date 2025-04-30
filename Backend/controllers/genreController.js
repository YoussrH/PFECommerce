const { Genre } = require("../models");

const obtenirTousGenres = async (req, res) => {
  try {
    const genres = await Genre.findAll();
    const genresModifies = genres.map(genre => {
      let libelle = genre.libelle;
      if (genre.id === 1) libelle = "Bébé";
      if (genre.id === 3) libelle = "Garçon";
      return { ...genre.toJSON(), libelle };
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.json(genresModifies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ajouterGenre = async (req, res) => {
  try {
    const { libelle } = req.body;
    if (!libelle) return res.status(400).json({ error: "Le libellé est obligatoire" });

    const genre = await Genre.create({ libelle });
    res.status(201).json(genre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const mettreAJourGenre = async (req, res) => {
  try {
    const { libelle } = req.body;
    const genre = await Genre.findByPk(req.params.id);
    if (!genre) return res.status(404).json({ error: "Genre non trouvé" });

    await genre.update({ libelle });
    res.json(genre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const supprimerGenre = async (req, res) => {
  try {
    const genre = await Genre.findByPk(req.params.id);
    if (!genre) return res.status(404).json({ error: "Genre non trouvé" });

    await genre.destroy();
    res.json({ message: "Genre supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  obtenirTousGenres,
  ajouterGenre,
  mettreAJourGenre,
  supprimerGenre,
};