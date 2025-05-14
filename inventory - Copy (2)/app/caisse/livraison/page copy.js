const PDFDocument = require('pdfkit');
const path = require('path');
const { Commande, Client, Adresse, Article, Marque, Utilisateur } = require('../models');

const genererFacturePDF = async (req, res) => {
  const { reference } = req.params;

  try {
    const commande = await Commande.findOne({
      where: { reference },
      attributes: ['id', 'reference', 'prix_total', 'methode_livraison', 'created_at'],
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['telephone'],
          include: [{
            model: Utilisateur,
            as: 'utilisateur',
            attributes: ['nom', 'prenom', 'email']
          }]
        },
        {
          model: Adresse,
          as: 'adresse',
          attributes: ['adresse', 'complement', 'code_postal', 'ville', 'gouvernorat', 'telephone']
        },
        {
          model: Article,
          as: 'articles',
          attributes: ['nom_produit'],
          through: {
            attributes: ['quantite', 'prix_unitaire']
          },
          include: [{
            model: Marque,
            as: 'marque',
            attributes: ['libelle']
          }]
        }
      ]
    });

    if (!commande) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    // ===== CONSTANTS & CALCULATIONS =====
    const STYLE = {
      colors: {
        primary: '#1E3A8A',       // Dark blue
        secondary: '#E63946',      // Red accent
        lightBg: '#F8F9FA',        // Light gray background
        text: '#333333',           // Dark text
        lightText: '#666666'       // Lighter text
      },
      fonts: {
        header: 'Helvetica-Bold',
        body: 'Helvetica',
        table: 'Courier',
        tableHeader: 'Courier-Bold'
      },
      spacing: {
        section: 20,
        paragraph: 10,
        small: 5
      }
    };

    const fraisLivraison = commande.methode_livraison === 'express' ? 15 : 7;
    const prixTotal = Number(commande.prix_total) || 0;
    const sousTotal = prixTotal - fraisLivraison;
    
    const dateCommande = commande.created_at 
      ? new Date(commande.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : 'Date inconnue';

    // ===== PDF DOCUMENT SETUP =====
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true,
      info: {
        Title: `Facture ${commande.reference}`,
        Author: 'MGM Boutique'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Facture-${commande.reference}.pdf`);
    doc.pipe(res);

    // ===== HELPER FUNCTIONS =====
    const addSectionTitle = (title, yOffset = 0) => {
      doc.font(STYLE.fonts.header)
         .fontSize(14)
         .fillColor(STYLE.colors.primary)
         .text(title, 50, doc.y + yOffset);
      doc.moveDown(0.5);
    };

    const addInfoBox = (content, height) => {
      const boxY = doc.y;
      doc.rect(45, boxY, 520, height)
         .fill(STYLE.colors.lightBg)
         .stroke();
      
      return boxY + 10; // Return starting Y position for content
    };

    // ===== HEADER SECTION =====
    doc.image(path.join(__dirname, '../public/images/logo.png'), 50, 45, { width: 100 })
       .fillColor(STYLE.colors.primary)
       .fontSize(24)
       .font(STYLE.fonts.header)
       .text('FACTURE', 200, 65, { align: 'left' });

    doc.fontSize(10)
       .fillColor(STYLE.colors.lightText)
       .text(`Référence: ${commande.reference}`, 450, 65)
       .text(`Date: ${dateCommande}`, 450, 80)
       .text(`Livraison: ${commande.methode_livraison === 'express' ? 'Express (+15 DT)' : 'Standard (+7 DT)'}`, 450, 95);

    doc.moveDown(3);

    // ===== CLIENT INFORMATION =====
    addSectionTitle('Informations Client');
    const clientBoxY = addInfoBox('client', 80);
    
    const utilisateur = commande.client?.utilisateur;
    const telephoneClient = commande.client?.telephone || commande.adresse?.telephone || 'Non spécifié';

    doc.font(STYLE.fonts.body)
       .fontSize(11)
       .fillColor(STYLE.colors.text)
       .text(`Nom: ${utilisateur?.prenom || ''} ${utilisateur?.nom || ''}`, 50, clientBoxY)
       .text(`Email: ${utilisateur?.email || 'Non spécifié'}`, 50, clientBoxY + 20)
       .text(`Téléphone: ${telephoneClient}`, 50, clientBoxY + 40);

    doc.moveDown(4);

    // ===== DELIVERY ADDRESS =====
    addSectionTitle('Adresse de Livraison');
    const addressBoxY = addInfoBox('address', 70);
    
    const adresse = commande.adresse;
    if (adresse) {
      doc.font(STYLE.fonts.body)
         .fontSize(11)
         .fillColor(STYLE.colors.text)
         .text(adresse.adresse, 50, addressBoxY);
      
      if (adresse.complement) {
        doc.text(adresse.complement, 50, addressBoxY + 15);
      }
      
      doc.text(`${adresse.code_postal} ${adresse.ville}`, 50, addressBoxY + 30)
         .text(adresse.gouvernorat, 50, addressBoxY + 45);
    }

    doc.moveDown(3);

    // ===== PRODUCTS TABLE =====
    addSectionTitle('Détails de la Commande');
    
    // Table header
    const tableTop = doc.y;
    doc.font(STYLE.fonts.tableHeader)
       .fontSize(11)
       .fillColor('white');
    
    doc.rect(45, tableTop, 520, 20)
       .fill(STYLE.colors.primary);
    
    doc.text('Produit', 50, tableTop + 5);
    doc.text('Prix Unitaire', 300, tableTop + 5, { width: 90, align: 'right' });
    doc.text('Qté', 400, tableTop + 5, { width: 50, align: 'right' });
    doc.text('Total', 470, tableTop + 5, { width: 90, align: 'right' });

    // Table rows
    let y = tableTop + 30;
    doc.font(STYLE.fonts.table)
       .fillColor(STYLE.colors.text);
    
    commande.articles?.forEach((article) => {
      const prixUnitaire = Number(article.CommandeArticle?.prix_unitaire) || 0;
      const quantite = Number(article.CommandeArticle?.quantite) || 0;
      const total = prixUnitaire * quantite;

      doc.text(article.nom_produit, 50, y);
      doc.text(`${prixUnitaire.toFixed(2)} DT`, 300, y, { width: 90, align: 'right' });
      doc.text(quantite.toString(), 400, y, { width: 50, align: 'right' });
      doc.text(`${total.toFixed(2)} DT`, 470, y, { width: 90, align: 'right' });
      y += 20;
    });

    // ===== TOTALS SECTION =====
    doc.rect(350, y + 10, 215, 80)
       .fill(STYLE.colors.lightBg)
       .stroke();
    
    doc.font(STYLE.fonts.tableHeader)
       .fillColor(STYLE.colors.text);

    doc.text('Sous-total:', 360, y + 15, { width: 90, align: 'right' });
    doc.text(`${sousTotal.toFixed(2)} DT`, 460, y + 15, { width: 90, align: 'right' });

    doc.text('Livraison:', 360, y + 35, { width: 90, align: 'right' });
    doc.text(`${fraisLivraison.toFixed(2)} DT`, 460, y + 35, { width: 90, align: 'right' });

    doc.fillColor(STYLE.colors.primary)
       .fontSize(12);
    doc.text('TOTAL:', 360, y + 60, { width: 90, align: 'right' });
    doc.text(`${prixTotal.toFixed(2)} DT`, 460, y + 60, { width: 90, align: 'right' });

    // ===== FOOTER =====
    doc.moveTo(50, doc.y + 30)
       .lineTo(550, doc.y + 30)
       .lineWidth(1)
       .stroke(STYLE.colors.secondary);

    doc.font(STYLE.fonts.header)
       .fontSize(12)
       .fillColor(STYLE.colors.primary)
       .text('MGM Boutique', { align: 'center' });
    
    doc.font(STYLE.fonts.body)
       .fontSize(9)
       .fillColor(STYLE.colors.lightText)
       .text('Rue Mouhamed Gannouni, Ksar Hlel, 5016', { align: 'center' })
       .text('Tél: +216 51 301 308 | Email: contact@mgmboutique.tn', { align: 'center' })
       .text('Site web: www.mgmboutique.tn', { align: 'center' });
    
    doc.moveDown(1);
    
    doc.font(STYLE.fonts.body)
       .fontSize(10)
       .fillColor(STYLE.colors.secondary)
       .text('Merci pour votre confiance!', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports = {
  genererFacturePDF
};