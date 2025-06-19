// commandeController.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Op, Sequelize } = require('sequelize');
const { isUUID } = require('validator');
const QRCode = require('qrcode');
const { envoyerEmail } = require('../services/emailService');
const db = require('../models');
const sequelize = db.sequelize;
const { v4: uuidv4 } = require('uuid');

const {
  Commande,
  Client,
  Adresse,
  Taille,
  Couleur,
  CommandeArticle,
  CommandeHistorique,
  Facture,
  Livreur,
  Article,
  Marque,
  Utilisateur,
  ArticleTaille,
  ImageArticleCouleur,
  Colis,
  Retour

} = require('../models');

// Debug helper
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

// Delivery fee constants
const DELIVERY_FEES = {
  standard: 7.00,
  express: 15.00
};


// Helper to get delivery info
const getDeliveryInfo = (method) => ({
  fee: DELIVERY_FEES[method],
  description: method === 'express' 
    ? 'Livraison express (15.00 DT)' 
    : 'Livraison standard (7.00 DT)'
});

// 1. Generate PDF Invoice
/* const genererFacturePDF = async (req, res) => {
  try {
    const { reference } = req.params;

    const commande = await Commande.findOne({
      where: { reference },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' },
        {
          model: Article,
          as: 'articles',
          through: { 
            model: CommandeArticle,
            attributes: ['quantite', 'prix_unitaire', 'taille_id', 'couleur_id']
          },
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
        }
      ]
    });

    if (!commande) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée'
      });
    }

    if (commande.statut === 'annulee') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de générer une facture pour une commande annulée'
      });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `Facture-${commande.reference}.pdf`;
    const filepath = path.join(__dirname, '../../public/factures', filename);
    
    // Ensure directory exists
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // PDF Content
    doc.fontSize(20).text(`Facture ${commande.reference}`, { align: 'center' });
    doc.moveDown();
    
    // Client info
    doc.fontSize(12)
      .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`)
      .text(`Client: ${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`)
      .text(`Email: ${commande.client.utilisateur.email}`)
      .moveDown();

    // Address
    doc.text('Adresse de livraison:', { underline: true })
      .moveDown(0.5)
      .text(`${commande.adresse.adresse}`)
      .text(`${commande.adresse.code_postal} ${commande.adresse.ville}`)
      .text(`${commande.adresse.gouvernorat}`)
      .moveDown();

    // Delivery method and fees
    const deliveryInfo = getDeliveryInfo(commande.methode_livraison);
    doc.text(`Méthode de livraison: ${commande.methode_livraison === 'express' ? 'Express' : 'Standard'}`)
      .text(`Frais de livraison: ${deliveryInfo.fee.toFixed(2)} DT`)
      .moveDown();

    // Items table
    doc.text('Articles:', { underline: true }).moveDown(0.5);
    
    let yPosition = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Article', 50, yPosition);
    doc.text('Qté', 250, yPosition);
    doc.text('Prix', 350, yPosition, { width: 100, align: 'right' });
    doc.font('Helvetica');
    yPosition += 20;

    commande.articles.forEach(article => {
      const details = article.CommandeArticle;
      doc.text(article.nom_produit, 50, yPosition);
      doc.text(details.quantite.toString(), 250, yPosition);
      doc.text(`${details.prix_unitaire.toFixed(2)} DT`, 350, yPosition, { width: 100, align: 'right' });
      yPosition += 20;
    });

    // Totals
    doc.moveDown();
    doc.text(`Total: ${commande.prix_total.toFixed(2)} DT (inclut les frais de livraison)`);

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);
    fs.createReadStream(filepath).pipe(res);

  } catch (error) {
    const errorInfo = debugError('genererFacturePDF', error, { reference: req.params.reference });
    res.status(500).json({ 
      success: false, 
      message: 'Erreur génération facture',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
}; */

// 1. Generate PDF Invoice
const genererFacturePDF = async (req, res) => {
  let transaction; // Declare transaction here
  try {
    const { reference } = req.params;

    transaction = await sequelize.transaction();

    const commande = await Commande.findOne({
      where: { reference },
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        { model: Adresse, as: 'adresse' },
        {
          model: CommandeArticle,
          as: 'commande_articles', // Use commande_articles as defined in associations
          include: [
            {
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
            }
          ]
        }
      ],
      transaction // Pass transaction here
    });

    if (!commande) {
      await transaction.rollback(); // Rollback on error
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    if (commande.statut === 'annulee') {
      await transaction.rollback(); // Rollback on error
      return res.status(400).json({
        success: false,
        message: 'Impossible de générer une facture pour une commande annulée'
      });
    }

    const numeroFacture = `FAC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const filename = `${numeroFacture}.pdf`; // Changed filename to match generateCommandeInvoice style
    const filepath = path.join(__dirname, '../../public/factures', filename);

    // Ensure directory exists
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }

    const doc = new PDFDocument({ margin: 30 });
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // Get delivery info
    const deliveryInfo = getDeliveryInfo(commande.methode_livraison);

    // Use generateCommandeInvoice for PDF content
    generateCommandeInvoice(doc, commande, numeroFacture, deliveryInfo);

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Create or update Facture record
    let facture = await Facture.findOne({
      where: { commande_id: commande.id },
      transaction,
    });

    if (!facture) {
      facture = await Facture.create(
        {
          commande_id: commande.id,
          numero: numeroFacture,
          date_emission: new Date(),
          // Assuming prix_total on commande already includes delivery and is TTC
          montant_ht: commande.prix_total / 1.2,
          taux_tva: 20.0,
          montant_ttc: commande.prix_total,
          fichier_url: `/factures/${filename}`,
          est_payee: commande.paiement_recu,
          date_paiement: commande.date_paiement,
          methode_paiement: commande.methode_paiement
        },
        { transaction }
      );

      await CommandeHistorique.create(
        {
          commande_id: commande.id,
          utilisateur_id: req.utilisateur?.id || null,
          action: "generation_facture",
          details: `Facture ${numeroFacture} générée`,
        },
        { transaction }
      );
    } else {
      // Update existing invoice with payment info if needed
      await facture.update({
        est_payee: commande.paiement_recu,
        date_paiement: commande.date_paiement
      }, { transaction });
    }

    await transaction.commit(); // Commit transaction on success

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);
    fs.createReadStream(filepath).pipe(res);

  } catch (error) {
    if (transaction) await transaction.rollback(); // Rollback on error
    const errorInfo = debugError('genererFacturePDF', error, { reference: req.params.reference });
    res.status(500).json({
      success: false,
      message: 'Erreur génération facture',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

// 2. List Orders
const listerCommandes = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (statut && statut !== 'tous') whereClause.statut = statut;
    
    if (search) {
      whereClause[Op.or] = [
        { reference: { [Op.iLike]: `%${search}%` }},
        Sequelize.where(
          Sequelize.fn('concat', Sequelize.col('client.utilisateur.prenom'), ' ', Sequelize.col('client.utilisateur.nom')),
          { [Op.iLike]: `%${search}%` }
        )
      ];
    }

    const { count, rows } = await Commande.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        },
        {
          model: Livreur,
          as: 'livreur',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add delivery info to each order
    const commandes = rows.map(commande => ({
      ...commande.toJSON(),
      details_livraison: getDeliveryInfo(commande.methode_livraison)
    }));

    res.status(200).json({
      success: true,
      data: {
        commandes,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    const errorInfo = debugError('listerCommandes', error, { query: req.query });
    res.status(500).json({ 
      success: false,
      message: 'Erreur récupération commandes',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const obtenirDetailsCommande = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isUUID(id, 4)) {
      return res.status(400).json({
        success: false,
        message: 'Format ID invalide'
      });
    }

    const commande = await Commande.findByPk(id, {
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ 
            model: Utilisateur, 
            as: 'utilisateur',
            attributes: ['id', 'prenom', 'nom', 'email']
          }]
        },
        { 
          model: Adresse, 
          as: 'adresse',
          attributes: ['id', 'adresse', 'complement', 'code_postal', 'ville', 'gouvernorat']
        },
        { 
          model: Livreur, 
          as: 'livreur',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['id', 'prenom', 'nom']
          }]
        },
        {
          model: CommandeArticle,
          as: 'commande_articles',
          include: [
            {
              model: Article,
              as: 'article',
              include: [
                { 
                  model: Marque, 
                  as: 'marque',
                  attributes: ['id', 'libelle']
                },
                {
                  model: ArticleTaille,
                  as: 'inventory',
                  include: [
                    {
                      model: Taille,
                      as: 'taille'
                    },
                    {
                      model: Couleur,
                      as: 'couleur'
                    }
                  ]
                },
                {
                  model: ImageArticleCouleur,
                  as: 'images_couleurs',
                  on: {
                    article_id: { [Op.col]: 'commande_articles->article.id' },
                    couleur_id: { [Op.col]: 'commande_articles.couleur_id' }
                  },
                  required: false,
                  attributes: ['id', 'image_url', 'ordre_affichage']
                }
              ]
            }
          ]
        },
        {
          model: CommandeHistorique,
          as: 'historique',
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['id', 'prenom', 'nom']
          }],
          order: [['created_at', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!commande) {
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Transform the data structure
    const transformedArticles = commande.commande_articles.map(ca => {
      // Find the matching inventory item based on taille_id and couleur_id
      const inventoryItem = ca.article.inventory?.find(
        inv => inv.taille_id === ca.taille_id && inv.couleur_id === ca.couleur_id
      ) || { taille: null, couleur: null };

      // Get images for this specific color variant
      const images = ca.article.images_couleurs?.map(img => ({
        id: img.id,
        url: img.image_url,
        order: img.ordre_affichage
      })) || [];

      return {
        id: ca.article.id,
        nom_produit: ca.article.nom_produit,
        description: ca.article.description,
        conseils: ca.article.conseils,
        prix: ca.article.prix,
        prix_final: ca.article.prix_final,
        sku: ca.article.sku,
        seo_titre: ca.article.seo_titre,
        mots_cles_seo: ca.article.mots_cles_seo,
        categorie_id: ca.article.categorie_id,
        marque_id: ca.article.marque_id,
        genre_id: ca.article.genre_id,
        created_at: ca.article.created_at,
        updated_at: ca.article.updated_at,
        marque: ca.article.marque,
        tailles: inventoryItem.taille ? [inventoryItem.taille] : [],
        couleurs: inventoryItem.couleur ? [inventoryItem.couleur] : [],
        images: images.sort((a, b) => a.order - b.order),
        CommandeArticle: {
          quantite: ca.quantite,
          prix_unitaire: ca.prix_unitaire,
          taille_id: ca.taille_id,
          couleur_id: ca.couleur_id
        }
      };
    });

    // Calculate correct total from items
    const calculatedTotal = commande.commande_articles.reduce((total, ca) => {
      return total + (ca.prix_unitaire * ca.quantite);
    }, 0);

    // Add delivery fee if not already included
    const deliveryInfo = getDeliveryInfo(commande.methode_livraison);
    const finalTotal = calculatedTotal + deliveryInfo.fee;

    // Prepare response data
    const responseData = {
      ...commande.toJSON(),
      articles: transformedArticles,
      prix_total: finalTotal,
      details_livraison: {
        methode: commande.methode_livraison,
        frais: deliveryInfo.fee,
        description: deliveryInfo.description
      }
    };

    // Remove intermediate data
    delete responseData.commande_articles;

    res.status(200).json({ 
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error in obtenirDetailsCommande:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur récupération détails',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

const mettreAJourStatut = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;
    const { statut, notes } = req.body;
    const utilisateurId = req.utilisateur?.id;

    transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [
        'colis',
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
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

    const ancienStatut = commande.statut;

    if (!isValidStatusTransition(ancienStatut, statut)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Transition de statut non autorisée de ${ancienStatut} à ${statut}`
      });
    }

    if (statut === 'annulee') {
      await handleOrderCancellation(commande, notes, transaction);
    } else if (statut === 'remplacee') {
      await handleOrderReplacement(commande, notes, transaction);
    } else {
      await commande.update({ statut }, { transaction });
    }

    // Colis creation / update logic
    const existingColis = await sequelize.models.Colis.findOne({
      where: { commande_id: id },
      transaction
    });

    if (statut === 'en_preparation' || statut === 'expediee') {
      const isExpediee = statut === 'expediee';

      const colisData = {
        commande_id: id,
        livreur_id: commande.livreur_id,
        statut: isExpediee ? 'expediee' : 'en_preparation',
        transporteur: commande.methode_livraison === 'express' ? 'Express' : 'Standard',
        numero_suivi: `TRK${Date.now().toString(36).toUpperCase()}`,
        url_suivi: `${process.env.TRACKING_BASE_URL}/track/${commande.reference}`,
        ...(isExpediee && { date_expedition: new Date() })
      };

      let colis;
      if (existingColis) {
        colis = await existingColis.update(colisData, { transaction });
      } else {
        colis = await sequelize.models.Colis.create(colisData, { transaction });
      }

      const qrToken = uuidv4();
      const qrData = JSON.stringify({
        colisId: colis.id,
        commandeId: commande.id,
        token: qrToken
      });
      const qrCodeData = await QRCode.toDataURL(qrData);

      await colis.update({
        qr_token: qrToken,
        qr_expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        qr_code_data: qrCodeData
      }, { transaction });
    }

    if (statut === 'livree' && existingColis) {
      await existingColis.update({
        statut: 'livree',
        date_livraison: new Date()
      }, { transaction });
    }

    // Update related parcels (if needed)
    if (shouldUpdateParcels(ancienStatut, statut)) {
      await updateRelatedParcels(commande, statut, transaction);
    }

    // Log status change
    await logStatusChange(commande, ancienStatut, statut, utilisateurId, notes, transaction);

    // Special handling: replaced order
    if (statut === 'remplacee') {
      const replacementOrder = await createReplacementOrder(commande, transaction);
      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Commande marquée comme remplacée et nouvelle commande créée',
        data: {
          ancienStatut,
          nouveauStatut: statut,
          replacementOrderId: replacementOrder.id
        }
      });
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour',
      data: {
        ancienStatut,
        nouveauStatut: statut
      }
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error in mettreAJourStatut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur changement statut',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 
async function createReplacementOrder(originalCommande, transaction) {
  // Create new order with same details as original
  const nouvelleCommande = await Commande.create({
    client_id: originalCommande.client_id,
    adresse_id: originalCommande.adresse_id,
    prix_total: originalCommande.prix_total,
    methode_livraison: originalCommande.methode_livraison,
    methode_paiement: originalCommande.methode_paiement,
    frais_livraison: originalCommande.frais_livraison,
    remplace_commande_id: originalCommande.id,
    statut: 'en_preparation' // Changed from ''
  }, { transaction });

  // Copy articles from original order
  const articles = await originalCommande.getCommande_articles({ transaction });
  await Promise.all(articles.map(article => 
    nouvelleCommande.addCommande_articles(article, { transaction })
  ));

  return nouvelleCommande;
}

async function restockOrderItems(commande, transaction) {
  // Find all items in the order
  const articles = await CommandeArticle.findAll({
    where: { commande_id: commande.id },
    transaction
  });

  // Restock each item
  await Promise.all(articles.map(async (article) => {
    await ArticleTaille.increment('quantite', {
      by: article.quantite,
      where: {
        article_id: article.article_id,
        taille_id: article.taille_id,
        couleur_id: article.couleur_id
      },
      transaction
    });
  }));
}

async function initierRemboursement(commande, transaction) {
  // Implement your refund logic here
  // This is just a placeholder
  await CommandeHistorique.create({
    commande_id: commande.id,
    action: 'demande_remboursement',
    details: 'Remboursement initié'
  }, { transaction });
}
function isValidStatusTransition(oldStatus, newStatus) {
  const allowedTransitions = {
    en_preparation: ['expediee', 'annulee', 'remplacee', 'retourne'],
    expediee: ['livree', 'retourne', 'remplacee'],
    livree: ['retourne'],
    annulee: [],
    remplacee: [],
    retourne: ['remplacee', 'annulee']
  };
  return allowedTransitions[oldStatus]?.includes(newStatus) || false;
}
function shouldUpdateParcels(oldStatus, newStatus) {
  // Only update parcels for these status transitions
  const statusesThatAffectParcels = [
    'en_preparation',
    'expediee', 
    'livree'
  ];
  
  return statusesThatAffectParcels.includes(newStatus);
}

async function handleOrderCancellation(commande, notes, transaction) {
  // Cancel all related parcels
  await Colis.update(
    { statut: 'annulee', motif_annulation: notes },
    { 
      where: { commande_id: commande.id },
      transaction
    }
  );
  
  // Update order status
  await commande.update({ 
    statut: 'annulee',
    notes_admin: notes 
  }, { transaction });
}

async function handleOrderReplacement(commande, notes, transaction) {
  // Mark all related parcels as returned
  await Colis.update(
    { statut: 'retourne' },
    { 
      where: { commande_id: commande.id },
      transaction
    }
  );
  
  // Update order status
  await commande.update({ 
    statut: 'remplacee',
    notes_admin: notes 
  }, { transaction });
}

async function updateRelatedParcels(commande, newStatus, transaction) {
  const parcelStatusMap = {
    en_preparation: 'en_preparation',
    expediee: 'expediee',
    livree: 'livree'
  };
  
  if (parcelStatusMap[newStatus]) {
    await Colis.update(
      { statut: parcelStatusMap[newStatus] },
      { 
        where: { commande_id: commande.id },
        transaction
      }
    );
  }
}

async function logStatusChange(commande, oldStatus, newStatus, userId, notes, transaction) {
  return CommandeHistorique.create({
    commande_id: commande.id,
    utilisateur_id: userId,
    action: 'changement_statut',
    ancienne_valeur: oldStatus,
    nouvelle_valeur: newStatus,
    details: notes || `Statut changé de ${oldStatus} à ${newStatus}`
  }, { transaction });
}

const genererFacture = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;
    const { type = "commande" } = req.query; // 'commande' or 'colis'

    transaction = await sequelize.transaction();

    // First check if this is a colis ID and find the associated commande
    let commande;
    let colis = null;
    
    if (type === "colis") {
      // Use the Colis model from sequelize.models if direct import doesn't work
      colis = await sequelize.models.Colis.findByPk(id, {
        transaction,
        include: [{
          model: Commande,
          as: 'commande',
          include: [
            {
              model: Client,
              as: "client",
              include: [{ model: Utilisateur, as: "utilisateur" }],
            },
            { model: Adresse, as: "adresse" },
            {
              model: CommandeArticle,
              as: "commande_articles",
              include: [
                {
                  model: Article,
                  as: "article",
                  include: [
                    { model: Marque, as: "marque" },
                    {
                      model: Taille,
                      as: "tailles",
                      through: { attributes: [] },
                    },
                    {
                      model: Couleur,
                      as: "couleurs",
                      through: { attributes: [] },
                    },
                  ],
                },
              ],
            },
            {
              model: Livreur,
              as: "livreur",
              include: [{ model: Utilisateur, as: "utilisateur" }]
            }
          ]
        }]
      });

      if (!colis) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Colis non trouvé",
        });
      }

      commande = colis.commande;
    } else {
      // Regular commande lookup
      commande = await Commande.findByPk(id, {
        transaction,
        include: [
          {
            model: Client,
            as: "client",
            include: [{ model: Utilisateur, as: "utilisateur" }],
          },
          { model: Adresse, as: "adresse" },
          {
            model: CommandeArticle,
            as: "commande_articles",
            include: [
              {
                model: Article,
                as: "article",
                include: [
                  { model: Marque, as: "marque" },
                  {
                    model: Taille,
                    as: "tailles",
                    through: { attributes: [] },
                  },
                  {
                    model: Couleur,
                    as: "couleurs",
                    through: { attributes: [] },
                  },
                ],
              },
            ],
          },
          {
            model: Livreur,
            as: "livreur",
            include: [{ model: Utilisateur, as: "utilisateur" }]
          }
        ],
      });
    }

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    if (commande.statut === "annulee") {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Impossible de générer une facture pour une commande annulée",
      });
    }

    const numeroFacture = `FAC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const isColisInvoice = type === "colis";
    const fileName = isColisInvoice ? `Colis-${commande.reference}.pdf` : `${numeroFacture}.pdf`;
    const filePath = path.join(__dirname, "../../public/factures", fileName);

    // Ensure directory exists
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    const doc = new PDFDocument({ margin: 30 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Get delivery info
    const deliveryInfo = getDeliveryInfo(commande.methode_livraison);

    if (isColisInvoice) {
      // Generate Colis Invoice with QR Code
      generateColisInvoice(doc, commande, colis, deliveryInfo);
    } else {
      // Generate Regular Invoice
      generateCommandeInvoice(doc, commande, numeroFacture, deliveryInfo);
    }

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Only create facture record for regular invoices
    if (!isColisInvoice) {
      let facture = await Facture.findOne({
        where: { commande_id: commande.id },
        transaction,
      });

      if (!facture) {
        facture = await Facture.create(
          {
            commande_id: commande.id,
            numero: numeroFacture,
            date_emission: new Date(),
            montant_ht: commande.prix_total / 1.2, // Assuming 20% VAT
            taux_tva: 20.0,
            montant_ttc: commande.prix_total,
            fichier_url: `/factures/${fileName}`,
            est_payee: commande.statut === "livree",
            est_payee: commande.paiement_recu, // Use the new payment status field
            date_paiement: commande.date_paiement, // Use the payment date from commande
            methode_paiement: commande.methode_paiement
          },
          { transaction }
        );

        await CommandeHistorique.create(
          {
            commande_id: commande.id,
            utilisateur_id: req.utilisateur?.id || null,
            action: "generation_facture",
            details: `Facture ${numeroFacture} générée`,
          },
          { transaction }
        );
      }
      else {
      // Update existing invoice with payment info if needed
      await facture.update({
        est_payee: commande.paiement_recu,
        date_paiement: commande.date_paiement
      }, { transaction });
    }
    }

    await transaction.commit();

    // Send the generated PDF
    res.setHeader("Content-Type", "application/pdf");
    const disposition = isColisInvoice ? "inline" : "attachment";
    res.setHeader("Content-Disposition", `${disposition}; filename=${fileName}`);
    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    if (transaction) await transaction.rollback();

    const errorInfo = debugError("genererFacture", error, {
      commandeId: req.params.id,
      query: req.query,
    });
    res.status(500).json({
      success: false,
      message: "Erreur génération facture",
      debug: process.env.NODE_ENV === "development" ? errorInfo : undefined,
    });
  }
};

    function generateColisInvoice(doc, commande, colis, deliveryInfo) {
      // Colors
      const orange = "#f05a22";
      const black = "#000000";
      const gray = "#6B7280";
  
      // Header with orange background
      doc.rect(0, 0, 612, 80).fill(orange).fillColor(black);
      doc.fontSize(24).fillColor("white").text("MGM NEGOCES SARL", 0, 20, { align: "center" });
      doc.fontSize(20).text("BON DE LIVRAISON", 0, 45, { align: "center" });
  
      // Reset colors
      doc.fillColor(black);
  
      // Invoice Details - Right aligned with reduced spacing
      doc.fontSize(10).moveDown(0.5);
      const detailsX = 400;
      doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, detailsX, 90);
      doc.text(`Numéro colis: ${colis.numero_suivi}`, detailsX, 105);
      
      // Border around content
      doc.lineWidth(2).strokeColor(orange).rect(30, 140, 552, 400).stroke().strokeColor(black);
  
      // Company Info
      doc.fontSize(12).moveTo(50, 160);
      doc.text("MGM Négoces Sarl", 50, 160);
      doc.text("123 Rue des Entrepreneurs", 50, 175);
      doc.text("1002 Tunis, Tunisie", 50, 190);
      doc.text("Tél: +216 70 123 456", 50, 205);
  
      // Delivery and Customer Information side by side
      const infoY = 230;
      const columnWidth = 250; // Width for each column
      
      // Left Column - Delivery Information
      doc.fontSize(12).fillColor(orange).text("Informations de livraison:", 50, infoY);
      doc.fillColor(black).fontSize(12);
      doc.text(`Date d'expédition: ${colis.date_expedition?.toLocaleDateString("fr-FR") || new Date().toLocaleDateString("fr-FR")}`, 50, infoY + 20);
      doc.text(`Méthode: ${commande.methode_livraison === "express" ? "Express" : "Standard"}`, 50, infoY + 40);
  
      // Right Column - Customer Information
      doc.fontSize(12).fillColor(orange).text("Livrer à:", 50 + columnWidth, infoY);
      doc.fillColor(black).fontSize(12);
      doc.text(`${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`, 50 + columnWidth, infoY + 20);
      doc.text(`${commande.adresse.adresse}`, 50 + columnWidth, infoY + 40);
      doc.text(`${commande.adresse.code_postal} ${commande.adresse.ville}`, 50 + columnWidth, infoY + 60);
      doc.text(`${commande.adresse.gouvernorat}`, 50 + columnWidth, infoY + 80);
  
      // Items Table - starts below both columns
      const itemsY = infoY + 100;
      doc.fontSize(12).fillColor(orange).text("Articles:", 50, itemsY);
      doc.fillColor(black);
  
      // Table headers
      const tableTop = itemsY + 20;
      doc.fontSize(12)
         .fillColor(orange)
         .text("Article", 50, tableTop)
         .text("Quantité", 280, tableTop)
         .text("Détails", 350, tableTop);
  
      // Table header line
      doc.lineWidth(1)
         .strokeColor(orange)
         .moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();
  
      // Table content
      let currentY = tableTop + 25;
      doc.fillColor(black).fontSize(12);
  
      commande.commande_articles.forEach((commandeArticle) => {
          const article = commandeArticle.article;
          
          // Article name and quantity
          doc.text(article.nom_produit, 50, currentY)
             .text(commandeArticle.quantite.toString(), 280, currentY);
  
          // Details (size and color)
          let details = "";
          if (commandeArticle.taille_id) {
              const taille = article.tailles.find(t => t.id === commandeArticle.taille_id);
              if (taille) details += `Taille: ${taille.libelle}`;
          }
          if (commandeArticle.couleur_id) {
              const couleur = article.couleurs.find(c => c.id === commandeArticle.couleur_id);
              if (couleur) details += `${details ? ', ' : ''}Couleur: ${couleur.libelle}`;
          }
  
          doc.text(details, 350, currentY);
          currentY += 20;
      });
  
      // QR Code Section
      if (colis.qr_code_data) {
          const qrY = currentY + 110;
          doc.fontSize(12).fillColor(orange).text("QR Code", 0, qrY, { align: "center" });
          
          const qrSize = 120;
          const qrX = (612 - qrSize) / 2;
          
          doc.image(colis.qr_code_data, qrX, qrY + 20, { width: qrSize });
          doc.fontSize(12).text("Scannez pour confirmer", 33, qrY + 20 + qrSize + 10, { align: "center" });
      }
  
      // Footer
      doc.fontSize(10)
         .text("MGM Négoces Sarl - Livraison sécurisée", 0, 750, { align: "center" })
  }
    
    function generateCommandeInvoice(doc, commande, numeroFacture, deliveryInfo) {
      // Updated orange color
      const orange = "#f05a22"
      const black = "#000000"
      const gray = "#6B7280"
    
      // Draw the orange header bar
      doc.rect(0, 0, 612, 80).fill(orange).fillColor(black)
    
      // Add the company name to the header
      doc.fontSize(24).fillColor("white").text("MGM NEGOCES SARL", 0, 20, { align: "center" })
    
      // Add "FACTURE" title under the company name
      doc.fontSize(18).text("FACTURE", 0, 50, { align: "center" })
    
      // Set default color and font size for rest of the document
      doc.fillColor(black)
      doc.fontSize(10).moveDown(2)
    
      // Add invoice details in a single block with consistent indentation
      const detailsX = 400
      doc.text(`Numéro: ${numeroFacture}`, detailsX, 90)
      doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, detailsX, 105)
      doc.text(`Référence: ${commande.reference}`, detailsX, 120)
      doc.moveDown(1)
    
      // Draw a bordered container for the invoice
      doc.lineWidth(2).strokeColor(orange).rect(30, 140, 552, 560).stroke().strokeColor(black)
    
      // Company and client info in two columns with consistent indentation
      const leftColX = 50
      const rightColX = 300
      const infoY = 160
    
      // Company contact info (left column)
      doc.fontSize(14).fillColor(orange).text("De:", leftColX, infoY)
      doc.fillColor(black).fontSize(12)
      doc.text("MGM Négoces Sarl", leftColX, infoY + 20)
      doc.text("123 Rue des Entrepreneurs", leftColX, infoY + 35)
      doc.text("1002 Tunis, Tunisie", leftColX, infoY + 50)
      doc.text("Tél: +216 70 123 456", leftColX, infoY + 65)
      doc.text("Email: contact@mgmnegoces.com", leftColX, infoY + 80)
    
      // Client info (right column)
      doc.fontSize(14).fillColor(orange).text("Facturé à:", rightColX, infoY)
      doc.fillColor(black).fontSize(12)
      doc.text(`${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`, rightColX, infoY + 20)
      doc.text(`${commande.adresse.adresse}`, rightColX, infoY + 35)
      doc.text(`${commande.adresse.code_postal} ${commande.adresse.ville}`, rightColX, infoY + 50)
      doc.text(`${commande.adresse.gouvernorat}`, rightColX, infoY + 65)
    
      // Table headers
      const tableTop = infoY + 120
      doc
        .fontSize(12)
        .fillColor(orange)
        .text("Description", 50, tableTop)
        .text("Qté", 300, tableTop)
        .text("Prix Unitaire", 380, tableTop)
        .text("Total", 480, tableTop)
        .fillColor(black)
    
      // Table header line
      doc
        .lineWidth(1)
        .strokeColor(orange)
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke()
    
      // Articles loop with consistent table format
      let currentY = tableTop + 25
      let subtotal = 0
    
      commande.commande_articles.forEach((commandeArticle) => {
        const article = commandeArticle.article
        const lineTotal = commandeArticle.quantite * commandeArticle.prix_unitaire
        subtotal += lineTotal
    
        doc
          .fontSize(11)
          .text(article.nom_produit, 50, currentY)
          .text(commandeArticle.quantite.toString(), 300, currentY)
          .text(`${commandeArticle.prix_unitaire.toFixed(2)} DT`, 380, currentY)
          .text(`${lineTotal.toFixed(2)} DT`, 480, currentY)
    
        // Add size and color if available
        if (commandeArticle.taille_id || commandeArticle.couleur_id) {
          const details = []
          if (commandeArticle.taille_id) {
            const taille = article.tailles.find((t) => t.id === commandeArticle.taille_id)
            if (taille) details.push(`Taille: ${taille.libelle}`)
          }
          if (commandeArticle.couleur_id) {
            const couleur = article.couleurs.find((c) => c.id === commandeArticle.couleur_id)
            if (couleur) details.push(`Couleur: ${couleur.libelle}`)
          }
    
          currentY += 15
          doc.fontSize(10).fillColor(gray).text(details.join(", "), 70, currentY)
          doc.fillColor(black)
        }
    
        currentY += 25
      })
    
      // Line below the item list
      doc.lineWidth(1).strokeColor(orange).moveTo(50, currentY).lineTo(550, currentY).stroke()
    
      // Totals section with consistent alignment
      currentY += 20
      const totalsX = 380
      const valuesX = 480
    
      doc.fontSize(12).fillColor(black)
      doc.text("Sous-total:", totalsX, currentY)
      doc.text(`${subtotal.toFixed(2)} DT`, valuesX, currentY)
    
      currentY += 20
      doc.text("Frais de livraison:", totalsX, currentY)
      doc.text(`${deliveryInfo.fee.toFixed(2)} DT`, valuesX, currentY)
    
      currentY += 20
      doc.lineWidth(1).strokeColor(orange).moveTo(totalsX, currentY).lineTo(550, currentY).stroke()
    
      currentY += 10
      doc.fontSize(14).fillColor(orange)
      doc.text("Total TTC:", totalsX, currentY)
      doc.text(`${commande.prix_total.toFixed(2)} DT`, valuesX, currentY)
    
      // Payment information
      currentY += 40
      doc.fontSize(12).fillColor(orange).text("Informations de paiement:", 50, currentY)
      doc.fillColor(black)
      currentY += 20
       const paymentStatus = commande.paiement_recu ? "Payée" : "En attente";
       const paymentDate = commande.paiement_recu 
       ? commande.date_paiement.toLocaleDateString('fr-FR') 
       : "Non payée";
      doc.text(`Statut: ${paymentStatus} `, 50, currentY)
      currentY += 15
      doc.text(`Méthode: ${commande.methode_paiement || 'Non spécifiée'}`, 50, currentY)
      currentY += 15
      doc.text(`Date de paiement: ${paymentDate}`, 50, currentY)
    
      // Footer
      doc
        .fontSize(10)
        .text("MGM Négoces Sarl - Merci pour votre confiance!", 0, 720, { align: "center" })
          
        
    }


async function sendShippingNotification(commande, colis, utilisateurId) {
  try {
    if (!colis) {
      throw new Error('Package information is required for shipping notification');
    }

    // Send email without QR code
    await envoyerEmail({
      to: commande.client.utilisateur.email,
      subject: `Votre commande #${commande.reference} a été expédiée`,
      template: 'commandeExpediee',
      context: {
        PRENOM: commande.client.utilisateur.prenom,
        NOM: commande.client.utilisateur.nom,
        ORDER_REF: commande.reference,
        TRACKING_NUMBER: colis.numero_suivi,
        CARRIER_NAME: colis.transporteur || 'Standard',
        SHIPPING_DATE: new Date().toLocaleDateString('fr-FR'),
        DELIVERY_ESTIMATE: commande.methode_livraison === 'express' ? '1-2 jours ouvrables' : '2-3 jours ouvrables',
        TRACKING_LINK: colis.url_suivi || `${process.env.TRACKING_BASE_URL}/track/${commande.reference}`
      }
    });

    // Log notification
    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId || null,
      action: 'notification_expedition',
      details: 'Notification d\'expédition envoyée'
    });

    console.log(`Shipping notification sent for command ${commande.id}`);
  } catch (error) {
    console.error('Error sending shipping notification:', error);
    throw error;
  }
}

// 5. Update Delivery Address
const modifierAdresseLivraison = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { adresse_id } = req.body;
    const utilisateurId = req.utilisateur.id;

    const nouvelleAdresse = await Adresse.findByPk(adresse_id, { transaction });
    if (!nouvelleAdresse) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Adresse non trouvée' 
      });
    }

    const commande = await Commande.findByPk(id, { 
      transaction,
      lock: true 
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    if (['expediee', 'livree'].includes(commande.statut)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Impossible de modifier l\'adresse pour une commande déjà expédiée ou livrée'
      });
    }

    const ancienneAdresseId = commande.adresse_id;
    await commande.update({ adresse_id }, { transaction });

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: 'changement_adresse',
      ancienne_valeur: ancienneAdresseId,
      nouvelle_valeur: adresse_id,
      details: `Adresse de livraison modifiée`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Adresse de livraison modifiée avec succès',
      data: { adresse_id }
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('modifierAdresseLivraison', error, {
      commandeId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur modification adresse',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

const annulerCommande = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { raison, rembourser = false } = req.body;
    const utilisateurId = req.utilisateur.id;

    const commande = await Commande.findByPk(id, { 
      transaction,
      include: [
        {
          model: Colis,
          as: 'colis'
        },
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
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

    // Check if order can be cancelled
    const shippedParcels = commande.colis.filter(c => c.statut === 'expediee');
    if (shippedParcels.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Impossible d\'annuler une commande avec des colis déjà expédiés'
      });
    }

    // Update order status
    const ancienStatut = commande.statut;
    await commande.update({ 
      statut: 'annulee',
      raison_annulation: raison
    }, { transaction });

    // Restock items
    await restockOrderItems(commande, transaction);

    // Delete unshipped parcels
    await Colis.destroy({
      where: { 
        commande_id: commande.id,
        statut: { [Op.ne]: 'expediee' }
      },
      transaction
    });

    // Log the cancellation
    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: 'annulation_commande',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: 'annulee',
      details: `Annulée: ${raison || 'Non spécifié'}. Remboursement: ${rembourser ? 'Oui' : 'Non'}`
    }, { transaction });

    // Initiate refund if requested
    if (rembourser) {
      await initierRemboursement(commande, transaction);
    }

    await transaction.commit();

    // Notify customer
    await envoyerEmail({
      to: commande.client.utilisateur.email,
      subject: `Annulation de votre commande #${commande.reference}`,
      template: 'commandeAnnulee',
      context: {
        PRENOM: commande.client.utilisateur.prenom,
        NOM: commande.client.utilisateur.nom,
        ORDER_REF: commande.reference,
        RAISON: raison || 'Non spécifiée',
        REMBOURSEMENT: rembourser ? 'Oui' : 'Non'
      }
    });

    res.status(200).json({ 
      success: true,
      message: 'Commande annulée avec succès'
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'annulation de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// controllers/commandeController.js
const remplacerCommande = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { articles, adresse_id, notes } = req.body;
    const utilisateurId = req.utilisateur?.id;

    // 1. Validate original order
    const commandeOriginale = await Commande.findByPk(id, {
      transaction,
      include: ['colis']
    });

    if (!commandeOriginale) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande originale non trouvée' 
      });
    }

    // 2. Check if replacement is allowed
    if (!canBeReplaced(commandeOriginale)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Cette commande ne peut pas être remplacée'
      });
    }

    // 3. Create new order
    const nouvelleCommande = await Commande.create({
      client_id: commandeOriginale.client_id,
      adresse_id: adresse_id || commandeOriginale.adresse_id,
      prix_total: calculateTotal(articles),
      methode_livraison: commandeOriginale.methode_livraison,
      methode_paiement: commandeOriginale.methode_paiement,
      frais_livraison: commandeOriginale.frais_livraison,
      remplace_commande_id: commandeOriginale.id,
      statut: 'en_preparation'
    }, { transaction });

    // 4. Add articles to new order
    await addArticlesToOrder(nouvelleCommande.id, articles, transaction);

    // 5. Mark original order as replaced
    await commandeOriginale.update({
      statut: 'remplacee',
      notes_admin: notes
    }, { transaction });

    // 6. Handle original parcels
    await handleOriginalParcels(commandeOriginale, transaction);

    // 7. Log the replacement
    await logReplacement(commandeOriginale, nouvelleCommande, utilisateurId, notes, transaction);

    await transaction.commit();

    res.status(201).json({ 
      success: true,
      message: 'Commande remplacée avec succès',
      data: {
        ancienne_commande: commandeOriginale.id,
        nouvelle_commande: nouvelleCommande.id
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in remplacerCommande:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur remplacement commande'
    });
  }
};

// Helper functions
function canBeReplaced(commande) {
  return ['en_preparation', 'expediee'].includes(commande.statut) && 
         commande.statut !== 'annulee' && 
         commande.statut !== 'remplacee';
}

async function handleOriginalParcels(commande, transaction) {
  if (commande.colis && commande.colis.length > 0) {
    // Mark shipped parcels as returned
    await Colis.update(
      { statut: 'retourne', date_retour: new Date() },
      { 
        where: { 
          commande_id: commande.id,
          statut: 'expediee'
        },
        transaction
      }
    );
    
    // Cancel unshipped parcels
    await Colis.update(
      { statut: 'annulee' },
      { 
        where: { 
          commande_id: commande.id,
          statut: 'en_preparation'
        },
        transaction
      }
    );
  }
}

async function logReplacement(original, replacement, userId, notes, transaction) {
  const actions = [
    CommandeHistorique.create({
      commande_id: original.id,
      utilisateur_id: userId,
      action: 'commande_remplacee',
      details: notes || `Commande remplacée par ${replacement.reference}`
    }, { transaction }),
    CommandeHistorique.create({
      commande_id: replacement.id,
      utilisateur_id: userId,
      action: 'commande_remplacement',
      details: notes || `Commande de remplacement pour ${original.reference}`
    }, { transaction })
  ];
  
  return Promise.all(actions);
}
// 7. Add Admin Note
// In commandeController.js - update the ajouterNoteAdmin function
const ajouterNoteAdmin = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { notes_admin } = req.body; // Changed from 'note' to 'notes_admin'
    const utilisateurId = req.utilisateur.id;

    if (!notes_admin || notes_admin.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'La note ne peut pas être vide' 
      });
    }

    const commande = await Commande.findByPk(id, { transaction });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    await commande.update({ notes_admin }, { transaction });

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: 'ajout_note',
      details: `Note administrative mise à jour`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Note administrative mise à jour avec succès',
      data: { notes_admin }
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('ajouterNoteAdmin', error, {
      commandeId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour des notes',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};



// 9. Get Order History
const obtenirHistorique = async (req, res) => {
  try {
    const { id } = req.params;

    const historique = await CommandeHistorique.findAll({
      where: { commande_id: id },
      include: [
        { 
          model: Utilisateur, 
          as: 'utilisateur',
          attributes: ['id', 'nom', 'prenom', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({ 
      success: true,
      data: historique 
    });
  } catch (error) {
    const errorInfo = debugError('obtenirHistorique', error, { commandeId: req.params.id });
    res.status(500).json({ 
      success: false,
      message: 'Erreur récupération historique',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};



// 11. Notify Client
const envoyerNotificationClient = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { type } = req.body;

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
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

    const templates = {
      expedition: {
        subject: `Votre commande #${commande.reference} a été expédiée`,
        template: 'commandeExpediee',
        context: {
          PRENOM: commande.client.utilisateur.prenom,
          NOM: commande.client.utilisateur.nom,
          ORDER_REF: commande.reference,
          TRACKING_NUMBER: commande.numero_suivi || 'N/A',
          CARRIER_NAME: commande.transporteur || 'Standard',
          SHIPPING_DATE: new Date().toLocaleDateString('fr-FR'),
          DELIVERY_ESTIMATE: '2-3 jours ouvrables'
        }
      },
      livraison: {
        subject: `Votre commande #${commande.reference} a été livrée`,
        template: 'commandeLivree',
        context: {
          PRENOM: commande.client.utilisateur.prenom,
          NOM: commande.client.utilisateur.nom,
          ORDER_REF: commande.reference,
          DELIVERY_DATE: new Date().toLocaleDateString('fr-FR')
        }
      }
    };

    const template = templates[type];
    if (!template) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Type de notification invalide'
      });
    }

    await envoyerEmail({
      to: commande.client.utilisateur.email,
      subject: template.subject,
      template: template.template,
      context: template.context
    });

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: req.utilisateur.id,
      action: 'notification_client',
      details: `Notification ${type} envoyée`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Notification envoyée avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('envoyerNotificationClient', error, {
      commandeId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur envoi notification',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

// 12. Confirm Delivery with QR Code
const confirmerLivraisonQR = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { token } = req.body;
    const utilisateurId = req.utilisateur?.id;

    const commande = await Commande.findByPk(id, { 
      transaction,
      lock: true 
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    if (commande.statut !== 'expediee') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'La commande doit être en statut "expédiée" pour confirmation'
      });
    }

    if (!commande.qr_token || commande.qr_token !== token) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'Token de confirmation invalide' 
      });
    }

    if (commande.qr_expires && new Date(commande.qr_expires) < new Date()) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'Token de confirmation expiré' 
      });
    }

    await commande.update({ 
      statut: 'livree',
      date_livraison: new Date(),
      qr_token: null,
      qr_expires: null,
      qr_code_data: null
    }, { transaction });

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId || null,
      action: 'confirmation_livraison',
      ancienne_valeur: 'expediee',
      nouvelle_valeur: 'livree',
      details: `Livraison confirmée via QR code`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Livraison confirmée avec succès'
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('confirmerLivraisonQR', error, {
      commandeId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur confirmation livraison',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

// 13. Notify Shipping
const notifierExpEdition = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const commande = await Commande.findByPk(id, {
      transaction,
      include: [
        {
          model: Client,
          as: 'client',
          include: [{ model: Utilisateur, as: 'utilisateur' }]
        }
      ]
    });

    if (!commande || commande.statut !== 'expediee') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Commande non expédiée ou non trouvée'
      });
    }

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(`delivery-confirmation:${commande.id}`);
    const urlConfirmation = `${process.env.FRONTEND_URL}/confirmation-livraison?token=${commande.qr_token}`;

    await commande.update({
      qr_code_data: qrCodeDataURL
    }, { transaction });

    // Send email
    await envoyerEmail({
      to: commande.client.utilisateur.email,
      subject: `Votre commande #${commande.reference} a été expédiée`,
      template: 'commandeExpediee',
      context: {
        PRENOM: commande.client.utilisateur.prenom,
        NOM: commande.client.utilisateur.nom,
        ORDER_REF: commande.reference,
        TRACKING_NUMBER: commande.numero_suivi || 'N/A',
        CARRIER_NAME: commande.transporteur || 'Standard',
        SHIPPING_DATE: new Date().toLocaleDateString('fr-FR'),
        DELIVERY_ESTIMATE: '2-3 jours ouvrables',
        TRACKING_LINK: urlConfirmation
      }
    });

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Notification d\'expédition envoyée'
    });
  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('notifierExpEdition', error, { commandeId: req.params.id });
    res.status(500).json({ 
      success: false,
      message: 'Erreur notification expédition',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

// Helper function to generate QR code for delivery
const genererQRCodePourLivraison = async (commandeId) => {
  try {
    const token = `qr-${commandeId}-${Date.now()}`;
    const url = `${process.env.FRONTEND_URL}/confirmation-livraison?token=${token}`;
    const qrCodeDataURL = await QRCode.toDataURL(url);
    
    return {
      token,
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      url,
      qrCodeDataURL
    };
  } catch (error) {
    debugError('genererQRCodePourLivraison', error, { commandeId });
    throw error;
  }
};

/**
 * @desc Get orders ready for delivery ( + delivery method + no livreur assigned)
 * @access Admin/SuperAdmin
 */
const obtenirCommandesALivrer = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Commande.findAndCountAll({
      where: {
        statut: 'en_preparation', // Changed from ''
        methode_livraison: { [Op.in]: ['standard', 'express'] },
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
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        commandes: rows,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    const errorInfo = debugError('obtenirCommandesALivrer', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur récupération commandes à livrer',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};
const creerCommandeRemplacement = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const utilisateurId = req.utilisateur?.id;

    // Verify the original command exists and has a replacement request
    const commandeOriginale = await Commande.findByPk(id, {
      transaction,
      include: [
        {
          model: CommandeArticle,
          as: 'commande_articles',
          include: [{
            model: Article,
            as: 'article'
          }]
        },
        {
          model: Retour,
          as: 'retours',
          where: {
            type: 'livreur',
            motif: 'demande_de_remplacement',
            statut: 'en_preparation'
          },
          required: true
        }
      ]
    });

    if (!commandeOriginale) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande originale non trouvée ou pas de demande de remplacement' 
      });
    }

    // Create new order with same details as original
    const nouvelleCommande = await Commande.create({
      client_id: commandeOriginale.client_id,
      adresse_id: commandeOriginale.adresse_id,
      prix_total: commandeOriginale.prix_total,
      methode_livraison: commandeOriginale.methode_livraison,
      methode_paiement: commandeOriginale.methode_paiement,
      frais_livraison: commandeOriginale.frais_livraison,
      remplace_commande_id: commandeOriginale.id,
      statut: 'en_preparation'
    }, { transaction });

    // Copy articles from original order
    await CommandeArticle.bulkCreate(
      commandeOriginale.commande_articles.map(article => ({
        commande_id: nouvelleCommande.id,
        article_id: article.article_id,
        quantite: article.quantite,
        prix_unitaire: article.prix_unitaire,
        taille_id: article.taille_id,
        couleur_id: article.couleur_id
      })),
      { transaction }
    );

    // Update the retour record to mark it as processed
    await Retour.update(
      { statut: 'traite' },
      { 
        where: { 
          commande_id: commandeOriginale.id,
          motif: 'demande_de_remplacement'
        },
        transaction
      }
    );

    // Create a new colis for the replacement order
    await Colis.create({
      commande_id: nouvelleCommande.id,
      livreur_id: commandeOriginale.livreur_id,
      statut: 'en_preparation',
      transporteur: commandeOriginale.methode_livraison === 'express' ? 'Express' : 'Standard',
      numero_suivi: `TRK${Date.now().toString(36).toUpperCase()}`,
      url_suivi: `${process.env.TRACKING_BASE_URL}/track/${nouvelleCommande.reference}`,
    }, { transaction });

    // Log the actions
    await CommandeHistorique.create({
      commande_id: nouvelleCommande.id,
      utilisateur_id: utilisateurId,
      action: 'commande_remplacement',
      details: `Commande de remplacement créée pour ${commandeOriginale.reference}`
    }, { transaction });

    await CommandeHistorique.create({
      commande_id: commandeOriginale.id,
      utilisateur_id: utilisateurId,
      action: 'commande_remplacee',
      details: `Commande remplacée par ${nouvelleCommande.reference}`
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Commande de remplacement créée avec succès',
      data: {
        nouvelle_commande_id: nouvelleCommande.id,
        reference: nouvelleCommande.reference,
        ancienne_commande_id: commandeOriginale.id
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error in creerCommandeRemplacement:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande de remplacement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  genererFacturePDF,
  listerCommandes,
  obtenirDetailsCommande,
  mettreAJourStatut,
  modifierAdresseLivraison,
  annulerCommande,
  ajouterNoteAdmin,
  genererFacture,
  obtenirHistorique,
  envoyerNotificationClient,
  confirmerLivraisonQR,
  notifierExpEdition,
  obtenirCommandesALivrer,
  remplacerCommande,
    creerCommandeRemplacement

};