const  RemiseCategorie  = require("../models/RemiseCategorie");

const addRemiseCategorie = async (req, res) => {
  try {
    const remiseCategorie = await RemiseCategorie.create(req.body);
    res.status(201).json(remiseCategorie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRemiseCategorie = async (req, res) => {
  try {
    const remiseCategorie = await RemiseCategorie.findByPk(req.params.id);
    if (!remiseCategorie) return res.status(404).json({ message: "RemiseCategorie non trouvée" });

    await remiseCategorie.update(req.body);
    res.json(remiseCategorie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRemiseCategorie = async (req, res) => {
  try {
    const remiseCategorie = await RemiseCategorie.findByPk(req.params.id);
    if (!remiseCategorie) return res.status(404).json({ message: "RemiseCategorie non trouvée" });

    await remiseCategorie.destroy();
    res.json({ message: "RemiseCategorie supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRemiseCategories = async (req, res) => {
  try {
    const remiseCategories = await RemiseCategorie.findAll();
    res.json(remiseCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addRemiseCategorie,
  updateRemiseCategorie,
  deleteRemiseCategorie,
  getAllRemiseCategories,
};