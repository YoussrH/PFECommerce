const { Op } = require('sequelize');
const { Remise, Article, Categorie, Marque, Genre, Taille, Couleur, Utilisateur } = require('../models');
const models = require("../models");
const { sequelize } = require("../models");

// Helper function to calculate final price
const calculateFinalPrice = (originalPrice, discount) => {
  if (!discount) return originalPrice;
  
  switch (discount.type_remise) {
    case 'pourcentage':
      return originalPrice * (1 - discount.valeur / 100);
    case 'montant_fixe':
      return Math.max(0, originalPrice - discount.valeur);
    default:
      return originalPrice;
  }
};

const createRemise = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      code,
      libelle,
      description,
      type_remise,
      valeur,
      date_debut,
      date_fin,
      est_active = true,
      min_articles,
      min_montant,
      max_utilisation,
      est_cumulable,
      apply_to,
      articles = [],
      categories = [],
      marques = [],
      genres = [],
    } = req.body;

    // Validate required fields
    if (!code || !libelle || !type_remise || !valeur || !date_debut || !date_fin || !apply_to) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the discount
    const remise = await Remise.create({
      code,
      libelle,
      description,
      type_remise,
      valeur: parseFloat(valeur),
      date_debut,
      date_fin,
      est_active,
      min_articles: min_articles ? parseInt(min_articles) : null,
      min_montant: min_montant ? parseFloat(min_montant) : null,
      max_utilisation: max_utilisation ? parseInt(max_utilisation) : null,
      est_cumulable,
      apply_to,
    }, { transaction });

    // Function to update prices for affected articles
    const updateAffectedArticles = async (articleIds) => {
      if (!articleIds || articleIds.length === 0) return;

      const articlesToUpdate = await Article.findAll({
        where: { id: articleIds },
        include: [
          {
            model: Remise,
            as: 'article_discounts',
            where: {
              est_active: true,
              date_debut: { [Op.lte]: new Date() },
              date_fin: { [Op.gte]: new Date() }
            },
            required: false
          }
        ],
        transaction
      });

      await Promise.all(articlesToUpdate.map(async article => {
        // Find the best applicable discount (including the new one)
        const allDiscounts = [...article.article_discounts, remise]
          .filter(d => d.date_debut <= new Date() && d.date_fin >= new Date() && d.est_active);
        
        const bestDiscount = allDiscounts.reduce((prev, current) => {
          const prevValue = calculateFinalPrice(article.prix, prev);
          const currentValue = calculateFinalPrice(article.prix, current);
          return (prevValue < currentValue) ? prev : current;
        }, remise);

        const newPrice = calculateFinalPrice(article.prix, bestDiscount);
        
        if (article.prix_final !== newPrice) {
          await article.update({ prix_final: newPrice }, { transaction });
        }
      }));
    };

    // Process based on apply_to type
    switch (apply_to) {
      case 'articles':
        if (articles.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'At least one article must be selected' });
        }
        await remise.addDiscounted_articles(articles, { transaction });
        await updateAffectedArticles(articles);
        break;

      case 'categories':
        if (categories.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'At least one category must be selected' });
        }
        await remise.addDiscounted_categories(categories, { transaction });
        
        // Find all articles in these categories
        const categoryArticles = await Article.findAll({
          where: { categorie_id: categories },
          attributes: ['id'],
          transaction
        });
        
        if (categoryArticles.length > 0) {
          const articleIds = categoryArticles.map(a => a.id);
          await updateAffectedArticles(articleIds);
        }
        break;

      case 'marques':
        if (marques.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'At least one brand must be selected' });
        }
        await remise.addDiscounted_marques(marques, { transaction });
        
        // Find all articles from these brands
        const brandArticles = await Article.findAll({
          where: { marque_id: marques },
          attributes: ['id'],
          transaction
        });
        
        if (brandArticles.length > 0) {
          const articleIds = brandArticles.map(a => a.id);
          await updateAffectedArticles(articleIds);
        }
        break;

      case 'genres':
        if (genres.length === 0) {
          await transaction.rollback();
          return res.status(400).json({ error: 'At least one genre must be selected' });
        }
        await remise.addDiscounted_genres(genres, { transaction });
        
        // Find all articles in these genres
        const genreArticles = await Article.findAll({
          where: { genre_id: genres },
          attributes: ['id'],
          transaction
        });
        
        if (genreArticles.length > 0) {
          const articleIds = genreArticles.map(a => a.id);
          await updateAffectedArticles(articleIds);
        }
        break;

      case 'tous':
        // No specific associations needed for "all products"
        // Update prices for all active articles
        const allArticles = await Article.findAll({
          attributes: ['id'],
          transaction
        });
        
        if (allArticles.length > 0) {
          const articleIds = allArticles.map(a => a.id);
          await updateAffectedArticles(articleIds);
        }
        break;

      default:
        await transaction.rollback();
        return res.status(400).json({ error: 'Invalid apply_to value' });
    }

    await transaction.commit();

    // Reload the remise with all associations
    const fullRemise = await Remise.findByPk(remise.id, {
      include: [
        { model: Article, as: 'discounted_articles' },
        { model: Categorie, as: 'discounted_categories' },
        { model: Marque, as: 'discounted_marques' },
        { model: Genre, as: 'discounted_genres' },
      ],
    });

    res.status(201).json(fullRemise);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating discount:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        error: 'Discount code already exists',
        details: error.errors 
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create discount', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


// Other controller methods remain the same...

// Get all active discounts
const getActiveRemises = async (req, res) => {
  try {
    const currentDate = new Date();
    const remises = await Remise.findAll({
      where: {
        est_active: true,
        date_debut: { [Op.lte]: currentDate },
        date_fin: { [Op.gte]: currentDate }
      },
      include: [
        { model: Article, as: 'discounted_articles', through: { attributes: [] } },
        { model: Categorie, as: 'discounted_categories', through: { attributes: [] } },
        { model: Marque, as: 'discounted_marques', through: { attributes: [] } },
        { model: Genre, as: 'discounted_genres', through: { attributes: [] } },
        { model: Taille, as: 'discounted_tailles', through: { attributes: [] } },
        { model: Couleur, as: 'discounted_couleurs', through: { attributes: [] } },
        { model: Utilisateur, as: 'discounted_utilisateurs', through: { attributes: [] } }
      ]
    });
    
    res.json(remises);
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    res.status(500).json({ error: 'Failed to fetch active discounts', details: error.message });
  }
};

// Apply discount to articles
const applyRemiseToArticles = async (req, res) => {
  try {
    const { remiseId } = req.params;
    const { articleIds } = req.body;

    const remise = await Remise.findByPk(remiseId);
    if (!remise) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    await remise.addDiscounted_articles(articleIds);
    
    // Update prices for these articles
    const articles = await Article.findAll({
      where: { id: articleIds },
      include: [{ model: Remise, as: 'article_discounts' }]
    });

    res.json({ message: 'Discount applied successfully', articles });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: 'Failed to apply discount', details: error.message });
  }
};

// Remove discount from articles
const removeRemiseFromArticles = async (req, res) => {
  try {
    const { remiseId } = req.params;
    const { articleIds } = req.body;

    const remise = await Remise.findByPk(remiseId);
    if (!remise) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    await remise.removeDiscounted_articles(articleIds);
    
    res.json({ message: 'Discount removed successfully' });
  } catch (error) {
    console.error('Error removing discount:', error);
    res.status(500).json({ error: 'Failed to remove discount', details: error.message });
  }
};

// Update a discount
const updateRemise = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const remise = await Remise.findByPk(id);
    if (!remise) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    await remise.update(updates);
    
    // Reload with associations
    const updatedRemise = await Remise.findByPk(id, {
      include: [
        { model: Article, as: 'discounted_articles' },
        { model: Categorie, as: 'discounted_categories' },
        { model: Marque, as: 'discounted_marques' },
        { model: Genre, as: 'discounted_genres' },
        { model: Taille, as: 'discounted_tailles' },
        { model: Couleur, as: 'discounted_couleurs' },
        { model: Utilisateur, as: 'discounted_utilisateurs' }
      ]
    });
    
    res.json(updatedRemise);
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({ error: 'Failed to update discount', details: error.message });
  }
};

// Delete a discount
const deleteRemise = async (req, res) => {
  try {
    const { id } = req.params;

    const remise = await Remise.findByPk(id);
    if (!remise) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    await remise.destroy();
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({ error: 'Failed to delete discount', details: error.message });
  }
};

module.exports = {
  createRemise,
  getActiveRemises,
  applyRemiseToArticles,
  removeRemiseFromArticles,
  updateRemise,
  deleteRemise
};