// controllers/clientController.js
const { Commande, Client, Adresse,Utilisateur, CommandeArticle, Article, CommandeHistorique, Retour, Remplacement ,ImageArticleCouleur, Colis,} = require('../models');
const { Sequelize, Op } = require('sequelize');
const { sequelize } = require("../models");

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

    const whereClause = { client_id: userId };

    if (statut) {
      whereClause.statut = statut;
    }

    let dateFilter = {};
    if (date_debut && date_fin) {
      dateFilter = {
        [Op.between]: [new Date(date_debut), new Date(date_fin)]
      };
    }

    const { count, rows } = await Commande.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: CommandeArticle,
          as: 'commande_articles',
          include: [
            {
              model: Article,
              as: 'article',
              include: [
                {
                  model: ImageArticleCouleur,
                  as: 'images_couleurs',
                  attributes: ['image_url'],
                  limit: 1,
                  order: [['ordre_affichage', 'ASC']]
                }
              ]
            }
          ]
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
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    const commandes = rows.map(commande => {
      const articles = commande.commande_articles.map(ca => ({
        id: ca.article.id,
        name: ca.article.nom_produit,
        price: ca.prix_unitaire,
        quantity: ca.quantite,
        image: ca.article.images_couleurs?.[0]?.image_url || '/placeholder.svg',
        taille_id: ca.taille_id,
        couleur_id: ca.couleur_id
      }));

      const latestColis = commande.colis?.[0] || null;

      return {
        id: commande.id,
        reference: commande.reference,
        status: commande.statut,
        createdAt: commande.created_at,
        trackingNumber: latestColis?.numero_suivi,
        items: articles,
        total: commande.prix_total
      };
    });

    return res.json({
      success: true,
      data: {
        orders: commandes,
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
      error: "Error fetching orders"
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

    const client = await Client.findOne({
      where: { utilisateur_id: userId },
      transaction
    });

    if (!client) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    const address = await Adresse.findOne({
      where: {
        id: adresseId,
        client_id: client.utilisateur_id
      },
      transaction
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Address not found"
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
            client_id: client.utilisateur_id,
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
      message: "Address updated successfully",
      data: address
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error updating address:', error);
    return res.status(500).json({
      success: false,
      error: "Error updating address"
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
  supprimerAdresse
};