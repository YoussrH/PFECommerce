const { Sequelize, Op } = require('sequelize');
const { body, validationResult } = require("express-validator");
const { Commande, ArticleCommande, Utilisateur, Client, Marque, CommandeArticle, ArticlePanier, Article, Panier, Couleur, Taille, ArticleTaille, Adresse, ImageArticleCouleur, sequelize } = require("../models");

const initialiserCommande = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.SERIALIZABLE
  });

  try {
    const idUtilisateur = req.utilisateur?.id;
    const guestToken = req.headers['x-guest-token'];

    // Step 1: Try to find existing cart
    let panier = await Panier.findOne({
      where: idUtilisateur ? { utilisateur_id: idUtilisateur } : { guest_token: guestToken },
      include: [{
        model: ArticlePanier,
        as: 'panier_articles',
        required: true
      }],
      transaction,
      lock: true
    });

    // Step 2: If authenticated but no cart found, check for guest cart to migrate
    if (!panier && idUtilisateur && guestToken) {
      const guestCart = await Panier.findOne({
        where: { guest_token: guestToken },
        include: [{
          model: ArticlePanier,
          as: 'panier_articles',
          required: true
        }],
        transaction,
        lock: true
      });

      if (guestCart) {
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
          transaction,
          lock: true
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

    // Step 3: Verify stock for all items with row locking
    const articlesAvecStock = await Promise.all(
      panier.panier_articles.map(async (item) => {
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
            quantite_demandee: item.quantite,
            quantite_disponible: item.stock_disponible
          }))
        }
      });
    }

    // Step 4: Determine next step based on auth status
    const etapeSuivante = idUtilisateur ? '/caisse/adresse' : '/caisse/identification';

    await transaction.commit();
    return res.status(200).json({
      success: true,
      data: {
        etapeSuivante,
        panier_id: panier.id,
        cartItems: panier.panier_articles.map(item => ({
          id: item.id,
          article_id: item.article_id,
          quantite: item.quantite,
          prix: item.prix_au_moment_ajout
        }))
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Checkout init error:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'initialisation de la commande",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const obtenirAdresses = async (req, res) => {
  try {
    const adresses = await Adresse.findAll({
      where: { utilisateur_id: req.utilisateur.id },
      order: [['est_principale', 'DESC'], ['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: adresses
    });
  } catch (error) {
    console.error('Erreur de récupération des adresses:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des adresses"
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
      est_principale 
    } = req.body;

    // If setting as primary, unset any existing primary address
    if (est_principale) {
      await Adresse.update(
        { est_principale: false },
        { 
          where: { 
            utilisateur_id: req.utilisateur.id,
            est_principale: true
          },
          transaction 
        }
      );
    }

    const nouvelleAdresse = await Adresse.create({
      utilisateur_id: req.utilisateur.id,
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
      message: "Erreur lors de la création de l'adresse"
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
      est_principale 
    } = req.body;
    const idUtilisateur = req.utilisateur?.id;

    if (!idUtilisateur) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'Authentification requise' 
      });
    }

    // Find or create client
    const [client] = await Client.findOrCreate({
      where: { utilisateur_id: idUtilisateur },
      defaults: { telephone },
      transaction
    });

    // If marking as primary, unset any existing primary address
    if (est_principale) {
      await Adresse.update(
        { est_principale: false },
        { 
          where: { client_id: client.utilisateur_id },
          transaction 
        }
      );
    }

    // Create new address
    const nouvelleAdresse = await Adresse.create({
      client_id: client.utilisateur_id,
      nom_adresse: nom_adresse || 'Adresse Principale',
      adresse,
      complement: complement || null,
      code_postal,
      ville: ville || gouvernorat,
      gouvernorat,
      telephone,
      est_principale: est_principale || false
    }, { transaction });

    // Update user status if this is their first address
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
        est_principale: nouvelleAdresse.est_principale
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

/* const obtenirConfirmationCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;

    // Get the basic order information first
    const commande = await Commande.findOne({
      where: { id: commandeId },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['nom', 'email']
          }]
        },
        {
          model: Adresse,
          as: 'adresse'
        },
        {
          model: Article,
          as: 'articles',
          through: {
            attributes: ['quantite', 'prix_unitaire', 'taille_id', 'couleur_id'],
            model: CommandeArticle
          }
        }
      ]
    });

    if (!commande) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    // Get the plain data object
    const commandeData = commande.get({ plain: true });

    // Enrich each article with additional data
    const enrichedArticles = await Promise.all(
      commandeData.articles.map(async (article) => {
        // Get color information
        const couleur = article.CommandeArticle.couleur_id ? 
          await Couleur.findByPk(article.CommandeArticle.couleur_id) : null;
        
        // Get size information
        const taille = article.CommandeArticle.taille_id ? 
          await Taille.findByPk(article.CommandeArticle.taille_id) : null;

        // Get first image for this article/color combination
        const image = article.CommandeArticle.couleur_id ? 
          await ImageArticleCouleur.findOne({
            where: {
              article_id: article.id,
              couleur_id: article.CommandeArticle.couleur_id
            },
            order: [['ordre_affichage', 'ASC']],
            limit: 1
          }) : null;

        return {
          ...article,
          couleur: couleur ? couleur.get({ plain: true }) : null,
          taille: taille ? taille.get({ plain: true }) : null,
          image: image ? image.image_url : null,
          quantite: article.CommandeArticle.quantite,
          prix_unitaire: article.CommandeArticle.prix_unitaire
        };
      })
    );

    // Replace articles with enriched version
    commandeData.articles = enrichedArticles;

    return res.status(200).json({
      success: true,
      data: {
        commande: commandeData
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};  */

const obtenirConfirmationCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;

    // Get the basic order information first
    const commande = await Commande.findOne({
      where: { id: commandeId },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['nom', 'email']
          }]
        },
        {
          model: Adresse,
          as: 'adresse'
        },
        {
          model: Article,
          as: 'articles',
          through: {
            attributes: ['quantite', 'prix_unitaire', 'taille_id', 'couleur_id'],
            model: CommandeArticle
          },
          include: [
            {
              model: Marque,
              as: 'marque',
              attributes: ['libelle']
            }
          ]
        }
      ]
    });

    if (!commande) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    // Get the plain data object
    const commandeData = commande.get({ plain: true });

    // Ensure numeric values are properly formatted
    commandeData.prix_total = parseFloat(commandeData.prix_total || 0);
    commandeData.frais_livraison = parseFloat(commandeData.frais_livraison || 0);

    // Enrich each article with additional data
    const enrichedArticles = await Promise.all(
      commandeData.articles.map(async (article) => {
        // Get color information
        const couleur = article.CommandeArticle.couleur_id ? 
          await Couleur.findByPk(article.CommandeArticle.couleur_id) : null;
        
        // Get size information
        const taille = article.CommandeArticle.taille_id ? 
          await Taille.findByPk(article.CommandeArticle.taille_id) : null;

        // Get first image for this article/color combination
        const image = article.CommandeArticle.couleur_id ? 
          await ImageArticleCouleur.findOne({
            where: {
              article_id: article.id,
              couleur_id: article.CommandeArticle.couleur_id
            },
            order: [['ordre_affichage', 'ASC']],
            limit: 1
          }) : null;

        return {
          ...article,
          couleur: couleur ? couleur.get({ plain: true }) : null,
          taille: taille ? taille.get({ plain: true }) : null,
          image: image ? image.image_url : null,
          quantite: article.CommandeArticle.quantite,
          prix_unitaire: parseFloat(article.CommandeArticle.prix_unitaire || 0),
          prix: parseFloat(article.prix || 0),
          prix_final: parseFloat(article.prix_final || article.prix || 0)
        };
      })
    );

    // Replace articles with enriched version
    commandeData.articles = enrichedArticles;

    return res.status(200).json({
      success: true,
      data: {
        commande: commandeData
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

  const traiterPaiement = async (req, res) => {
  const transaction = await sequelize.transaction({
    isolationLevel: Sequelize.Transaction.SERIALIZABLE
  });

  try {
    const { methodePaiement, adresse_id, shipping_method, shipping_cost = 0 } = req.body;
    const idUtilisateur = req.utilisateur?.id;

    if (!idUtilisateur) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: "Authentification requise" });
    }

    // 1. Get cart with basic info
    const panier = await Panier.findOne({
      where: { utilisateur_id: idUtilisateur },
      attributes: ['id'],
      transaction
    });

    if (!panier) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Aucun panier trouvé" });
    }

    // 2. Validate address
    const adresseLivraison = await Adresse.findOne({
      where: { id: adresse_id, client_id: idUtilisateur },
      transaction
    });

    if (!adresseLivraison) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Adresse de livraison invalide" });
    }

    // 3. Get cart items with article details
    const panierArticles = await ArticlePanier.findAll({
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
      return res.status(400).json({ success: false, message: "Le panier est vide" });
    }

    // 4. Verify stock availability with locking
    const stockUpdates = [];
    for (const item of panierArticles) {
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

      if (!stock) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Article ${item.article_id} (taille ${item.taille_id}, couleur ${item.couleur_id}) non trouvé en stock`
        });
      }

      if (stock.quantite < item.quantite) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour l'article ${item.article_id}`,
          details: {
            article_id: item.article_id,
            taille_id: item.taille_id,
            couleur_id: item.couleur_id,
            quantite_demandee: item.quantite,
            quantite_disponible: stock.quantite
          }
        });
      }

      stockUpdates.push({
        article_id: item.article_id,
        couleur_id: item.couleur_id,
        taille_id: item.taille_id,
        quantite: item.quantite,
        current_stock: stock.quantite
      });
    }

    // 5. Process inventory updates with raw query to bypass any model validations
    for (const update of stockUpdates) {
      const newQuantity = update.current_stock - update.quantite;
      
      await sequelize.query(
        `UPDATE article_taille 
         SET quantite = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE article_id = ? AND couleur_id = ? AND taille_id = ? AND deleted_at IS NULL
         RETURNING *`,
        {
          replacements: [newQuantity, update.article_id, update.couleur_id, update.taille_id],
          type: sequelize.QueryTypes.UPDATE,
          transaction
        }
      );
    }

    // 6. Calculate totals
    const subtotal = panierArticles.reduce((sum, item) => {
      return sum + (item.prix_au_moment_ajout * item.quantite);
    }, 0);
    
    const total = subtotal + parseFloat(shipping_cost);

    // 7. Create order
    const commande = await Commande.create({
      client_id: idUtilisateur,
      adresse_id: adresseLivraison.id,
      prix_total: total,
      statut: "en_attente",
      methode_livraison: shipping_method,
      methode_paiement: methodePaiement,
      frais_livraison: shipping_cost
    }, { transaction });

    // 8. Create order items
    for (const item of panierArticles) {
      await CommandeArticle.create({
        commande_id: commande.id,
        article_id: item.article_id,
        couleur_id: item.couleur_id,
        taille_id: item.taille_id,
        quantite: item.quantite,
        prix_unitaire: item.prix_au_moment_ajout,
      }, { transaction });
    }

    // 9. Clear cart
    await ArticlePanier.destroy({
      where: { panier_id: panier.id },
      transaction
    });

    // 10. Update user status
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
        prix_total: total,
        statut: commande.statut
      },
      message: 'Commande créée avec succès',
      etapeSuivante: `/caisse/confirmation/${commande.id}`
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Payment processing error:", error);

    let errorMessage = "Erreur lors du traitement du paiement";
    if (error.name === 'SequelizeDatabaseError') {
      errorMessage = "Erreur de stock lors de la mise à jour des quantités";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Add this to caisseController.js
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

    // Store the shipping method in session
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
  sauvegarderMethodeLivraison

};