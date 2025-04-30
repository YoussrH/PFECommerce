const models = require("../models");
const { Article, Couleur, Taille, Genre, Categorie, Marque, ImageArticleCouleur } = models;
const cloudinary = require("../config/cloudinaryConfig");
const { Op, sequelize } = require("sequelize");
const { body, validationResult } = require('express-validator');

// Fonction pour uploader une image vers Cloudinary
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
        reject(new Error("Upload failed"));
      }
    };
    
    xhr.onerror = () => reject(new Error("Upload error"));
    xhr.send(formData);
  });
};

// Validation middleware for updating articles
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

// Helper function to format images by color
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

// Helper function to calculate total stock
const calculateTotalStock = (tailles) => {
  return tailles.reduce((sum, taille) => {
    return sum + (taille.ArticleTaille?.quantite || 0);
  }, 0);
};


const ajouterArticle = async (req, res) => {
  try {
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
      variations, // This will be an array of color-size combinations
      conseils,
      prix_final,
      images_par_couleur = {}
    } = req.body;

    // Validation
    const champsObligatoires = {
      nom_produit: !nom_produit,
      prix: !prix,
      categorie_id: !categorie_id,
      marque_id: !marque_id,
      genre_id: !genre_id,
      variations: !variations || variations.length === 0
    };

    const champsManquants = Object.keys(champsObligatoires).filter(champ => champsObligatoires[champ]);
    if (champsManquants.length > 0) {
      return res.status(400).json({ 
        succes: false,
        message: "Champs obligatoires manquants",
        champsManquants
      });
    }

    // Create article
    const article = await Article.create({
      nom_produit,
      description: description || null,
      prix: parseFloat(prix),
      remise: remise ? parseFloat(remise) : 0,
      prix_final: prix_final || (parseFloat(prix) * (1 - (parseFloat(remise || 0) / 100))),
      sku: sku || null,
      seo_titre: seo_titre || null,
      mots_cles_seo: mots_cles_seo || null,
      categorie_id: parseInt(categorie_id),
      marque_id: parseInt(marque_id),
      genre_id: parseInt(genre_id),
      conseils: conseils || null,
    });

    // Handle variations (color-size combinations)
    const variationsToCreate = [];
    const uniqueColors = new Set();
    
    for (const variation of variations) {
      variationsToCreate.push({
        article_id: article.id,
        taille_id: parseInt(variation.taille_id),
        couleur_id: parseInt(variation.couleur_id),
        quantite: parseInt(variation.quantite)
      });
      uniqueColors.add(parseInt(variation.couleur_id));
    }

    await models.ArticleTaille.bulkCreate(variationsToCreate);

    // Associate colors with article
    await article.addCouleurs([...uniqueColors]);

    // Handle images for each color
    for (const couleurId of uniqueColors) {
      const imagesForColor = images_par_couleur[couleurId] || [];
      
      for (const imageUrl of imagesForColor) {
        await ImageArticleCouleur.create({
          article_id: article.id,
          couleur_id: couleurId,
          image_url: imageUrl,
          ordre_affichage: 0
        });
      }
    }

    // Fetch the created article with all relations
    const articleCree = await Article.scope('avecQuantiteTotale').findByPk(article.id, {
      include: [
        { 
          model: Couleur, 
          as: 'couleurs', 
          through: { attributes: [] } 
        },
        { 
          model: Taille, 
          as: 'tailles',
          through: { 
            model: models.ArticleTaille,
            attributes: ['quantite', 'couleur_id']
          }
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [
            {
              model: Couleur,
              as: 'couleur'
            }
          ]
        }
      ]
    });

    // Format images by color
    const imagesParCouleur = formatImagesByColor(articleCree.images_couleurs);

    res.status(201).json({
      succes: true,
      message: "Article créé avec succès",
      donnees: {
        ...articleCree.get({ plain: true }),
        images_par_couleur
      }
    });
  } catch (erreur) {
    console.error("Erreur lors de l'ajout de l'article:", erreur);
    res.status(500).json({ 
      succes: false,
      message: "Erreur lors de l'ajout de l'article", 
      erreur: erreur.message
    });
  }
};

const obtenirTousArticles = async (req, res) => {
  try {
    const articles = await Article.scope('avecQuantiteTotale').findAll({
      include: [
        { 
          model: Taille, 
          as: 'tailles',
          through: { 
            attributes: ['quantite'],
            as: 'ArticleTaille'
          },
          attributes: ['id', 'libelle', 'genre_id', 'categorie_id'] 
        },
        { 
          model: Couleur, 
          as: 'couleurs',
          through: { attributes: [] },
          attributes: ['id', 'libelle', 'hexcode'] 
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
          model: Marque, 
          as: 'marque',
          attributes: ['id', 'libelle'] 
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          attributes: ['image_url', 'couleur_id'],
          limit: 1 // Only get one image per color for the listing
        }
      ],
      attributes: { 
        exclude: ['created_at', 'updated_at'] 
      }
    });

    // Format the articles with a primary image
    const formattedArticles = articles.map(article => {
      const plainArticle = article.get({ plain: true });
      
      return {
        ...plainArticle,
        primaryImage: plainArticle.images_couleurs.length > 0 
          ? plainArticle.images_couleurs[0].image_url 
          : null,
        stock: calculateTotalStock(plainArticle.tailles)
      };
    });
    
    res.json({
      succes: true,
      donnees: formattedArticles
    });
  } catch (erreur) {
    console.error("Erreur lors de la récupération des articles:", erreur);
    res.status(500).json({ 
      succes: false,
      message: "Erreur lors de la récupération des articles", 
      erreur: erreur.message 
    });
  }
};

const obtenirArticleParId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: "ID d'article invalide" 
      });
    }

    const article = await Article.findByPk(id, {
      include: [
        { 
          model: Taille, 
          as: 'tailles',
          through: { 
            model: models.ArticleTaille,
            attributes: ['quantite', 'couleur_id']
          },
          attributes: ['id', 'libelle', 'genre_id', 'categorie_id'] 
        },
        { 
          model: Couleur, 
          as: 'couleurs',
          through: { attributes: [] },
          attributes: ['id', 'libelle', 'hexcode'] 
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
          model: Marque, 
          as: 'marque',
          attributes: ['id', 'libelle'] 
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [
            {
              model: Couleur,
              as: 'couleur',
              attributes: ['id', 'libelle', 'hexcode']
            }
          ]
        }
      ]
    });

    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé" 
      });
    }

    const plainArticle = article.get({ plain: true });
    
    // Format the sizes by color
    const taillesParCouleur = {};
    plainArticle.tailles.forEach(taille => {
      const couleurId = taille.ArticleTaille.couleur_id;
      if (!taillesParCouleur[couleurId]) {
        taillesParCouleur[couleurId] = [];
      }
      taillesParCouleur[couleurId].push({
        id: taille.id,
        libelle: taille.libelle,
        quantite: taille.ArticleTaille.quantite
      });
    });

    res.json({
      success: true,
      donnees: {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        images_par_couleur: formatImagesByColor(plainArticle.images_couleurs),
        tailles_par_couleur: taillesParCouleur
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

const ajouterArticles = async (req, res) => {
  try {
    const articlesData = req.body;

    if (!Array.isArray(articlesData)) {
      return res.status(400).json({ 
        succes: false,
        message: "Le corps de la requête doit être un tableau d'articles" 
      });
    }

    const articlesCrees = [];
    const erreurs = [];

    for (const articleData of articlesData) {
      try {
        const {
          nom_produit,
          description,
          prix,
          remise,
          sku,
          images,
          seo_titre,
          mots_cles_seo,
          categorie_id,
          marque_id,
          genre_id,
          tailles,
          couleurs,
          conseils,
          prix_final
        } = articleData;

        const champsObligatoires = {
          nom_produit: !nom_produit,
          prix: !prix,
          categorie_id: !categorie_id,
          marque_id: !marque_id,
          genre_id: !genre_id,
          tailles: !tailles || tailles.length === 0
        };

        const champsManquants = Object.keys(champsObligatoires).filter(champ => champsObligatoires[champ]);
        if (champsManquants.length > 0) {
          throw new Error(`Champs obligatoires manquants: ${champsManquants.join(', ')}`);
        }

        const finalPrixFinal = prix_final || 
          (parseFloat(prix) * (1 - (parseFloat(remise || 0) / 100))).toFixed(2);

        const article = await Article.create({
          nom_produit,
          description: description || null,
          prix: parseFloat(prix),
          remise: remise ? parseFloat(remise) : 0,
          prix_final: finalPrixFinal,
          sku: sku || null,
          seo_titre: seo_titre || null,
          mots_cles_seo: mots_cles_seo || null,
          categorie_id: parseInt(categorie_id),
          marque_id: parseInt(marque_id),
          genre_id: parseInt(genre_id),
          conseils: conseils || null,
        });

        const taillesAvecQuantites = tailles.map(t => ({
          article_id: article.id,
          taille_id: parseInt(t.taille_id),
          quantite: parseInt(t.quantite)
        }));
        
        await models.ArticleTaille.bulkCreate(taillesAvecQuantites);

        if (Array.isArray(couleurs) && couleurs.length > 0) {
          await article.addCouleurs(couleurs);
        }

        const articleCree = await Article.scope('avecQuantiteTotale').findByPk(article.id, {
          include: [
            { 
              model: Couleur, 
              as: 'couleurs', 
              through: { attributes: [] } 
            },
            { 
              model: Taille, 
              as: 'tailles',
              through: { attributes: ['quantite'] }
            },
            { model: Genre, as: 'genre' },
            { model: Categorie, as: 'categorie' },
            { model: Marque, as: 'marque' }
          ]
        });

        articlesCrees.push(articleCree);
      } catch (erreur) {
        erreurs.push({
          article: articleData.nom_produit || 'Article sans nom',
          erreur: erreur.message
        });
      }
    }

    if (erreurs.length > 0) {
      return res.status(207).json({
        succes: erreurs.length === articlesData.length ? false : true,
        message: erreurs.length === articlesData.length 
          ? "Tous les articles ont échoué" 
          : "Certains articles n'ont pas pu être créés",
        donnees: articlesCrees,
        erreurs
      });
    }

    res.status(201).json({
      succes: true,
      message: "Tous les articles ont été créés avec succès",
      donnees: articlesCrees
    });
  } catch (erreur) {
    console.error("Erreur lors de l'ajout des articles:", erreur);
    res.status(500).json({ 
      succes: false,
      message: "Erreur lors de l'ajout des articles", 
      erreur: erreur.message
    });
  }
};

const mettreAJourArticle = async (req, res) => {
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
      tailles,
      couleurs,
      images_par_couleur = {}
    } = req.body;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ 
        succes: false,
        message: "Article non trouvé" 
      });
    }

    await article.update({
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
      conseils
    });

    if (tailles) {
      await models.ArticleTaille.destroy({ where: { article_id: id } });
      const taillesAvecQuantites = tailles.map(t => ({
        article_id: id,
        taille_id: parseInt(t.taille_id),
        quantite: parseInt(t.quantite)
      }));
      await models.ArticleTaille.bulkCreate(taillesAvecQuantites);
    }
    
    if (couleurs) {
      await models.ArticleCouleur.destroy({ where: { article_id: id } });
      await article.addCouleurs(couleurs);
      await ImageArticleCouleur.destroy({ where: { article_id: id } });
      
      for (const couleurId of couleurs) {
        const imagesForColor = images_par_couleur[couleurId] || [];
        for (const imageUrl of imagesForColor) {
          await ImageArticleCouleur.create({
            article_id: id,
            couleur_id: couleurId,
            image_url: imageUrl,
            ordre_affichage: 0
          });
        }
      }
    }

    const articleMisAJour = await Article.scope('avecQuantiteTotale').findByPk(id, {
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
          include: [{ model: Couleur, as: 'couleur' }]
        }
      ]
    });

    const plainArticle = articleMisAJour.get({ plain: true });
    res.json({
      succes: true,
      message: "Article mis à jour avec succès",
      donnees: {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        images_par_couleur: formatImagesByColor(plainArticle.images_couleurs)
      }
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article:", error);
    res.status(500).json({
      succes: false,
      message: "Erreur lors de la mise à jour de l'article",
      error: error.message
    });
  }
};

const supprimerArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id, {
      include: [{ model: ImageArticleCouleur, as: 'images_couleurs' }]
    });
    
    if (!article) {
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé" 
      });
    }

    // Delete images from Cloudinary
    const images = article.images_couleurs || [];
    for (const image of images) {
      try {
        const publicId = image.image_url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`articles/${publicId}`);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
      }
    }

    // Delete database records
    await models.ArticleTaille.destroy({ where: { article_id: article.id } });
    await models.ArticleCouleur.destroy({ where: { article_id: article.id } });
    await ImageArticleCouleur.destroy({ where: { article_id: article.id } });
    await article.destroy();

    res.json({ 
      success: true,
      message: "Article supprimé avec succès" 
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la suppression de l'article", 
      error: error.message 
    });
  }
};

const obtenirDerniersArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      limit: 20,
      order: [["created_at", "DESC"]],
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
    console.error("Erreur lors de la récupération des derniers articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des derniers articles", 
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
        message: "Genre non trouvé" 
      });
    }

    const articles = await Article.findAll({
      where: { genre_id: genre.id },
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
      ],
      limit: 1,
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
    console.error("Erreur lors de la récupération des articles par genre:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};

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

const obtenirArticlesPetitPrix = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: {
        genre_id: [4,5], 
        prix_final: { [Op.lte]: 100 }
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
      ],
      order: [['prix_final', 'ASC']]
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
    console.error("Error fetching petit prix articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching petit prix articles",
      error: error.message
    });
  }
};

const obtenirArticlesBebe = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { genre_id: [1] },
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
      ],
      order: [['created_at', 'DESC']]
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
    console.error("Error fetching baby articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching baby articles",
      error: error.message
    });
  }
};

const ObtenirTousArticleAleatoire = async (req, res) => {
  try {
    const articles = await Article.scope('avecQuantiteTotale').findAll({
      include: [
        { 
          model: Taille, 
          as: 'tailles',
          through: { 
            attributes: ['quantite'],
            as: 'ArticleTaille'
          },
          attributes: ['id', 'libelle', 'genre_id', 'categorie_id'] 
        },
        { 
          model: Couleur, 
          as: 'couleurs',
          through: { attributes: [] },
          attributes: ['id', 'libelle', 'hexcode'] 
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
          model: Marque, 
          as: 'marque',
          attributes: ['id', 'libelle'] 
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }],
          limit: 1
        }
      ],
      attributes: { 
        exclude: ['created_at', 'updated_at'],
        include: [
          [sequelize.literal('DATEDIFF(NOW(), created_at) <= 9'), 'isNew']
        ]
      },
      order: sequelize.literal('RAND()'),
      limit: 50
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
    console.error("Error fetching random articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching random articles", 
      error: error.message 
    });
  }
};
const obtenirArticlesFille = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { genre_id: 2 },
      include: [
        { 
          model: Taille, 
          as: 'tailles',
          through: { attributes: ['quantite'] },
          attributes: ['id', 'libelle']
        },
        { 
          model: Couleur, 
          as: 'couleurs',
          through: { attributes: [] },
          attributes: ['id', 'libelle', 'hexcode']
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
          model: Marque, 
          as: 'marque',
          attributes: ['id', 'libelle']
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [
            {
              model: Couleur,
              as: 'couleur',
              attributes: ['id', 'libelle', 'hexcode']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedArticles = articles.map(article => {
      const plainArticle = article.get({ plain: true });
      return {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        images_par_couleur: formatImagesByColor(plainArticle.images_couleurs)
      };
    });

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
  ObtenirTousArticleAleatoire
};