// File: controllers/livraisonController.js
const { Op, Sequelize } = require('sequelize');
const { io } = require("../server");
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const {  Commande,Retour, CommandeArticle, CommandeHistorique ,Article, Client, Livreur, Utilisateur, Adresse, Colis } = require('../models');

const {envoyerEmail} = require('../services/emailService');
const db = require('../models');
const sequelize = db.sequelize;

const obtenirLivraisonsDisponibles = async (req, res) => {
  try {
    const livraisons = await Commande.findAll({
      where: {
        statut: 'en_preparation',
        livreur_id: null
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ],
      order: [['created_at', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: livraisons.map(l => ({
        livraison_id: l.id,
        reference: l.reference,
        date_creation: l.created_at,
        adresse_livraison: l.adresse?.adresse || 'N/A',
        client_nom: `${l.client?.utilisateur?.prenom} ${l.client?.utilisateur?.nom}`,
        statut: l.statut
      }))
    });
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons disponibles'
    });
  }
};

const assignerLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { livreur_id } = req.body;

    const commande = await Commande.findByPk(id, { 
      transaction,
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ]
    });
    
    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    const livreur = await Livreur.findByPk(livreur_id, {
      include: [{ model: Utilisateur, as: 'utilisateur' }],
      transaction
    });
    
    if (!livreur) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Livreur non trouvé' 
      });
    }

    // Update order status to "expediee" and assign delivery person
    await commande.update({
      livreur_id,
      statut: 'expediee'
    }, { transaction });

    // Create or update colis record with tracking info
    const [colis] = await db.Colis.findOrCreate({
      where: { commande_id: id },
      defaults: {
        commande_id: id,
        livreur_id,
        statut: 'expediee',
        transporteur: commande.methode_livraison === 'express' ? 'Express' : 'Standard',
        numero_suivi: `TRK${Date.now().toString(36).toUpperCase()}`,
        url_suivi: `${process.env.TRACKING_BASE_URL}/track/${commande.reference}`,
        date_expedition: new Date()
      },
      transaction
    });

    // Generate QR code data consistent with commandeController.js
    const qrToken = uuidv4();
    const qrData = JSON.stringify({
      colisId: colis.id, // Changed from commandeId to colisId
      commandeId: commande.id,
      token: qrToken
    });
    const qrCodeData = await QRCode.toDataURL(qrData);

    // Update colis with QR code data
    await colis.update({
      qr_token: qrToken,
      qr_expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      qr_code_data: qrCodeData
    }, { transaction });

    await livreur.update({
      nombre_livraisons: (livreur.nombre_livraisons || 0) + 1
    }, { transaction });

    // Send notification to the delivery person with QR code
    try {
      await envoyerEmail({
        to: livreur.utilisateur.email,
        template: 'livraisonAssignee',
        subject: 'Nouvelle livraison assignée - ' + commande.reference,
        context: {
          livreurPrenom: livreur.utilisateur.prenom,
          reference: commande.reference,
          clientNom: `${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`,
          adresseLivraison: commande.adresse?.adresse || 'Adresse non spécifiée',
          dateCreation: new Date(commande.created_at).toLocaleDateString('fr-FR'),
          statut: 'Expédiée',
          numeroSuivi: colis.numero_suivi,
          transporteur: colis.transporteur,
          appLink: `${process.env.APP_URL}/livreur/livraisons/${commande.id}`,
          qrCodeData: colis.qr_code_data // Include QR code in email
        }
      });
    } catch (emailError) {
      console.error('Failed to send delivery person notification:', emailError);
    }

    // Send shipping confirmation to customer
    try {
      await envoyerEmail({
        to: commande.client.utilisateur.email,
        template: 'commandeExpediee',
        subject: `Votre commande #${commande.reference} a été expédiée`,
        context: {
          PRENOM: commande.client.utilisateur.prenom,
          NOM: commande.client.utilisateur.nom,
          ORDER_REF: commande.reference,
          TRACKING_NUMBER: colis.numero_suivi,
          CARRIER_NAME: colis.transporteur,
          SHIPPING_DATE: new Date().toLocaleDateString('fr-FR'),
          DELIVERY_ESTIMATE: commande.methode_livraison === 'express' ? '1-2 jours ouvrables' : '2-3 jours ouvrables',
          TRACKING_LINK: colis.url_suivi,
          QR_CODE_URL: colis.qr_code_data // Include QR code in email
        }
      });
    } catch (emailError) {
      console.error('Failed to send customer notification:', emailError);
    }

    // Send real-time notification with QR code info
    const io = req.app.get('io');
    if (io) {
      io.to(`livreur-${livreur_id}`).emit('livraison:assigned', {
        id: Date.now().toString(),
        type: 'nouvelle_commande',
        titre: 'Nouvelle livraison assignée',
        message: `Vous avez été assigné à la livraison ${commande.reference}`,
        date: new Date().toISOString(),
        livraison_id: commande.id,
        reference: commande.reference,
        client_nom: `${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`,
        adresse_livraison: commande.adresse?.adresse || 'Adresse non spécifiée',
        numero_suivi: colis.numero_suivi,
        statut: 'expediee',
        qr_code_data: colis.qr_code_data // Include QR code in real-time notification
      });
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Livreur assigné et commande expédiée avec succès',
      data: {
        livreur_id,
        livreur_nom: `${livreur.utilisateur.prenom} ${livreur.utilisateur.nom}`,
        commande: {
          id: commande.id,
          reference: commande.reference,
          statut: commande.statut
        },
        colis: {
          numero_suivi: colis.numero_suivi,
          transporteur: colis.transporteur,
          url_suivi: colis.url_suivi,
          qr_code_data: colis.qr_code_data // Include QR code in response
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error assigning delivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'assignation du livreur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
const modifierLivreurLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { livreur_id } = req.body;

    if (!livreur_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'L\'identifiant du nouveau livreur est requis'
      });
    }

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [
        {
          model: Livreur,
          as: 'livreur',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ]
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Check if commande status is "en_preparation"
    if (commande.statut !== 'en_preparation') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Seules les commandes en préparation peuvent être réassignées'
      });
    }

    if (commande.livreur_id === livreur_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cette commande est déjà assignée à ce livreur'
      });
    }

    const nouveauLivreur = await Livreur.findByPk(livreur_id, {
      include: [{ model: Utilisateur, as: 'utilisateur' }],
      transaction
    });

    if (!nouveauLivreur) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Nouveau livreur non trouvé'
      });
    }

    const ancienLivreurId = commande.livreur_id;

    await commande.update({ livreur_id }, { transaction });
    await Colis.update({ livreur_id }, { where: { commande_id: id }, transaction });

    // Prepare common email context
    const emailContext = {
      reference: commande.reference || 'N/A',
      clientNom: commande.client?.utilisateur 
        ? `${commande.client.utilisateur.prenom || ''} ${commande.client.utilisateur.nom || ''}`.trim()
        : 'Client inconnu',
      adresseLivraison: commande.adresse?.adresse || 'Adresse non spécifiée',
      dateCreation: commande.created_at 
        ? new Date(commande.created_at).toLocaleDateString('fr-FR') 
        : new Date().toLocaleDateString('fr-FR'),
      statut: commande.statut || 'N/A',
      CURRENT_YEAR: new Date().getFullYear(),
      currentYear: new Date().getFullYear(),
      appLink: `${process.env.APP_URL || 'https://yourdomain.com'}/livreur/livraisons/${commande.id}`
    };

    // Send email to new delivery person
    if (nouveauLivreur.utilisateur?.email) {
      try {
        await envoyerEmail({
          to: nouveauLivreur.utilisateur.email,
          template: 'livraison-assignee',
          subject: `Nouvelle livraison assignée - ${emailContext.reference}`,
          context: {
            ...emailContext,
            livreurPrenom: nouveauLivreur.utilisateur.prenom || 'Livreur'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email to new delivery person:', emailError.message);
      }
    }

    // Send email to old delivery person if exists
    if (commande.livreur?.utilisateur?.email) {
      try {
        await envoyerEmail({
          to: commande.livreur.utilisateur.email,
          template: 'livraison-unassigned',
          subject: `Livraison réassignée - ${emailContext.reference}`,
          context: {
            ...emailContext,
            livreurPrenom: commande.livreur.utilisateur.prenom || 'Livreur',
            nouveauLivreur: `${nouveauLivreur.utilisateur.prenom || ''} ${nouveauLivreur.utilisateur.nom || ''}`.trim() || 'Nouveau Livreur'
          }
        });
      } catch (emailError) {
        console.error('Failed to send email to old delivery person:', emailError.message);
      }
    }

    // Send real-time notifications
    const io = req.app.get('io');
    if (io) {
      // Notify new livreur
      io.to(`livreur-${livreur_id}`).emit('livraison:assigned', {
        id: Date.now().toString(),
        type: 'nouvelle_commande',
        titre: 'Nouvelle livraison assignée',
        message: `Vous avez été assigné à la livraison ${commande.reference}`,
        date: new Date().toISOString(),
        livraison_id: commande.id,
        reference: commande.reference,
        client_nom: emailContext.clientNom,
        adresse_livraison: emailContext.adresseLivraison
      });

      // Notify old livreur if exists
      if (ancienLivreurId) {
        io.to(`livreur-${ancienLivreurId}`).emit('livraison:unassigned', {
          id: Date.now().toString(),
          type: 'commande_retiree',
          titre: 'Livraison réassignée',
          message: `La livraison ${commande.reference} vous a été retirée`,
          date: new Date().toISOString(),
          livraison_id: commande.id,
          reference: commande.reference,
          nouveau_livreur: `${nouveauLivreur.utilisateur.prenom || ''} ${nouveauLivreur.utilisateur.nom || ''}`.trim()
        });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Livreur modifié avec succès',
      data: {
        ancien_livreur_id: ancienLivreurId,
        nouveau_livreur_id: livreur_id,
        nouveau_livreur_nom: `${nouveauLivreur.utilisateur.prenom || ''} ${nouveauLivreur.utilisateur.nom || ''}`.trim(),
        commande_id: commande.id,
        reference: commande.reference
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in modifierLivreurLivraison:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de livreur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


const debugError = (operation, error, context = {}) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    operation,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context
  };
  console.error('DEBUG ERROR:', JSON.stringify(errorInfo, null, 2));
  return errorInfo;
};

const obtenirLivraisonsParLivreur = async (req, res) => {
  try {
    const { id } = req.params;

    const livraisons = await Commande.findAll({
      where: { livreur_id: id },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: livraisons.map(l => ({
        livraison_id: l.id,
        reference: l.reference,
        date_creation: l.created_at,
        adresse_livraison: l.adresse?.adresse || 'N/A',
        client_nom: `${l.client?.utilisateur?.prenom} ${l.client?.utilisateur?.nom}`,
        statut: l.statut
      }))
    });
  } catch (error) {
    const errorInfo = debugError('obtenirLivraisonsParLivreur', error, { livreurId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des livraisons',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

// Update delivery person status
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { enService } = req.body;

    const livreur = await Livreur.findByPk(id, {
      include: [{ model: Utilisateur, as: 'utilisateur' }]
    });

    if (!livreur) {
      return res.status(404).json({ 
        success: false,
        message: 'Livreur non trouvé' 
      });
    }

    await livreur.update({ enService });

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour',
      data: {
        enService: livreur.enService
      }
    });
  } catch (error) {
    const errorInfo = debugError('updateStatus', error, { livreurId: req.params.id, body: req.body });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const obtenirMesLivraisons = async (req, res) => {
  try {
    // Use req.livreur instead of req.utilisateur.livreur
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    const livraisons = await Commande.findAll({
      where: { 
        livreur_id: livreurId,
        statut: {
          [Op.in]: ['en_preparation', 'expediee', 'livree']
        }
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const result = livraisons.map(l => ({
      livraison_id: l.id,
      reference: l.reference,
      date_creation: l.created_at,
      adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
      client_nom: l.client?.utilisateur
        ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
        : 'Client inconnu',
      statut: l.statut,
      colis: l.colis || null
    }));

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const errorInfo = debugError('obtenirMesLivraisons', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const obtenirMesLivraisonsAujourdhui = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    // Today date boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find commandes that:
    // 1. Are assigned to this delivery person
    // 2. Are not completed (status is not 'livree')
    // 3. Either:
    //    a) Were shipped today, OR
    //    b) Were shipped before today but not yet delivered
    const livraisons = await Commande.findAll({
      where: {
        livreur_id: livreurId,
        statut: {
          [Op.in]: ['en_preparation', 'expediee'] // Only include not-yet-delivered
        },
        [Op.or]: [
          // Shipments from today
          {
            '$colis.date_expedition$': {
              [Op.between]: [todayStart, todayEnd]
            }
          },
          // OR shipments from before today that aren't delivered
          {
            '$colis.date_expedition$': {
              [Op.lt]: todayStart
            },
            '$colis.date_livraison$': null
          }
        ]
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison'],
          required: true // Ensure only commandes with colis are returned
        }
      ],
      order: [
        ['statut', 'ASC'], // 'en_preparation' first, then 'expediee'
        ['created_at', 'DESC'] // Newer ones first within same status
      ]
    });

    const result = livraisons.map(l => ({
      livraison_id: l.id,
      reference: l.reference,
      date_creation: l.created_at,
      adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
      client_nom: l.client?.utilisateur
        ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
        : 'Client inconnu',
      statut: l.statut,
      colis: l.colis || null
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirMesLivraisonsAujourdhui:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};

const mettreAJourStatutLivraison = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params; // commande_id
    const { statut } = req.body;
    const livreurId = req.livreur?.utilisateur_id;

    if (!livreurId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['id', 'prenom', 'nom', 'email']
          }]
        }
      ]
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    if (commande.livreur_id !== livreurId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "Accès refusé : vous n'êtes pas le livreur assigné à cette commande."
      });
    }

    const ancienStatut = commande.statut;

    // Autoriser uniquement certains statuts pour le livreur
    const statutsAutorisés = ['livree']; // Only allow 'livree' status now
    if (!statutsAutorisés.includes(statut)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Statut '${statut}' non autorisé pour le livreur.`
      });
    }

    // Prepare update data
    const updateData = {
      statut,
      ...(statut === 'livree' && {
        paiement_recu: true,
        date_paiement: new Date() // Set payment date to current date when status is 'livree'
      })
    };

    // Mettre à jour la commande
    await commande.update(updateData, { transaction });

    const colis = await sequelize.models.Colis.findOne({
      where: { commande_id: id },
      transaction
    });

    if (colis) {
      await colis.update({
        statut,
        ...(statut === 'livree' && { date_livraison: new Date() })
      }, { transaction });
    }

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: livreurId,
      action: 'changement_statut',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: statut,
      details: `Livreur a changé le statut de ${ancienStatut} à ${statut}`
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: {
        commandeId: commande.id,
        ancienStatut,
        nouveauStatut: statut,
        paiement_recu: statut === 'livree', // Include payment status in response
        date_paiement: statut === 'livree' ? new Date() : null // Include payment date in response
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Erreur changement statut par livreur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne lors du changement de statut'
    });
  }
};
const obtenirMesStatistiquesLivraison = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;

    // Dates utiles
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const stats = await sequelize.transaction(async (transaction) => {
      // Total colis affectés à ce livreur
      const total = await Colis.count({
        where: { livreur_id: livreurId },
        transaction
      });

      // Colis livrés (via commande livrée OU colis livré)
      const completees = await Colis.count({
        include: [{
          model: Commande,
          as: 'commande',
          where: { 
            statut: 'livree'
          },
          required: false
        }],
        where: { 
          livreur_id: livreurId,
          [Op.or]: [
            { statut: 'livree' },
            { '$commande.statut$': 'livree' }
          ]
        },
        transaction
      });

      // Colis en cours (statut = en_preparation ou expedie)
      const enCours = await Colis.count({
        where: {
          livreur_id: livreurId,
          statut: { [Op.in]: ['en_preparation', 'expediee'] }
        },
        transaction
      });

      // Colis expédiés aujourd'hui (date_expedition = aujourd'hui)
      const livraisonsDuJourTotal = await Colis.count({
        where: {
          livreur_id: livreurId,
          date_expedition: { [Op.between]: [todayStart, todayEnd] }
        },
        transaction
      });

      // Colis livrés aujourd'hui (via commande livrée OU colis livré aujourd'hui)
      const livraisonsDuJourCompletees = await Colis.count({
        include: [{
          model: Commande,
          as: 'commande',
          required: false
        }],
        where: { 
          livreur_id: livreurId,
          [Op.or]: [
            { 
              statut: 'livree',
              date_livraison: { [Op.between]: [todayStart, todayEnd] }
            },
            { 
              '$commande.statut$': 'livree',
              '$commande.updated_at$': { [Op.between]: [todayStart, todayEnd] }
            }
          ]
        },
        transaction
      });

      // Colis livrés ce mois-ci
      const colisLivresCeMois = await Colis.count({
        include: [{
          model: Commande,
          as: 'commande',
          required: false
        }],
        where: { 
          livreur_id: livreurId,
          [Op.or]: [
            { 
              statut: 'livree',
              date_livraison: { [Op.between]: [startOfMonth, endOfMonth] }
            },
            { 
              '$commande.statut$': 'livree',
              '$commande.updated_at$': { [Op.between]: [startOfMonth, endOfMonth] }
            }
          ]
        },
        transaction
      });

      return {
        total,
        completees,
        enCours,
        livraisonsDuJour: {
          total: livraisonsDuJourTotal,
          completees: livraisonsDuJourCompletees
        },
        colisLivresCeMois
      };
    });

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur obtenirMesStatistiquesLivraison:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};


const obtenirLivraisonsParDate = async (req, res) => {
  try {
    if (!req.livreur || !req.livreur.utilisateur_id) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié ou identifiant livreur manquant.'
      });
    }

    const livreurId = req.livreur.utilisateur_id;
    const { dateDebut, dateFin } = req.query;

    // Set default dates (today) if not provided
    const defaultStartDate = new Date();
    defaultStartDate.setHours(0, 0, 0, 0);
    
    const defaultEndDate = new Date();
    defaultEndDate.setHours(23, 59, 59, 999);

    // Parse dates or use defaults
    const startDate = dateDebut ? new Date(dateDebut) : defaultStartDate;
    const endDate = dateFin ? new Date(dateFin) : defaultEndDate;

    // Validate dates
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date de début invalide.'
      });
    }

    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format de date de fin invalide.'
      });
    }

    // Ensure proper time boundaries
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const livraisons = await Commande.findAll({
      where: {
        livreur_id: livreurId,
        [Op.or]: [
          {
            '$colis.date_livraison$': {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            '$colis.date_expedition$': {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            '$colis.date_retour$': {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            [Op.and]: [
              { '$colis.date_livraison$': null },
              { '$colis.date_expedition$': null },
              { '$colis.date_retour$': null },
              {
                created_at: {
                  [Op.between]: [startDate, endDate]
                }
              }
            ]
          }
        ]
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison', 'date_retour'],
          required: false
        },
        {
          model: Retour,
          as: 'retours',
          attributes: ['id', 'statut', 'type', 'motif'],
          required: false,
          where: {
            type: 'livreur'
          }
        }
      ],
      order: [
        ['created_at', 'DESC'],
        [{ model: Colis, as: 'colis' }, 'date_livraison', 'DESC'],
        [{ model: Colis, as: 'colis' }, 'date_expedition', 'DESC'],
        [{ model: Colis, as: 'colis' }, 'date_retour', 'DESC']
      ]
    });

    const result = livraisons.map(l => {
      const colis = Array.isArray(l.colis) ? l.colis[0] : l.colis;
      const retour = Array.isArray(l.retours) ? l.retours[0] : l.retours;

      // Determine display status
      let displayStatus = l.statut;
      let badgeStatus = l.statut;
      
      if (l.statut === 'remplacee') {
        displayStatus = 'echec';
        badgeStatus = 'remplacee';
      } else if (l.statut === 'retourne') {
        displayStatus = 'echec';
        badgeStatus = 'retourne';
      }

      // Determine which date to display based on status
      let displayDate;
      if (l.statut === 'livree') {
        displayDate = colis?.date_livraison;
      } else if (l.statut === 'retourne') {
        displayDate = colis?.date_retour;
      } else if (l.statut === 'expediee') {
        displayDate = colis?.date_expedition;
      } else {
        displayDate = l.created_at;
      }

      return {
        livraison_id: l.id,
        reference: l.reference,
        date_creation: l.created_at,
        date_livraison: colis?.date_livraison || null,
        date_retour: colis?.date_retour || null,
        displayDate,
        adresse_livraison: l.adresse?.adresse || 'Adresse non disponible',
        client_nom: l.client?.utilisateur
          ? `${l.client.utilisateur.prenom} ${l.client.utilisateur.nom}`
          : 'Client inconnu',
        statut: displayStatus,
        badge_statut: badgeStatus,
        colis: l.colis || [],
        retour: retour || null
      };
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirLivraisonsParDate:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur.',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};

// Update the obtenirLivraisonParId function
const obtenirLivraisonParId = async (req, res) => {
  try {
    const { id } = req.params;
    const livreurId = req.livreur?.utilisateur_id;

    const livraison = await Commande.findOne({
      where: { 
        id,
        ...(livreurId && { livreur_id: livreurId })
      },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse', 'ville', 'code_postal']
        },
        {
          model: Colis,
          as: 'colis',
          attributes: ['id', 'numero_suivi', 'statut', 'date_expedition', 'date_livraison', 'date_retour']
        },
        {
          model: Livreur,
          as: 'livreur',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['prenom', 'nom']
          }]
        },
        {
          model: Retour,
          as: 'retours',
          where: {
            type: 'livreur'
          },
          required: false
        }
      ]
    });

    if (!livraison) {
      return res.status(404).json({ 
        success: false,
        message: 'Livraison non trouvée' 
      });
    }

    // Determine display status
    let displayStatus = livraison.statut;
    let badgeStatus = livraison.statut;
    
    if (livraison.statut === 'remplacee') {
      displayStatus = 'echec';
      badgeStatus = 'remplacee';
    } else if (livraison.statut === 'retourne') {
      displayStatus = 'echec';
      badgeStatus = 'retourne';
    }

    const result = {
      livraison_id: livraison.id,
      reference: livraison.reference,
      date_creation: livraison.created_at,
      date_livraison: livraison.colis?.[0]?.date_livraison || null,
      date_retour: livraison.colis?.[0]?.date_retour || null,
      statut: displayStatus,
      badge_statut: badgeStatus,
      montant_total: livraison.prix_total,
      instructions: livraison.notes_admin,
      client_nom: livraison.client?.utilisateur 
        ? `${livraison.client.utilisateur.prenom} ${livraison.client.utilisateur.nom}`
        : 'Client inconnu',
      client_telephone: livraison.client?.telephone || 'N/A',
      adresse_livraison: livraison.adresse?.adresse 
        ? `${livraison.adresse.adresse}, ${livraison.adresse.code_postal} ${livraison.adresse.ville}`
        : 'Adresse non disponible',
      livreur: livraison.livreur?.utilisateur
        ? `${livraison.livreur.utilisateur.prenom} ${livraison.livreur.utilisateur.nom}`
        : null,
      colis: livraison.colis || [],
      retour: livraison.retours?.[0] || null
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erreur obtenirLivraisonParId:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la livraison',
      ...(process.env.NODE_ENV === 'development' && {
        error: error.message,
        stack: error.stack
      })
    });
  }
};



const signalerProblemeLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { type, notes } = req.body;
    const livreurId = req.livreur?.utilisateur_id;

    if (!type) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le type de problème est requis'
      });
    }

    const validProblemTypes = ['livraison_echouee', 'produit_endommage', 'adresse_incorrecte', 'demande_de_remplacement'];
    if (!validProblemTypes.includes(type)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Type de problème invalide'
      });
    }

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [{
        model: Colis,
        as: 'colis'
      }]
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    if (commande.livreur_id !== livreurId) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas assigné à cette commande'
      });
    }

    let newOrderStatus = 'retourne';
    let retourStatus = 'en_preparation';
    let shouldCreateReplacement = false;

    if (type === 'demande_de_remplacement') {
      newOrderStatus = 'remplacee';
      retourStatus = 'traite';
      shouldCreateReplacement = true;
    }

    const retour = await Retour.create({
      commande_id: commande.id,
      colis_id: commande.colis?.[0]?.id || null,
      motif: type,
      type: 'livreur',
      statut: retourStatus,
      notes_livreur: notes,
      date_demande: new Date()
    }, { transaction });

    await commande.update({
      statut: newOrderStatus,
      badge_statut: newOrderStatus,
      notes_admin: `Problème signalé: ${type} - ${notes || 'Aucun détail fourni'}`
    }, { transaction });

    if (commande.colis?.length > 0) {
      await Colis.update(
        {
          statut: newOrderStatus === 'retourne' ? 'retourne' : newOrderStatus,
          date_retour: newOrderStatus === 'retourne' ? new Date() : null
        },
        {
          where: { commande_id: id },
          transaction
        }
      );
    }

    let replacementOrder = null;
    if (shouldCreateReplacement) {
      console.log('Creating replacement order for commande:', commande.id);
      replacementOrder = await createReplacementOrder(commande, transaction);
      console.log('Replacement order created with ID:', replacementOrder?.id);
    }

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: livreurId,
      action: 'signalement_probleme',
      details: notes || `Problème signalé: ${type}`,
      ancienne_valeur: commande.statut,
      nouvelle_valeur: newOrderStatus
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Problème signalé avec succès',
      data: {
        commande_id: commande.id,
        retour_id: retour.id,
        nouveau_statut: newOrderStatus,
        badge_statut: newOrderStatus,
        replacement_order_id: replacementOrder?.id || null
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur dans signalerProblemeLivraison:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement du problème',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

async function createReplacementOrder(originalCommande, transaction) {
  const nouvelleCommande = await Commande.create({
    client_id: originalCommande.client_id,
    adresse_id: originalCommande.adresse_id,
    prix_total: originalCommande.prix_total,
    methode_livraison: originalCommande.methode_livraison,
    methode_paiement: originalCommande.methode_paiement,
    frais_livraison: originalCommande.frais_livraison,
    remplace_commande_id: originalCommande.id,
    statut: 'en_preparation'
  }, { transaction });

  const articles = await CommandeArticle.findAll({
    where: { commande_id: originalCommande.id },
    transaction
  });

  if (!articles.length) {
    console.warn('Aucun article trouvé pour la commande originale:', originalCommande.id);
  }

  await CommandeArticle.bulkCreate(
    articles.map(a => ({
      commande_id: nouvelleCommande.id,
      article_id: a.article_id,
      quantite: a.quantite,
      prix_unitaire: a.prix_unitaire,
      taille_id: a.taille_id,
      couleur_id: a.couleur_id
    })),
    { transaction }
  );

  return nouvelleCommande;
}


module.exports = {
  modifierLivreurLivraison,
  signalerProblemeLivraison,

  obtenirLivraisonParId,
  obtenirLivraisonsDisponibles,
  assignerLivraison,
  obtenirLivraisonsParLivreur,
  obtenirMesLivraisons,
  obtenirMesLivraisonsAujourdhui,
  mettreAJourStatutLivraison,
  obtenirMesStatistiquesLivraison,
  updateStatus,
  obtenirLivraisonsParDate
};

