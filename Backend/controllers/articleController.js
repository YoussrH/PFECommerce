const models = require("../models");
const { Article, Couleur, Taille, Genre, Categorie, Marque, ImageArticleCouleur, ArticleTaille, ArticleCouleur } = models;
const cloudinary = require("../config/cloudinaryConfig");
const { Op } = require("sequelize");
const { sequelize } = require("../models");
const { body, validationResult } = require('express-validator');

const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Bgtm_D");
    
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.cloudinary.com/v1_1/dnkd2ksye/image/upload", true);
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        reject(new Error("Échec du téléchargement"));
      }
    };
    
    xhr.onerror = () => reject(new Error("Erreur de téléchargement"));
    xhr.send(formData);
  });
};

// Middleware de validation pour la mise à jour des articles
const validateUpdateArticle = [
  body('nom_produit')
    .trim()
    .notEmpty().withMessage('Le nom du produit est requis')
    .isLength({ max: 255 }).withMessage('Le nom ne doit pas dépasser 255 caractères'),
  
  body('prix')
    .isFloat({ min: 0.01 }).withMessage('Le prix doit être un nombre positif'),
    
  body('remise')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('La remise doit être entre 0 et 100'),
    
  body('genre_id')
    .notEmpty().withMessage('Le genre est requis')
    .isInt().withMessage('ID de genre invalide'),
    
  body('categorie_id')
    .notEmpty().withMessage('La catégorie est requise')
    .isInt().withMessage('ID de catégorie invalide'),
    
  body('marque_id')
    .notEmpty().withMessage('La marque est requise')
    .isInt().withMessage('ID de marque invalide'),
    
  body('tailles')
    .custom(value => {
      try {
        const tailles = JSON.parse(value);
        return Array.isArray(tailles) && tailles.length > 0;
      } catch {
        return false;
      }
    }).withMessage('Au moins une taille est requise')
];

// Fonction pour formater les images par couleur
const formatImagesByColor = (images) => {
  const imagesParCouleur = {};
  images.forEach(image => {
    if (!imagesParCouleur[image.couleur_id]) {
      imagesParCouleur[image.couleur_id] = {
        couleur: image.couleur,
        images: []
      };
    }
    imagesParCouleur[image.couleur_id].images.push(image.image_url);
  });
  return imagesParCouleur;
};

// Fonction pour calculer le stock total
const calculateTotalStock = (tailles) => {
  return tailles.reduce((sum, taille) => {
    return sum + (taille.ArticleTaille?.quantite || 0);
  }, 0);
};



const ajouterArticle = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      nom_produit,
      description,
      conseils,
      prix,
      remise,
      sku,
      seo_titre,
      mots_cles_seo,
      categorie_id,
      marque_id,
      genre_id,
      variations,
      images_par_couleur
    } = req.body;

    // Validate variations
    if (!variations || variations.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Au moins une variation (couleur/taille) est requise" 
      });
    }

    // Create article
    const article = await Article.create({
      nom_produit,
      description,
      conseils,
      prix,
      prix_final: prix * (1 - (remise / 100)),
      sku,
      seo_titre,
      mots_cles_seo,
      categorie_id,
      marque_id,
      genre_id
    }, { transaction });

    // Process variations
    const variationPromises = variations.map(async (variation) => {
      // Check if the combination already exists
      const existing = await ArticleTaille.findOne({
        where: {
          article_id: article.id,
          taille_id: variation.taille_id,
          couleur_id: variation.couleur_id
        },
        transaction
      });

      if (existing) {
        // Update existing record instead of creating new one
        await existing.update({
          quantite: variation.quantite
        }, { transaction });
      } else {
        // Create new record
        await ArticleTaille.create({
          article_id: article.id,
          taille_id: variation.taille_id,
          couleur_id: variation.couleur_id,
          quantite: variation.quantite
        }, { transaction });
      }

      // Create article_couleur record if not exists
      await ArticleCouleur.findOrCreate({
        where: {
          article_id: article.id,
          couleur_id: variation.couleur_id
        },
        transaction
      });
    });

    await Promise.all(variationPromises);

    // Process images
    if (images_par_couleur) {
      // First delete existing images for this article
      await ImageArticleCouleur.destroy({
        where: { article_id: article.id },
        transaction
      });

      const imagePromises = Object.entries(images_par_couleur).map(async ([couleur_id, images]) => {
        for (const imageUrl of images) {
          await ImageArticleCouleur.create({
            article_id: article.id,
            couleur_id,
            image_url: imageUrl
          }, { transaction });
        }
      });
      await Promise.all(imagePromises);
    }

    await transaction.commit();

    // Fetch the complete article with associations
    const completeArticle = await Article.findByPk(article.id, {
      include: [
        { 
          model: Taille, 
          as: 'tailles',
          through: { attributes: ['quantite', 'couleur_id'] }
        },
        { 
          model: Couleur, 
          as: 'couleurs',
          through: { attributes: [] }
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs'
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: "Article ajouté avec succès",
      data: completeArticle
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in ajouterArticle:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Une combinaison article/taille/couleur existe déjà",
        error: error.errors 
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: error.message || "Erreur lors de l'ajout de l'article",
      error: error.errors || error.stack
    });
  }
};


const ajouterArticles = async (req, res) => {
  console.log('Request body:', req.body);

  if (!req.body.articles) {
    return res.status(400).json({
      success: false,
      message: "Le champ 'articles' est requis dans le corps de la requête"
    });
  }

  const transaction = await sequelize.transaction();
  
  try {
    const { articles } = req.body;

    if (!Array.isArray(articles) || articles.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Au moins un article est requis",
        receivedData: req.body
      });
    }

    // Validate all foreign keys first
    const allReferences = {
      couleurIds: new Set(),
      tailleIds: new Set(),
      categorieIds: new Set(),
      marqueIds: new Set(),
      genreIds: new Set()
    };

    // Collect all reference IDs
    articles.forEach(article => {
      allReferences.categorieIds.add(article.categorie_id);
      allReferences.marqueIds.add(article.marque_id);
      allReferences.genreIds.add(article.genre_id);
      
      article.variations.forEach(variation => {
        allReferences.couleurIds.add(variation.couleur_id);
        allReferences.tailleIds.add(variation.taille_id);
      });
    });

    // Convert Sets to Arrays
    const couleurIds = Array.from(allReferences.couleurIds);
    const tailleIds = Array.from(allReferences.tailleIds);
    const categorieIds = Array.from(allReferences.categorieIds);
    const marqueIds = Array.from(allReferences.marqueIds);
    const genreIds = Array.from(allReferences.genreIds);

    // Validate all references exist
    const [
      existingColors,
      existingSizes,
      existingCategories,
      existingBrands,
      existingGenres
    ] = await Promise.all([
      Couleur.findAll({ where: { id: couleurIds }, transaction }),
      Taille.findAll({ where: { id: tailleIds }, transaction }),
      Categorie.findAll({ where: { id: categorieIds }, transaction }),
      Marque.findAll({ where: { id: marqueIds }, transaction }),
      Genre.findAll({ where: { id: genreIds }, transaction })
    ]);

    // Check for missing references
    const missingReferences = {};
    
    if (existingColors.length !== couleurIds.length) {
      const existingColorIds = existingColors.map(c => c.id);
      missingReferences.couleurs = couleurIds.filter(id => !existingColorIds.includes(id));
    }
    
    if (existingSizes.length !== tailleIds.length) {
      const existingSizeIds = existingSizes.map(t => t.id);
      missingReferences.tailles = tailleIds.filter(id => !existingSizeIds.includes(id));
    }
    
    if (existingCategories.length !== categorieIds.length) {
      const existingCategoryIds = existingCategories.map(c => c.id);
      missingReferences.categories = categorieIds.filter(id => !existingCategoryIds.includes(id));
    }
    
    if (existingBrands.length !== marqueIds.length) {
      const existingBrandIds = existingBrands.map(m => m.id);
      missingReferences.marques = marqueIds.filter(id => !existingBrandIds.includes(id));
    }
    
    if (existingGenres.length !== genreIds.length) {
      const existingGenreIds = existingGenres.map(g => g.id);
      missingReferences.genres = genreIds.filter(id => !existingGenreIds.includes(id));
    }

    if (Object.keys(missingReferences).length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Certaines références n'existent pas dans la base de données",
        missingReferences
      });
    }

    // Process articles
    const createdArticles = [];

    for (const articleData of articles) {
      const {
        nom_produit,
        description,
        conseils,
        prix,
        remise = 0,
        sku,
        seo_titre,
        mots_cles_seo,
        categorie_id,
        marque_id,
        genre_id,
        variations,
        images_par_couleur
      } = articleData;

      // Validate required fields
      if (!nom_produit || !description || !prix || !categorie_id || !marque_id || !genre_id) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `L'article "${nom_produit || 'sans nom'}" a des champs manquants`
        });
      }

      if (!variations || variations.length === 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `L'article "${nom_produit}" doit avoir au moins une variation (couleur/taille)`
        });
      }

      // Create article
      const article = await Article.create({
        nom_produit,
        description,
        conseils,
        prix,
        prix_final: prix * (1 - (remise / 100)),
        sku,
        seo_titre,
        mots_cles_seo,
        categorie_id,
        marque_id,
        genre_id
      }, { transaction });

      // Process variations
      const variationPromises = variations.map(async (variation) => {
        const existing = await ArticleTaille.findOne({
          where: {
            article_id: article.id,
            taille_id: variation.taille_id,
            couleur_id: variation.couleur_id
          },
          transaction
        });

        if (existing) {
          await existing.update({
            quantite: variation.quantite
          }, { transaction });
        } else {
          await ArticleTaille.create({
            article_id: article.id,
            taille_id: variation.taille_id,
            couleur_id: variation.couleur_id,
            quantite: variation.quantite
          }, { transaction });
        }

        await ArticleCouleur.findOrCreate({
          where: {
            article_id: article.id,
            couleur_id: variation.couleur_id
          },
          transaction
        });
      });

      await Promise.all(variationPromises);

      // Process images
      if (images_par_couleur && Object.keys(images_par_couleur).length > 0) {
        // First validate all image colors exist in variations
        const imageColorIds = Object.keys(images_par_couleur).map(Number);
        const variationColorIds = variations.map(v => v.couleur_id);
        
        const invalidImageColors = imageColorIds.filter(
          colorId => !variationColorIds.includes(colorId)
        );

        if (invalidImageColors.length > 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `L'article "${nom_produit}" a des images pour des couleurs sans variation`,
            invalidImageColors
          });
        }

        // Delete existing images if any
        await ImageArticleCouleur.destroy({
          where: { article_id: article.id },
          transaction
        });

        // Create new images
        const imagePromises = Object.entries(images_par_couleur).map(
          async ([couleur_id, images]) => {
            const imageCreates = images.map(imageUrl => 
              ImageArticleCouleur.create({
                article_id: article.id,
                couleur_id,
                image_url: imageUrl
              }, { transaction })
            );
            await Promise.all(imageCreates);
          }
        );

        await Promise.all(imagePromises);
      }

      // Fetch the complete article with associations
      const completeArticle = await Article.findByPk(article.id, {
        include: [
          {
            model: Taille,
            as: 'tailles',
            through: { attributes: ['quantite', 'couleur_id'] }
          },
          {
            model: Couleur,
            as: 'couleurs',
            through: { attributes: [] }
          },
          {
            model: ImageArticleCouleur,
            as: 'images_couleurs'
          },
          {
            model: Categorie,
            as: 'categorie'
          },
          {
            model: Marque,
            as: 'marque'
          },
          {
            model: Genre,
            as: 'genre'
          }
        ],
        transaction
      });

      createdArticles.push(completeArticle);
    }

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "Articles ajoutés avec succès",
      data: createdArticles
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in ajouterArticles:', error);
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Violation de contrainte de clé étrangère",
        error: error.parent ? error.parent.detail : error.message
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Violation de contrainte d'unicité",
        error: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};





const mettreAJourArticle = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      nom_produit,
      description,
      prix,
      remise,
      sku,
      seo_titre,
      mots_cles_seo,
      categorie_id,
      marque_id,
      genre_id,
      conseils,
      variations,
      images_par_couleur = {}
    } = req.body;

    const article = await Article.findByPk(id, { transaction });
    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé" 
      });
    }

    await article.update({
      nom_produit,
      description,
      prix,
      remise,
      prix_final: prix * (1 - (remise / 100)),
      sku,
      seo_titre,
      mots_cles_seo,
      categorie_id,
      marque_id,
      genre_id,
      conseils
    }, { transaction });

    // Mettre à jour les variations (combinaisons couleur/taille)
    if (variations) {
      await models.ArticleTaille.destroy({ 
        where: { article_id: id },
        transaction 
      });
      
      const variationsACreer = [];
      const couleursUniques = new Set();
      
      for (const variation of variations) {
        variationsACreer.push({
          article_id: id,
          taille_id: parseInt(variation.taille_id),
          couleur_id: parseInt(variation.couleur_id),
          quantite: parseInt(variation.quantite)
        });
        couleursUniques.add(parseInt(variation.couleur_id));
      }

      await models.ArticleTaille.bulkCreate(variationsACreer, { transaction });
      
      // Mettre à jour les associations de couleur
      await models.ArticleCouleur.destroy({ 
        where: { article_id: id },
        transaction 
      });
      
      const associationsCouleurs = Array.from(couleursUniques).map(couleur_id => ({
        article_id: id,
        couleur_id
      }));
      
      await models.ArticleCouleur.bulkCreate(associationsCouleurs, { transaction });
    }
    
    // Mettre à jour les images
    if (images_par_couleur) {
      await ImageArticleCouleur.destroy({ 
        where: { article_id: id },
        transaction 
      });
      
      const imagesACreer = [];
      for (const couleurId in images_par_couleur) {
        const imagesPourCouleur = images_par_couleur[couleurId] || [];
        for (const imageUrl of imagesPourCouleur) {
          imagesACreer.push({
            article_id: id,
            couleur_id: couleurId,
            image_url: imageUrl
          });
        }
      }
      
      await ImageArticleCouleur.bulkCreate(imagesACreer, { transaction });
    }

    // Valider la transaction
    await transaction.commit();

    const articleMisAJour = await Article.scope('avecQuantiteTotale').findByPk(id, {
      include: [
        { 
          model: Taille, 
          as: 'tailles',
          through: { 
            model: models.ArticleTaille,
            attributes: ['quantite', 'couleur_id']
          }
        },
        { 
          model: Couleur, 
          as: 'couleurs',
          through: { attributes: [] } 
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }]
        }
      ]
    });

    // Formater les tailles par couleur
    const plainArticle = articleMisAJour.get({ plain: true });
    const taillesParCouleur = {};
    plainArticle.tailles.forEach(taille => {
      const couleurId = taille.ArticleTaille.couleur_id;
      if (!taillesParCouleur[couleurId]) {
        taillesParCouleur[couleurId] = {
          couleur: plainArticle.couleurs.find(c => c.id === couleurId),
          tailles: []
        };
      }
      taillesParCouleur[couleurId].tailles.push({
        id: taille.id,
        libelle: taille.libelle,
        quantite: taille.ArticleTaille.quantite
      });
    });

    res.json({
      success: true,
      message: "Article mis à jour avec succès",
      donnees: {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        images_par_couleur: formatImagesByColor(plainArticle.images_couleurs),
        tailles_par_couleur: taillesParCouleur
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Erreur lors de la mise à jour de l'article:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'article",
      error: error.message
    });
  }
};

// Supprimer un article
const supprimerArticle = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: ImageArticleCouleur, as: 'images_couleurs' }],
      transaction
    });
    
    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé" 
      });
    }

    // Supprimer les images de Cloudinary
    const images = article.images_couleurs || [];
    for (const image of images) {
      try {
        const publicId = image.image_url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`articles/${publicId}`);
      } catch (error) {
        console.error("Erreur lors de la suppression de l'image de Cloudinary:", error);
      }
    }

    // Supprimer les enregistrements de la base de données
    await models.ArticleTaille.destroy({ 
      where: { article_id: article.id },
      transaction 
    });
    
    await models.ArticleCouleur.destroy({ 
      where: { article_id: article.id },
      transaction 
    });
    
    await ImageArticleCouleur.destroy({ 
      where: { article_id: article.id },
      transaction 
    });
    
    await article.destroy({ transaction });

    // Valider la transaction
    await transaction.commit();

    res.json({ 
      success: true,
      message: "Article supprimé avec succès" 
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Erreur lors de la suppression de l'article:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la suppression de l'article", 
      error: error.message 
    });
  }
};


const filtrerArticles = async (req, res) => {
  try {
    const { filtres } = req.body;
    
    const where = { [Op.and]: [] };
    const include = [
      { 
        model: Marque, 
        as: 'marque',
        attributes: ['id', 'libelle']
      },
      { 
        model: Couleur, 
        as: 'couleurs', 
        through: { attributes: [] },
        attributes: ['id', 'libelle', 'hexcode']
      },
      { 
        model: Taille, 
        as: 'tailles', 
        through: { attributes: ['quantite'] },
        attributes: ['id', 'libelle']
      },
      { 
        model: Genre, 
        as: 'genre',
        attributes: ['id', 'libelle']
      },
      { 
        model: Categorie, 
        as: 'categorie',
        attributes: ['id', 'libelle']
      },
      {
        model: ImageArticleCouleur,
        as: 'images_couleurs',
        include: [{ model: Couleur, as: 'couleur' }],
        limit: 1
      }
    ];

    filtres.forEach(({ category, filter }) => {
      switch (category) {
        case "Prix":
          where[Op.and].push({
            prix_final: { [Op.between]: [filter.min, filter.max] }
          });
          break;
        case "Genres":
          include.push({
            model: Genre,
            as: 'genre',
            where: { libelle: filter },
            required: true
          });
          break;
        case "Catégories":
          include.push({
            model: Categorie,
            as: 'categorie',
            where: { libelle: filter },
            required: true
          });
          break;
        case "Tailles":
          include.push({
            model: Taille,
            as: 'tailles',
            where: { libelle: filter },
            required: true
          });
          break;
        case "Marques":
          include.push({
            model: Marque,
            as: 'marque',
            where: { libelle: filter },
            required: true
          });
          break;
      }
    });

    const articles = await Article.findAll({ 
      where,
      include,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    const formattedArticles = articles.map(article => {
      const plainArticle = article.get({ plain: true });
      return {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        primaryImage: plainArticle.images_couleurs.length > 0 
          ? plainArticle.images_couleurs[0].image_url 
          : null
      };
    });

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error filtering articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error filtering articles",
      error: error.message
    });
  }
};

const rechercherArticles = async (req, res) => {
  try {
    const { requete } = req.query;
    if (!requete) {
      return res.status(400).json({ 
        success: false,
        message: "La requête de recherche est obligatoire!" 
      });
    }

    const articles = await Article.findAll({
      where: {
        [Op.or]: [
          { nom_produit: { [Op.iLike]: `%${requete}%` } },
          { description: { [Op.iLike]: `%${requete}%` } },
        ],
      },
      include: [
        { 
          model: Taille, 
          as: 'tailles',
          through: { attributes: ['quantite'] }
        },
        { 
          model: Couleur, 
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ]
    });

    if (articles.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun article trouvé correspondant à votre recherche." 
      });
    }

    const formattedArticles = articles.map(article => {
      const plainArticle = article.get({ plain: true });
      return {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        primaryImage: plainArticle.images_couleurs.length > 0 
          ? plainArticle.images_couleurs[0].image_url 
          : null
      };
    });

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Erreur lors de la recherche d'articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la recherche d'articles", 
      error: error.message 
    });
  }
};

const obtenirMarqueAleatoire = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const marques = await Marque.findAll({
      include: [{
        model: Article,
        as: 'articles',
        where: { 
          [Op.and]: [
            sequelize.literal(`(
              SELECT COALESCE(SUM(quantite), 0)
              FROM article_taille
              WHERE article_taille.article_id = "articles".id
            ) > 0`)
          ]
        },
        required: true,
        limit: 1,
        include: [
          { 
            model: Taille, 
            as: 'tailles',
            through: { attributes: ['quantite'] }
          },
          { 
            model: Couleur, 
            as: 'couleurs',
            through: { attributes: [] }
          },
          {
            model: ImageArticleCouleur,
            as: 'images_couleurs',
            include: [{ model: Couleur, as: 'couleur' }],
            limit: 1
          }
        ]
      }],
      order: sequelize.literal(`RAND(${today})`)
    });

    if (marques.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Aucune marque avec articles disponibles trouvée" 
      });
    }

    const marqueAleatoire = marques[0];
    const formattedArticles = marqueAleatoire.articles.map(article => {
      const plainArticle = article.get({ plain: true });
      return {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        primaryImage: plainArticle.images_couleurs.length > 0 
          ? plainArticle.images_couleurs[0].image_url 
          : null
      };
    });
    
    res.json({
      success: true,
      donnees: {
        marque: {
          id: marqueAleatoire.id,
          name: marqueAleatoire.libelle,
          description: marqueAleatoire.description
        },
        articles: formattedArticles
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la marque aléatoire:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};



/* // Format article data consistently
const formatArticleData = (article) => {
  const plainArticle = article.get ? article.get({ plain: true }) : article;
  
  // Calculate total stock
  const stock = plainArticle.tailles?.reduce((sum, taille) => {
    return sum + (taille.ArticleTaille?.quantite || 0);
  }, 0) || 0;

  // Format images by color
  const images_par_couleur = {};
  plainArticle.images_couleurs?.forEach(image => {
    if (!images_par_couleur[image.couleur_id]) {
      images_par_couleur[image.couleur_id] = [];
    }
    images_par_couleur[image.couleur_id].push(image.image_url);
  });

  // Format sizes by color
  const tailles_par_couleur = {};
  plainArticle.tailles?.forEach(taille => {
    const couleurId = taille.ArticleTaille?.couleur_id;
    if (couleurId) {
      if (!tailles_par_couleur[couleurId]) {
        tailles_par_couleur[couleurId] = {
          couleur: plainArticle.couleurs?.find(c => c.id === couleurId),
          tailles: []
        };
      }
      tailles_par_couleur[couleurId].tailles.push({
        id: taille.id,
        libelle: taille.libelle,
        quantite: taille.ArticleTaille.quantite
      });
    }
  });

  // Format variations
  const variations = plainArticle.tailles?.map(taille => ({
    taille_id: taille.id,
    couleur_id: taille.ArticleTaille?.couleur_id,
    quantite: taille.ArticleTaille?.quantite
  })) || [];

  return {
    ...plainArticle,
    stock,
    images_par_couleur,
    tailles_par_couleur,
    variations,
    primaryImage: plainArticle.images_couleurs?.[0]?.image_url || null
  };
}; */



const formatArticleData = (article) => {
  const plainArticle = article.get ? article.get({ plain: true }) : article;
  
  // Initialize data structures
  const couleurs = [];
  const colorMap = {};
  const sizesByColor = {}; // Previously tailles_par_couleur
  const variations = [];
  let stock = 0;

  // Process inventory items
  plainArticle.inventory?.forEach(inv => {
    // Add color if not already present
    if (!colorMap[inv.couleur_id]) {
      colorMap[inv.couleur_id] = true;
      couleurs.push(inv.couleur);
    }
    
    // Initialize color entry if not exists
    if (!sizesByColor[inv.couleur_id]) {
      sizesByColor[inv.couleur_id] = {
        couleur: inv.couleur,
        tailles: []
      };
    }
    
    // Add size with quantity
    sizesByColor[inv.couleur_id].tailles.push({
      id: inv.taille.id,
      libelle: inv.taille.libelle,
      quantite: inv.quantite
    });

    // Add to variations
    variations.push({
      taille_id: inv.taille_id,
      couleur_id: inv.couleur_id,
      quantite: inv.quantite
    });

    // Add to total stock
    stock += inv.quantite;
  });

  // Format images by color
  const imagesByColor = {};
  plainArticle.images_couleurs?.forEach(image => {
    if (!imagesByColor[image.couleur_id]) {
      imagesByColor[image.couleur_id] = [];
    }
    imagesByColor[image.couleur_id].push(image.image_url);
  });

  // Get primary image (first image of first color)
  let primaryImage = null;
  const firstColorId = Object.keys(imagesByColor)[0];
  if (firstColorId && imagesByColor[firstColorId].length > 0) {
    primaryImage = imagesByColor[firstColorId][0];
  }

  return {
    id: plainArticle.id,
    nom_produit: plainArticle.nom_produit,
    description: plainArticle.description,
    conseils: plainArticle.conseils,
    prix: plainArticle.prix,
    prix_final: plainArticle.prix_final,
    sku: plainArticle.sku,
    seo_titre: plainArticle.seo_titre,
    mots_cles_seo: plainArticle.mots_cles_seo,
    categorie_id: plainArticle.categorie_id,
    marque_id: plainArticle.marque_id,
    genre_id: plainArticle.genre_id,
    created_at: plainArticle.created_at,
    updated_at: plainArticle.updated_at,
    genre: plainArticle.genre,
    categorie: plainArticle.categorie,
    marque: plainArticle.marque,
    couleurs,
    images_couleurs: plainArticle.images_couleurs,
    stock,
    images_par_couleur: imagesByColor,
    tailles_par_couleur: sizesByColor, // This was the missing variable
    variations,
    primaryImage
  };
};
const obtenirArticleParSku = async (req, res) => {
  try {
    const { sku } = req.params;

    // Find the article with all related data
    const article = await Article.findOne({
      where: { sku },
      include: [
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ArticleTaille,
          as: 'inventory',
          include: [
            { model: Taille, as: 'taille' },
            { model: Couleur, as: 'couleur' }
          ]
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [
            { model: Couleur, as: 'couleur' }
          ]
        }
      ]
    });

    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé avec ce SKU" 
      });
    }

    // Format the article data
    const formattedArticle = formatArticleData(article);

    res.json({
      success: true,
      donnees: formattedArticle
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article par SKU:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération de l'article",
      error: error.message 
    });
  }
};

// Get all articles
const obtenirTousArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      include: [
        { 
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        { 
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching articles",
      error: error.message
    });
  }
};
const obtenirArticleParId = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the article with all related data
    const article = await Article.findOne({
      where: { id },
      include: [
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ArticleTaille,
          as: 'inventory',
          include: [
            { model: Taille, as: 'taille' },
            { model: Couleur, as: 'couleur' }
          ]
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [
            { model: Couleur, as: 'couleur' }
          ]
        }
      ]
    });

    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé avec cet ID" 
      });
    }

    // Format the article data
    const formattedArticle = formatArticleData(article);

    res.json({
      success: true,
      donnees: formattedArticle
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article par ID:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération de l'article",
      error: error.message 
    });
  }
};


// Get latest articles
const obtenirDerniersArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      limit: 20,
      order: [['created_at', 'DESC']],
      include: [
        { 
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        { 
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ]
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching latest articles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching latest articles",
      error: error.message
    });
  }
};

// Get random articles
const ObtenirTousArticleAleatoire = async (req, res) => {
  try {
    const articles = await Article.findAll({
      include: [
        { 
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        { 
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ],
      order: sequelize.literal('RAND()'),
      limit: 50
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching random articles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching random articles",
      error: error.message
    });
  }
};

// Get articles by gender
const obtenirArticlesParGenre = async (req, res) => {
  try {
    const { id } = req.params;
    
    let genre = await Genre.findByPk(id);
    if (!genre) {
      genre = await Genre.findOne({ 
        where: { 
          libelle: { [Op.iLike]: `%${id}%` }
        } 
      });
    }
    
    if (!genre) {
      return res.status(404).json({ 
        success: false,
        message: "Genre not found" 
      });
    }

    const articles = await Article.findAll({
      where: { genre_id: genre.id },
      include: [
        { 
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        { 
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ],
      limit: 20
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching articles by gender:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching articles by gender",
      error: error.message 
    });
  }
};

// Get girls' articles
const obtenirArticlesFille = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { genre_id: 4 }, 
      include: [
        { 
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        { 
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching girls' articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching girls' articles",
      error: error.message
    });
  }
};

// Get baby articles
const obtenirArticlesBebe = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { genre_id: 5 }, // Assuming 1 is the ID for baby
      include: [
        { 
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        { 
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching baby articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching baby articles",
      error: error.message
    });
  }
};

// Get low price articles
const obtenirArticlesPetitPrix = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: {
        prix_final: { [Op.lte]: 100 } // Articles with price <= 100
      },
      include: [
        { 
          model: Taille,
          as: 'tailles',
          through: { 
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        { 
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ],
      order: [['prix_final', 'ASC']]
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching low price articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching low price articles",
      error: error.message
    });
  }
};

// Get article count
const obtenirNombreArticles = async (req, res) => {
  try {
    const count = await Article.count();
    res.json({ 
      success: true,
      count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error counting articles",
      error: error.message 
    });
  }
};



module.exports = {
  ajouterArticle,
  obtenirTousArticles,
  obtenirArticlesFille,
     obtenirArticleParId,
 mettreAJourArticle,
  supprimerArticle,
  obtenirDerniersArticles,
  filtrerArticles,
  rechercherArticles,
  obtenirMarqueAleatoire,
  obtenirArticlesParGenre,
  validateUpdateArticle,
  obtenirNombreArticles,
  ajouterArticles,
  obtenirArticlesPetitPrix, 
  obtenirArticlesBebe,
  ObtenirTousArticleAleatoire,
  obtenirArticleParSku
};