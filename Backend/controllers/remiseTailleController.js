const  RemiseTaille  = require("../models/RemiseTaille");

const addRemiseTaille = async (req, res) => {
  try {
    const remiseTaille = await RemiseTaille.create(req.body);
    res.status(201).json(remiseTaille);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRemiseTaille = async (req, res) => {
  try {
    const remiseTaille = await RemiseTaille.findByPk(req.params.id);
    if (!remiseTaille) return res.status(404).json({ message: "RemiseTaille non trouvée" });

    await remiseTaille.update(req.body);
    res.json(remiseTaille);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRemiseTaille = async (req, res) => {
  try {
    const remiseTaille = await RemiseTaille.findByPk(req.params.id);
    if (!remiseTaille) return res.status(404).json({ message: "RemiseTaille non trouvée" });

    await remiseTaille.destroy();
    res.json({ message: "RemiseTaille supprimée" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRemiseTailles = async (req, res) => {
  try {
    const remiseTailles = await RemiseTaille.findAll();
    res.json(remiseTailles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addRemiseTaille,
  updateRemiseTaille,
  deleteRemiseTaille,
  getAllRemiseTailles,
};