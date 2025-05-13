// controllers/clientController.js
const { Op, Sequelize } = require('sequelize');
const { Commande, Client, Adresse,Utilisateur, CommandeArticle, Article, CommandeHistorique, Retour, Remplacement } = require('../models');

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
    const { id } = req.params;
    const { page = 1, limit = 10, statut, date_debut, date_fin } = req.query;
    const offset = (page - 1) * limit;

    // Verify the client is accessing their own orders
    if (req.utilisateur.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé - Vous ne pouvez voir que vos propres commandes"
      });
    }

    const whereClause = { client_id: id };

    // Status filter
    if (statut) {
      whereClause.statut = statut;
    }

    // Date range filter
    if (date_debut && date_fin) {
      whereClause.created_at = {
        [Op.between]: [
          new Date(date_debut),
          new Date(date_fin)
        ]
      };
    } else if (date_debut) {
      whereClause.created_at = {
        [Op.gte]: new Date(date_debut)
      };
    } else if (date_fin) {
      whereClause.created_at = {
        [Op.lte]: new Date(date_fin)
      };
    }

    const { count, rows } = await Commande.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: CommandeArticle,
          as: 'commande_articles',
          include: [{
            model: Article,
            as: 'article',
            attributes: ['id', 'nom_produit', 'prix_final', 'marque_id']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['id', 'ville', 'gouvernorat']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate total for each order
    const commandes = rows.map(commande => {
      const articles = commande.commande_articles.map(ca => ({
        id: ca.article.id,
        nom_produit: ca.article.nom_produit,
        prix_unitaire: ca.prix_unitaire,
        quantite: ca.quantite,
        marque_id: ca.article.marque_id
      }));

      const sousTotal = commande.commande_articles.reduce((total, ca) => {
        return total + (ca.prix_unitaire * ca.quantite);
      }, 0);

      return {
        id: commande.id,
        reference: commande.reference,
        statut: commande.statut,
        methode_livraison: commande.methode_livraison,
        created_at: commande.created_at,
        adresse: commande.adresse,
        articles,
        sous_total: sousTotal,
        frais_livraison: commande.methode_livraison === 'express' ? 15 : 7,
        total: sousTotal + (commande.methode_livraison === 'express' ? 15 : 7)
      };
    });

    return res.json({
      success: true,
      data: {
        commandes,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching client orders:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des commandes"
    });
  }
};

/**
 * @desc Filter client orders by status
 * @access Client
 */
const filtrerCommandesParStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.query;

    // Verify the client is accessing their own orders
    if (req.utilisateur.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    if (!statut) {
      return res.status(400).json({
        success: false,
        message: "Le paramètre 'statut' est requis"
      });
    }

    const commandes = await Commande.findAll({
      where: {
        client_id: id,
        statut: statut
      },
      attributes: ['id', 'reference', 'statut', 'created_at', 'prix_total'],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: commandes
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
 * @desc Filter client orders by date range
 * @access Client
 */
const filtrerCommandesParDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date_debut, date_fin } = req.query;

    // Verify the client is accessing their own orders
    if (req.utilisateur.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    if (!date_debut || !date_fin) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres 'date_debut' et 'date_fin' sont requis"
      });
    }

    const commandes = await Commande.findAll({
      where: {
        client_id: id,
        created_at: {
          [Op.between]: [new Date(date_debut), new Date(date_fin)]
        }
      },
      attributes: ['id', 'reference', 'statut', 'created_at', 'prix_total'],
      order: [['created_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: commandes
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
const obtenirRetoursClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Verify the client is accessing their own returns
    if (req.utilisateur.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    const { count, rows } = await Retour.findAndCountAll({
      where: { client_id: id },
      include: [
        {
          model: Commande,
          as: 'commande',
          attributes: ['id', 'reference', 'prix_total']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json({
      success: true,
      data: {
        retours: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          totalPages: Math.ceil(count / limit)
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
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Verify the client is accessing their own replacements
    if (req.utilisateur.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    const { count, rows } = await Remplacement.findAndCountAll({
      where: { client_id: id },
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
    const { id, commandeId } = req.params;

    // Verify the client is accessing their own order
    if (req.utilisateur.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé"
      });
    }

    const commande = await Commande.findOne({
      where: {
        id: commandeId,
        client_id: id
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
      historique: commande.historique
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

module.exports = {
  mettreAJourProfil,
  obtenirCommandesClient,
  filtrerCommandesParStatut,
  filtrerCommandesParDate,
  obtenirRetoursClient,
  obtenirRemplacementsClient,
  obtenirDetailsCommandeClient
};