//articelcontroller.js
const models = require("../models");
const { Article, Couleur, Taille, Utilisateur,Genre,Remise, Categorie, Marque, ImageArticleCouleur, ArticleTaille, ArticleCouleur } = models;
const { envoyerEmail } = require('../services/emailService');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

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

    // Validate required fields
    if (!nom_produit || !prix || !categorie_id || !marque_id || !genre_id) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Les champs obligatoires sont manquants (nom_produit, prix, categorie_id, marque_id, genre_id)" 
      });
    }

    // Validate variations
    if (!variations || !Array.isArray(variations) ){
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Le champ variations est requis et doit être un tableau" 
      });
    }

    // Validate each variation
    const invalidVariations = variations.filter(v => 
      !v.taille_id || !v.couleur_id || v.quantite === undefined || v.quantite < 0
    );

    if (invalidVariations.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Certaines variations sont invalides",
        invalidVariations
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

    if (!article || !article.id) {
      await transaction.rollback();
      return res.status(500).json({ 
        success: false,
        message: "Échec de la création de l'article" 
      });
    }

    // Process variations
    const variationPromises = variations.map(async (variation) => {
      try {
        // Additional validation
        if (!variation.taille_id || !variation.couleur_id) {
          throw new Error(`Variation invalide: taille_id=${variation.taille_id}, couleur_id=${variation.couleur_id}`);
        }

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

        // Create article_couleur record if not exists
        const [articleCouleur, created] = await ArticleCouleur.findOrCreate({
          where: {
            article_id: article.id,
            couleur_id: variation.couleur_id
          },
          defaults: {
            article_id: article.id,
            couleur_id: variation.couleur_id
          },
          transaction
        });

        if (!articleCouleur) {
          throw new Error(`Failed to create ArticleCouleur record for article_id=${article.id}, couleur_id=${variation.couleur_id}`);
        }

      } catch (error) {
        console.error('Error processing variation:', {
          article_id: article.id,
          variation,
          error: error.message
        });
        throw error;
      }
    });

    await Promise.all(variationPromises);

    // Process images
    if (images_par_couleur && typeof images_par_couleur === 'object') {
      try {
        // First delete existing images for this article
        await ImageArticleCouleur.destroy({
          where: { article_id: article.id },
          transaction
        });

        const imagePromises = Object.entries(images_par_couleur).map(async ([couleur_id, images]) => {
          if (!Array.isArray(images)) return;

          // Validate that the color exists in variations
          const colorExistsInVariations = variations.some(v => v.couleur_id == couleur_id);
          if (!colorExistsInVariations) {
            throw new Error(`Couleur ${couleur_id} a des images mais n'existe pas dans les variations`);
          }

          const imageCreates = images.map(imageUrl => {
            if (typeof imageUrl !== 'string') {
              throw new Error(`URL d'image invalide pour couleur ${couleur_id}: ${imageUrl}`);
            }
            return ImageArticleCouleur.create({
              article_id: article.id,
              couleur_id,
              image_url: imageUrl
            }, { transaction });
          });
          
          await Promise.all(imageCreates);
        });
        
        await Promise.all(imagePromises);
      } catch (imageError) {
        console.error('Error processing images:', imageError);
        throw imageError;
      }
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

// After transaction.commit() and fetching the complete article:

// Send new product notification to newsletter subscribers
try {
  // Get all users who have subscribed to newsletter
  const subscribers = await Utilisateur.findAll({
    where: {
      newsletter: true,
      est_verifie: true // Only send to verified emails
    },
    attributes: ['id', 'email', 'prenom', 'prefix']
  });

  if (subscribers.length > 0) {
    // Get the first image URL for the product
    const firstImage = completeArticle.images_couleurs[0]?.image_url || '';

    // Prepare email data
    const emailData = {
      PRENOM: '', // Will be replaced for each user
      PRODUCT_NAME: completeArticle.nom_produit,
      PRODUCT_IMAGE: firstImage,
      PRICE: completeArticle.prix_final.toFixed(2),
      ORIGINAL_PRICE: remise > 0 ? prix.toFixed(2) : null,
      DISCOUNT_PRICE: remise > 0,
      PRODUCT_DESCRIPTION: completeArticle.description || 'Découvrez notre nouveau produit!',
      FEATURES:completeArticle.description,
      COMPANY_NAME: 'MGM Boutique',
      WEBSITE_URL: process.env.FRONTEND_URL,
      CONTACT_LINK: `${process.env.FRONTEND_URL}/contact`,
      CURRENT_YEAR: new Date().getFullYear()
    };

    // Send emails to all subscribers
    const emailPromises = subscribers.map(utilisateur => {
      // Determine greeting based on prefix
      let greeting = 'Client';
      if (utilisateur.prenom) {
        greeting = utilisateur.prenom;
      } else if (utilisateur.prefix) {
        greeting = utilisateur.prefix;
      }

      const userData = {
        ...emailData,
        PRENOM: greeting
      };
      
      return envoyerEmail({
        to: utilisateur.email,
        subject: `Nouveau produit disponible: ${completeArticle.nom_produit}`,
        template: 'newproduit',
        context: userData
      }).catch(emailError => {
        console.error(`Failed to send email to ${utilisateur.email}:`, emailError.message);
      });
    });

    await Promise.all(emailPromises);
    console.log(`Sent new product notification to ${subscribers.length} subscribers`);
  }
} catch (emailError) {
  console.error('Error sending new product notifications:', emailError);
  // Don't fail the whole operation if email sending fails
}

    return res.status(201).json({
      success: true,
      message: "Article ajouté avec succès",
      data: completeArticle
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Complete error in ajouterArticle:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Une combinaison article/taille/couleur existe déjà",
        error: error.errors 
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Référence invalide (couleur, taille, ou autre clé étrangère non trouvée)",
        error: error.parent ? error.parent.detail : error.message
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: error.message || "Erreur lors de l'ajout de l'article",
      error: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        details: error.errors
      } : undefined
    });
  }
};

const ajouterArticles = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Le champ articles est requis et doit être un tableau" 
      });
    }

    // Validate all articles first
    for (const articleData of articles) {
      const { 
        nom_produit, prix, categorie_id, marque_id, genre_id, variations 
      } = articleData;

      if (!nom_produit || !prix || !categorie_id || !marque_id || !genre_id) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: `Article invalide: champs obligatoires manquants (${nom_produit || 'sans nom'})` 
        });
      }

      if (!variations || !Array.isArray(variations)) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: `Article invalide: variations manquantes ou invalides (${nom_produit})` 
        });
      }

      const invalidVariations = variations.filter(v => 
        !v.taille_id || !v.couleur_id || v.quantite === undefined || v.quantite < 0
      );

      if (invalidVariations.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: `Article invalide: variations invalides (${nom_produit})`,
          invalidVariations
        });
      }
    }

    // Create all articles in bulk
    const createdArticles = await Article.bulkCreate(
      articles.map(articleData => ({
        nom_produit: articleData.nom_produit,
        description: articleData.description,
        conseils: articleData.conseils,
        prix: articleData.prix,
        remise: articleData.remise || 0,
        prix_final: articleData.prix * (1 - ((articleData.remise || 0) / 100)),
        sku: articleData.sku,
        seo_titre: articleData.seo_titre,
        mots_cles_seo: articleData.mots_cles_seo,
        categorie_id: articleData.categorie_id,
        marque_id: articleData.marque_id,
        genre_id: articleData.genre_id
      })), 
      { transaction, returning: true }
    );

    // Prepare all variations and color associations
    const allVariations = [];
    const allArticleColors = [];
    const allImages = [];

    createdArticles.forEach((article, index) => {
      const articleData = articles[index];
      const colorSet = new Set();

      // Process variations
      articleData.variations.forEach(variation => {
        allVariations.push({
          article_id: article.id,
          taille_id: variation.taille_id,
          couleur_id: variation.couleur_id,
          quantite: variation.quantite
        });
        
        // Track unique color combinations
        if (!colorSet.has(variation.couleur_id)) {
          colorSet.add(variation.couleur_id);
          allArticleColors.push({
            article_id: article.id,
            couleur_id: variation.couleur_id
          });
        }
      });

      // Process images
      if (articleData.images_par_couleur) {
        Object.entries(articleData.images_par_couleur).forEach(([couleur_id, images]) => {
          if (Array.isArray(images)) {
            images.forEach(imageUrl => {
              allImages.push({
                article_id: article.id,
                couleur_id,
                image_url: imageUrl
              });
            });
          }
        });
      }
    });

    // Perform bulk database operations
    await Promise.all([
      ArticleTaille.bulkCreate(allVariations, { transaction }),
      ArticleCouleur.bulkCreate(allArticleColors, { transaction }),
      ImageArticleCouleur.bulkCreate(allImages, { transaction })
    ]);

    await transaction.commit();

    // Send email notifications asynchronously after transaction
    if (process.env.NODE_ENV === 'production') {
      try {
        const subscribers = await Utilisateur.findAll({
          where: { newsletter: true, est_verifie: true },
          attributes: ['id', 'email', 'prenom', 'prefix']
        });

        if (subscribers.length > 0) {
          const emailPromises = createdArticles.map(article => {
            const firstImage = articles.find(a => a.sku === article.sku)
              ?.images_par_couleur?.[Object.keys(articles.find(a => a.sku === article.sku).images_par_couleur)[0]]?.[0] || '';

            const emailData = {
              PRENOM: '', // Will be replaced per user
              PRODUCT_NAME: article.nom_produit,
              PRODUCT_IMAGE: firstImage,
              PRICE: article.prix_final.toFixed(2),
              ORIGINAL_PRICE: article.remise > 0 ? article.prix.toFixed(2) : null,
              DISCOUNT_PRICE: article.remise > 0,
              PRODUCT_DESCRIPTION: article.description || 'Découvrez notre nouveau produit!',
              FEATURES: article.description,
              COMPANY_NAME: 'MGM Boutique',
              WEBSITE_URL: process.env.FRONTEND_URL,
              CONTACT_LINK: `${process.env.FRONTEND_URL}/contact`,
              CURRENT_YEAR: new Date().getFullYear()
            };

            return Promise.all(
              subscribers.map(utilisateur => {
                const userData = {
                  ...emailData,
                  PRENOM: utilisateur.prenom || utilisateur.prefix || 'Client'
                };
                
                return envoyerEmail({
                  to: utilisateur.email,
                  subject: `Nouveau produit disponible: ${article.nom_produit}`,
                  template: 'newproduit',
                  context: userData
                }).catch(emailError => {
                  console.error(`Failed to send email to ${utilisateur.email}:`, emailError.message);
                });
              })
            );
          });

          Promise.all(emailPromises)
            .then(() => console.log('Email notifications sent'))
            .catch(err => console.error('Error sending emails:', err));
        }
      } catch (emailError) {
        console.error('Error preparing email notifications:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdArticles.length} articles ajoutés avec succès`,
      data: createdArticles.map(article => article.id)
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Complete error in ajouterArticles:', {
      error: error.message,
      stack: error.stack
    });
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Une contrainte d'unicité a été violée (SKU peut-être dupliqué)",
        error: error.errors 
      });
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: "Référence invalide (couleur, taille, ou autre clé étrangère non trouvée)",
        error: error.parent ? error.parent.detail : error.message
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: error.message || "Erreur lors de l'ajout des articles",
      error: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        details: error.errors
      } : undefined
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

    // Find the article with current associations
    const article = await Article.findByPk(id, {
      include: [
        {
          model: ArticleTaille,
          as: 'inventory'
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs'
        }
      ],
      transaction
    });

    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé" 
      });
    }

    // Update only changed article fields
    const articleUpdates = {};
    const fieldsToCheck = [
      'nom_produit', 'description', 'prix', 'remise', 'sku', 
      'seo_titre', 'mots_cles_seo', 'categorie_id', 'marque_id', 
      'genre_id', 'conseils'
    ];

    fieldsToCheck.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== article[field]) {
        articleUpdates[field] = req.body[field];
      }
    });

    // Calculate final price if remise or price changed
    if (articleUpdates.prix !== undefined || articleUpdates.remise !== undefined) {
      const newPrix = articleUpdates.prix !== undefined ? articleUpdates.prix : article.prix;
      const newRemise = articleUpdates.remise !== undefined ? articleUpdates.remise : article.remise;
      articleUpdates.prix_final = newPrix * (1 - (newRemise / 100));
    }

    if (Object.keys(articleUpdates).length > 0) {
      await article.update(articleUpdates, { transaction });
    }

    // Handle variations updates
    if (variations) {
      // Get current variations as a map for quick lookup
      const currentVariationsMap = new Map();
      article.inventory.forEach(v => {
        const key = `${v.taille_id}-${v.couleur_id}`;
        currentVariationsMap.set(key, v);
      });

      // Process new variations
      const variationsToCreate = [];
      const variationsToUpdate = [];
      const seenVariations = new Set();

      for (const variation of variations) {
        const key = `${variation.taille_id}-${variation.couleur_id}`;
        seenVariations.add(key);

        const existingVariation = currentVariationsMap.get(key);
        if (existingVariation) {
          // Only update if quantity changed
          if (existingVariation.quantite !== parseInt(variation.quantite)) {
            variationsToUpdate.push({
              id: existingVariation.id,
              quantite: parseInt(variation.quantite)
            });
          }
        } else {
          // New variation to create
          variationsToCreate.push({
            article_id: id,
            taille_id: parseInt(variation.taille_id),
            couleur_id: parseInt(variation.couleur_id),
            quantite: parseInt(variation.quantite)
          });
        }
      }

      // Find variations to delete (present in DB but not in new variations)
      const variationsToDelete = article.inventory.filter(v => {
        const key = `${v.taille_id}-${v.couleur_id}`;
        return !seenVariations.has(key);
      });

      // Execute all variation operations
      await Promise.all([
        // Create new variations
        variationsToCreate.length > 0 && 
          ArticleTaille.bulkCreate(variationsToCreate, { transaction }),
        
        // Update existing variations
        variationsToUpdate.length > 0 && 
          Promise.all(variationsToUpdate.map(v => 
            ArticleTaille.update(
              { quantite: v.quantite },
              { where: { id: v.id }, transaction }
            )
          )),
        
        // Delete removed variations
        variationsToDelete.length > 0 && 
          ArticleTaille.destroy({
            where: { 
              id: variationsToDelete.map(v => v.id) 
            },
            transaction
          })
      ]);

      // Update color associations (only for new colors)
      const currentColorIds = new Set(article.inventory.map(v => v.couleur_id));
      const newColorIds = new Set(variations.map(v => v.couleur_id));
      const colorsToAdd = [...newColorIds].filter(id => !currentColorIds.has(id));

      if (colorsToAdd.length > 0) {
        await ArticleCouleur.bulkCreate(
          colorsToAdd.map(couleur_id => ({ article_id: id, couleur_id })),
          { transaction }
        );
      }
    }

    // Handle images updates
    if (images_par_couleur) {
      // Get current images by color
      const currentImagesByColor = {};
      article.images_couleurs.forEach(img => {
        if (!currentImagesByColor[img.couleur_id]) {
          currentImagesByColor[img.couleur_id] = new Set();
        }
        currentImagesByColor[img.couleur_id].add(img.image_url);
      });

      // Process new images
      const imagesToCreate = [];
      const seenImages = new Set();

      for (const [couleur_id, imageUrls] of Object.entries(images_par_couleur)) {
        for (const imageUrl of imageUrls) {
          const key = `${couleur_id}-${imageUrl}`;
          seenImages.add(key);

          // Only add if image doesn't already exist
          if (!currentImagesByColor[couleur_id] || !currentImagesByColor[couleur_id].has(imageUrl)) {
            imagesToCreate.push({
              article_id: id,
              couleur_id,
              image_url: imageUrl
            });
          }
        }
      }

      // Find images to delete (present in DB but not in new images)
      const imagesToDelete = article.images_couleurs.filter(img => {
        const key = `${img.couleur_id}-${img.image_url}`;
        return !seenImages.has(key);
      });

      // Execute all image operations
      await Promise.all([
        // Add new images
        imagesToCreate.length > 0 && 
          ImageArticleCouleur.bulkCreate(imagesToCreate, { transaction }),
        
        // Delete removed images
        imagesToDelete.length > 0 && 
          ImageArticleCouleur.destroy({
            where: { 
              id: imagesToDelete.map(img => img.id) 
            },
            transaction
          })
      ]);
    }

    // Commit transaction
    await transaction.commit();

    // Fetch the complete updated article
    const updatedArticle = await Article.scope('avecQuantiteTotale').findByPk(id, {
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

    // Format the response
    const plainArticle = updatedArticle.get({ plain: true });
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
    
    let errorMessage = "Erreur lors de la mise à jour de l'article";
    if (error.name === 'SequelizeValidationError') {
      errorMessage = "Données invalides: " + error.errors.map(e => e.message).join(', ');
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = "Une combinaison article/taille/couleur existe déjà";
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      errorMessage = "Référence invalide (couleur, taille, ou autre clé étrangère non trouvée)";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const supprimerArticle = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    // Debug logging
    console.log('Attempting HARD DELETE of article:', id);

    // Find the article with transaction
    const article = await Article.findOne({
      where: { id },
      transaction,
      paranoid: false // Include soft-deleted records
    });

    if (!article) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Article non trouvé",
        details: { articleId: id }
      });
    }

    // HARD DELETE all related records first
    await Promise.all([
      ImageArticleCouleur.destroy({
        where: { article_id: id },
        force: true, // Hard delete
        transaction
      }),
      ArticleTaille.destroy({
        where: { article_id: id },
        force: true, // Hard delete
        transaction
      }),
      ArticleCouleur.destroy({
        where: { article_id: id },
        force: true, // Hard delete
        transaction
      })
    ]);

    // Perform HARD DELETE on main article
    await article.destroy({ 
      force: true, // This ensures hard delete
      transaction 
    });

    // Commit the transaction
    await transaction.commit();

    // Success response
    return res.json({
      success: true,
      message: "Article supprimé définitivement avec succès",
      donnees: { 
        id: article.id,
        nom_produit: article.nom_produit
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Erreur lors de la suppression définitive:", {
      error: error.message,
      stack: error.stack,
      articleId: req.params.id
    });
    
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression définitive",
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
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
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "La requête de recherche doit contenir au moins 2 caractères"
      });
    }

    const articles = await Article.findAll({
      where: {
        [Op.or]: [
          { nom_produit: { [Op.iLike]: `%${query}%` } },
          { seo_titre: { [Op.iLike]: `%${query}%` } },
          { mots_cles_seo: { [Op.iLike]: `%${query}%` } }
        ]
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
      limit: 20,
      order: [['nom_produit', 'ASC']]
    });

    const formattedArticles = articles.map(article => formatArticleData(article));

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


// In your articleController.js
const filtrerArticlesGFemme = async (req, res) => {
  try {
    const { filtres = [], genreId = 4 } = req.body;
    
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
        where: { id: genreId },
        required: true,
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

    // Process filters
    filtres.forEach(({ category, filter }) => {
      switch (category) {
        case "Prix":
          where[Op.and].push({
            prix_final: { [Op.between]: [filter.min, filter.max] }
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
        primaryImage: plainArticle.images_couleurs?.length > 0 
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

// And create a corresponding initial load endpoint
const obtenirDerniersArticlesFemme = async (req, res) => {
  try {
    const articles = await Article.findAll({
      include: [
        { 
          model: Marque, 
          as: 'marque',
          attributes: ['id', 'libelle']
        },
        { 
          model: Genre, 
          as: 'genre',
          where: { id: 4 }, // Women's category
          attributes: ['id', 'libelle']
        },
        // Include other necessary models...
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    const formattedArticles = articles.map(article => {
      const plainArticle = article.get({ plain: true });
      return {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        primaryImage: plainArticle.images_couleurs?.length > 0 
          ? plainArticle.images_couleurs[0].image_url 
          : null
      };
    });

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching women's articles:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching women's articles"
    });
  }
};
const filtrerArticlesGHomme = async (req, res) => {
  try {
    const { filtres, genreId = 5 } = req.body; // Default to genreId 4 if not provided
    
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
        where: { id: genreId }, // Fixed genre filter
        required: true,
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

    // Process other filters
    filtres.forEach(({ category, filter }) => {
      switch (category) {
        case "Prix":
          where[Op.and].push({
            prix_final: { [Op.between]: [filter.min, filter.max] }
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
        // Removed Genres case since we're using fixed genre
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

const obtenirTousLesArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
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
      ],
      order: [['id', 'DESC']] // Optional: order by ID descending
    });

    if (!articles || articles.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun article trouvé" 
      });
    }

    // Format all articles data
    const formattedArticles = articles.map(article => formatArticleData(article));

    res.json({
      success: true,
      donnees: formattedArticles
    });

  } catch (error) {
    console.error("Erreur lors de la récupération des articles:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des articles",
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




const obtenirArticlesPetitPrix = async (req, res) => {
  try {
    // Define maximum price for "petits prix" (adjust as needed)

    const articles = await Article.findAll({
      where: {
        genre_id: {
          [Op.in]: [2, 3] // Garçon (2) et Fille (3)
        }
      },
      include: [
        {
          model: ArticleTaille,
          as: 'inventory',
          attributes: [],
          where: { quantite: { [Op.gt]: 0 } },
          required: true
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          attributes: ['image_url']
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
        }
      ],
      order: [
        ['prix_final', 'ASC'], // Cheapest first
        ['created_at', 'DESC'] // Newest first
      ]
    });

    // Format the response
    const formattedArticles = articles.map(article => ({
      id: article.id,
      nom_produit: article.nom_produit,
      description: article.description,
      prix: article.prix,
      prix_final: article.prix_final,
      images: article.images_couleurs.map(img => img.image_url),
      marque: article.marque,
      genre: article.genre,
      categorie: article.categorie,
      created_at: article.created_at
    }));

    res.status(200).json({
      success: true,
      data: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching low-price articles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low-price articles",
      error: error.message
    });
  }
}; 
const obtenirArticlesFemme = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: {
        genre_id: 4 // Femme
      },
      include: [
        {
          model: ArticleTaille,
          as: 'inventory',
          attributes: [],
          where: { quantite: { [Op.gt]: 0 } },
          required: true
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          attributes: ['image_url']
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
        }
      ],
      order: [
        ['created_at', 'DESC'] // Newest first
      ]
    });

    const formattedArticles = articles.map(article => ({
      id: article.id,
      nom_produit: article.nom_produit,
      description: article.description,
      prix: article.prix,
      prix_final: article.prix_final,
      images: article.images_couleurs.map(img => img.image_url),
      marque: article.marque,
      genre: article.genre,
      categorie: article.categorie,
      created_at: article.created_at
    }));

    res.status(200).json({
      success: true,
      data: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching women's articles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching women's articles",
      error: error.message
    });
  }
};

const obtenirArticlesHomme = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: {
        genre_id: 5 // Homme
      },
      include: [
        {
          model: ArticleTaille,
          as: 'inventory',
          attributes: [],
          where: { quantite: { [Op.gt]: 0 } },
          required: true
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          attributes: ['image_url']
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
        }
      ],
      order: [
        ['created_at', 'DESC'] // Newest first
      ]
    });

    const formattedArticles = articles.map(article => ({
      id: article.id,
      nom_produit: article.nom_produit,
      description: article.description,
      prix: article.prix,
      prix_final: article.prix_final,
      images: article.images_couleurs.map(img => img.image_url),
      marque: article.marque,
      genre: article.genre,
      categorie: article.categorie,
      created_at: article.created_at
    }));

    res.status(200).json({
      success: true,
      data: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching men's articles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching men's articles",
      error: error.message
    });
  }
};

const obtenirArticleQuotidien = async (req, res) => {
  try {
    // Get today's date as a seed for consistent daily selection
    const today = new Date().toISOString().split('T')[0];
    const seed = parseInt(today.replace(/-/g, ''), 10);

    // Find all articles that have at least 4 colors
    const articles = await Article.findAll({
      include: [
        {
          model: Couleur,
          as: 'couleurs',
          through: { attributes: [] }, // No attributes from the join table
          required: true
        },
        {
          model: Taille,
          as: 'tailles',
          through: {
            attributes: ['quantite', 'couleur_id'],
            as: 'ArticleTaille'
          }
        },
        {
          model: ImageArticleCouleur,
          as: 'images_couleurs',
          include: [{ model: Couleur, as: 'couleur' }]
        },
        { model: Genre, as: 'genre' },
        { model: Categorie, as: 'categorie' },
        { model: Marque, as: 'marque' }
      ]
    });

    // Filter articles to only those with at least 4 colors
    const articlesWith4Colors = articles.filter(article => {
      return article.couleurs && article.couleurs.length >= 4;
    });

    if (articlesWith4Colors.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun article avec 4 couleurs trouvé" 
      });
    }

    // Select an article based on today's seed (consistent for the day)
    const selectedIndex = seed % articlesWith4Colors.length;
    const selectedArticle = articlesWith4Colors[selectedIndex];

    // Get all colors for this article
    const uniqueColors = selectedArticle.couleurs;

    // Select 4 colors based on today's seed (consistent for the day)
    const selectedColors = uniqueColors
      .sort((a, b) => {
        // Create a consistent order based on seed + color id
        const hashA = parseInt(
          require('crypto')
            .createHash('md5')
            .update(`${seed}-${a.id}`)
            .digest('hex')
            .substring(0, 8), 
          16
        );
        const hashB = parseInt(
          require('crypto')
            .createHash('md5')
            .update(`${seed}-${b.id}`)
            .digest('hex')
            .substring(0, 8), 
          16
        );
        return hashA - hashB;
      })
      .slice(0, 4);

    const selectedColorIds = selectedColors.map(c => c.id);

    // Format the article data with only the selected colors
    const formattedArticle = {
      id: selectedArticle.id,
      nom_produit: selectedArticle.nom_produit,
      description: selectedArticle.description,
      prix: selectedArticle.prix,
      prix_final: selectedArticle.prix_final,
      sku: selectedArticle.sku,
      seo_titre: selectedArticle.seo_titre,
      mots_cles_seo: selectedArticle.mots_cles_seo,
      categorie_id: selectedArticle.categorie_id,
      marque_id: selectedArticle.marque_id,
      genre_id: selectedArticle.genre_id,
      created_at: selectedArticle.created_at,
      updated_at: selectedArticle.updated_at,
      genre: selectedArticle.genre,
      categorie: selectedArticle.categorie,
      marque: selectedArticle.marque,
      couleurs: selectedColors,
      images_couleurs: selectedArticle.images_couleurs
        .filter(img => selectedColorIds.includes(img.couleur_id)),
      tailles: selectedArticle.tailles
        .filter(t => selectedColorIds.includes(t.ArticleTaille.couleur_id)),
      stock: calculateTotalStock(selectedArticle.tailles
        .filter(t => selectedColorIds.includes(t.ArticleTaille.couleur_id))),
      variations: selectedArticle.tailles
        .filter(t => selectedColorIds.includes(t.ArticleTaille.couleur_id))
        .map(t => ({
          taille_id: t.id,
          couleur_id: t.ArticleTaille.couleur_id,
          quantite: t.ArticleTaille.quantite
        }))
    };

    // Group images by color
    const imagesByColor = {};
    formattedArticle.images_couleurs.forEach(img => {
      if (!imagesByColor[img.couleur_id]) {
        imagesByColor[img.couleur_id] = [];
      }
      imagesByColor[img.couleur_id].push(img.image_url);
    });

    // Group sizes by color
    const sizesByColor = {};
    formattedArticle.tailles.forEach(t => {
      const colorId = t.ArticleTaille.couleur_id;
      if (!sizesByColor[colorId]) {
        sizesByColor[colorId] = {
          couleur: selectedColors.find(c => c.id === colorId),
          tailles: []
        };
      }
      sizesByColor[colorId].tailles.push({
        id: t.id,
        libelle: t.libelle,
        quantite: t.ArticleTaille.quantite
      });
    });

    // Add the grouped data to the response
    formattedArticle.images_par_couleur = imagesByColor;
    formattedArticle.tailles_par_couleur = sizesByColor;

    res.json({
      success: true,
      donnees: formattedArticle
    });

  } catch (error) {
    console.error("Erreur lors de la récupération de l'article quotidien:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération de l'article quotidien",
      error: error.message 
    });
  }
};
// ... (keep all your existing code above this new function)

// New function to fetch all articles with a discount
const obtenirArticlesEnRemise = async (req, res) => {
  try {
    const currentDate = new Date();
    
    // First, find all active discounts
    const activeDiscounts = await Remise.findAll({
      where: {
        est_active: true,
        date_debut: { [Op.lte]: currentDate },
        date_fin: { [Op.gte]: currentDate }
      }
    });

    if (activeDiscounts.length === 0) {
      return res.json({
        success: true,
        donnees: [],
        message: "Aucune remise active trouvée"
      });
    }

    // Then find articles with discounts applied
    const articles = await Article.findAll({
      include: [
        {
          model: Remise,
          as: 'article_discounts',
          where: {
            id: activeDiscounts.map(d => d.id)
          },
          required: true
        },
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
      order: [['updated_at', 'DESC']],
      distinct: true
    });

    const formattedArticles = articles.map(article => {
      const plainArticle = article.get({ plain: true });
      return {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        primaryImage: plainArticle.images_couleurs?.length > 0
          ? plainArticle.images_couleurs[0].image_url
          : null,
        remise_details: plainArticle.article_discounts?.length > 0 
          ? plainArticle.article_discounts[0]
          : null
      };
    });

    res.json({
      success: true,
      donnees: formattedArticles
    });
  } catch (error) {
    console.error("Error fetching discounted articles:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching discounted articles",
      error: error.message
    });
  }
};

const filtrerArticlesEnRemise = async (req, res) => {
  try {
    const { filtres = [] } = req.body;
    const currentDate = new Date();

    // Base where clause to only get discounted items
    const where = {
      [Op.and]: [
        { 
          prix_final: { 
            [Op.lt]: sequelize.col('prix') // Only items where final price < original price
          } 
        }
      ]
    };

    // Base includes with required discount filtering
    const include = [
      {
        model: Remise,
        as: 'article_discounts',
        where: {
          est_active: true,
          date_debut: { [Op.lte]: currentDate },
          date_fin: { [Op.gte]: currentDate }
        },
        required: true
      },
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

    // Process each filter
    filtres.forEach(({ category, filter }) => {
      switch (category) {
        case "Prix":
          where[Op.and].push({
            prix_final: { 
              [Op.between]: [filter.min, filter.max] 
            }
          });
          break;
          
        case "Catégories":
          include.push({
            model: Categorie,
            as: 'categorie',
            where: { libelle: filter },
            required: true,
            attributes: ['id', 'libelle']
          });
          break;
          
        case "Marques":
          include.push({
            model: Marque,
            as: 'marque',
            where: { libelle: filter },
            required: true,
            attributes: ['id', 'libelle']
          });
          break;
          
        case "Genres":
          include.push({
            model: Genre,
            as: 'genre',
            where: { libelle: filter },
            required: true,
            attributes: ['id', 'libelle']
          });
          break;
          
        case "Tailles":
          include.push({
            model: Taille,
            as: 'tailles',
            where: { libelle: filter },
            required: true,
            attributes: ['id', 'libelle']
          });
          break;
          
        default:
          console.warn(`Unknown filter category: ${category}`);
      }
    });

    // Execute the query
    const articles = await Article.findAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    // Format the response
    const formattedArticles = articles.map(article => {
      const plainArticle = article.get({ plain: true });
      
      return {
        ...plainArticle,
        stock: calculateTotalStock(plainArticle.tailles),
        primaryImage: plainArticle.images_couleurs?.length > 0 
          ? plainArticle.images_couleurs[0].image_url 
          : null,
        remise_details: plainArticle.article_discounts?.[0] || null
      };
    });

    res.json({
      success: true,
      donnees: formattedArticles
    });

  } catch (error) {
    console.error("Error filtering discounted articles:", {
      error: error.message,
      stack: error.stack,
      filters: req.body.filtres
    });
    
    res.status(500).json({
      success: false,
      message: "Error filtering discounted articles",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add these new functions to your module.exports
module.exports = {
  // ... existing exports
  obtenirArticlesEnRemise,
  filtrerArticlesEnRemise,


  ajouterArticle,
  obtenirTousArticles,
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
  ObtenirTousArticleAleatoire,
  obtenirArticleParSku,
  obtenirArticlesFemme,
  obtenirArticlesHomme,
  filtrerArticlesGFemme,
  filtrerArticlesGHomme,
  obtenirArticleQuotidien,
  obtenirTousLesArticles,

  
};