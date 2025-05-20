const { Op } = require('sequelize');
const { Remise, Article, Categorie, Marque, Genre } = require('../models');
const { sequelize } = require("../models");

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

// Helper function to apply discount to specific articles
const applyDiscountToArticles = async (remise, articleIds, transaction) => {
  if (!articleIds || articleIds.length === 0) return;

  const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
  
  if (validArticleIds.length === 0) {
    throw new Error('No valid article IDs provided');
  }

  // Verify articles exist
  const articles = await Article.findAll({
    where: { id: validArticleIds },
    transaction
  });

  if (articles.length !== validArticleIds.length) {
    throw new Error('One or more articles do not exist');
  }

  // Clear existing associations for these specific articles
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: validArticleIds,
      remise_id: remise.id
    },
    transaction
  });

  // Create new associations
  const articleQuery = `
    INSERT INTO remise_article (remise_id, article_id, created_at, updated_at)
    VALUES ${validArticleIds.map(id => 
      `(${remise.id}, ${id}, NOW(), NOW())`
    ).join(',')}
    ON CONFLICT (remise_id, article_id) DO NOTHING
  `;
  
  await sequelize.query(articleQuery, { transaction });

  // Update prices for only these articles
  await Promise.all(articles.map(async article => {
    const newPrice = calculateFinalPrice(article.prix, remise);
    await article.update({ prix_final: newPrice }, { transaction });
  }));
};

// Helper function for categories
const applyDiscountToCategories = async (remise, categoryIds, articleIds = [], transaction) => {
  if (!categoryIds || categoryIds.length === 0) return;

  const validCategoryIds = categoryIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
  
  if (validCategoryIds.length === 0) {
    throw new Error('No valid category IDs provided');
  }

  // Verify categories exist
  const categories = await Categorie.findAll({
    where: { id: validCategoryIds },
    transaction
  });

  if (categories.length !== validCategoryIds.length) {
    throw new Error('One or more categories do not exist');
  }

  // Create category associations
  const categoryQuery = `
    INSERT INTO remise_categorie (remise_id, categorie_id, created_at, updated_at)
    VALUES ${validCategoryIds.map(id => 
      `(${remise.id}, ${id}, NOW(), NOW())`
    ).join(',')}
    ON CONFLICT (remise_id, categorie_id) DO NOTHING
  `;
  
  await sequelize.query(categoryQuery, { transaction });

  // Build where clause for articles
  const whereClause = { 
    categorie_id: validCategoryIds 
  };

  // If specific article IDs are provided, only apply to those articles
  if (articleIds && articleIds.length > 0) {
    const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
    whereClause.id = validArticleIds;
  }

  const articles = await Article.findAll({
    where: whereClause,
    transaction
  });

  if (articles.length === 0) {
    console.warn('No articles found for the specified categories and article IDs');
    return;
  }

  // Clear existing associations for these articles
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: articles.map(a => a.id),
      remise_id: remise.id
    },
    transaction
  });

  // Create new associations
  await sequelize.models.RemiseArticle.bulkCreate(
    articles.map(article => ({
      remise_id: remise.id,
      article_id: article.id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction }
  );

  // Update prices for these articles
  await Promise.all(articles.map(async article => {
    const newPrice = calculateFinalPrice(article.prix, remise);
    await article.update({ prix_final: newPrice }, { transaction });
  }));
};

// Helper function for brands
const applyDiscountToMarques = async (remise, marqueIds, articleIds = [], transaction) => {
  if (!marqueIds || marqueIds.length === 0) return;

  const validMarqueIds = marqueIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
  
  if (validMarqueIds.length === 0) {
    throw new Error('No valid marque IDs provided');
  }

  // Verify marques exist
  const marques = await Marque.findAll({
    where: { id: validMarqueIds },
    transaction
  });

  if (marques.length !== validMarqueIds.length) {
    throw new Error('One or more marques do not exist');
  }

  // Create marque associations
  const marqueQuery = `
    INSERT INTO remise_marque (remise_id, marque_id, created_at, updated_at)
    VALUES ${validMarqueIds.map(id => 
      `(${remise.id}, ${id}, NOW(), NOW())`
    ).join(',')}
    ON CONFLICT (remise_id, marque_id) DO NOTHING
  `;
  
  await sequelize.query(marqueQuery, { transaction });

  // Build where clause for articles
  const whereClause = { 
    marque_id: validMarqueIds 
  };

  // If specific article IDs are provided, only apply to those articles
  if (articleIds && articleIds.length > 0) {
    const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
    whereClause.id = validArticleIds;
  }

  const articles = await Article.findAll({
    where: whereClause,
    transaction
  });

  if (articles.length === 0) {
    console.warn('No articles found for the specified marques and article IDs');
    return;
  }

  // Clear existing associations for these articles
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: articles.map(a => a.id),
      remise_id: remise.id
    },
    transaction
  });

  // Create new associations
  await sequelize.models.RemiseArticle.bulkCreate(
    articles.map(article => ({
      remise_id: remise.id,
      article_id: article.id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction }
  );

  // Update prices for these articles
  await Promise.all(articles.map(async article => {
    const newPrice = calculateFinalPrice(article.prix, remise);
    await article.update({ prix_final: newPrice }, { transaction });
  }));
};

// Helper function for genres
const applyDiscountToGenres = async (remise, genreIds, articleIds = [], transaction) => {
  if (!genreIds || genreIds.length === 0) return;

  const validGenreIds = genreIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
  
  if (validGenreIds.length === 0) {
    throw new Error('No valid genre IDs provided');
  }

  // Verify genres exist
  const genres = await Genre.findAll({
    where: { id: validGenreIds },
    transaction
  });

  if (genres.length !== validGenreIds.length) {
    throw new Error('One or more genres do not exist');
  }

  // Create genre associations
  const genreQuery = `
    INSERT INTO remise_genre (remise_id, genre_id, created_at, updated_at)
    VALUES ${validGenreIds.map(id => 
      `(${remise.id}, ${id}, NOW(), NOW())`
    ).join(',')}
    ON CONFLICT (remise_id, genre_id) DO NOTHING
  `;
  
  await sequelize.query(genreQuery, { transaction });

  // Build where clause for articles
  const whereClause = { 
    genre_id: validGenreIds 
  };

  // If specific article IDs are provided, only apply to those articles
  if (articleIds && articleIds.length > 0) {
    const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
    whereClause.id = validArticleIds;
  }

  const articles = await Article.findAll({
    where: whereClause,
    transaction
  });

  if (articles.length === 0) {
    console.warn('No articles found for the specified genres and article IDs');
    return;
  }

  // Clear existing associations for these articles
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: articles.map(a => a.id),
      remise_id: remise.id
    },
    transaction
  });

  // Create new associations
  await sequelize.models.RemiseArticle.bulkCreate(
    articles.map(article => ({
      remise_id: remise.id,
      article_id: article.id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction }
  );

  // Update prices for these articles
  await Promise.all(articles.map(async article => {
    const newPrice = calculateFinalPrice(article.prix, remise);
    await article.update({ prix_final: newPrice }, { transaction });
  }));
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
      est_cumulable = false,
      apply_to = 'articles',
      articles = [],
      categories = [],
      marques = [],
      genres = [],
    } = req.body;

    // Validate required fields
    if (!code || !libelle || !type_remise || !valeur || !date_debut || !date_fin) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Validate discount value based on type
    if (type_remise === 'pourcentage' && (valeur <= 0 || valeur > 100)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Percentage discount must be between 0 and 100' 
      });
    }

    if (type_remise === 'montant_fixe' && valeur <= 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Fixed amount discount must be greater than 0' 
      });
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

    // Process based on apply_to type
    switch (apply_to) {
      case 'articles':
        await applyDiscountToArticles(remise, articles, transaction);
        break;

      case 'categories':
        await applyDiscountToCategories(remise, categories, articles, transaction);
        break;

      case 'marques':
        await applyDiscountToMarques(remise, marques, articles, transaction);
        break;

      case 'genres':
        await applyDiscountToGenres(remise, genres, articles, transaction);
        break;

      case 'all':
        // Apply to all products (or selected articles if provided)
        const whereClause = {};
        if (articles && articles.length > 0) {
          whereClause.id = articles.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
        }
        
        const allArticles = await Article.findAll({
          where: whereClause,
          transaction
        });

        if (allArticles.length === 0) {
          console.warn('No articles found to apply discount to');
          break;
        }

        // Clear existing associations
        await sequelize.models.RemiseArticle.destroy({
          where: {
            article_id: allArticles.map(a => a.id),
            remise_id: remise.id
          },
          transaction
        });

        // Create new associations
        await sequelize.models.RemiseArticle.bulkCreate(
          allArticles.map(article => ({
            remise_id: remise.id,
            article_id: article.id,
            created_at: new Date(),
            updated_at: new Date()
          })),
          { transaction }
        );

        // Update prices
        await Promise.all(allArticles.map(async article => {
          const newPrice = calculateFinalPrice(article.prix, remise);
          await article.update({ prix_final: newPrice }, { transaction });
        }));
        break;

      default:
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: 'Invalid apply_to value' 
        });
    }

    await transaction.commit();

    // Get the full discount with associations
    const fullRemise = await Remise.findByPk(remise.id, {
      include: [
        { model: Article, as: 'discounted_articles', attributes: ['id', 'nom_produit', 'prix', 'prix_final'] },
        { model: Categorie, as: 'discounted_categories', attributes: ['id', 'libelle'] },
        { model: Marque, as: 'discounted_marques', attributes: ['id', 'libelle'] },
        { model: Genre, as: 'discounted_genres', attributes: ['id', 'libelle'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      data: fullRemise
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createRemise:', error);
    
    if (error.message.includes('Invalid') || error.message.includes('No valid')) {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'Discount code already exists',
        details: error.errors 
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create discount', 
      error: error.message,
    });
  }
};


const deleteRemise = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const remise = await Remise.findByPk(id, { transaction });
    if (!remise) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Discount not found' });
    }

    // Get all articles affected by this discount
    const affectedArticles = await sequelize.models.Article.findAll({
      include: [{
        model: Remise,
        as: 'article_discounts',
        where: { id: id },
        through: { attributes: [] }
      }],
      transaction
    });

    // Remove all associations
    await sequelize.models.RemiseArticle.destroy({
      where: { remise_id: id },
      transaction
    });

    await sequelize.models.RemiseCategorie.destroy({
      where: { remise_id: id },
      transaction
    });

    await sequelize.models.RemiseMarque.destroy({
      where: { remise_id: id },
      transaction
    });

    await sequelize.models.RemiseGenre.destroy({
      where: { remise_id: id },
      transaction
    });

    // Restore original prices or apply next best discount
    await Promise.all(affectedArticles.map(async article => {
      // Option 1: Simply revert to original price
      await article.update({ prix_final: article.prix }, { transaction });
    }));

    // Finally delete the discount
    await remise.destroy({ transaction });
    await transaction.commit();
    
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting discount:', error);
    res.status(500).json({ 
      error: 'Failed to delete discount', 
      details: error.message,
    });
  }
};


// Get all discounts (both active and inactive)
const getAllRemises = async (req, res) => {
  try {
    const remises = await Remise.findAll({
      include: [
        { 
          model: Article, 
          as: 'discounted_articles',
          through: { attributes: [] },
          attributes: ['id', 'nom_produit', 'prix', 'prix_final']
        },
        { 
          model: Categorie, 
          as: 'discounted_categories',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        },
        { 
          model: Marque, 
          as: 'discounted_marques',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        },
        { 
          model: Genre, 
          as: 'discounted_genres',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        }
      ],
      order: [['date_debut', 'DESC']]
    });

    res.json(remises);
  } catch (error) {
    console.error('Error fetching all discounts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch discounts',
      details: error.message 
    });
  }
};

// Get only active discounts (current date within range)
const getActiveRemises = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Format date without time for comparison
    const formattedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    const remises = await Remise.findAll({
      where: {
        est_active: true,
        date_debut: { [Op.lte]: formattedDate },
        date_fin: { [Op.gte]: formattedDate }
      },
      include: [
        { 
          model: Article, 
          as: 'discounted_articles',
          through: { attributes: [] },
          attributes: ['id', 'nom_produit', 'prix', 'prix_final']
        },
        { 
          model: Categorie, 
          as: 'discounted_categories',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        },
        { 
          model: Marque, 
          as: 'discounted_marques',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        },
        { 
          model: Genre, 
          as: 'discounted_genres',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        }
      ],
      order: [['valeur', 'DESC']] // Sort by highest discount first
    });

    res.json(remises);
  } catch (error) {
    console.error('Error fetching active discounts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active discounts',
      details: error.message 
    });
  }
};

// Apply discount to articles
const applyRemiseToArticles = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { remiseId } = req.params;
    const { articleIds } = req.body;

    const remise = await Remise.findByPk(remiseId, { transaction });
    if (!remise) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Discount not found' });
    }

    await remise.addDiscounted_articles(articleIds, { transaction });
    
    // Update prices for these articles
    const articles = await Article.findAll({
      where: { id: articleIds },
      include: [{ 
        model: Remise, 
        as: 'article_discounts',
        where: {
          est_active: true,
          date_debut: { [Op.lte]: new Date() },
          date_fin: { [Op.gte]: new Date() }
        },
        required: false
      }],
      transaction
    });

    await Promise.all(articles.map(async article => {
      const bestDiscount = article.article_discounts.reduce((prev, current) => {
        const prevValue = calculateFinalPrice(article.prix, prev);
        const currentValue = calculateFinalPrice(article.prix, current);
        return (prevValue < currentValue) ? prev : current;
      }, null);

      const newPrice = calculateFinalPrice(article.prix, bestDiscount);
      if (article.prix_final !== newPrice) {
        await article.update({ prix_final: newPrice }, { transaction });
      }
    }));

    await transaction.commit();
    res.json({ message: 'Discount applied successfully', articles });
  } catch (error) {
    await transaction.rollback();
    console.error('Error applying discount:', error);
    res.status(500).json({ error: 'Failed to apply discount', details: error.message });
  }
};

// Remove discount from articles
const removeRemiseFromArticles = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { remiseId } = req.params;
    const { articleIds } = req.body;

    const remise = await Remise.findByPk(remiseId, { transaction });
    if (!remise) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Discount not found' });
    }

    await remise.removeDiscounted_articles(articleIds, { transaction });
    
    // Update prices for these articles (remove the discount)
    const articles = await Article.findAll({
      where: { id: articleIds },
      include: [{ 
        model: Remise, 
        as: 'article_discounts',
        where: {
          est_active: true,
          date_debut: { [Op.lte]: new Date() },
          date_fin: { [Op.gte]: new Date() },
          id: { [Op.ne]: remiseId } // Exclude the current discount
        },
        required: false
      }],
      transaction
    });

    await Promise.all(articles.map(async article => {
      const bestDiscount = article.article_discounts.reduce((prev, current) => {
        const prevValue = calculateFinalPrice(article.prix, prev);
        const currentValue = calculateFinalPrice(article.prix, current);
        return (prevValue < currentValue) ? prev : current;
      }, null);

      const newPrice = calculateFinalPrice(article.prix, bestDiscount);
      await article.update({ prix_final: newPrice }, { transaction });
    }));

    await transaction.commit();
    res.json({ message: 'Discount removed successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error removing discount:', error);
    res.status(500).json({ error: 'Failed to remove discount', details: error.message });
  }
};

// Update a discount
const updateRemise = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const updates = req.body;

    const remise = await Remise.findByPk(id, { transaction });
    if (!remise) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Discount not found' });
    }

    await remise.update(updates, { transaction });
    
    // If discount is being deactivated or dates changed, update affected articles
    if (updates.est_active === false || updates.date_debut || updates.date_fin) {
      const articleIds = (await remise.getDiscounted_articles({ transaction })).map(a => a.id);
      if (articleIds.length > 0) {
        const articles = await Article.findAll({
          where: { id: articleIds },
          include: [{ 
            model: Remise, 
            as: 'article_discounts',
            where: {
              est_active: true,
              date_debut: { [Op.lte]: new Date() },
              date_fin: { [Op.gte]: new Date() },
              id: { [Op.ne]: id } // Exclude the current discount if it's no longer active
            },
            required: false
          }],
          transaction
        });

        await Promise.all(articles.map(async article => {
          const bestDiscount = article.article_discounts.reduce((prev, current) => {
            const prevValue = calculateFinalPrice(article.prix, prev);
            const currentValue = calculateFinalPrice(article.prix, current);
            return (prevValue < currentValue) ? prev : current;
          }, null);

          const newPrice = calculateFinalPrice(article.prix, bestDiscount);
          await article.update({ prix_final: newPrice }, { transaction });
        }));
      }
    }
    
    await transaction.commit();
    
    // Reload with associations
    const updatedRemise = await Remise.findByPk(id, {
      include: [
        { model: Article, as: 'discounted_articles' },
        { model: Categorie, as: 'discounted_categories' },
        { model: Marque, as: 'discounted_marques' },
        { model: Genre, as: 'discounted_genres' }
      ]
    });
    
    res.json(updatedRemise);
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating discount:', error);
    res.status(500).json({ error: 'Failed to update discount', details: error.message });
  }
};

/* const getRemiseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const remise = await Remise.findByPk(id, {
      include: [
        { 
          model: Article, 
          as: 'discounted_articles',
          through: { attributes: [] },
          attributes: ['id', 'nom_produit', 'prix', 'prix_final'],
          required: false // Change to false to make it a LEFT JOIN
        },
        { 
          model: Categorie, 
          as: 'discounted_categories',
          through: { attributes: [] },
          attributes: ['id', 'libelle'],
          required: false // Change to false
        },
        { 
          model: Marque, 
          as: 'discounted_marques',
          through: { attributes: [] },
          attributes: ['id', 'libelle'],
          required: false // Change to false
        },
        { 
          model: Genre, 
          as: 'discounted_genres',
          through: { attributes: [] },
          attributes: ['id', 'libelle'],
          required: false // Change to false
        }
      ]
    });

    if (!remise) {
      return res.status(404).json({ 
        success: false,
        message: 'Discount not found' 
      });
    }

    res.json({
      success: true,
      data: remise
    });
  } catch (error) {
    console.error('Error fetching discount by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch discount',
      error: error.message 
    });
  }
}; */

const getRemiseById = async (req, res) => {
  try {
    const { id } = req.params;
    const remise = await Remise.findByPk(id, {
      include: [
        { 
          model: Article, 
          as: 'discounted_articles',
          through: { attributes: [] },
          attributes: ['id', 'nom_produit', 'prix', 'prix_final']
        },
        { 
          model: Categorie, 
          as: 'discounted_categories',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        },
        { 
          model: Marque, 
          as: 'discounted_marques',
          through: { attributes: [] },
  attributes: ['id', 'libelle']
},
        { 
          model: Genre, 
          as: 'discounted_genres',
          through: { attributes: [] },
          attributes: ['id', 'libelle']
        }
      ]
    });

    if (!remise) {
      return res.status(404).json({ 
        success: false,
        message: 'Discount not found' 
      });
    }

    res.json({
      success: true,
      data: remise
    });
  } catch (error) {
    console.error('Error fetching discount:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch discount',
      details: error.message 
    });
  }
};
module.exports = {
  createRemise,
  getActiveRemises,
  applyRemiseToArticles,
  removeRemiseFromArticles,
  updateRemise,
  deleteRemise,
  getAllRemises,
  getRemiseById
};