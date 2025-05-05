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
const Colis = require('../models/Colis');



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
  ImageArticleCouleur

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
const genererFacturePDF = async (req, res) => {
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


// 8. Generate Invoice - FIXED VERSION
const genererFacture = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;

    // Validate UUID first
    if (!isUUID(id, 4)) {
      return res.status(400).json({ 
        success: false,
        message: 'Format ID de commande invalide'
      });
    }

    transaction = await sequelize.transaction();
    
    const commande = await Commande.findByPk(id, {
      transaction,
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
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée' 
      });
    }

    if (commande.statut === 'annulee') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Impossible de générer une facture pour une commande annulée'
      });
    }

    let facture = await Facture.findOne({ 
      where: { commande_id: id },
      transaction
    });

    if (!facture) {
      const numeroFacture = `FAC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      
      facture = await Facture.create({
        commande_id: commande.id,
        numero: numeroFacture,
        date_emission: new Date(),
        montant_ht: commande.prix_total / 1.2, // Assuming 20% VAT
        taux_tva: 20.0,
        montant_ttc: commande.prix_total,
        fichier_url: `/factures/${numeroFacture}.pdf`,
        est_payee: commande.statut === 'livree'
      }, { transaction });

      // Add invoice generation to history
      await CommandeHistorique.create({
        commande_id: commande.id,
        utilisateur_id: req.utilisateur?.id || null,
        action: 'generation_facture',
        details: `Facture ${numeroFacture} générée`
      }, { transaction });
    }

    // Create the factures directory if it doesn't exist
    const facturesDir = path.join(__dirname, '../../public/factures');
    if (!fs.existsSync(facturesDir)) {
      fs.mkdirSync(facturesDir, { recursive: true });
    }

    // Generate PDF
    const doc = new PDFDocument();
    const pdfPath = path.join(facturesDir, `${facture.numero}.pdf`);
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Get delivery info
    const deliveryInfo = getDeliveryInfo(commande.methode_livraison);

    // PDF Header
    doc.image(path.join(__dirname, '../../public/logo.png'), 50, 45, { width: 50 })
       .fillColor('#444444')
       .fontSize(20)
       .text('Facture', 200, 50, { align: 'right' })
       .fontSize(10)
       .text(`Numéro: ${facture.numero}`, 200, 65, { align: 'right' })
       .text(`Date: ${new Date(facture.date_emission).toLocaleDateString('fr-FR')}`, 200, 80, { align: 'right' })
       .moveDown();

    // Customer Information
    doc.fillColor('#444444')
       .fontSize(14)
       .text('Facturé à:', 50, 120)
       .fontSize(10)
       .text(`${commande.client.utilisateur.prenom} ${commande.client.utilisateur.nom}`, 50, 140)
       .text(`${commande.adresse.adresse}`, 50, 155)
       .text(`${commande.adresse.code_postal} ${commande.adresse.ville}`, 50, 170)
       .text(`${commande.adresse.gouvernorat}`, 50, 185)
       .moveDown();

    // Invoice Items Table Header
    doc.fontSize(12)
       .fillColor('#ffffff')
       .rect(50, 220, 500, 20)
       .fill('#009966')
       .text('Description', 50, 222)
       .text('Quantité', 300, 222)
       .text('Prix', 400, 222, { width: 100, align: 'right' })
       .text('Total', 500, 222, { width: 50, align: 'right' });

    // Invoice Items
    let yPosition = 250;
    doc.fillColor('#444444')
       .fontSize(10);

    commande.articles.forEach(article => {
      const commandeArticle = article.CommandeArticle;
      const lineTotal = commandeArticle.prix_unitaire * commandeArticle.quantite;
      
      doc.text(article.nom_produit, 50, yPosition)
         .text(commandeArticle.quantite.toString(), 300, yPosition)
         .text(`${commandeArticle.prix_unitaire.toFixed(2)} DT`, 400, yPosition, { width: 100, align: 'right' })
         .text(`${lineTotal.toFixed(2)} DT`, 500, yPosition, { width: 50, align: 'right' });
      
      yPosition += 25;
    });

    // Delivery Fee
    doc.text(deliveryInfo.description, 50, yPosition)
       .text('1', 300, yPosition)
       .text(`${deliveryInfo.fee.toFixed(2)} DT`, 400, yPosition, { width: 100, align: 'right' })
       .text(`${deliveryInfo.fee.toFixed(2)} DT`, 500, yPosition, { width: 50, align: 'right' });
    
    yPosition += 30;

    // Totals
    doc.fontSize(12)
       .text(`Sous-total: ${(facture.montant_ttc - deliveryInfo.fee).toFixed(2)} DT`, 400, yPosition, { width: 150, align: 'right' })
       .text(`Frais de livraison: ${deliveryInfo.fee.toFixed(2)} DT`, 400, yPosition + 20, { width: 150, align: 'right' })
       .fontSize(14)
       .text(`Total TTC: ${facture.montant_ttc.toFixed(2)} DT`, 400, yPosition + 40, { width: 150, align: 'right' })
       .moveDown();

    // Footer
    doc.fontSize(10)
       .text('Merci pour votre achat!', 50, 700, { align: 'center' })
       .text('Pour toute question, contactez notre service client au +216 XX XXX XXX', 50, 720, { align: 'center' });

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    await transaction.commit();

    // Send the generated PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Facture-${facture.numero}.pdf`);
    fs.createReadStream(pdfPath).pipe(res);

  } catch (error) {
    if (transaction) await transaction.rollback();
    
    // Handle specific errors
    if (error.code === 'ENOENT') {
      return res.status(500).json({
        success: false,
        message: 'Erreur système: Impossible de créer le fichier PDF'
      });
    }

    if (error.name === 'SequelizeDatabaseError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de base de données',
        details: error.message
      });
    }

    const errorInfo = debugError('genererFacture', error, { commandeId: req.params.id });
    res.status(500).json({ 
      success: false,
      message: 'Erreur génération facture',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

/* 
const mettreAJourStatut = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const utilisateurId = req.utilisateur?.id;

    // Start transaction with isolation level to prevent deadlocks
    transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    // First get basic commande info without locking
    const commande = await Commande.findByPk(id, {
      include: [{
        model: Client,
        as: 'client',
        attributes: ['utilisateur_id', 'telephone'],
        include: [{
          model: Utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'prenom', 'nom', 'email']
        }]
      }],
      transaction
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Now lock ONLY the commande row
    const [updatedCount] = await Commande.update(
      { statut },
      { 
        where: { id },
        transaction,
        lock: true,
        skip: ['updated_at'] // Skip timestamp auto-update to prevent deadlock
      }
    );

    if (updatedCount === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Aucune commande mise à jour'
      });
    }

    // Handle package creation
    if (statut === 'expediee') {
      const [colis] = await db.Colis.findOrCreate({
        where: { commande_id: id },
        defaults: {
          numero_suivi: `TRK${Date.now().toString(36).toUpperCase()}`,
          statut: 'expedie',
          date_expedition: new Date(),
          transporteur: commande.methode_livraison === 'express' ? 'Express' : 'Standard',
          url_suivi: `${process.env.TRACKING_BASE_URL}/track/${commande.reference}`
        },
        transaction
      });

      // Generate QR code
      const qrToken = require('uuid').v4();
      const qrData = JSON.stringify({
        colisId: colis.id,
        commandeId: commande.id,
        token: qrToken
      });
      const qrCodeData = await QRCode.toDataURL(qrData);
      
      await colis.update({
        qr_token: qrToken,
        qr_expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        qr_code_data: qrCodeData
      }, { transaction });
    }

    // Log history
    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: 'changement_statut',
      ancienne_valeur: commande.statut,
      nouvelle_valeur: statut,
      details: `Statut changé de ${commande.statut} à ${statut}`
    }, { transaction });

    // Commit transaction FIRST
    await transaction.commit();

    // Send notification AFTER successful commit
    if (statut === 'expediee') {
      const colis = await db.Colis.findOne({ where: { commande_id: id } });
      await sendShippingNotification(commande, colis, utilisateurId);
    }

    res.status(200).json({ 
      success: true,
      message: 'Statut mis à jour',
      data: { 
        ancienStatut: commande.statut, 
        nouveauStatut: statut 
      }
    });

  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    console.error('Status update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur changement statut',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; */

const mettreAJourStatut = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const utilisateurId = req.utilisateur?.id;

    transaction = await sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    const commande = await Commande.findByPk(id, {
      include: [{
        model: Client,
        as: 'client',
        attributes: ['utilisateur_id', 'telephone'],
        include: [{
          model: Utilisateur,
          as: 'utilisateur',
          attributes: ['id', 'prenom', 'nom', 'email']
        }]
      }],
      transaction
    });

    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const [updatedCount] = await Commande.update(
      { statut },
      {
        where: { id },
        transaction,
        lock: true,
        skip: ['updated_at']
      }
    );

    if (updatedCount === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Aucune commande mise à jour' });
    }

    // ✅ If statut is "en_preparation", create or update colis and generate QR code
    if (statut === 'en_preparation') {
      let colis = await db.Colis.findOne({ where: { commande_id: id }, transaction });
      if (colis) {
        // If colis exists, update its statut
        await colis.update({ statut: 'en_preparation' }, { transaction });
      } else {
        // If colis doesn't exist, create a new colis
        colis = await db.Colis.create({
          commande_id: id,
          statut: 'en_preparation',
          transporteur: commande.methode_livraison === 'express' ? 'Express' : 'Standard',
          numero_suivi: `TRK${Date.now().toString(36).toUpperCase()}`,
          url_suivi: `${process.env.TRACKING_BASE_URL}/track/${commande.reference}`,
        }, { transaction });

        // Generate QR code when colis is created
        const qrToken = require('uuid').v4();
        const qrData = JSON.stringify({
          colisId: colis.id,
          commandeId: commande.id,
          token: qrToken
        });
        const qrCodeData = await QRCode.toDataURL(qrData); // Generate the QR code

        // Update colis with the QR code and expiration details
        await colis.update({
          qr_token: qrToken,
          qr_expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          qr_code_data: qrCodeData
        }, { transaction });
      }
    }

    // ✅ Handle package creation if commande is "expediee"
    if (statut === 'expediee') {
      const [colis] = await db.Colis.findOrCreate({
        where: { commande_id: id },
        defaults: {
          numero_suivi: `TRK${Date.now().toString(36).toUpperCase()}`,
          statut: 'expedie',
          date_expedition: new Date(),
          transporteur: commande.methode_livraison === 'express' ? 'Express' : 'Standard',
          url_suivi: `${process.env.TRACKING_BASE_URL}/track/${commande.reference}`
        },
        transaction
      });

      const qrToken = require('uuid').v4();
      const qrData = JSON.stringify({
        colisId: colis.id,
        commandeId: commande.id,
        token: qrToken
      });
      const qrCodeData = await QRCode.toDataURL(qrData);

      await colis.update({
        qr_token: qrToken,
        qr_expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        qr_code_data: qrCodeData
      }, { transaction });
    }

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: 'changement_statut',
      ancienne_valeur: commande.statut,
      nouvelle_valeur: statut,
      details: `Statut changé de ${commande.statut} à ${statut}`
    }, { transaction });

    await transaction.commit();

    // Only send notification after commit
    if (statut === 'expediee') {
      const colis = await db.Colis.findOne({ where: { commande_id: id } });
      await sendShippingNotification(commande, colis, utilisateurId);
    }

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour',
      data: {
        ancienStatut: commande.statut,
        nouveauStatut: statut
      }
    });

  } catch (error) {
    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }

    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur changement statut',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




async function sendShippingNotification(commande, colis, utilisateurId) {
  try {
    if (!colis) {
      throw new Error('Package information is required for shipping notification');
    }

    const urlConfirmation = `${process.env.FRONTEND_URL}/confirmation-livraison?token=${colis.qr_token}`;

    // Send email
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
        DELIVERY_ESTIMATE: '2-3 jours ouvrables',
        TRACKING_LINK: urlConfirmation,
        QR_CODE_URL: colis.qr_code_data
      }
    });

    // Log notification
    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId || null,
      action: 'notification_expedition',
      details: 'Notification d\'expédition envoyée'
    });
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

// 6. Cancel Order
const annulerCommande = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { raison, rembourser = false } = req.body;
    const utilisateurId = req.utilisateur.id;

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

    if (['livree', 'annulee'].includes(commande.statut)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: `Impossible d'annuler une commande ${commande.statut}`
      });
    }

    const ancienStatut = commande.statut;
    await commande.update({ statut: 'annulee' }, { transaction });

    await CommandeHistorique.create({
      commande_id: commande.id,
      utilisateur_id: utilisateurId,
      action: 'annulation_commande',
      ancienne_valeur: ancienStatut,
      nouvelle_valeur: 'annulee',
      details: `Annulée: ${raison || 'Non spécifié'}. Remboursement: ${rembourser ? 'Oui' : 'Non'}`
    }, { transaction });

    if (rembourser) {
      await CommandeHistorique.create({
        commande_id: commande.id,
        utilisateur_id: utilisateurId,
        action: 'demande_remboursement',
        details: 'Remboursement initié'
      }, { transaction });
    }

    await transaction.commit();

    res.status(200).json({ 
      success: true,
      message: 'Commande annulée',
      data: { 
        statut: 'annulee',
        remboursement_initie: rembourser 
      }
    });

  } catch (error) {
    await transaction.rollback();
    const errorInfo = debugError('annulerCommande', error, {
      commandeId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      message: 'Erreur annulation commande',
      debug: process.env.NODE_ENV === 'development' ? errorInfo : undefined
    });
  }
};

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
 * @desc Get orders ready for delivery (en_attente + delivery method + no livreur assigned)
 * @access Admin/SuperAdmin
 */
const obtenirCommandesALivrer = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Commande.findAndCountAll({
      where: {
        statut: 'en_attente',
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
      order: [['created_at', 'ASC']], // Oldest first
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
  
};