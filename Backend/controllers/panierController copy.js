const { Panier, ArticlePanier, Article, Couleur, Taille, ArticleTaille, ImageArticleCouleur, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

/**
 * Crée un nouveau panier pour un invité
 */
const creerPanierInvite = async (transaction) => {
  const guestToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return await Panier.create({
    guest_token: guestToken,
    expires_at: expiresAt
  }, { transaction });
};

/**
 * Récupère le panier actuel (utilisateur connecté ou invité)
 */
const obtenirPanier = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    let panier;
    const maintenant = new Date();
    const guestToken = req.headers['x-guest-token'] || req.session?.guestToken;

    if (req.utilisateur) {
      panier = await Panier.findOne({
        where: { utilisateur_id: req.utilisateur.id },
        include: [{
          model: ArticlePanier,
          as: 'panier_articles',
          include: [
            { model: Article, as: 'article' },
            { model: Couleur, as: 'couleur' },
            { model: Taille, as: 'taille' }
          ]
        }],
        transaction
      });
    } else if (guestToken) {
      panier = await Panier.findOne({
        where: {
          guest_token: guestToken,
          expires_at: { [Op.gt]: maintenant }
        },
        include: [{
          model: ArticlePanier,
          as: 'panier_articles',
          include: [
            { model: Article, as: 'article' },
            { model: Couleur, as: 'couleur' },
            { model: Taille, as: 'taille' }
          ]
        }],
        transaction
      });
    }

    if (!panier) {
      await transaction.commit();
      return res.json({
        success: true,
        data: {
          panier: { panier_articles: [] },
          total: 0
        }
      });
    }

    let total = 0;
    let articlesValides = [];

    for (const article of panier.panier_articles || []) {
      const stock = await ArticleTaille.findOne({
        where: {
          article_id: article.article_id,
          couleur_id: article.couleur_id,
          taille_id: article.taille_id,
          deleted_at: null
        },
        transaction
      });

      if (!stock || stock.quantite < article.quantite) {
        if (stock && stock.quantite > 0) {
          await article.update({ quantite: stock.quantite }, { transaction });
          article.quantite = stock.quantite;
          articlesValides.push(article);
        } else {
          await article.destroy({ transaction });
        }
      } else {
        articlesValides.push(article);
      }

      total += article.prix_au_moment_ajout * article.quantite;
    }

    await transaction.commit();

    return res.json({
      success: true,
      data: {
        panier: {
          ...panier.get({ plain: true }),
          panier_articles: articlesValides,
          guest_token: panier.guest_token || null
        },
        total: parseFloat(total.toFixed(2))
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erreur lors de la récupération du panier:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du panier",
      error: error.message
    });
  }
};

/**
 * Ajoute un article au panier
 */
const ajouterArticleAuPanier = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { article_id, couleur_id, taille_id, quantite } = req.body;

    if (!article_id || !couleur_id || !taille_id || !quantite || quantite <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Données invalides"
      });
    }

    const article = await Article.findByPk(article_id, {
      transaction,
      include: [{
        model: ArticleTaille,
        as: 'inventory',
        where: { couleur_id, taille_id }
      }]
    });

    if (!article) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Article non trouvé"
      });
    }

    const stockDisponible = article.inventory[0]?.quantite || 0;
    if (stockDisponible < quantite) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Disponible: ${stockDisponible}`,
        stock_disponible: stockDisponible
      });
    }

    let panier;

    if (req.utilisateur) {
      panier = await Panier.findOne({
        where: { utilisateur_id: req.utilisateur.id },
        transaction
      });

      if (!panier) {
        panier = await Panier.create({
          utilisateur_id: req.utilisateur.id,
          expires_at: new Date(new Date().setDate(new Date().getDate() + 30))
        }, { transaction });
      }
    } else {
      let guestToken = req.headers['x-guest-token'] || req.session?.guestToken;

      if (guestToken) {
        panier = await Panier.findOne({
          where: {
            guest_token: guestToken,
            expires_at: { [Op.gt]: new Date() }
          },
          transaction
        });
      }

      if (!panier) {
        panier = await creerPanierInvite(transaction);
        guestToken = panier.guest_token;
        req.session.guestToken = guestToken;
        res.set('X-Guest-Token', guestToken);
      }
    }

    const [articlePanier, created] = await ArticlePanier.findOrCreate({
      where: {
        panier_id: panier.id,
        article_id,
        couleur_id,
        taille_id
      },
      defaults: {
        quantite,
        prix_au_moment_ajout: article.prix_final
      },
      transaction
    });

    if (!created) {
      const nouvelleQuantite = articlePanier.quantite + quantite;
      if (nouvelleQuantite > stockDisponible) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Quantité totale (${nouvelleQuantite}) dépasse le stock disponible (${stockDisponible})`
        });
      }

      await articlePanier.update({
        quantite: nouvelleQuantite
      }, { transaction });
    }

    await transaction.commit();

    const response = {
      success: true,
      message: "Article ajouté au panier avec succès",
      article_panier: articlePanier
    };

    if (!req.utilisateur) {
      response.guest_token = panier.guest_token;
    }

    res.json(response);

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur lors de l\'ajout au panier:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout au panier",
      error: error.message
    });
  }
};

/**
 * Met à jour la quantité d'un article dans le panier
 */
const mettreAJourQuantite = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { article_panier_id } = req.params;
    const { quantite } = req.body;

    if (!quantite || quantite <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "La quantité doit être supérieure à zéro"
      });
    }

    const articlePanier = await ArticlePanier.findByPk(article_panier_id, {
      include: [{
        model: Article,
        as: 'article',
        include: [{
          model: ArticleTaille,
          as: 'inventory',
          where: {
            couleur_id: sequelize.col('article_panier.couleur_id'),
            taille_id: sequelize.col('article_panier.taille_id')
          },
          required: false
        }]
      }],
      transaction
    });

    if (!articlePanier) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Article non trouvé dans le panier"
      });
    }

    const stockDisponible = articlePanier.article.inventory[0]?.quantite || 0;

    if (quantite > stockDisponible) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Disponible: ${stockDisponible}`,
        stock_disponible: stockDisponible
      });
    }

    await articlePanier.update({ quantite }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "Quantité mise à jour avec succès",
      article_panier: articlePanier
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la quantité",
      error: error.message
    });
  }
};

/**
 * Supprime un article du panier
 */
const supprimerArticleDuPanier = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { article_panier_id } = req.params;

    const articlePanier = await ArticlePanier.findByPk(article_panier_id, {
      include: [{ model: Panier, as: 'panier' }],
      transaction
    });

    if (!articlePanier) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Article non trouvé dans le panier"
      });
    }

    const panier = articlePanier.panier;
    const guestToken = req.session?.guestToken;

    const isOwner = (
      (req.utilisateur && panier.utilisateur_id === req.utilisateur.id) ||
      (!req.utilisateur && panier.guest_token === guestToken)
    );

    if (!isOwner) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer cet article"
      });
    }

    await articlePanier.destroy({ transaction });
    await transaction.commit();

    return res.json({
      success: true,
      message: "Article supprimé du panier avec succès"
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'article du panier",
      error: error.message
    });
  }
};

module.exports = {
  creerPanierInvite,
  obtenirPanier,
  ajouterArticleAuPanier,
  mettreAJourQuantite,
  supprimerArticleDuPanier
};
