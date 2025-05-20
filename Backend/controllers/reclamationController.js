const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinaryConfig');
const { Op } = require('sequelize');
const { Reclamation, Commande, Utilisateur } = require("../models");
const { envoyerEmail } = require("../services/emailService");
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Template loading function
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
  userConfirmation: loadTemplate('../templates/reclamation-confirmation.html'),
  responseTemplate: loadTemplate('../templates/reclamation-response.html'),
  reminderTemplate: loadTemplate('../templates/reclamation-reminder.html')
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper to clean up uploaded files on error
const cleanupFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
};

// ====================
// EXISTING FUNCTIONS (PRESERVED)
// ====================

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

    // Send confirmation emails
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

// ====================
// NEW WORKFLOW FUNCTIONS
// ====================

const listerReclamations = async (req, res) => {
  try {
    const { statut } = req.query;
    const where = {};
    
    if (statut) where.statut = statut;
    
    const reclamations = await Reclamation.findAll({
      where,
      order: [['date_creation', 'DESC']],
      include: [
        { 
          model: Utilisateur, 
          as: 'utilisateur', 
          attributes: ['id', 'nom', 'prenom', 'email'] 
        },
        { 
          model: Commande, 
          as: 'commande', 
          attributes: ['id', 'reference'] 
        }
      ]
    });

    return res.json({
      success: true,
      data: reclamations.map(r => ({
        ...r.toJSON(),
        reference: `REC-${r.id.slice(0, 8).toUpperCase()}`
      }))
    });
  } catch (error) {
    console.error('Error listing reclamations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réclamations'
    });
  }
};

const consulterReclamation = async (req, res) => {
  try {
    const reclamation = await Reclamation.findByPk(req.params.id, {
      include: [
        { model: Utilisateur, as: 'utilisateur' },
        { model: Commande, as: 'commande' }
      ]
    });

    if (!reclamation) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }

    // Auto-update to "brouillon" when admin opens it
    if (req.utilisateur && ['admin', 'super_admin'].includes(req.utilisateur.role) && reclamation.statut === 'nouveau') {
      await reclamation.update({ 
        statut: 'brouillon',
        admin_id: req.utilisateur.id
      });
    }

    return res.json({
      success: true,
      data: {
        ...reclamation.toJSON(),
        reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`
      }
    });
  } catch (error) {
    console.error('Error fetching reclamation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la réclamation'
    });
  }
};

const repondreReclamation = async (req, res) => {
  try {
    const { reponse } = req.body;
    if (!reponse) {
      return res.status(400).json({
        success: false,
        message: 'La réponse est obligatoire'
      });
    }

    const reclamation = await Reclamation.findByPk(req.params.id);
    if (!reclamation) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }

    // Auto-update to "traite" when admin submits response
    await reclamation.update({
      reponse,
      date_reponse: new Date(),
      statut: 'traite',
      admin_id: req.utilisateur.id
    });

    // Send response email
    await envoyerReponseEmail(reclamation);

    return res.json({
      success: true,
      message: 'Réponse envoyée avec succès',
      data: {
        reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`
      }
    });
  } catch (error) {
    console.error('Error responding to reclamation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la réponse'
    });
  }
};

const archiverReclamation = async (req, res) => {
  try {
    const reclamation = await Reclamation.findByPk(req.params.id);
    if (!reclamation) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }

    if (reclamation.statut !== 'traite') {
      return res.status(400).json({
        success: false,
        message: 'Seules les réclamations traitées peuvent être archivées'
      });
    }

    await reclamation.update({ statut: 'archive' });

    return res.json({
      success: true,
      message: 'Réclamation archivée avec succès',
      data: {
        reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`
      }
    });
  } catch (error) {
    console.error('Error archiving reclamation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'archivage de la réclamation'
    });
  }
};

const nettoyerReclamations = async (req, res) => {
  try {
    // Archive processed reclamations older than 7 days
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - 7);
    
    const archived = await Reclamation.update(
      { statut: 'archive' },
      {
        where: {
          statut: 'traite',
          date_reponse: { [Op.lt]: archiveDate }
        }
      }
    );

    // Send reminders for draft reclamations older than 24h
    const reminderDate = new Date();
    reminderDate.setHours(reminderDate.getHours() - 24);
    
    const drafts = await Reclamation.findAll({
      where: {
        statut: 'brouillon',
        updatedAt: { [Op.lt]: reminderDate }
      },
      include: [{ model: Utilisateur, as: 'admin' }]
    });

    for (const reclamation of drafts) {
      await envoyerRappelEmail(reclamation);
    }

    return res.json({
      success: true,
      message: 'Nettoyage terminé',
      data: {
        archived: archived[0],
        remindersSent: drafts.length
      }
    });
  } catch (error) {
    console.error('Error cleaning reclamations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage automatique'
    });
  }
};

// ====================
// EMAIL FUNCTIONS
// ====================

async function sendReclamationEmails(reclamation) {
  try {
    // Send confirmation to user
    const userHtml = templates.userConfirmation({
      prenom: reclamation.prenom,
      nom: reclamation.nom,
      sujet: reclamation.sujet,
      reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`
    });

    await transporter.sendMail({
      to: reclamation.email,
      subject: 'Confirmation de votre réclamation',
      html: userHtml
    });

    // Send alert to admin team
    const adminHtml = templates.adminAlert({
      sujet: reclamation.sujet,
      reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`,
      date: new Date().toLocaleDateString('fr-FR')
    });

    await transporter.sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: `Nouvelle réclamation: ${reclamation.sujet}`,
      html: adminHtml
    });
  } catch (error) {
    console.error('Error sending reclamation emails:', error);
  }
}

async function envoyerReponseEmail(reclamation) {
  try {
    const html = templates.responseTemplate({
      prenom: reclamation.prenom,
      nom: reclamation.nom,
      sujet: reclamation.sujet,
      message: reclamation.message,
      reponse: reclamation.reponse,
      reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`
    });

    await transporter.sendMail({
      to: reclamation.email,
      subject: `Réponse à votre réclamation: ${reclamation.sujet}`,
      html
    });
  } catch (error) {
    console.error('Error sending response email:', error);
  }
}

async function envoyerRappelEmail(reclamation) {
  try {
    if (!reclamation.admin) return;

    const html = templates.reminderTemplate({
      adminPrenom: reclamation.admin.prenom,
      sujet: reclamation.sujet,
      reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`,
      dateCreation: reclamation.createdAt.toLocaleDateString('fr-FR')
    });

    await transporter.sendMail({
      to: reclamation.admin.email,
      subject: `Rappel: Réclamation en brouillon depuis 24h`,
      html
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
}
const restaurerReclamation = async (req, res) => {
  try {
    const reclamation = await Reclamation.findByPk(req.params.id);
    if (!reclamation) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }

    if (reclamation.statut !== 'archive') {
      return res.status(400).json({
        success: false,
        message: 'Seules les réclamations archivées peuvent être restaurées'
      });
    }

    await reclamation.update({ 
      statut: 'traite',
      date_modification: new Date()
    });

    return res.json({
      success: true,
      message: 'Réclamation restaurée avec succès'
    });
  } catch (error) {
    console.error('Error restoring reclamation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la restauration de la réclamation'
    });
  }
};
module.exports = {
  creerReclamation,
  listerReclamations,
  consulterReclamation,
  repondreReclamation,
  archiverReclamation,
  nettoyerReclamations,
  restaurerReclamation
};




