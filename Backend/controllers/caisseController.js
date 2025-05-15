const { Sequelize, Op } = require('sequelize');
const { body, validationResult } = require("express-validator");
const { Commande, ArticleCommande, Coupon,Utilisateur, Client, Marque, CommandeArticle, ArticlePanier, Article, Panier, Couleur, Taille, ArticleTaille, Adresse, ImageArticleCouleur, sequelize } = require("../models");
const LoyaltyService = require('../services/loyaltyService');

const { generateOrderReference } = require('../services/orderReferenceService');

const initialiserCommande = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.REPEATABLE_READ
  });

  try {
    const idUtilisateur = req.utilisateur?.id;
    const guestToken = req.headers['x-guest-token'];

    // Validate we have at least one identifier
    if (!idUtilisateur && !guestToken) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Identifiant de panier manquant (authentification ou token invité requis)" 
      });
    }

    // Build the initial where clause
    const whereClause = {};
    
    if (idUtilisateur) {
      whereClause.utilisateur_id = idUtilisateur;
    } else {
      whereClause.guest_token = guestToken;
    }

    // Step 1: Try to find existing cart
    let panier = await Panier.findOne({
      where: whereClause,
      include: [{
        model: ArticlePanier,
        as: 'panier_articles',
        required: false,
        include: [
          { model: Article, as: 'article' },
          { model: Couleur, as: 'couleur' },
          { model: Taille, as: 'taille' }
        ]
      }],
      transaction
    });

    // If authenticated user with guest token but no cart found yet
    if (!panier && idUtilisateur && guestToken) {
      // Find and lock the guest cart
      const guestCart = await Panier.findOne({
        where: { guest_token: guestToken },
        include: [{
          model: ArticlePanier,
          as: 'panier_articles',
          required: false,
          include: [
            { model: Article, as: 'article' },
            { model: Couleur, as: 'couleur' },
            { model: Taille, as: 'taille' }
          ]
        }],
        transaction,
        lock: true
      });

      if (guestCart) {
        // Migrate guest cart to authenticated user
        await Panier.update(
          { 
            utilisateur_id: idUtilisateur, 
            guest_token: null 
          },
          { 
            where: { id: guestCart.id }, 
            transaction 
          }
        );
        
        panier = await Panier.findByPk(guestCart.id, { 
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
    }

    if (!panier) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Aucun panier actif trouvé" 
      });
    }

    // Get cart items (either from included relations or separate query)
    const panierArticles = panier.panier_articles || await ArticlePanier.findAll({
      where: { panier_id: panier.id },
      include: [
        { model: Article, as: 'article' },
        { model: Couleur, as: 'couleur' },
        { model: Taille, as: 'taille' }
      ],
      transaction
    });

    if (!panierArticles?.length) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Le panier est vide" 
      });
    }

    // Verify stock for all items with row locking
    const articlesAvecStock = await Promise.all(
      panierArticles.map(async (item) => {
        const stock = await ArticleTaille.findOne({
          where: {
            article_id: item.article_id,
            couleur_id: item.couleur_id,
            taille_id: item.taille_id,
            deleted_at: null
          },
          transaction,
          lock: true
        });
        
        return {
          ...item.get({ plain: true }),
          stock_disponible: stock?.quantite || 0,
          stock_row: stock
        };
      })
    );

    const articlesIndisponibles = articlesAvecStock
      .filter(item => item.quantite > item.stock_disponible);

    if (articlesIndisponibles.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Certains articles ne sont plus disponibles",
        data: {
          unavailableItems: articlesIndisponibles.map(item => ({
            article_id: item.article_id,
            article_nom: item.article?.nom_produit,
            quantite_demandee: item.quantite,
            quantite_disponible: item.stock_disponible
          }))
        }
      });
    }

    // Determine next step based on auth status
    const etapeSuivante = idUtilisateur ? '/caisse/adresse' : '/caisse/identification';

    await transaction.commit();
    return res.status(200).json({
      success: true,
      data: {
        etapeSuivante,
        panier_id: panier.id,
        cartItems: panierArticles.map(item => ({
          id: item.id,
          article_id: item.article_id,
          couleur_id: item.couleur_id,
          taille_id: item.taille_id,
          quantite: item.quantite,
          prix: item.prix_au_moment_ajout,
          article_nom: item.article?.nom_produit,
          couleur_nom: item.couleur?.libelle,
          taille_nom: item.taille?.libelle
        }))
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Checkout init error:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'initialisation de la commande",
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

const obtenirAdresses = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const adresses = await Adresse.findAll({
      where: { client_id: req.utilisateur.id },
      order: [
        ['est_principale', 'DESC'], // Adresse principale en premier
        ['created_at', 'ASC'] // Plus anciennes en premier
      ],
      transaction
    });

    // Si aucune adresse principale mais il y a des adresses
    if (adresses.length > 0 && !adresses.some(a => a.est_principale)) {
      // Définir la plus ancienne comme principale
      await adresses[0].update({ est_principale: true }, { transaction });
      // Recharger les adresses après mise à jour
      adresses[0].est_principale = true;
    }

    await transaction.commit();
    
    res.status(200).json({
      success: true,
      data: adresses
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur de récupération des adresses:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des adresses",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const creerAdresse = async (req, res) => {
  await Promise.all([
    body('nom_complet').notEmpty().withMessage('Le nom complet est requis').run(req),
    body('adresse').notEmpty().withMessage('L\'adresse est requise').run(req),
    body('code_postal').notEmpty().withMessage('Le code postal est requis').run(req),
    body('gouvernorat').notEmpty().withMessage('Le gouvernorat est requis').run(req),
    body('telephone').notEmpty().withMessage('Le téléphone est requis').run(req)
  ]);

  const erreurs = validationResult(req);
  if (!erreurs.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation échouée',
      errors: erreurs.array() 
    });
  }

  const transaction = await sequelize.transaction();
  try {
    const { 
      nom_complet,
      adresse, 
      complement, 
      code_postal, 
      ville, 
      gouvernorat, 
      telephone,
      est_principale = false 
    } = req.body;

    const nouvelleAdresse = await Adresse.create({
      client_id: req.utilisateur.id,
      nom_complet,
      adresse,
      complement,
      code_postal,
      ville,
      gouvernorat,
      telephone,
      est_principale
    }, { transaction });

    await transaction.commit();

    res.status(201).json({ 
      success: true,
      data: nouvelleAdresse,
      message: 'Adresse créée avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur de création d\'adresse:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la création de l'adresse",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const definirAdressePrincipale = async (req, res) => {
  const { adresseId } = req.params;
  const transaction = await sequelize.transaction();

  try {
    // 1. Trouver l'adresse
    const adresse = await Adresse.findOne({
      where: { id: adresseId, client_id: req.utilisateur.id },
      transaction
    });

    if (!adresse) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: "Adresse non trouvée" 
      });
    }

    // 2. Mettre à jour toutes les adresses (hook beforeSave fera ce travail)
    await adresse.update({ est_principale: true }, { transaction });

    await transaction.commit();
    return res.json({ 
      success: true, 
      message: "Adresse principale mise à jour",
      data: {
        adresse_id: adresse.id,
        est_principale: true
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur de mise à jour de l\'adresse principale:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la mise à jour de l'adresse principale",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const sauvegarderAdresseLivraison = async (req, res) => {
  await Promise.all([
    body('adresse').notEmpty().withMessage('L\'adresse est requise').run(req),
    body('code_postal').notEmpty().withMessage('Le code postal est requis')
      .isNumeric().withMessage('Le code postal doit être numérique').run(req),
    body('gouvernorat').notEmpty().withMessage('Le gouvernorat est requis').run(req),
    body('telephone').notEmpty().withMessage('Le téléphone est requis')
      .isLength({ min: 8, max: 8 }).withMessage('Le téléphone doit avoir 8 chiffres')
      .isNumeric().withMessage('Le téléphone doit être numérique').run(req)
  ]);

  const erreurs = validationResult(req);
  
  if (!erreurs.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation échouée',
      errors: erreurs.array() 
    });
  }

 const transaction = await sequelize.transaction();
  try {
    const { 
      adresse, 
      complement, 
      code_postal, 
      ville, 
      gouvernorat, 
      telephone, 
      nom_adresse,
      est_principale = false 
    } = req.body;
    const idUtilisateur = req.utilisateur?.id;

    if (!idUtilisateur) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'Authentification requise' 
      });
    }

    const [client] = await Client.findOrCreate({
      where: { utilisateur_id: idUtilisateur },
      defaults: { telephone },
      transaction
    });

    // Create the address - let the model hooks handle the primary address logic
    const nouvelleAdresse = await Adresse.create({
      client_id: client.utilisateur_id,
      nom_adresse: nom_adresse || 'Adresse', // Default to 'Adresse', hooks will update if primary
      adresse,
      complement: complement || null,
      code_postal,
      ville: ville || gouvernorat,
      gouvernorat,
      telephone,
      est_principale
    }, { transaction });

    await Utilisateur.update(
      { statut: 'client_en_attente' },
      { 
        where: { 
          id: idUtilisateur,
          statut: { [Op.ne]: 'client_confirme' }
        },
        transaction 
      }
    );

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Adresse de livraison sauvegardée avec succès',
      data: {
        adresse_id: nouvelleAdresse.id,
        est_principale: nouvelleAdresse.est_principale,
        nom_adresse: nouvelleAdresse.nom_adresse
      },
      etapeSuivante: '/caisse/livraison'
    });
  } catch (erreur) {
    await transaction.rollback();
    console.error('Erreur de sauvegarde de l\'adresse:', erreur);
    res.status(500).json({ 
      success: false,
      message: erreur.message || 'Erreur lors de la sauvegarde de l\'adresse',
      error: process.env.NODE_ENV === 'development' ? erreur.stack : undefined
    });
  }
};


const obtenirConfirmationCommande = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.READ_COMMITTED
  });

  try {
    const { reference } = req.params;
    console.log(`[Order Confirmation] Fetching order with reference: ${reference}`);

    // Basic validation
    if (!reference) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'La référence de commande est requise',
        code: 'MISSING_REFERENCE'
      });
    }

    // Find order with all necessary relations - using exact column names from your schema
    const commande = await Commande.findOne({
      where: { reference },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['utilisateur_id', 'telephone', 'points_fidelite', 'methode_paiement'],
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['id', 'nom', 'prenom', 'email']
          }],
          transaction
        },
        {
          model: Adresse,
          as: 'adresse',
          // Using exact column names from your adresse table
          attributes: ['id', 'client_id', 'nom_adresse', 'adresse', 'complement', 'code_postal', 'ville', 'gouvernorat', 'telephone', 'est_principale'],
          transaction
        },
        {
          model: Article,
          as: 'articles',
          attributes: ['id', 'nom_produit', 'description', 'prix', 'prix_final'],
          through: {
            attributes: ['quantite', 'prix_unitaire', 'taille_id', 'couleur_id'],
            model: CommandeArticle,
            transaction
          },
          include: [
            {
              model: Marque,
              as: 'marque',
              attributes: ['libelle'],
              transaction
            }
          ],
          transaction
        }
      ],
      transaction
      // Removed FOR SHARE lock as it conflicts with LEFT OUTER JOIN
    });

    if (!commande) {
      await transaction.rollback();
      console.warn(`[Order Confirmation] Order not found: ${reference}`);
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée',
        code: 'ORDER_NOT_FOUND'
      });
    }

    console.log(`[Order Confirmation] Found order: ${commande.id}`);

    // Convert to plain object and process data
    const commandeData = commande.get({ plain: true });
    
    // Parse numeric fields
    commandeData.prix_total = parseFloat(commandeData.prix_total || 0);
    commandeData.frais_livraison = parseFloat(commandeData.frais_livraison || 0);

    // Enrich articles with additional data
    const enrichedArticles = await Promise.all(
      commandeData.articles.map(async (article) => {
        const [couleur, taille, image] = await Promise.all([
          article.CommandeArticle.couleur_id ? 
            Couleur.findByPk(article.CommandeArticle.couleur_id, {
              attributes: ['id', 'libelle', 'hexcode'],
              transaction
            }) : Promise.resolve(null),
          
          article.CommandeArticle.taille_id ? 
            Taille.findByPk(article.CommandeArticle.taille_id, {
              attributes: ['id', 'libelle'],
              transaction
            }) : Promise.resolve(null),
          
          article.CommandeArticle.couleur_id ?
            ImageArticleCouleur.findOne({
              where: {
                article_id: article.id,
                couleur_id: article.CommandeArticle.couleur_id
              },
              attributes: ['image_url'],
              order: [['ordre_affichage', 'ASC']],
              transaction,
              limit: 1
            }) : Promise.resolve(null)
        ]);

        return {
          ...article,
          couleur: couleur ? couleur.get({ plain: true }) : null,
          taille: taille ? taille.get({ plain: true }) : null,
          image: image ? image.image_url : null,
          quantite: article.CommandeArticle.quantite,
          prix_unitaire: parseFloat(article.CommandeArticle.prix_unitaire || 0),
          prix_total: parseFloat(article.CommandeArticle.prix_unitaire || 0) * article.CommandeArticle.quantite,
          marque: article.marque
        };
      })
    );

    // Sort articles by ID for consistent ordering
    enrichedArticles.sort((a, b) => a.id - b.id);
    commandeData.articles = enrichedArticles;

    await transaction.commit();

    return res.status(200).json({
      success: true,
      data: {
        commande: commandeData,
        commandeReference: commande.reference
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error(`[Order Confirmation] Error:`, error);
    
    return res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const validerCoupon = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { code } = req.body;
    const idUtilisateur = req.utilisateur?.id;

    // Validate authentication
    if (!idUtilisateur) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Authentification requise" 
      });
    }

    // Validate coupon code exists
    if (!code || typeof code !== 'string') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Code coupon requis" 
      });
    }

    // Find and lock the coupon
    const coupon = await Coupon.findOne({
      where: {
        code,
        client_id: idUtilisateur,
        is_used: false,
        expires_at: { [Op.gt]: new Date() }
      },
      transaction,
      lock: true
    });

    if (!coupon) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Coupon invalide, expiré ou déjà utilisé" 
      });
    }

    // Get cart to calculate subtotal (for percentage coupons)
    const panier = await Panier.findOne({
      where: { utilisateur_id: idUtilisateur },
      include: [{
        model: ArticlePanier,
        as: 'panier_articles',
        required: false
      }],
      transaction
    });

    if (!panier?.panier_articles?.length) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: "Votre panier est vide" 
      });
    }

    // Calculate cart subtotal
    const subtotal = panier.panier_articles.reduce((sum, item) => {
      return sum + (item.prix_au_moment_ajout * item.quantite);
    }, 0);

    // Calculate discount amount
    let remise = 0;
    if (coupon.type === 'fixed') {
      remise = parseFloat(coupon.value);
    } else if (coupon.type === 'percentage') {
      remise = (subtotal * parseFloat(coupon.value)) / 100;
      
      // For percentage coupons, ensure discount doesn't exceed max value if specified
      if (coupon.max_value && remise > coupon.max_value) {
        remise = coupon.max_value;
      }
    }

    // Don't mark as used yet - just validating
    await transaction.commit();
    
    return res.status(200).json({
      success: true,
      data: {
        remise,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          expires_at: coupon.expires_at
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Coupon validation error:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du coupon",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/* const traiterPaiement = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.REPEATABLE_READ
  });

  try {
    const { methodePaiement, adresse_id, shipping_method, shipping_cost = 0 } = req.body;
    const idUtilisateur = req.utilisateur?.id;

    if (!idUtilisateur) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Authentification requise" 
      });
    }

    // 1. Get and lock the cart
    const panier = await Panier.findOne({
      where: { utilisateur_id: idUtilisateur },
      transaction,
      lock: true,
      skipLocked: true
    });

    if (!panier) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Aucun panier actif trouvé" 
      });
    }

    // 2. Get cart items with article details
    const panierArticles = await ArticlePanier.findAll({
      where: { panier_id: panier.id },
      include: [
        { 
          model: Article,
          as: 'article',
          required: true
        },
        {
          model: Couleur,
          as: 'couleur',
          required: false
        },
        {
          model: Taille,
          as: 'taille',
          required: false
        }
      ],
      transaction
    });

    if (!panierArticles?.length) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Le panier est vide" 
      });
    }

    // 3. Verify shipping address
    const adresseLivraison = await Adresse.findOne({
      where: { id: adresse_id, client_id: idUtilisateur },
      transaction
    });

    if (!adresseLivraison) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Adresse de livraison invalide" 
      });
    }

    // 4. Verify stock for all items with locking
    const stockVerifications = await Promise.all(
      panierArticles.map(async (item) => {
        const stock = await ArticleTaille.findOne({
          where: {
            article_id: item.article_id,
            couleur_id: item.couleur_id,
            taille_id: item.taille_id,
            deleted_at: null
          },
          transaction,
          lock: true
        });
        
        return {
          item,
          stock: stock?.quantite || 0
        };
      })
    );

    const articlesIndisponibles = stockVerifications
      .filter(({ item, stock }) => item.quantite > stock);

    if (articlesIndisponibles.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Certains articles ne sont plus disponibles",
        data: {
          unavailableItems: articlesIndisponibles.map(({ item, stock }) => ({
            article_id: item.article_id,
            article_nom: item.article?.nom_produit,
            quantite_demandee: item.quantite,
            quantite_disponible: stock
          }))
        }
      });
    }

    // 5. Calculate totals
    const subtotal = panierArticles.reduce((sum, item) => {
      return sum + (item.prix_au_moment_ajout * item.quantite);
    }, 0);
    
    const total = subtotal + parseFloat(shipping_cost);
    // ▲ Après avoir calculé le subtotal ▲
    const pointsEarned = Math.floor(subtotal); // 1 point par dinar
    await LoyaltyService.addPoints(idUtilisateur, pointsEarned, transaction);
    // 6. Create order
    const commande = await Commande.create({
      client_id: idUtilisateur,
      adresse_id: adresseLivraison.id,
      prix_total: total,
      statut: "en_preparation",
      methode_livraison: shipping_method,
      methode_paiement: methodePaiement,
      frais_livraison: shipping_cost
    }, { transaction });

    // 7. Create order items with duplicate handling
    const orderItemsMap = new Map();

    // Group identical items (same article + color + size)
    for (const item of panierArticles) {
      const itemKey = `${item.article_id}_${item.couleur_id || 'null'}_${item.taille_id || 'null'}`;
      
      if (orderItemsMap.has(itemKey)) {
        // Update quantity if item exists
        const existing = orderItemsMap.get(itemKey);
        existing.quantite += item.quantite;
      } else {
        // Add new item to map
        orderItemsMap.set(itemKey, {
          commande_id: commande.id,
          article_id: item.article_id,
          couleur_id: item.couleur_id,
          taille_id: item.taille_id,
          quantite: item.quantite,
          prix_unitaire: item.prix_au_moment_ajout
        });
      }
    }

    // Convert to array for bulkCreate
    const orderItemsToCreate = Array.from(orderItemsMap.values());
    
    await CommandeArticle.bulkCreate(orderItemsToCreate, {
      transaction,
      updateOnDuplicate: ['quantite'] // Update quantity if duplicate exists
    });

    // 8. Update stock levels
    for (const { item, stock } of stockVerifications) {
      await ArticleTaille.update(
        { quantite: stock - item.quantite },
        {
          where: {
            article_id: item.article_id,
            couleur_id: item.couleur_id,
            taille_id: item.taille_id
          },
          transaction
        }
      );
    }

    // 9. Clear cart
    await ArticlePanier.destroy({
      where: { panier_id: panier.id },
      transaction
    });

    // 10. Update user status if needed
    await Utilisateur.update(
      { statut: "client_confirme" },
      {
        where: {
          id: idUtilisateur,
          statut: { [Op.ne]: "client_confirme" }
        },
        transaction
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      data: {
        commandeId: commande.id,
        commandeReference: commande.reference,
        prix_total: total,
        statut: commande.statut
      },
      message: 'Commande créée avec succès',
      etapeSuivante: `/caisse/confirmation/${commande.reference}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Payment processing error:", error);

    let errorMessage = "Erreur lors du traitement du paiement";
    if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = "Un problème est survenu avec les articles de la commande";
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = "Erreur de base de données lors du traitement";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
}; */

const traiterPaiement = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.REPEATABLE_READ
  });

  try {
    const { 
      methodePaiement, 
      adresse_id, 
      shipping_method, 
      shipping_cost = 0,
      codeCoupon 
    } = req.body;
    
    const idUtilisateur = req.utilisateur?.id;

    if (!idUtilisateur) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Authentification requise" 
      });
    }

    // 1. First get and lock just the cart (without items)
    const panier = await Panier.findOne({
      where: { utilisateur_id: idUtilisateur },
      transaction,
      lock: true,
      skipLocked: true
    });

    if (!panier) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Aucun panier actif trouvé" 
      });
    }

    // 2. Then get the cart items separately
    const panierArticles = await ArticlePanier.findAll({
      where: { panier_id: panier.id },
      include: [{
        model: Article,
        as: 'article',
        required: true
      }],
      transaction
    });

    if (!panierArticles?.length) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Le panier est vide" 
      });
    }

    // 3. Verify shipping address
    const adresseLivraison = await Adresse.findOne({
      where: { id: adresse_id, client_id: idUtilisateur },
      transaction
    });

    if (!adresseLivraison) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Adresse de livraison invalide" 
      });
    }

    // 4. Verify stock for all items with locking
    const stockVerifications = await Promise.all(
      panierArticles.map(async (item) => {
        const stock = await ArticleTaille.findOne({
          where: {
            article_id: item.article_id,
            couleur_id: item.couleur_id,
            taille_id: item.taille_id,
            deleted_at: null
          },
          transaction,
          lock: true
        });
        
        return {
          item,
          stock: stock?.quantite || 0,
          stockRow: stock
        };
      })
    );

    // Check for unavailable items
    const articlesIndisponibles = stockVerifications
      .filter(({ item, stock }) => item.quantite > stock);

    if (articlesIndisponibles.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Certains articles ne sont plus disponibles",
        data: {
          unavailableItems: articlesIndisponibles.map(({ item, stock }) => ({
            article_id: item.article_id,
            article_nom: item.article?.nom_produit,
            quantite_demandee: item.quantite,
            quantite_disponible: stock
          }))
        }
      });
    }

    // Calculate subtotal
    const subtotal = panierArticles.reduce((sum, item) => {
      return sum + (item.prix_au_moment_ajout * item.quantite);
    }, 0);

    // Handle coupon if provided
    let remise = 0;
    let couponUtilise = null;

    if (codeCoupon) {
      const coupon = await Coupon.findOne({
        where: {
          code: codeCoupon,
          client_id: idUtilisateur,
          is_used: false,
          expires_at: { [Op.gt]: new Date() }
        },
        transaction,
        lock: true
      });

      if (!coupon) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false,
          message: "Coupon invalide ou déjà utilisé" 
        });
      }

      // Calculate discount
      if (coupon.type === 'fixed') {
        remise = parseFloat(coupon.value);
      } else if (coupon.type === 'percentage') {
        remise = (subtotal * parseFloat(coupon.value)) / 100;
        
        if (coupon.max_value && remise > coupon.max_value) {
          remise = coupon.max_value;
        }
      }

      // Mark coupon as used
      await coupon.update({ 
        is_used: true,
        used_at: new Date()
      }, { transaction });

      couponUtilise = coupon.code;
    }

    // Calculate final total
    const total = subtotal + parseFloat(shipping_cost) - remise;

    // Create order
    const commande = await Commande.create({
      client_id: idUtilisateur,
      adresse_id: adresseLivraison.id,
      prix_total: total,
      statut: "en_preparation",
      methode_livraison: shipping_method,
      methode_paiement: methodePaiement,
      frais_livraison: shipping_cost,
      coupon_utilise: couponUtilise,
      remise
    }, { transaction });

    // Create order items (group identical items)
    const orderItemsMap = new Map();
    panierArticles.forEach(item => {
      const key = `${item.article_id}_${item.couleur_id || 'null'}_${item.taille_id || 'null'}`;
      if (orderItemsMap.has(key)) {
        const existing = orderItemsMap.get(key);
        existing.quantite += item.quantite;
      } else {
        orderItemsMap.set(key, {
          commande_id: commande.id,
          article_id: item.article_id,
          couleur_id: item.couleur_id,
          taille_id: item.taille_id,
          quantite: item.quantite,
          prix_unitaire: item.prix_au_moment_ajout
        });
      }
    });

    await CommandeArticle.bulkCreate(Array.from(orderItemsMap.values()), {
      transaction,
      updateOnDuplicate: ['quantite']
    });

    // Update stock levels
    await Promise.all(
      stockVerifications.map(({ item, stock }) => 
        ArticleTaille.update(
          { quantite: stock - item.quantite },
          {
            where: {
              article_id: item.article_id,
              couleur_id: item.couleur_id,
              taille_id: item.taille_id
            },
            transaction
          }
        )
      )
    );

    // Clear cart
    await ArticlePanier.destroy({
      where: { panier_id: panier.id },
      transaction
    });

    // Update user status if needed
    await Utilisateur.update(
      { statut: "client_confirme" },
      {
        where: {
          id: idUtilisateur,
          statut: { [Op.ne]: "client_confirme" }
        },
        transaction
      }
    );

    // Add loyalty points (1 point per dinar spent)
    const pointsEarned = Math.floor(subtotal);
    await LoyaltyService.addPoints(idUtilisateur, pointsEarned, transaction);

    await transaction.commit();

    return res.status(200).json({
      success: true,
      data: {
        commandeId: commande.id,
        commandeReference: commande.reference,
        prix_total: total,
        statut: commande.statut,
        remise,
        pointsEarned
      },
      message: 'Commande créée avec succès',
      etapeSuivante: `/caisse/confirmation/${commande.reference}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Payment processing error:", {
      userId: req.utilisateur?.id,
      error: error.message,
      stack: error.stack
    });
    
    let errorMessage = "Erreur lors du traitement du paiement";
    if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = "Un problème est survenu avec les articles de la commande";
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = "Erreur de base de données lors du traitement";
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};


const sauvegarderMethodeLivraison = async (req, res) => {
  try {
    const { methode } = req.body;
    const idUtilisateur = req.utilisateur?.id;

    if (!idUtilisateur) {
      return res.status(401).json({ 
        success: false,
        message: "Authentification requise" 
      });
    }

    req.session.methodeLivraison = methode;
    await req.session.save();

    res.status(200).json({ 
      success: true,
      etapeSuivante: "/caisse/paiement" 
    });
  } catch (error) {
    console.error("Erreur de sauvegarde de la méthode de livraison:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la sauvegarde de la méthode de livraison",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  initialiserCommande,
  obtenirAdresses,
  creerAdresse,
  sauvegarderAdresseLivraison,
  traiterPaiement,
  obtenirConfirmationCommande,
  sauvegarderMethodeLivraison,
  definirAdressePrincipale,
  validerCoupon

};
