const { Reclamation, Utilisateur } = require("../models");
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinaryConfig');
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Load and compile templates
const loadTemplate = (templatePath) => {
  try {
    const template = fs.readFileSync(path.join(__dirname, templatePath), 'utf8');
    return handlebars.compile(template);
  } catch (err) {
    console.error('Error loading template:', err);
    throw err;
  }
};

const templates = {
  adminAlert: loadTemplate('../templates/reclamation-alert.html'),
  userConfirmation: loadTemplate('../templates/reclamation-confirmation.html')
};

const creerReclamation = async (req, res) => {
  // Validate request
  if (!req.body.sujet || !req.body.message || !req.body.email) {
    return res.status(400).json({
      success: false,
      message: 'Le sujet, le message et l\'email sont obligatoires'
    });
  }

  try {
    // Upload files to Cloudinary
    const fichiers = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'mgm/reclamations',
            resource_type: 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp']
          });
          
          fichiers.push({
            url: result.secure_url,
            name: file.originalname,
            size: formatFileSize(file.size)
          });
          
          fs.unlinkSync(file.path);
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
        }
      }
    }

    // Prepare reclamation data
    const reclamationData = {
      sujet: req.body.sujet,
      message: req.body.message,
      email: req.body.email,
      telephone: req.body.telephone || null,
      numero_commande: req.body.numeroCommande || null,
      fichiers,
      statut: 'nouveau'
    };

    // Handle user data (authenticated or guest)
    if (req.utilisateur?.id) {
      const utilisateur = await Utilisateur.findByPk(req.utilisateur.id);
      if (utilisateur) {
        reclamationData.utilisateur_id = utilisateur.id;
        reclamationData.prefix = utilisateur.prefix || '';
        reclamationData.prenom = utilisateur.prenom || '';
        reclamationData.nom = utilisateur.nom || '';
      }
    } else {
      if (!req.body.prenom || !req.body.nom) {
        return res.status(400).json({
          success: false,
          message: 'Pour les visiteurs, le prénom et nom sont obligatoires'
        });
      }
      reclamationData.prefix = req.body.prefix || '';
      reclamationData.prenom = req.body.prenom;
      reclamationData.nom = req.body.nom;
    }

    // Create reclamation
    const reclamation = await Reclamation.create(reclamationData);

    // Send emails using templates
    await sendReclamationEmails(reclamation);

    return res.status(201).json({
      success: true,
      message: 'Réclamation créée avec succès',
      data: {
        id: reclamation.id,
        reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`
      }
    });

  } catch (error) {
    console.error('Error:', error);
    cleanupFiles(req.files);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la réclamation'
    });
  }
};

async function sendReclamationEmails(reclamation) {
  const date = new Date(reclamation.date_creation).toLocaleString('fr-FR');
  const reference = `REC-${reclamation.id.slice(0, 8).toUpperCase()}`;

 // Admin email data
// Prepare data for admin confirmation template
const adminData = {
  subject: `Nouvelle réclamation: ${reclamation.sujet}`,
  time: date,
  year: new Date().getFullYear(),
  prefix: reclamation.prefix,
  nom: reclamation.nom,
  prenom: reclamation.prenom,
  email: reclamation.email,
  telephone: reclamation.telephone || 'Non fourni',
  numero_commande: reclamation.numero_commande || null,
  message: reclamation.message,
  fichiers: reclamation.fichiers || []
};




  // Prepare data for user confirmation template
  const userData = {
    reference: reference,
    sujet: reclamation.sujet,
    date: date,
    year: new Date().getFullYear(),
    prefix: reclamation.prefix,
    nom: reclamation.nom,
    prenom: reclamation.prenom,
    hasFiles: reclamation.fichiers.length > 0,
    message: reclamation.message
  };

  try {
    // Send admin alert
    await transporter.sendMail({
      from: `"MGM Boutique" <${process.env.EMAIL_USER}>`,
      to:  process.env.EMAIL_USER,
      subject: `Nouvelle réclamation: ${reference}`,
      html: templates.adminAlert(adminData)
    });

    // Send user confirmation
    await transporter.sendMail({
      from: `"MGM Boutique" <${process.env.EMAIL_USER}>`,
      to: reclamation.email,
      subject: `Confirmation de votre réclamation ${reference}`,
      html: templates.userConfirmation(userData)
    });
  } catch (emailError) {
    console.error('Email sending failed:', emailError);
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function cleanupFiles(files) {
  if (files?.length) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
  }
}

const obtenirToutesReclamations = async (req, res) => {
  try {
    const reclamations = await Reclamation.findAll({
      include: [{
        model: Utilisateur,
        as: 'utilisateur',
        attributes: ['id', 'prefix', 'nom', 'prenom', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(reclamations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenirMesReclamations = async (req, res) => {
  try {
    const reclamations = await Reclamation.findAll({
      where: { utilisateur_id: req.utilisateur.id },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(reclamations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenirReclamationParId = async (req, res) => {
  try {
    const reclamation = await Reclamation.findByPk(req.params.id, {
      include: [{
        model: Utilisateur,
        as: 'utilisateur',
        attributes: ['id', 'prefix', 'nom', 'prenom', 'email']
      }]
    });

    if (!reclamation) {
      return res.status(404).json({ message: "Réclamation non trouvée." });
    }

    if (req.utilisateur.role !== 'admin' && reclamation.utilisateur_id !== req.utilisateur.id) {
      return res.status(403).json({ message: "Non autorisé." });
    }

    res.status(200).json(reclamation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const mettreAJourReclamation = async (req, res) => {
  try {
    const { statut, reponse } = req.body;
    
    const reclamation = await Reclamation.findByPk(req.params.id);
    if (!reclamation) {
      return res.status(404).json({ message: "Réclamation non trouvée." });
    }

    reclamation.statut = statut || reclamation.statut;
    reclamation.reponse = reponse || reclamation.reponse;
    await reclamation.save();

    if (statut && reclamation.email) {
      await transporter.sendMail({
        from: `"MGM Boutique" <${process.env.EMAIL_USER}>`,
        to: reclamation.email,
        subject: `Mise à jour de votre réclamation #${reclamation.id}`,
        html: templates.userConfirmation({
          reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`,
          sujet: reclamation.sujet,
          date: new Date().toLocaleString('fr-FR'),
          prefix: reclamation.prefix,
          nom: reclamation.nom,
          message: `Le statut de votre réclamation a été mis à jour:<br><br>
                   Nouveau statut: ${statut}<br>
                   ${reponse ? `Réponse:<br>${reponse}` : ''}`
        })
      });
    }

    res.status(200).json(reclamation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  creerReclamation,
  obtenirToutesReclamations,
  obtenirMesReclamations,
  obtenirReclamationParId,
  mettreAJourReclamation
};