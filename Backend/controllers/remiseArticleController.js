const  RemiseArticle = require("../models/RemiseArticle");

const addRemiseArticle = async (req, res) => {
  try {
    const remiseArticle = await RemiseArticle.create(req.body);
    res.status(201).json(remiseArticle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRemiseArticle = async (req, res) => {
  try {
    const remiseArticle = await RemiseArticle.findByPk(req.params.id);
    if (!remiseArticle) return res.status(404).json({ message: "RemiseArticle non trouvé" });

    await remiseArticle.update(req.body);
    res.json(remiseArticle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRemiseArticle = async (req, res) => {
  try {
    const remiseArticle = await RemiseArticle.findByPk(req.params.id);
    if (!remiseArticle) return res.status(404).json({ message: "RemiseArticle non trouvé" });

    await remiseArticle.destroy();
    res.json({ message: "RemiseArticle supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRemiseArticles = async (req, res) => {
  try {
    const remiseArticles = await RemiseArticle.findAll();
    res.json(remiseArticles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addRemiseArticle,
  updateRemiseArticle,
  deleteRemiseArticle,
  getAllRemiseArticles,
};