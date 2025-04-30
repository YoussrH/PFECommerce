const  RemiseGenre  = require("../models/RemiseGenre");

const addRemiseGenre = async (req, res) => {
  try {
    const remiseGenre = await RemiseGenre.create(req.body);
    res.status(201).json(remiseGenre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRemiseGenre = async (req, res) => {
  try {
    const remiseGenre = await RemiseGenre.findByPk(req.params.id);
    if (!remiseGenre) return res.status(404).json({ message: "RemiseGenre non trouvé" });

    await remiseGenre.update(req.body);
    res.json(remiseGenre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRemiseGenre = async (req, res) => {
  try {
    const remiseGenre = await RemiseGenre.findByPk(req.params.id);
    if (!remiseGenre) return res.status(404).json({ message: "RemiseGenre non trouvé" });

    await remiseGenre.destroy();
    res.json({ message: "RemiseGenre supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRemiseGenres = async (req, res) => {
  try {
    const remiseGenres = await RemiseGenre.findAll();
    res.json(remiseGenres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addRemiseGenre,
  updateRemiseGenre,
  deleteRemiseGenre,
  getAllRemiseGenres,
};