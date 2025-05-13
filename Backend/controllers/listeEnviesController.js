// controllers/listeEnviesController.js
const { ListeEnvies, Article, ImageArticleCouleur, Marque, sequelize } = require('../models');
const { Op } = require('sequelize');

const ajouterAListeEnvies = async (req, res) => {
  if (!req.utilisateur) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise pour la liste d'envies"
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const { article_id } = req.body;

    if (!article_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "ID d'article requis"
      });
    }

    // Vérifier si l'article existe
    const article = await Article.findByPk(article_id, { transaction });
    if (!article) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Article non trouvé"
      });
    }

    // Vérifier si l'article est déjà dans la liste d'envies
    const existeDeja = await ListeEnvies.findOne({
      where: {
        utilisateur_id: req.utilisateur.id,
        article_id
      },
      transaction
    });

    if (existeDeja) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Cet article est déjà dans votre liste d'envies"
      });
    }

    // Ajouter à la liste d'envies
    const listeEnviesItem = await ListeEnvies.create({
      utilisateur_id: req.utilisateur.id,
      article_id
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Article ajouté à la liste d'envies",
      data: listeEnviesItem
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Erreur lors de l'ajout à la liste d'envies:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout à la liste d'envies",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const obtenirListeEnvies = async (req, res) => {
  if (!req.utilisateur) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise pour accéder à la liste d'envies"
    });
  }

  try {
    const listeEnvies = await ListeEnvies.findAll({
      where: { utilisateur_id: req.utilisateur.id },
      include: [
        {
          model: Article,
          as: 'article',
          include: [
            {
              model: ImageArticleCouleur,
              as: 'images_couleurs',
              limit: 1 // Only get the first image for each article
            },
            {
              model: Marque,
              as: 'marque',
              attributes: ['id', 'libelle']
            }
          ],
          attributes: ['id', 'nom_produit', 'prix_final', 'description']
        }
      ],
      order: [['date_ajout', 'DESC']]
    });

    return res.json({
      success: true,
      data: listeEnvies.map(item => ({
        id: item.id,
        date_ajout: item.date_ajout,
        article: item.article
      }))
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de la liste d'envies:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la liste d'envies",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const supprimerDeListeEnvies = async (req, res) => {
  if (!req.utilisateur) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise pour modifier la liste d'envies"
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const listeEnviesItem = await ListeEnvies.findOne({
      where: {
        id,
        utilisateur_id: req.utilisateur.id
      },
      transaction
    });

    if (!listeEnviesItem) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Article non trouvé dans la liste d'envies"
      });
    }

    await listeEnviesItem.destroy({ transaction });
    await transaction.commit();

    return res.json({
      success: true,
      message: "Article retiré de la liste d'envies"
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Erreur lors de la suppression de la liste d'envies:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'article de la liste d'envies",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifierArticleDansListeEnvies = async (req, res) => {
  if (!req.utilisateur) {
    return res.status(401).json({
      success: false,
      message: "Authentification requise"
    });
  }

  try {
    const { article_id } = req.params;

    const existe = await ListeEnvies.findOne({
      where: {
        utilisateur_id: req.utilisateur.id,
        article_id
      }
    });

    return res.json({
      success: true,
      data: {
        dans_liste_envies: !!existe,
        item_id: existe?.id || null
      }
    });

  } catch (error) {
    console.error("Erreur lors de la vérification de la liste d'envies:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de la liste d'envies",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  ajouterAListeEnvies,
  obtenirListeEnvies,
  supprimerDeListeEnvies,
  verifierArticleDansListeEnvies
};