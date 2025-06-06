// controllers/clientController.js
const { Commande,Coupon,Reclamation, Client, Adresse, Utilisateur, ImageArticleCouleur,CommandeArticle, Article, CommandeHistorique, Retour, Remplacement, Colis } = require('../models');
const { Sequelize, Op } = require('sequelize');
const { sequelize } = require("../models");
const { envoyerEmail } = require('../services/emailService');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

/**
 * @desc Update client profile (without password)
 * @access Client
 */
const mettreAJourProfil = async (req, res) => {
  try {
    // Get the authenticated user's ID from the request
    const userId = req.utilisateur.id;
    const { nom, prenom, prefix, telephone, email } = req.body;

    // Find the client with the authenticated user's ID
    const client = await Client.findOne({
      where: { utilisateur_id: userId },
      include: [{ model: Utilisateur, as: 'utilisateur' }]
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Prepare update data
    const updateData = {};
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (prefix) updateData.prefix = prefix;
    if (email) updateData.email = email;

    // Update user info
    if (Object.keys(updateData).length > 0) {
      await client.utilisateur.update(updateData);
    }

    // Update client-specific info
    if (telephone) {
      await client.update({ telephone });
    }

    // Fetch updated data
    const updatedClient = await Client.findOne({
      where: { utilisateur_id: userId },
      include: [{ model: Utilisateur, as: 'utilisateur' }]
    });

    return res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: {
        id: updatedClient.utilisateur.id,
        nom: updatedClient.utilisateur.nom,
        prenom: updatedClient.utilisateur.prenom,
        prefix: updatedClient.utilisateur.prefix,
        email: updatedClient.utilisateur.email,
        telephone: updatedClient.telephone,
        newsletter: updatedClient.utilisateur.newsletter
      }
    });

  } catch (error) {
    console.error('Error updating client profile:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du profil"
    });
  }
};



/**
 * @desc Get all client orders with filtering
 * @access Client
 */
const obtenirCommandesClient = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { page = 1, limit = 10, statut, date_debut, date_fin } = req.query;
    const offset = (page - 1) * limit;

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    const whereClause = { client_id: client.utilisateur_id };

    if (statut) {
      whereClause.statut = statut;
    }

    let dateFilter = {};
    if (date_debut && date_fin) {
      dateFilter = {
        [Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    } else if (date_debut) {
      dateFilter = { [Op.gte]: new Date(date_debut) };
    } else if (date_fin) {
      dateFilter = { [Op.lte]: new Date(date_fin) };
    }

    // First get the orders with basic information
    const { count, rows: commandes } = await Commande.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['id', 'ville', 'gouvernorat']
        },
        {
          model: Colis,
          as: 'colis',
          where: date_debut || date_fin ? {
            [Op.or]: [
              { date_expedition: dateFilter },
              { date_livraison: dateFilter }
            ]
          } : {},
          required: date_debut || date_fin,
          attributes: ['date_expedition', 'date_livraison', 'numero_suivi']
        },
        {
          model: CommandeArticle,
          as: 'commande_articles',
          include: [
            {
              model: Article,
              as: 'article',
              attributes: ['id', 'nom_produit', 'prix_final', 'marque_id'],
              include: [
                {
                  model: ImageArticleCouleur,
                  as: 'images_couleurs',
                  attributes: ['image_url'],
                  limit: 1
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Transform the commandes data
    const commandesWithArticles = commandes.map(commande => {
      const articles = commande.commande_articles.map(ca => ({
        id: ca.article.id,
        name: ca.article.nom_produit,
        price: ca.prix_unitaire,
        quantity: ca.quantite,
        brandId: ca.article.marque_id,
        image: ca.article.images_couleurs?.[0]?.image_url
      }));

      const latestColis = commande.colis?.[0] || null;

      return {
        id: commande.id,
        reference: commande.reference,
        status: commande.statut,
        deliveryMethod: commande.methode_livraison,
        createdAt: commande.created_at,
        shippingDate: latestColis?.date_expedition,
        deliveryDate: latestColis?.date_livraison,
        trackingNumber: latestColis?.numero_suivi,
        address: commande.adresse,
        items: articles,
        subtotal: commande.commande_articles.reduce((sum, ca) => sum + (ca.prix_unitaire * ca.quantite), 0),
        shippingFee: commande.frais_livraison || 0,
        total: commande.prix_total
      };
    });

    return res.json({
      success: true,
      data: {
        orders: commandesWithArticles,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client orders:', error);
    return res.status(500).json({
      success: false,
      error: "Error fetching orders",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc Filter client orders by status
 * @access Client
 */
const filtrerCommandesParStatut = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { statut } = req.query;

    if (!statut) {
      return res.status(400).json({
        success: false,
        message: "Le paramètre 'statut' est requis"
      });
    }

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    const commandes = await Commande.findAll({
      where: {
        client_id: client.id,
        statut: statut
      },
      include: [{
        model: Colis,
        as: 'colis',
        attributes: ['date_expedition', 'date_livraison']
      }],
      attributes: ['id', 'reference', 'statut', 'created_at', 'prix_total'],
      order: [['created_at', 'DESC']]
    });

    // Format response with colis dates
    const formattedCommandes = commandes.map(commande => {
      const latestColis = commande.colis && commande.colis.length > 0 
        ? commande.colis[0] 
        : null;

      return {
        id: commande.id,
        reference: commande.reference,
        statut: commande.statut,
        created_at: commande.created_at,
        prix_total: commande.prix_total,
        date_expedition: latestColis?.date_expedition || null,
        date_livraison: latestColis?.date_livraison || null
      };
    });

    return res.json({
      success: true,
      data: formattedCommandes
    });

  } catch (error) {
    console.error('Error filtering orders by status:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du filtrage des commandes"
    });
  }
};

/**
 * @desc Filter client orders by date range (based on colis dates)
 * @access Client
 */

const filtrerCommandesParDate = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { date_debut, date_fin, date_type = 'expedition' } = req.query;

    if (!date_debut || !date_fin) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres 'date_debut' et 'date_fin' sont requis"
      });
    }

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    const dateFilter = {
      [Op.between]: [new Date(date_debut), new Date(date_fin)]
    };

    // Filter based on the date type (expedition or livraison)
    const colisWhere = {};
    if (date_type === 'expedition') {
      colisWhere.date_expedition = dateFilter;
    } else {
      colisWhere.date_livraison = dateFilter;
    }

    const commandes = await Commande.findAll({
      where: { client_id: client.id },
      include: [{
        model: Colis,
        as: 'colis',
        where: colisWhere,
        required: true,
        attributes: ['date_expedition', 'date_livraison']
      }],
      attributes: ['id', 'reference', 'statut', 'created_at', 'prix_total'],
      order: [['created_at', 'DESC']]
    });

    // Format response with colis dates
    const formattedCommandes = commandes.map(commande => {
      const latestColis = commande.colis && commande.colis.length > 0 
        ? commande.colis[0] 
        : null;

      return {
        id: commande.id,
        reference: commande.reference,
        statut: commande.statut,
        created_at: commande.created_at,
        prix_total: commande.prix_total,
        date_expedition: latestColis?.date_expedition || null,
        date_livraison: latestColis?.date_livraison || null
      };
    });

    return res.json({
      success: true,
      data: formattedCommandes
    });

  } catch (error) {
    console.error('Error filtering orders by date:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du filtrage des commandes"
    });
  }
};

/**
 * @desc Get all return requests for a client
 * @access Client
 */
/**
 * @desc Get all return requests for a client
 * @access Client
 */
const obtenirRetoursClient = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Get returns with their associated commandes
    const { count, rows: retours } = await Retour.findAndCountAll({
      include: [
        {
          model: Commande,
          as: 'commande',
          where: { client_id: client.utilisateur_id },
          attributes: ['id', 'reference', 'prix_total'],
          required: true,
          include: [
            {
              model: CommandeArticle,
              as: 'commande_articles',
              attributes: ['quantite', 'taille_id', 'couleur_id'],
              include: [
                {
                  model: Article,
                  as: 'article',
                  attributes: ['id', 'nom_produit']
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Format the response
    const formattedRetours = retours.map(retour => {
      const articles = retour.commande.commande_articles.map(ca => ({
        nom_produit: ca.article.nom_produit,
        quantite: ca.quantite,
        raison: retour.motif
      }));

      return {
        id: retour.id,
        created_at: retour.created_at,
        statut: retour.statut,
        montant_remboursement: retour.commande.prix_total * 0.9, // Example calculation
        commande: {
          reference: retour.commande.reference
        },
        articles
      };
    });

    return res.json({
      success: true,
      data: {
        retours: formattedRetours,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client returns:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des retours"
    });
  }
};

/**
 * @desc Get all replacement requests for a client
 * @access Client
 */
const obtenirRemplacementsClient = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    const { count, rows } = await Remplacement.findAndCountAll({
      where: { client_id: client.utilisateur_id },
      include: [
        {
          model: Commande,
          as: 'commande_originale',
          attributes: ['id', 'reference']
        },
        {
          model: Commande,
          as: 'commande_remplacement',
          attributes: ['id', 'reference']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: {
        remplacements: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client replacements:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des remplacements"
    });
  }
};

/**
 * @desc Get order details for a client
 * @access Client
 */
const obtenirDetailsCommandeClient = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { commandeId } = req.params;

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    const commande = await Commande.findOne({
      where: {
        id: commandeId,
        client_id: client.id
      },
      include: [
        {
          model: CommandeArticle,
          as: 'commande_articles',
          include: [{
            model: Article,
            as: 'article',
            include: [
              { model: Marque, as: 'marque' },
              {
                model: Taille,
                as: 'tailles',
                through: { attributes: [] }
              },
              {
                model: Couleur,
                as: 'couleurs',
                through: { attributes: [] }
              }
            ]
          }]
        },
        {
          model: Adresse,
          as: 'adresse'
        },
        {
          model: CommandeHistorique,
          as: 'historique',
          order: [['created_at', 'DESC']],
          limit: 10
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison', 'transporteur', 'url_suivi']
        }
      ]
    });

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée ou non autorisée"
      });
    }

    // Transform the data for client view
    const articles = commande.commande_articles.map(ca => {
      return {
        id: ca.article.id,
        nom_produit: ca.article.nom_produit,
        marque: ca.article.marque,
        quantite: ca.quantite,
        prix_unitaire: ca.prix_unitaire,
        taille_id: ca.taille_id,
        couleur_id: ca.couleur_id
      };
    });

    // Get the most recent colis
    const latestColis = commande.colis && commande.colis.length > 0 
      ? commande.colis[0] 
      : null;

    const response = {
      id: commande.id,
      reference: commande.reference,
      statut: commande.statut,
      methode_livraison: commande.methode_livraison,
      created_at: commande.created_at,
      updated_at: commande.updated_at,
      prix_total: commande.prix_total,
      adresse: commande.adresse,
      articles,
      historique: commande.historique,
      colis: latestColis ? {
        numero_suivi: latestColis.numero_suivi,
        statut: latestColis.statut,
        date_expedition: latestColis.date_expedition,
        date_livraison: latestColis.date_livraison,
        transporteur: latestColis.transporteur,
        url_suivi: latestColis.url_suivi
      } : null
    };

    return res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des détails de la commande"
    });
  }
};

/**
 * @desc Mark an address as primary for the client
 * @access Client
 */
const marquerAdressePrincipale = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.utilisateur.id;
    const { adresseId } = req.params;

    // First verify the client exists
    const client = await Client.findOne({
      where: { utilisateur_id: userId },
      transaction
    });

    if (!client) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Verify the address exists and belongs to this client
    const adresse = await Adresse.findOne({
      where: {
        id: adresseId,
        client_id: client.utilisateur_id
      },
      transaction
    });

    if (!adresse) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Adresse non trouvée ou n'appartient pas à ce client"
      });
    }

    // First unmark any other primary addresses
    await Adresse.update(
      { est_principale: false },
      {
        where: {
          client_id: client.utilisateur_id,
          est_principale: true,
          id: { [Op.ne]: adresseId } // Don't unmark the address we're about to mark
        },
        transaction
      }
    );

    // Now mark the specified address as primary
    await adresse.update({ est_principale: true }, { transaction });

    await transaction.commit();

    return res.json({
      success: true,
      message: "Adresse marquée comme principale avec succès",
      data: {
        adresse_id: adresse.id,
        est_principale: true
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error marking address as primary:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du marquage de l'adresse comme principale"
    });
  }
};
/**
 * @desc Get all addresses for a client
 * @access Client
 */
const obtenirAdresses = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Find all addresses for this client
    const { count, rows } = await Adresse.findAndCountAll({
      where: { client_id: client.utilisateur_id },
      order: [['est_principale', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: {
        adresses: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client addresses:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des adresses"
    });
  }
};
/**
 * @desc Delete an address
 * @access Client
 */
const supprimerAdresse = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.utilisateur.id;
    const { adresseId } = req.params;

    // First verify the client exists
    const client = await Client.findOne({
      where: { utilisateur_id: userId },
      transaction
    });

    if (!client) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Verify the address exists and belongs to this client
    const adresse = await Adresse.findOne({
      where: {
        id: adresseId,
        client_id: client.utilisateur_id
      },
      transaction
    });

    if (!adresse) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Adresse non trouvée ou n'appartient pas à ce client"
      });
    }

    // Check if this is the primary address
    const wasPrimary = adresse.est_principale;

    // Delete the address
    await adresse.destroy({ transaction });

    // If it was primary, set another address as primary if available
    if (wasPrimary) {
      const remainingAddress = await Adresse.findOne({
        where: { client_id: client.utilisateur_id },
        order: [['created_at', 'DESC']],
        transaction
      });

      if (remainingAddress) {
        await remainingAddress.update({ est_principale: true }, { transaction });
      }
    }

    await transaction.commit();

    return res.json({
      success: true,
      message: "Adresse supprimée avec succès"
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting address:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'adresse"
    });
  }
};
/**
 * @desc Update an existing address
 * @access Client
 */
const mettreAJourAdresse = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.utilisateur.id;
    const { adresseId } = req.params;
    const { nom_adresse, adresse, complement, code_postal, ville, gouvernorat, telephone, est_principale } = req.body;

    const address = await Adresse.findOne({
      where: {
        id: adresseId,
        client_id: userId
      },
      transaction
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Adresse non trouvée"
      });
    }

    const updateData = {
      nom_adresse: est_principale ? 'Adresse Principale' : (nom_adresse || address.nom_adresse).replace('Principale', '').trim(),
      adresse: adresse || address.adresse,
      complement: complement || address.complement,
      code_postal: code_postal || address.code_postal,
      ville: ville || address.ville,
      gouvernorat: gouvernorat || address.gouvernorat,
      telephone: telephone || address.telephone,
      est_principale: est_principale !== undefined ? est_principale : address.est_principale
    };

    if (updateData.est_principale) {
      await Adresse.update(
        { 
          est_principale: false,
          nom_adresse: sequelize.fn('REGEXP_REPLACE', sequelize.col('nom_adresse'), 'Principale', '')
        },
        {
          where: {
            client_id: userId,
            est_principale: true,
            id: { [Op.ne]: adresseId }
          },
          transaction
        }
      );
    }

    await address.update(updateData, { transaction });
    await transaction.commit();

    return res.json({
      success: true,
      message: "Adresse mise à jour avec succès",
      data: address
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating address:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour de l'adresse"
    });
  }
};

/**
 * @desc Get all coupons for a client
 * @access Client
 */
const obtenirCouponsClient = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { page = 1, limit = 10, is_used } = req.query;
    const offset = (page - 1) * limit;

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Prepare where clause
    const whereClause = { client_id: client.utilisateur_id };
    
    // Filter by usage status if provided
    if (is_used !== undefined) {
      whereClause.is_used = is_used === 'true';
    }

    // Get coupons with pagination
    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: whereClause,
      order: [
        ['is_used', 'ASC'], // Unused coupons first
        ['expires_at', 'ASC'] // Soonest to expire first
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Format the response
    const formattedCoupons = coupons.map(coupon => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      is_used: coupon.is_used,
      expires_at: coupon.expires_at,
      created_at: coupon.created_at
    }));

    return res.json({
      success: true,
      data: {
        coupons: formattedCoupons,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client coupons:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des coupons"
    });
  }
};


/**
 * @desc Get all reclamations for the current client
 * @access Client
 */
const obtenirReclamationsClient = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { page = 1, limit = 10, statut } = req.query;
    const offset = (page - 1) * limit;

    // First get the client's email from the authenticated user
    const utilisateur = await Utilisateur.findByPk(userId, {
      attributes: ['email']
    });

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Prepare where clause to match either user ID or email
    const whereClause = {
      [Op.or]: [
        { utilisateur_id: userId },
        { email: utilisateur.email }
      ]
    };

    if (statut) {
      whereClause.statut = statut;
    }

    // Get reclamations with pagination
    const { count, rows: reclamations } = await Reclamation.findAndCountAll({
      where: whereClause,
      order: [['date_creation', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Format the response
    const formattedReclamations = reclamations.map(reclamation => ({
      id: reclamation.id,
      reference: `REC-${reclamation.id.toString().slice(0, 8).toUpperCase()}`,
      sujet: reclamation.sujet,
      message: reclamation.message,
      reponse: reclamation.reponse,
      statut: reclamation.statut,
      categorie: reclamation.type_reclamation || 'autre',
      created_at: reclamation.date_creation,
      date_reponse: reclamation.date_reponse,
      fichiers: reclamation.fichiers ? 
        (typeof reclamation.fichiers === 'string' ? 
          JSON.parse(reclamation.fichiers) : 
          reclamation.fichiers) : 
        []
    }));

    return res.json({
      success: true,
      data: {
        reclamations: formattedReclamations,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client reclamations:', {
      error: error.message,
      stack: error.stack,
      userId: req.utilisateur?.id
    });
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des réclamations",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * @desc Update client newsletter subscription status
 * @access Client
 */
const mettreAJourNewsletter = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { subscribed } = req.body;

    // First get the client with user information
    const client = await Client.findOne({
      where: { utilisateur_id: userId },
      include: [{
        model: Utilisateur,
        as: 'utilisateur',
        attributes: ['id', 'prenom', 'email', 'newsletter']
      }]
    });

    if (!client || !client.utilisateur) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Update newsletter status directly in Utilisateur table
    const [updatedCount] = await Utilisateur.update(
      { newsletter: subscribed },
      { 
        where: { id: userId },
        returning: true // For PostgreSQL to return the updated record
      }
    );

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Échec de la mise à jour de l'abonnement"
      });
    }

    // Send confirmation email only when subscribing (not when unsubscribing)
    if (subscribed) {
      try {
        const templatePath = path.join(__dirname, '../templates/Subscription_Confirmation.html');
        
        // Verify template exists
        if (!fs.existsSync(templatePath)) {
          console.error('Template file not found:', templatePath);
          throw new Error('Template file not found');
        }

        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateContent);
        
        const html = template({
          PRENOM: client.utilisateur.prenom,
          EMAIL: client.utilisateur.email,
          SUBSCRIPTION_DATE: new Date().toLocaleDateString('fr-FR'),
        COMPANY_NAME: "MGM Boutique",
          CURRENT_YEAR: new Date().getFullYear(),
          COMPANY_ADDRESS: "ksar hlel, Tunis, Tunisie",
          WEBSITE_URL: process.env.FRONTEND_URL
        });

        // Send email
        await envoyerEmail({
          to: client.utilisateur.email,
          subject: "Confirmation d'abonnement à notre newsletter",
          html: html
        });

      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the request if email fails, just log it
      }
    }

    return res.json({
      success: true,
      message: subscribed 
        ? "Vous êtes maintenant abonné à notre newsletter" 
        : "Vous avez été désabonné de notre newsletter",
      data: {
        newsletter: subscribed
      }
    });

  } catch (error) {
    console.error('Error in mettreAJourNewsletter:', {
      error: error.message,
      stack: error.stack,
      userId: req.utilisateur?.id
    });
    return res.status(500).json({
      success: false,
      error: "Une erreur technique est survenue. Veuillez réessayer plus tard."
    });
  }
};

/**
 * @desc Check if current user has purchased the specified article
 * @access Client
 */
const verifierAchatArticle = async (req, res) => {
  try {
    const userId = req.utilisateur.id;
    const { articleId } = req.params;

    if (!articleId) {
      return res.status(400).json({
        success: false,
        message: "L'ID de l'article est requis"
      });
    }

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Check if the client has any orders containing this article
    const hasPurchased = await CommandeArticle.findOne({
      include: [
        {
          model: Commande,
          as: 'commande',
          where: {
            client_id: client.utilisateur_id,
            statut: {
              [Op.in]: ['livree', 'expediee'] // Only consider completed/delivered orders
            }
          }
        },
        {
          model: Article,
          as: 'article',
          where: { id: articleId }
        }
      ]
    });

    return res.json({
      success: true,
      data: {
        hasPurchased: !!hasPurchased,
        articleId: parseInt(articleId)
      }
    });

  } catch (error) {
    console.error('Error checking article purchase:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la vérification de l'achat de l'article",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc Get all addresses for the current user with principal address marked
 * @access Client
 */
const obtenirAdressesLivraison = async (req, res) => {
  try {
    const userId = req.utilisateur.id;

    // First get the client record
    const client = await Client.findOne({
      where: { utilisateur_id: userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé"
      });
    }

    // Find all addresses for this client
    const adresses = await Adresse.findAll({
      where: { client_id: client.utilisateur_id },
      order: [['est_principale', 'DESC'], ['created_at', 'DESC']]
    });

    // Find the principal address if exists
    const principalAddress = adresses.find(addr => addr.est_principale);

    return res.json({
      success: true,
      data: {
        adresses: adresses,
        principalAddress: principalAddress || null
      }
    });

  } catch (error) {
    console.error('Error fetching client delivery addresses:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des adresses de livraison"
    });
  }
};
module.exports = {
  mettreAJourProfil,
  obtenirCommandesClient,
  filtrerCommandesParStatut,
  filtrerCommandesParDate,
  obtenirRetoursClient,
  obtenirRemplacementsClient,
  obtenirDetailsCommandeClient,
  obtenirAdresses,
  marquerAdressePrincipale,
  mettreAJourAdresse,
  supprimerAdresse,
  obtenirCouponsClient,
  obtenirReclamationsClient,
  mettreAJourNewsletter,
  verifierAchatArticle,
  obtenirAdressesLivraison
};