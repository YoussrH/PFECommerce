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

const uploadFichiers = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier téléchargé'
      });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Type de fichier non autorisé: ${file.mimetype}`
        });
      }

      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Fichier trop volumineux (max 5MB): ${file.originalname}`
        });
      }

      // Configure upload options based on file type
      const isPDF = file.mimetype === 'application/pdf';
        const uploadOptions = {
        folder: 'mgm/reclamations',
        resource_type: isPDF ? 'raw' : 'image',
        type: 'authenticated', // Always use authenticated for consistency
        access_mode: 'authenticated',
        sign_url: true,
        context: `filename=${file.originalname}`,
        invalidate: true // Ensure CDN cache is cleared
              // Add context with original filename
      };

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(file.path, uploadOptions);

      uploadedFiles.push({
        url: result.secure_url,
        public_id: result.public_id,
        name: file.originalname,
        size: formatFileSize(file.size),
        type: file.mimetype,
        // Add signature data for PDFs
        ...(isPDF && {
          signature: result.signature,
          timestamp: result.timestamp
        })
      });

      // Delete temp file
      fs.unlinkSync(file.path);
    }

    return res.json({
      success: true,
      message: 'Fichiers téléchargés avec succès',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Error uploading files:', {
      error: error.message,
      stack: error.stack,
      files: req.files?.map(f => f.originalname)
    });
    
    // Cleanup any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement des fichiers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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
  // Validate required fields
  if (!req.body.sujet || !req.body.message || !req.body.email || !req.body.prenom || !req.body.nom) {
    return res.status(400).json({
      success: false,
      message: 'Le sujet, le message, l\'email, le prénom et le nom sont obligatoires'
    });
  }

  try {
    // Upload files to Cloudinary if any
    const fichiers = [];
    if (req.files?.length > 0) {
      for (const file of req.files) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: 'Seuls les fichiers JPG, PNG, WEBP et PDF sont autorisés'
          });
        }

        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'mgm/reclamations',
          resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image'
        });

        fichiers.push({
          url: result.secure_url,
          public_id: result.public_id,
          name: file.originalname,
          type: file.mimetype,
          size: formatFileSize(file.size)
        });

        fs.unlinkSync(file.path); // Remove temp file
      }
    }

    // Prepare reclamation data
    const reclamationData = {
      sujet: req.body.sujet,
      message: req.body.message,
      email: req.body.email,
      telephone: req.body.telephone || null,
      numero_commande: req.body.numeroCommande || null,
      fichiers: fichiers.length > 0 ? fichiers : null, // Will be stringified by model setter
      statut: 'nouveau',
      prefix: req.body.prefix || '',
      prenom: req.body.prenom,
      nom: req.body.nom
    };

    // If user is authenticated, add user ID
    if (req.utilisateur?.id) {
      reclamationData.utilisateur_id = req.utilisateur.id;
    }

    // Create reclamation
    const reclamation = await Reclamation.create(reclamationData);

    return res.status(201).json({
      success: true,
      message: 'Réclamation créée avec succès',
      data: {
        id: reclamation.id,
        reference: `REC-${reclamation.id.toString().slice(0, 8).toUpperCase()}`
      }
    });
  } catch (error) {
    console.error('Error creating reclamation:', error);
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
      ],
      raw: true
    });

    const processedReclamations = reclamations.map(r => {
      return {
        ...r,
        fichiers: parseFichiers(r.fichiers),
        reference: `REC-${r.id.slice(0, 8).toUpperCase()}`
      };
    });

    return res.json({
      success: true,
      data: processedReclamations
    });
  } catch (error) {
    console.error('Error listing reclamations:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des réclamations'
    });
  }
};
const parseFichiers = (fichiers) => {
  // Handle null/undefined cases
  if (!fichiers) return [];
  
  // Handle already parsed arrays
  if (Array.isArray(fichiers)) return fichiers;
  
  // Handle string cases
  if (typeof fichiers === 'string') {
    // Handle empty string case
    if (fichiers.trim() === '') return [];
    
    // Try to parse as JSON
    try {
      // First try direct parse
      const parsed = JSON.parse(fichiers);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (firstError) {
      try {
        // If direct parse fails, try cleaning the string
        const cleaned = fichiers
          .replace(/\\"/g, '"')  // Unescape quotes
          .replace(/\\\\/g, '\\') // Unescape backslashes
          .replace(/^"|"$/g, ''); // Remove surrounding quotes
        
        // Try parsing cleaned string
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (secondError) {
        console.error('Error parsing fichiers:', {
          originalValue: fichiers,
          firstError: firstError.message,
          secondError: secondError.message
        });
        return [];
      }
    }
  }
  
  // Handle any other cases (numbers, objects, etc.)
  console.error('Unexpected fichiers type:', typeof fichiers, fichiers);
  return [];
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

    // Handle fichiers parsing more robustly
    let fichiers = [];
    if (reclamation.fichiers) {
      try {
        if (typeof reclamation.fichiers === 'string') {
          // Try to parse as JSON
          fichiers = JSON.parse(reclamation.fichiers);
        } else if (Array.isArray(reclamation.fichiers)) {
          fichiers = reclamation.fichiers;
        }
        
        // Ensure we always have an array
        if (!Array.isArray(fichiers)) {
          fichiers = [fichiers];
        }
      } catch (e) {
        console.error('Error parsing fichiers:', e);
        fichiers = [];
      }
    }

    // Auto-update to "brouillon" when admin opens it
    if (req.utilisateur && ['admin', 'super_admin'].includes(req.utilisateur.role)) {
      if (reclamation.statut === 'nouveau') {
        await reclamation.update({ 
          statut: 'brouillon',
          admin_id: req.utilisateur.id
        });
      }
    }

    return res.json({
      success: true,
      data: {
        ...reclamation.toJSON(),
        fichiers, // Send the properly parsed fichiers array
        reference: `REC-${reclamation.id.toString().slice(0, 8).toUpperCase()}`
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
    const { reponse, fichiers } = req.body;
    if (!reponse || reponse.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La réponse ne peut pas être vide'
      });
    }

    const reclamation = await Reclamation.findByPk(req.params.id);
    if (!reclamation) {
      return res.status(404).json({
        success: false,
        message: 'Réclamation non trouvée'
      });
    }

    // Get existing files (already parsed by Sequelize getter)
    const existingFiles = reclamation.fichiers || [];

    // Combine with new response files
    const allFiles = [...existingFiles];
    if (fichiers && fichiers.length > 0) {
      allFiles.push(...fichiers);
    }

    // Update reclamation
    await reclamation.update({
      reponse: reponse.trim(),
      date_reponse: new Date(),
      statut: 'traite',
      admin_id: req.utilisateur.id,
      fichiers: allFiles.length > 0 ? allFiles : null
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
    // Register a helper for date formatting
    handlebars.registerHelper('formatDate', function(dateString) {
      if (!dateString) return 'Non spécifiée';
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    // Parse the fichiers properly - handle both string and array formats
    let fichiers = [];
    if (reclamation.fichiers) {
      try {
        if (typeof reclamation.fichiers === 'string') {
          fichiers = JSON.parse(reclamation.fichiers);
        } else if (Array.isArray(reclamation.fichiers)) {
          fichiers = reclamation.fichiers;
        }
        
        // Ensure we have an array
        if (!Array.isArray(fichiers)) {
          fichiers = [fichiers];
        }
        
        // Filter only response files (optional)
        // fichiers = fichiers.filter(file => file.url.includes('/reponses/'));
      } catch (e) {
        console.error('Error parsing fichiers:', e);
        fichiers = [];
      }
    }

    const html = templates.responseTemplate({
      prenom: reclamation.prenom,
      nom: reclamation.nom,
      prefix: reclamation.prefix,
      sujet: reclamation.sujet,
      message: reclamation.message,
      reponse: reclamation.reponse || 'Aucune réponse spécifique fournie',
      date_reponse: reclamation.date_reponse || new Date(),
      reference: `REC-${reclamation.id.slice(0, 8).toUpperCase()}`,
      year: new Date().getFullYear(),
      fichiers: fichiers // Pass the parsed files to template
    });

    // Prepare email options
    const mailOptions = {
      to: reclamation.email,
      subject: `Réponse à votre réclamation: ${reclamation.sujet}`,
      html: html
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending response email:', error);
    throw error;
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


const generateSignedUrl = async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    // Extract public ID from Cloudinary URL
    const urlParts = fileUrl.split('/');
    const publicId = urlParts.slice(urlParts.indexOf('upload') + 2).join('/');
    const resourceType = publicId.endsWith('.pdf') ? 'raw' : 'image';

    // Generate signed URL
    const signedUrl = cloudinary.url(publicId, {
      sign_url: true,
      type: 'authenticated',
      resource_type: resourceType,
      secure: true,
      force_download: true
    });

    return res.json({
      success: true,
      signedUrl
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating secure download link'
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
  restaurerReclamation,
  uploadFichiers,
  generateSignedUrl,
};




