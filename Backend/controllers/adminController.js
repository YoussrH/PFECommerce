const { Utilisateur, HistoriqueAction } = require("../models");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { Op } = require("sequelize");
const fs = require('fs');
const path = require('path');
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const ADMIN_EMAIL_TEMPLATES = {
  CREATE_ADMIN: fs.readFileSync(path.join(__dirname, '../templates/admin-creation.html'), 'utf8'),
  CREATE_SUPER_ADMIN: fs.readFileSync(path.join(__dirname, '../templates/superadmin-creation.html'), 'utf8'),
  DELETE_ADMIN: fs.readFileSync(path.join(__dirname, '../templates/admin-deletion.html'), 'utf8'),
  ADMIN_NOTIFICATION: fs.readFileSync(path.join(__dirname, '../templates/action-notification.html'), 'utf8')
};

const renderTemplate = (template, variables) => {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  return rendered;
};

const logAction = async (adminId, actionType, targetId, details, ipAddress) => {
  try {
    await HistoriqueAction.create({
      admin_id: adminId,
      action_type: actionType,
      target_id: targetId,
      details: JSON.stringify(details),
      ip_address: ipAddress,
      created_at: new Date()
    });
  } catch (error) {
    console.error("Error logging action:", error);
  }
};

const validateAdminData = (data) => {
  const errors = {};
  let isValid = true;

  if (!data.nom || data.nom.trim() === '') {
    errors.nom = "Le nom est requis";
    isValid = false;
  }

  if (!data.prenom || data.prenom.trim() === '') {
    errors.prenom = "Le prénom est requis";
    isValid = false;
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Une adresse email valide est requise";
    isValid = false;
  }

  if (!data.mot_de_passe || data.mot_de_passe.length < 8) {
    errors.mot_de_passe = "Le mot de passe doit contenir au moins 8 caractères";
    isValid = false;
  }

  return { isValid, errors };
};

const creerAdmin = async (req, res) => {
  try {
    const currentUser = req.session.utilisateur || req.utilisateur;
    
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        message: "Action non autorisée : droits insuffisants" 
      });
    }

    const { prefix, nom, prenom, email, mot_de_passe, newsletter } = req.body;
    const createdBy = currentUser.id;

    const { isValid, errors } = validateAdminData(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors
      });
    }

    const existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
        errors: { email: "Cet email est déjà utilisé" }
      });
    }

    const nouvelAdmin = await Utilisateur.create({
      prefix: prefix || '',
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      mot_de_passe: await bcrypt.hash(mot_de_passe, 10),
      newsletter: newsletter || false,
      role: 'admin',
      est_verifie: true,
      created_by: createdBy,
      created_at: new Date()
    });

    await logAction(
      createdBy,
      'create_admin',
      nouvelAdmin.id,
      { email, role: 'admin' },
      req.ip
    );

    const emailData = {
      PRENOM: prenom,
      NOM: nom,
      EMAIL: email,
      TEMPORARY_PASSWORD: mot_de_passe,
      CREATION_DATE: new Date().toLocaleString('fr-FR'),
      CREATOR_NAME: `${currentUser.prenom} ${currentUser.nom}`,
      CURRENT_YEAR: new Date().getFullYear(),
      LOGIN_URL: process.env.FRONTEND_LOGIN_URL || 'https://votredomaine.com/login'
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Votre compte administrateur a été créé",
      html: renderTemplate(ADMIN_EMAIL_TEMPLATES.CREATE_ADMIN, emailData)
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: currentUser.email,
      subject: "Notification: Nouvel administrateur créé",
      html: renderTemplate(ADMIN_EMAIL_TEMPLATES.ADMIN_NOTIFICATION, {
        PRENOM: currentUser.prenom,
        NOM: currentUser.nom,
        ACTION_TYPE: 'Création administrateur',
        ACTOR_NAME: `${currentUser.prenom} ${currentUser.nom}`,
        ACTOR_EMAIL: currentUser.email,
        ACTION_DATE: new Date().toLocaleString('fr-FR'),
        ACTION_DETAILS: `Création du compte administrateur ${email}`,
        CURRENT_YEAR: new Date().getFullYear()
      })
    });

    return res.status(201).json({
      success: true,
      message: "Administrateur créé avec succès",
      data: {
        id: nouvelAdmin.id,
        email: nouvelAdmin.email,
        role: nouvelAdmin.role,
      }
    });

  } catch (error) {
    console.error("Erreur création admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de l'administrateur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const creerSuperAdmin = async (req, res) => {
  try {
    const currentUser = req.session.utilisateur || req.utilisateur;
    
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        message: "Action strictement réservée aux super administrateurs" 
      });
    }

    const { prefix, nom, prenom, email, mot_de_passe } = req.body;
    const createdBy = currentUser.id;

    const { isValid, errors } = validateAdminData(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors
      });
    }

    const existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
        errors: { email: "Cet email est déjà utilisé" }
      });
    }

    const superAdminCount = await Utilisateur.count({ where: { role: 'super_admin' } });
    if (superAdminCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "Nombre maximum de super administrateurs atteint (3 maximum)"
      });
    }

    const nouveauSuperAdmin = await Utilisateur.create({
      prefix: prefix || '',
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      mot_de_passe: await bcrypt.hash(mot_de_passe, 12),
      role: 'super_admin',
      est_verifie: true,
      created_by: createdBy,
      created_at: new Date()
    });

    await logAction(
      createdBy,
      'create_super_admin',
      nouveauSuperAdmin.id,
      { email, role: 'super_admin' },
      req.ip
    );

    const emailData = {
      PRENOM: prenom,
      NOM: nom,
      EMAIL: email,
      TEMPORARY_PASSWORD: mot_de_passe,
      CREATION_DATE: new Date().toLocaleString('fr-FR'),
      CREATOR_NAME: `${currentUser.prenom} ${currentUser.nom}`,
      CURRENT_YEAR: new Date().getFullYear(),
      LOGIN_URL: process.env.FRONTEND_LOGIN_URL || 'https://votredomaine.com/login',
      SECURITY_NOTE: "Ce compte dispose de privilèges élevés. Veillez à protéger ces informations."
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Votre compte Super Administrateur a été créé",
      html: renderTemplate(ADMIN_EMAIL_TEMPLATES.CREATE_SUPER_ADMIN, emailData)
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: currentUser.email,
      subject: "Notification: Nouveau Super Admin créé",
      html: renderTemplate(ADMIN_EMAIL_TEMPLATES.ADMIN_NOTIFICATION, {
        PRENOM: currentUser.prenom,
        NOM: currentUser.nom,
        ACTION_TYPE: 'Création Super Admin',
        ACTOR_NAME: `${currentUser.prenom} ${currentUser.nom}`,
        ACTOR_EMAIL: currentUser.email,
        ACTION_DATE: new Date().toLocaleString('fr-FR'),
        ACTION_DETAILS: `Création du compte super administrateur ${email}`,
        CURRENT_YEAR: new Date().getFullYear(),
        SPECIAL_NOTE: "Attention: Ce compte a des privilèges égaux aux vôtres."
      })
    });

    return res.status(201).json({
      success: true,
      message: "Super administrateur créé avec succès",
      data: {
        id: nouveauSuperAdmin.id,
        email: nouveauSuperAdmin.email
      }
    });

  } catch (error) {
    console.error("Erreur création super admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du super administrateur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const supprimerAdmin = async (req, res) => {
  try {
    const currentUser = req.session.utilisateur || req.utilisateur;
    
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        message: "Action non autorisée : droits insuffisants" 
      });
    }

    const { id } = req.params;
    const currentUserId = currentUser.id;

    if (id === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Vous ne pouvez pas supprimer votre propre compte"
      });
    }

    const adminToDelete = await Utilisateur.findOne({
      where: { id },
      attributes: ['id', 'email', 'role', 'prenom', 'nom', 'created_by']
    });

    if (!adminToDelete) {
      return res.status(404).json({
        success: false,
        message: "Administrateur non trouvé"
      });
    }

    if (adminToDelete.created_by !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Vous ne pouvez supprimer que les comptes que vous avez créés"
      });
    }

    if (adminToDelete.role === 'super_admin') {
      const remainingSuperAdmins = await Utilisateur.count({ 
        where: { 
          role: 'super_admin',
          id: { [Op.ne]: id }
        } 
      });
      
      if (remainingSuperAdmins === 0) {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer le dernier super administrateur"
        });
      }
    }

    await logAction(
      currentUserId,
      'delete_admin',
      id,
      {
        email: adminToDelete.email,
        role: adminToDelete.role,
        name: `${adminToDelete.prenom} ${adminToDelete.nom}`
      },
      req.ip
    );

    await adminToDelete.destroy();
    const emailData = {
      PRENOM: adminToDelete.prenom,
      NOM: adminToDelete.nom,
      EMAIL: adminToDelete.email,
      ROLE: adminToDelete.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur',
      DELETION_DATE: new Date().toLocaleString('fr-FR'),
      DELETER_NAME: `${currentUser.prenom} ${currentUser.nom}`,
      CURRENT_YEAR: new Date().getFullYear()
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminToDelete.email,
      subject: "Votre compte administrateur a été supprimé",
      html: renderTemplate(ADMIN_EMAIL_TEMPLATES.DELETE_ADMIN, emailData)
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: currentUser.email,
      subject: "Notification: Suppression administrateur",
      html: renderTemplate(ADMIN_EMAIL_TEMPLATES.ADMIN_NOTIFICATION, {
        PRENOM: currentUser.prenom,
        NOM: currentUser.nom,
        ACTION_TYPE: 'Suppression administrateur',
        ACTOR_NAME: `${currentUser.prenom} ${currentUser.nom}`,
        ACTOR_EMAIL: currentUser.email,
        ACTION_DATE: new Date().toLocaleString('fr-FR'),
        ACTION_DETAILS: `Suppression du compte ${adminToDelete.email} (${adminToDelete.role})`,
        CURRENT_YEAR: new Date().getFullYear()
      })
    });

    return res.json({
      success: true,
      message: "Administrateur supprimé avec succès"
    });

  } catch (error) {
    console.error("Erreur suppression admin:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'administrateur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



const listerPersonnel = async (req, res) => {
  try {
    const personnel = await Utilisateur.findAll({
      where: {
        role: ['admin', 'super_admin']
      },
      include: [{
        model: Utilisateur,
        as: 'creator',
        attributes: ['id', 'prenom', 'nom', 'email']
      }],
      order: [['created_at', 'DESC']], 
      attributes: ['id', 'prefix', 'prenom', 'nom', 'email', 'role', 'created_at', 'created_by']
    });

    res.status(200).json({
      success: true,
      data: personnel
    });
  } catch (error) {
    console.error('Error listing personnel:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du personnel',
      error: error.message
    });
  }
};






const getActionHistory = async (req, res) => {
  try {
    if (!req.session.utilisateur || req.session.utilisateur.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false,
        message: "Action non autorisée : droits insuffisants" 
      });
    }

    const { adminId } = req.params;
    const { page = 1, limit = 20, actionType } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (adminId) where.admin_id = adminId;
    if (actionType && actionType !== 'all') where.action_type = actionType;

    const history = await HistoriqueAction.findAndCountAll({
      where,
      include: [
        {
          model: Utilisateur,
          as: 'admin',
          attributes: ['prenom', 'nom', 'email'],
          required: false
        },
        {
          model: Utilisateur,
          as: 'target',
          attributes: ['prenom', 'nom', 'email'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    return res.json({
      success: true,
      data: history.rows,
      total: history.count,
      page: parseInt(page),
      totalPages: Math.ceil(history.count / limit)
    });

  } catch (error) {
    console.error("Error fetching action history:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de l'historique",
      error: error.message,
    });
  }
};

module.exports = {
  creerAdmin,
  creerSuperAdmin,
  supprimerAdmin,
  listerPersonnel,
  getActionHistory
};