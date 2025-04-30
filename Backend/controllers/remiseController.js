const { Remise, Evenement, Article, Categorie, Genre, Taille, Utilisateur } = require('../models');
const { Op } = require('sequelize');

const listerRemises = async (req, res) => {
  try {
    const remises = await Remise.findAll({
      include: [
        { model: Evenement, as: 'evenement' },
        { model: Article, as: 'articles' },
        { model: Categorie, as: 'categories' },
        { model: Genre, as: 'genres' },
        { model: Taille, as: 'tailles' },
        { model: Utilisateur, as: 'utilisateurs' },
      ],
      order: [['date_debut', 'ASC']]
    });
    res.json(remises);
  } catch (err) {
    console.error('Erreur get remises:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getRemiseParId = async (req, res) => {
  try {
    const remise = await Remise.findByPk(req.params.id, {
      include: [
        { model: Evenement, as: 'evenement' },
        { model: Article, as: 'articles' },
        { model: Categorie, as: 'categories' },
        { model: Genre, as: 'genres' },
        { model: Taille, as: 'tailles' },
        { model: Utilisateur, as: 'utilisateurs' },
      ]
    });

    if (!remise) return res.status(404).json({ message: 'Remise introuvable' });
    res.json(remise);
  } catch (err) {
    console.error('Erreur get remise:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const creerRemise = async (req, res) => {
  try {
    const {
      libelle, type, valeur, date_debut, date_fin, min_achat,
      buy_x, get_y, empilable, automatique, code, etat,
      evenement_id
    } = req.body;

    const nouvelleRemise = await Remise.create({
      libelle, type, valeur, date_debut, date_fin, min_achat,
      buy_x, get_y, empilable, automatique, code, etat,
      evenement_id: evenement_id || null
    });

    res.status(201).json(nouvelleRemise);
  } catch (err) {
    console.error('Erreur creation remise:', err);
    res.status(500).json({ message: 'Erreur lors de la création' });
  }
};

const mettreAJourRemise = async (req, res) => {
  try {
    const remise = await Remise.findByPk(req.params.id);
    if (!remise) return res.status(404).json({ message: 'Remise introuvable' });

    await remise.update(req.body);
    res.json({ message: 'Remise mise à jour', remise });
  } catch (err) {
    console.error('Erreur update remise:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};
const supprimerRemise = async (req, res) => {
  try {
    const remise = await Remise.findByPk(req.params.id);
    if (!remise) return res.status(404).json({ message: 'Remise introuvable' });

    await remise.destroy();
    res.json({ message: 'Remise supprimée' });
  } catch (err) {
    console.error('Erreur suppression remise:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

const updateRelation = async (remiseId, entity, ids, model, alias, res) => {
  try {
    const remise = await Remise.findByPk(remiseId);
    if (!remise) return res.status(404).json({ message: 'Remise non trouvée' });

    const instances = await model.findAll({ where: { id: ids } });
    await remise[`set${alias}`](instances); 
    res.json({ message: `${entity} associés avec succès`, [entity]: instances });
  } catch (err) {
    console.error(`Erreur mise à jour ${entity}:`, err);
    res.status(500).json({ message: `Erreur lors de la mise à jour des ${entity}` });
  }
};

const setArticles = async (req, res) => {
  const { articleIds } = req.body;
  await updateRelation(req.params.id, 'articles', articleIds, Article, 'Articles', res);
};

const setCategories = async (req, res) => {
  const { categorieIds } = req.body;
  await updateRelation(req.params.id, 'categories', categorieIds, Categorie, 'Categories', res);
};

const setGenres = async (req, res) => {
  const { genreIds } = req.body;
  await updateRelation(req.params.id, 'genres', genreIds, Genre, 'Genres', res);
};

const setTailles = async (req, res) => {
  const { tailleIds } = req.body;
  await updateRelation(req.params.id, 'tailles', tailleIds, Taille, 'Tailles', res);
};
const setUtilisateurs = async (req, res) => {
  const { utilisateurIds } = req.body;

  try {
    const remise = await Remise.findByPk(req.params.id);
    if (!remise) return res.status(404).json({ message: 'Remise non trouvée' });

    const utilisateurs = await Utilisateur.findAll({
      where: { id: utilisateurIds }
    });

    await remise.setUtilisateurs(utilisateurs);

    res.json({
      message: 'Utilisateurs associés avec succès à la remise',
      utilisateurs
    });
  } catch (err) {
    console.error('Erreur association utilisateurs:', err);
    res.status(500).json({ message: 'Erreur lors de l’association des utilisateurs' });
  }
};
module.exports = {
  listerRemises,
  getRemiseParId,
  creerRemise,
  mettreAJourRemise,
  supprimerRemise,
  setArticles,
  setCategories,
  setGenres,
  setTailles,
  setUtilisateurs
};
