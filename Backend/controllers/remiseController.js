const { Op } = require('sequelize');
const { Remise, Article, Categorie, Marque, Genre, Evenement } = require('../models'); // Import Evenement
const { sequelize } = require("../models"); // Import sequelize instance for transactions and raw queries

// Helper function to calculate final price based on discount type
const calculateFinalPrice = (originalPrice, discount) => {
  if (!discount || !discount.type_remise) return originalPrice; // Ensure discount and its type exist

  switch (discount.type_remise) {
    case 'pourcentage':
      // Ensure percentage is between 0 and 100
      const percentage = Math.min(100, Math.max(0, discount.valeur));
      return originalPrice * (1 - percentage / 100);
    case 'montant_fixe':
      return Math.max(0, originalPrice - discount.valeur);
    // Add other types like 'bogo', 'seuil' here if they affect individual article price
    default:
      return originalPrice;
  }
};

// Helper function to apply discount to specific articles
const applyDiscountToArticles = async (remise, articleIds, transaction) => {
  if (!articleIds || articleIds.length === 0) return;

  const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);

  if (validArticleIds.length === 0) {
    // No valid IDs means nothing to do, not necessarily an error to throw for this helper
    console.warn('No valid article IDs provided for discount application.');
    return;
  }

  // Verify articles exist
  const articles = await Article.findAll({
    where: { id: validArticleIds },
    transaction
  });

  if (articles.length !== validArticleIds.length) {
    // Identify which IDs are invalid
    const foundIds = new Set(articles.map(a => a.id));
    const notFoundIds = validArticleIds.filter(id => !foundIds.has(id));
    throw new Error(`One or more articles do not exist: IDs ${notFoundIds.join(', ')}`);
  }

  // Clear existing associations for these specific articles for this remise
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: validArticleIds,
      remise_id: remise.id
    },
    transaction
  });

  // Create new associations (using bulkCreate for efficiency)
  await sequelize.models.RemiseArticle.bulkCreate(
    validArticleIds.map(article_id => ({
      remise_id: remise.id,
      article_id: article_id,
      created_at: new Date(), // Sequelize manages these but explicit is fine
      updated_at: new Date()
    })),
    { transaction, ignoreDuplicates: true } // ignoreDuplicates helps with ON CONFLICT DO NOTHING behavior
  );

  // Update prices for only these articles
  await Promise.all(articles.map(async article => {
    // When applying a new discount, we should apply it if active and it results in a lower price.
    // For simplicity here, we're assuming this specific `remise` is the one being applied.
    // A more complex system would find the *best* active discount.
    const newPrice = calculateFinalPrice(article.prix, remise);
    if (article.prix_final !== newPrice) { // Only update if price actually changes
      await article.update({ prix_final: newPrice }, { transaction });
    }
  }));
};

// Helper function for categories
const applyDiscountToCategories = async (remise, categoryIds, articleIds = [], transaction) => {
  if (!categoryIds || categoryIds.length === 0) return;

  const validCategoryIds = categoryIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);

  if (validCategoryIds.length === 0) {
    console.warn('No valid category IDs provided for discount application.');
    return;
  }

  // Verify categories exist
  const categories = await Categorie.findAll({
    where: { id: validCategoryIds },
    transaction
  });

  if (categories.length !== validCategoryIds.length) {
    const foundIds = new Set(categories.map(c => c.id));
    const notFoundIds = validCategoryIds.filter(id => !foundIds.has(id));
    throw new Error(`One or more categories do not exist: IDs ${notFoundIds.join(', ')}`);
  }

  // Clear existing category associations for this remise
  await sequelize.models.RemiseCategorie.destroy({
    where: {
      categorie_id: validCategoryIds,
      remise_id: remise.id
    },
    transaction
  });

  // Create category associations
  await sequelize.models.RemiseCategorie.bulkCreate(
    validCategoryIds.map(categorie_id => ({
      remise_id: remise.id,
      categorie_id: categorie_id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction, ignoreDuplicates: true }
  );

  // Build where clause for articles that belong to these categories
  const articleWhereClause = {
    categorie_id: validCategoryIds
  };

  // If specific article IDs are also provided, intersect them
  if (articleIds && articleIds.length > 0) {
    const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
    if (validArticleIds.length > 0) {
      articleWhereClause.id = { [Op.in]: validArticleIds };
    }
  }

  const articlesToUpdate = await Article.findAll({
    where: articleWhereClause,
    transaction
  });

  if (articlesToUpdate.length === 0) {
    console.warn('No articles found for the specified categories (and optional article IDs) to apply discount to.');
    return;
  }

  // Clear existing RemiseArticle associations for these articles and this remise
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: articlesToUpdate.map(a => a.id),
      remise_id: remise.id
    },
    transaction
  });

  // Create new RemiseArticle associations
  await sequelize.models.RemiseArticle.bulkCreate(
    articlesToUpdate.map(article => ({
      remise_id: remise.id,
      article_id: article.id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction, ignoreDuplicates: true }
  );

  // Update prices for these articles
  await Promise.all(articlesToUpdate.map(async article => {
    const newPrice = calculateFinalPrice(article.prix, remise);
    if (article.prix_final !== newPrice) {
      await article.update({ prix_final: newPrice }, { transaction });
    }
  }));
};

// Helper function for brands
const applyDiscountToMarques = async (remise, marqueIds, articleIds = [], transaction) => {
  if (!marqueIds || marqueIds.length === 0) return;

  const validMarqueIds = marqueIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);

  if (validMarqueIds.length === 0) {
    console.warn('No valid marque IDs provided for discount application.');
    return;
  }

  // Verify marques exist
  const marques = await Marque.findAll({
    where: { id: validMarqueIds },
    transaction
  });

  if (marques.length !== validMarqueIds.length) {
    const foundIds = new Set(marques.map(m => m.id));
    const notFoundIds = validMarqueIds.filter(id => !foundIds.has(id));
    throw new Error(`One or more marques do not exist: IDs ${notFoundIds.join(', ')}`);
  }

  // Clear existing marque associations for this remise
  await sequelize.models.RemiseMarque.destroy({
    where: {
      marque_id: validMarqueIds,
      remise_id: remise.id
    },
    transaction
  });

  // Create marque associations
  await sequelize.models.RemiseMarque.bulkCreate(
    validMarqueIds.map(marque_id => ({
      remise_id: remise.id,
      marque_id: marque_id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction, ignoreDuplicates: true }
  );

  // Build where clause for articles that belong to these marques
  const articleWhereClause = {
    marque_id: validMarqueIds
  };

  // If specific article IDs are also provided, intersect them
  if (articleIds && articleIds.length > 0) {
    const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
    if (validArticleIds.length > 0) {
      articleWhereClause.id = { [Op.in]: validArticleIds };
    }
  }

  const articlesToUpdate = await Article.findAll({
    where: articleWhereClause,
    transaction
  });

  if (articlesToUpdate.length === 0) {
    console.warn('No articles found for the specified marques (and optional article IDs) to apply discount to.');
    return;
  }

  // Clear existing RemiseArticle associations for these articles and this remise
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: articlesToUpdate.map(a => a.id),
      remise_id: remise.id
    },
    transaction
  });

  // Create new RemiseArticle associations
  await sequelize.models.RemiseArticle.bulkCreate(
    articlesToUpdate.map(article => ({
      remise_id: remise.id,
      article_id: article.id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction, ignoreDuplicates: true }
  );

  // Update prices for these articles
  await Promise.all(articlesToUpdate.map(async article => {
    const newPrice = calculateFinalPrice(article.prix, remise);
    if (article.prix_final !== newPrice) {
      await article.update({ prix_final: newPrice }, { transaction });
    }
  }));
};

// Helper function for genres
const applyDiscountToGenres = async (remise, genreIds, articleIds = [], transaction) => {
  if (!genreIds || genreIds.length === 0) return;

  const validGenreIds = genreIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);

  if (validGenreIds.length === 0) {
    console.warn('No valid genre IDs provided for discount application.');
    return;
  }

  // Verify genres exist
  const genres = await Genre.findAll({
    where: { id: validGenreIds },
    transaction
  });

  if (genres.length !== validGenreIds.length) {
    const foundIds = new Set(genres.map(g => g.id));
    const notFoundIds = validGenreIds.filter(id => !foundIds.has(id));
    throw new Error(`One or more genres do not exist: IDs ${notFoundIds.join(', ')}`);
  }

  // Clear existing genre associations for this remise
  await sequelize.models.RemiseGenre.destroy({
    where: {
      genre_id: validGenreIds,
      remise_id: remise.id
    },
    transaction
  });

  // Create genre associations
  await sequelize.models.RemiseGenre.bulkCreate(
    validGenreIds.map(genre_id => ({
      remise_id: remise.id,
      genre_id: genre_id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction, ignoreDuplicates: true }
  );

  // Build where clause for articles that belong to these genres
  const articleWhereClause = {
    genre_id: validGenreIds
  };

  // If specific article IDs are also provided, intersect them
  if (articleIds && articleIds.length > 0) {
    const validArticleIds = articleIds.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
    if (validArticleIds.length > 0) {
      articleWhereClause.id = { [Op.in]: validArticleIds };
    }
  }

  const articlesToUpdate = await Article.findAll({
    where: articleWhereClause,
    transaction
  });

  if (articlesToUpdate.length === 0) {
    console.warn('No articles found for the specified genres (and optional article IDs) to apply discount to.');
    return;
  }

  // Clear existing RemiseArticle associations for these articles and this remise
  await sequelize.models.RemiseArticle.destroy({
    where: {
      article_id: articlesToUpdate.map(a => a.id),
      remise_id: remise.id
    },
    transaction
  });

  // Create new RemiseArticle associations
  await sequelize.models.RemiseArticle.bulkCreate(
    articlesToUpdate.map(article => ({
      remise_id: remise.id,
      article_id: article.id,
      created_at: new Date(),
      updated_at: new Date()
    })),
    { transaction, ignoreDuplicates: true }
  );

  // Update prices for these articles
  await Promise.all(articlesToUpdate.map(async article => {
    const newPrice = calculateFinalPrice(article.prix, remise);
    if (article.prix_final !== newPrice) {
      await article.update({ prix_final: newPrice }, { transaction });
    }
  }));
};


// Main function to create a new discount
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
      apply_to = 'articles', // Default to 'articles' for explicit target
      articles = [],        // Array of article IDs
      categories = [],      // Array of category IDs
      marques = [],         // Array of brand IDs
      genres = [],          // Array of genre IDs
      evenement_id          // Optional event ID
    } = req.body;

    // --- Input Validations ---
    if (!code || !libelle || !type_remise || !valeur || !date_debut || !date_fin) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: code, libelle, type_remise, valeur, date_debut, date_fin'
      });
    }

    if (!['pourcentage', 'montant_fixe', 'bogo', 'seuil'].includes(type_remise)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid type_remise. Must be one of: pourcentage, montant_fixe, bogo, seuil'
      });
    }

    if (type_remise === 'pourcentage' && (valeur <= 0 || valeur > 100)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Percentage discount (valeur) must be between 0 and 100'
      });
    }
    if (type_remise === 'montant_fixe' && valeur <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Fixed amount discount (valeur) must be greater than 0'
      });
    }

    // Date validation: ensure date_fin is not before date_debut
    const startDate = new Date(date_debut);
    const endDate = new Date(date_fin);
    if (startDate > endDate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Date de fin cannot be before Date de debut.'
      });
    }

    // Validate evenement_id if provided
    let associatedEvent = null;
    if (evenement_id) {
      associatedEvent = await Evenement.findByPk(evenement_id, { transaction });
      if (!associatedEvent) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: `Evenement with ID ${evenement_id} not found.` });
      }
      // Optional: Check if the discount dates align with the event dates
      if (startDate < new Date(associatedEvent.date_debut) || endDate > new Date(associatedEvent.date_fin)) {
          console.warn(`Warning: Discount dates (${date_debut} to ${date_fin}) do not fully align with event dates (${associatedEvent.date_debut} to ${associatedEvent.date_fin}) for event_id: ${evenement_id}`);
          // You might choose to throw an error here instead of just a warning
          // return res.status(400).json({ success: false, message: 'Discount dates must be within the associated event dates.' });
      }
    }

    // --- Create the Discount ---
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
      evenement_id: evenement_id || null // Link the event
    }, { transaction });

    // --- Apply Discount to Targeted Entities ---
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
        // If apply_to is 'all', but specific articles are provided, apply only to those articles.
        // Otherwise, apply to *all* active articles in the database.
        let articlesToProcess;
        if (articles && articles.length > 0) {
            const validArticleIds = articles.filter(id => id !== null && id !== undefined && !isNaN(id) && id > 0);
            if (validArticleIds.length > 0) {
                articlesToProcess = await Article.findAll({
                    where: { id: { [Op.in]: validArticleIds } },
                    transaction
                });
                if (articlesToProcess.length !== validArticleIds.length) {
                    const foundIds = new Set(articlesToProcess.map(a => a.id));
                    const notFoundIds = validArticleIds.filter(id => !foundIds.has(id));
                    throw new Error(`One or more specific articles for 'apply_to: all' do not exist: IDs ${notFoundIds.join(', ')}`);
                }
            } else {
                articlesToProcess = await Article.findAll({ transaction }); // All active articles
            }
        } else {
            articlesToProcess = await Article.findAll({ transaction }); // All active articles
        }

        if (articlesToProcess.length === 0) {
          console.warn('No articles found to apply discount to for "apply_to: all".');
          break; // Exit switch case, no articles to update
        }

        // Clear existing RemiseArticle associations for these articles and this remise
        await sequelize.models.RemiseArticle.destroy({
          where: {
            article_id: articlesToProcess.map(a => a.id),
            remise_id: remise.id
          },
          transaction
        });

        // Create new RemiseArticle associations
        await sequelize.models.RemiseArticle.bulkCreate(
          articlesToProcess.map(article => ({
            remise_id: remise.id,
            article_id: article.id,
            created_at: new Date(),
            updated_at: new Date()
          })),
          { transaction, ignoreDuplicates: true }
        );

        // Update prices
        await Promise.all(articlesToProcess.map(async article => {
          const newPrice = calculateFinalPrice(article.prix, remise);
          if (article.prix_final !== newPrice) {
            await article.update({ prix_final: newPrice }, { transaction });
          }
        }));
        break;

      default:
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Invalid apply_to value: '${apply_to}'. Must be one of: all, categories, articles, marques, genres.`
        });
    }

    // --- Commit Transaction ---
    await transaction.commit();

    // --- Fetch and Return Full Remise Data ---
    // Fetch the newly created discount with all its associations for the response
    const fullRemise = await Remise.findByPk(remise.id, {
      include: [
        { model: Article, as: 'discounted_articles', attributes: ['id', 'nom_produit', 'prix', 'prix_final'] },
        { model: Categorie, as: 'discounted_categories', attributes: ['id', 'libelle'] },
        { model: Marque, as: 'discounted_marques', attributes: ['id', 'libelle'] },
        { model: Genre, as: 'discounted_genres', attributes: ['id', 'libelle'] },
        { model: Evenement, as: 'evenement', attributes: ['id', 'nom', 'date_debut', 'date_fin', 'type_evenement', 'annee'] } // Include event details
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Discount created successfully',
      data: fullRemise
    });

  } catch (error) {
    await transaction.rollback(); // Rollback transaction on any error
    console.error('Error in createRemise:', error);

    // --- Detailed Error Handling ---
    if (error.message.includes('Invalid') || error.message.includes('No valid')) {
      return res.status(400).json({
        success: false,
        message: error.message // Use the specific error message from helpers
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: `Discount with code '${req.body.code}' already exists.`, // More specific error
        details: error.errors
      });
    }

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error creating discount',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    // Generic 500 error for unhandled exceptions
    res.status(500).json({
      success: false,
      message: 'Failed to create discount due to a server error.',
      error: error.message,
    });
  }
};

/*const { Op } = require('sequelize');
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
}; */

/* const createRemise = async (req, res) => {
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
 */



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