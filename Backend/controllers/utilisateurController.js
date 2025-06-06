// controllers/utilisateurController.js
const { Utilisateur, Client, Livreur } = require("../models");
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db'); // Adjust the path as necessary

/**
 * @desc Get all users with optional filtering and pagination
 * @access Admin/SuperAdmin
 */
const obtenirTousUtilisateurs = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Utilisateur.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['mot_de_passe', 'otp', 'otp_expires', 'code_reinitialisation', 'token_reinitialisation'] }
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération des utilisateurs" 
    });
  }
};

/**
 * @desc Get a single user by ID
 * @access Admin/SuperAdmin or the user themselves
 */
const obtenirUtilisateurParId = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions - admin or the user themselves
    if (req.utilisateur.role === 'client' && req.utilisateur.id !== id) {
      return res.status(403).json({ 
        success: false,
        message: "Non autorisé" 
      });
    }

    const utilisateur = await Utilisateur.findByPk(id, {
      attributes: { exclude: ['mot_de_passe', 'otp', 'otp_expires', 'code_reinitialisation', 'token_reinitialisation'] },
      include: [
        {
          association: 'client',
          attributes: { exclude: ['utilisateur_id'] }
        },
        {
          association: 'livreur',
          attributes: { exclude: ['utilisateur_id'] }
        }
      ]
    });

    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    return res.json({ 
      success: true,
      data: utilisateur 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération de l'utilisateur" 
    });
  }
};

/**
 * @desc Update user details
 * @access Admin/SuperAdmin or the user themselves
 */
const mettreAJourUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check permissions
    if (req.utilisateur.role === 'client' && req.utilisateur.id !== id) {
      return res.status(403).json({ 
        success: false,
        message: "Non autorisé" 
      });
    }

    // Prevent role changes for non-admins
    if (updates.role && !['admin', 'super_admin'].includes(req.utilisateur.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Vous n'êtes pas autorisé à modifier les rôles" 
      });
    }

    const utilisateur = await Utilisateur.findByPk(id);
    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    await utilisateur.update(updates);

    return res.json({ 
      success: true,
      message: "Utilisateur mis à jour avec succès",
      data: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        est_verifie: utilisateur.est_verifie
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la mise à jour de l'utilisateur" 
    });
  }
};

/**
 * @desc Create a delivery person account (Livreur)
 * @access Admin/SuperAdmin
 */

// Configure your email transporter (add this at the top of your file)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * @desc Create a delivery person account (Livreur) and send welcome email
 * @access Admin/SuperAdmin
 */


const creeLivreur = async (req, res) => {
  try {
    const { email, nom, prenom, mot_de_passe, telephone, type_vehicule, plaque_immatriculation } = req.body;

    // Validate required fields
    const requiredFields = ['email', 'nom', 'prenom', 'mot_de_passe', 'telephone', 'type_vehicule', 'plaque_immatriculation'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Champs manquants: ${missingFields.join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await Utilisateur.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Un utilisateur avec cet email existe déjà" 
      });
    }

    // Create the user
    const newUser = await Utilisateur.create({
      email,
      nom,
      prenom,
      mot_de_passe,
      role: 'livreur',
      est_verifie: true,
      created_by: req.utilisateur?.id || null
    });

    // Create livreur profile
    const newLivreur = await Livreur.create({
      utilisateur_id: newUser.id,
      telephone,
      type_vehicule,
      plaque_immatriculation,
      statut: 'actif',
      capacite_max: req.body.capacite_max || 10,
      note_moyenne: req.body.note_moyenne || 5,
      est_certifie: req.body.est_certifie || false
    });

    // Try to send email but don't fail if it doesn't work
    try {
      const templatePath = path.join(__dirname, '../templates/assigner-livreur.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
      
        // Replace template variables
        htmlTemplate = htmlTemplate
        .replace(/{{PRENOM}}/g, prenom)
        .replace(/{{NOM}}/g, nom)
        .replace(/{{EMAIL}}/g, email)
        .replace(/{{MOT_DE_PASSE}}/g, mot_de_passe)
        .replace(/{{TELEPHONE}}/g, telephone)
        .replace(/{{TYPE_VEHICULE}}/g, type_vehicule)
        .replace(/{{PLAQUE_IMMATRICULATION}}/g, plaque_immatriculation)
        .replace(/{{STATUT}}/g, 'actif') // or use newLivreur.statut if different
        .replace(/{{LOGIN_URL}}/g, `${process.env.FRONTEND_URL}/login`)
        .replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear())
        .replace(/{{APP_NAME}}/g, process.env.APP_NAME || 'Votre Application');

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Bienvenue en tant que livreur',
        html: htmlTemplate
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails
    }

    return res.status(201).json({
      success: true,
      message: "Livreur créé avec succès",
      data: {
        utilisateur: {
          id: newUser.id,
          nom: newUser.nom,
          prenom: newUser.prenom,
          email: newUser.email,
          role: newUser.role
        },
        livreur: newLivreur
      }
    });

  } catch (error) {
    console.error('Error creating livreur:', error);
    return res.status(500).json({ 
      success: false,
      message: error.message || "Erreur serveur lors de la création du livreur"
    });
  }
};

/**
 * @desc Get all delivery persons (Livreurs)
 * @access Admin/SuperAdmin
 */
/* const obtenirTousLivreurs = async (req, res) => {
  try {
    const { statut, type_vehicule, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (statut) whereClause.statut = statut;
    if (type_vehicule) whereClause.type_vehicule = type_vehicule;

    const { count, rows } = await Livreur.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'role','est_actif', ]
      }]
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching delivery persons:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération des livreurs" 
    });
  }
}; */

const obtenirTousLivreurs = async (req, res) => {
  try {
    const { statut, type_vehicule, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (statut) whereClause.statut = statut;
    if (type_vehicule) whereClause.type_vehicule = type_vehicule;

    // First get the livreurs
    const { count, rows: livreurs } = await Livreur.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'role', 'est_actif']
      }]
    });

    // Then get delivery counts for each livreur
    const livreursWithCounts = await Promise.all(
      livreurs.map(async (livreur) => {
        const deliveryCount = await sequelize.models.Commande.count({
          where: {
            livreur_id: livreur.utilisateur_id,
            statut: 'livree' // Only count delivered orders
          }
        });
        
        return {
          ...livreur.toJSON(),
          nombre_livraisons: deliveryCount
        };
      })
    );

    return res.json({
      success: true,
      data: livreursWithCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching delivery persons:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération des livreurs" 
    });
  }
};

/**
 * @desc Get a single delivery person by ID
 * @access Admin/SuperAdmin
 */
const obtenirLivreurParId = async (req, res) => {
  try {
    const { id } = req.params;

    const livreur = await Livreur.findOne({
      where: { utilisateur_id: id },
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'role']
      }]
    });

    if (!livreur) {
      return res.status(404).json({ 
        success: false,
        message: "Livreur non trouvé" 
      });
    }

    return res.json({
      success: true,
      data: livreur
    });
  } catch (error) {
    console.error('Error fetching delivery person:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération du livreur" 
    });
  }
};

/**
 * @desc Delete a delivery person
 * @access Admin/SuperAdmin
 */
const supprimerLivreur = async (req, res) => {
  try {
    const { id } = req.params;

    const livreur = await Livreur.findOne({ where: { utilisateur_id: id } });
    if (!livreur) {
      return res.status(404).json({
        success: false,
        message: "Livreur non trouvé"
      });
    }

    // Delete the livreur profile first
    await livreur.destroy();

    // Then delete the associated user
    await Utilisateur.destroy({ where: { id } });

    return res.json({
      success: true,
      message: "Livreur supprimé avec succès"
    });
  } catch (error) {
    console.error('Error deleting delivery person:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression du livreur"
    });
  }
};

/**
 * @desc Update delivery person details
 * @access Admin/SuperAdmin
 */
const mettreAJourLivreur = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const livreur = await Livreur.findByPk(id, {
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'role']
      }]
    });

    if (!livreur) {
      return res.status(404).json({ 
        success: false,
        message: "Livreur non trouvé" 
      });
    }

    await livreur.update(updates);

    return res.json({
      success: true,
      message: "Livreur mis à jour avec succès",
      data: livreur
    });
  } catch (error) {
    console.error('Error updating delivery person:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la mise à jour du livreur" 
    });
  }
};

/**
 * @desc Get all clients
 * @access Admin/SuperAdmin
 */
const obtenirTousClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { '$utilisateur.nom$': { [Op.iLike]: `%${search}%` } },
        { '$utilisateur.prenom$': { [Op.iLike]: `%${search}%` } },
        { '$utilisateur.email$': { [Op.iLike]: `%${search}%` } },
        { telephone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Client.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'role', 'est_verifie', 'est_actif'] // Include est_actif
      }]
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération des clients" 
    });
  }
};

/**
 * @desc Get a single client by ID
 * @access Admin/SuperAdmin or the client themselves
 */
const obtenirClientParId = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.utilisateur.role === 'client' && req.utilisateur.id !== id) {
      return res.status(403).json({ 
        success: false,
        message: "Non autorisé" 
      });
    }

    const client = await Client.findByPk(id, {
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'role', 'est_verifie', 'newsletter']
      }]
    });

    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: "Client non trouvé" 
      });
    }

    return res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération du client" 
    });
  }
};

/**
 * @desc Update client details
 * @access Admin/SuperAdmin or the client themselves
 */
const mettreAJourClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check permissions
    if (req.utilisateur.role === 'client' && req.utilisateur.id !== id) {
      return res.status(403).json({ 
        success: false,
        message: "Non autorisé" 
      });
    }

    const client = await Client.findByPk(id, {
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email', 'role']
      }]
    });

    if (!client) {
      return res.status(404).json({ 
        success: false,
        message: "Client non trouvé" 
      });
    }

    // Update client profile
    await client.update(updates);

    // If updating newsletter preference, update the user table as well
    if (updates.newsletter !== undefined) {
      await client.utilisateur.update({ newsletter: updates.newsletter });
    }

    return res.json({
      success: true,
      message: "Client mis à jour avec succès",
      data: client
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la mise à jour du client" 
    });
  }
};

const obtenirLivreursDisponibles = async (req, res) => {
  try {
    const livreurs = await Livreur.findAll({
      where: { statut: 'actif' },
      include: [{
        association: 'utilisateur',
        attributes: ['id', 'nom', 'prenom', 'email']
      }]
    });

    return res.json({
      success: true,
      data: livreurs
    });
  } catch (error) {
    console.error('Error fetching available delivery persons:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la récupération des livreurs disponibles" 
    });
  }
};
/**
 * @desc Deactivate a user account
 * @access Admin/SuperAdmin
 */
const desactiverUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;
    const { raison } = req.body;

    // Check if user exists
    const utilisateur = await Utilisateur.findByPk(id);
    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    // Can't deactivate yourself
    if (req.utilisateur.id === id) {
      return res.status(400).json({ 
        success: false,
        message: "Vous ne pouvez pas désactiver votre propre compte" 
      });
    }

    // Update user status
    await utilisateur.update({ 
      est_actif: false,
      raison_desactivation: raison || null
    });

    // If it's a delivery person, also update their status
    if (utilisateur.role === 'livreur') {
      await Livreur.update(
        { statut: 'inactif' },
        { where: { utilisateur_id: id } }
      );
    }

    // Send notification email (optional)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: utilisateur.email,
        subject: 'Votre compte a été désactivé',
        html: `
          <p>Bonjour ${utilisateur.prenom},</p>
          <p>Votre compte a été désactivé par un administrateur.</p>
          ${raison ? `<p>Raison: ${raison}</p>` : ''}
          <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send deactivation email:', emailError);
    }

    return res.json({ 
      success: true,
      message: "Compte désactivé avec succès"
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la désactivation du compte" 
    });
  }
};

/**
 * @desc Reactivate a user account
 * @access Admin/SuperAdmin
 */
const reactiverUtilisateur = async (req, res) => {
  try {
    const { id } = req.params;

    const utilisateur = await Utilisateur.findByPk(id);
    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }

    await utilisateur.update({ 
      est_actif: true,
      raison_desactivation: null
    });

    // If it's a delivery person, set them to active
    if (utilisateur.role === 'livreur') {
      await Livreur.update(
        { statut: 'actif' },
        { where: { utilisateur_id: id } }
      );
    }

    // Send reactivation email (optional)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: utilisateur.email,
        subject: 'Votre compte a été réactivé',
        html: `
          <p>Bonjour ${utilisateur.prenom},</p>
          <p>Votre compte a été réactivé par un administrateur.</p>
          <p>Vous pouvez maintenant vous connecter normalement.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send reactivation email:', emailError);
    }

    return res.json({ 
      success: true,
      message: "Compte réactivé avec succès"
    });

  } catch (error) {
    console.error('Error reactivating user:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur lors de la réactivation du compte" 
    });
  }
};

module.exports = {
  obtenirTousUtilisateurs,
  obtenirUtilisateurParId,
  mettreAJourUtilisateur,
  creeLivreur,
  obtenirTousLivreurs,
  mettreAJourLivreur,
  obtenirTousClients,
  obtenirClientParId,
  mettreAJourClient,
  obtenirLivreurParId,
  supprimerLivreur,
  obtenirLivreursDisponibles,
  desactiverUtilisateur,
  reactiverUtilisateur
};