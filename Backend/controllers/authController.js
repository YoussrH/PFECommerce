const { Utilisateur, Client } = require("../models");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_TEMPLATES = {
  WELCOME: fs.readFileSync(path.join(__dirname, '../templates/welcome.html'), 'utf8'),
  OTP: fs.readFileSync(path.join(__dirname, '../templates/otp-verification.html'), 'utf8')
};

const genererOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const processTemplate = (template, variables) => {
  let processed = template;
  for (const [key, value] of Object.entries(variables)) {
    processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return processed;
};

const inscrireUtilisateur = async (req, res) => {
  try {
    const { prefix, nom, prenom, email, mot_de_passe, newsletter } = req.body;

    if (!prefix || !nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({ 
        success: false,
        message: "Tous les champs sont obligatoires." 
      });
    }

    const utilisateurExistant = await Utilisateur.findOne({ where: { email } });
    if (utilisateurExistant) {
      return res.status(400).json({ 
        success: false,
        message: "Cet email est déjà utilisé." 
      });
    }

    const motDePasseHache = await bcrypt.hash(mot_de_passe, 10);
    const otp = genererOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000);

    req.session.otp = otp;
    req.session.otpExpires = otpExpires;
    req.session.email = email;
    req.session.donneesInscription = { 
      prefix, 
      nom, 
      prenom, 
      mot_de_passe: motDePasseHache, 
      newsletter 
    };

    const otpEmail = processTemplate(EMAIL_TEMPLATES.OTP, {
      OTP_CODE: otp,
      CURRENT_YEAR: new Date().getFullYear()
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Vérifiez votre email",
      html: otpEmail,
    });

    res.status(201).json({
      success: true,
      message: "OTP envoyé à votre email.",
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      success: false,
      error: "Échec de l'inscription." 
    });
  }
};

const verifierOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const { email, otp: otpSession, otpExpires, donneesInscription } = req.session;

    if (!email || !otpSession || !otpExpires || !donneesInscription) {
      return res.status(400).json({ 
        success: false,
        message: "Session expirée." 
      });
    }

    if (new Date() > otpExpires) {
      return res.status(400).json({ 
        success: false,
        message: "OTP expiré." 
      });
    }

    if (otp !== otpSession) {
      return res.status(400).json({ 
        success: false,
        message: "OTP invalide." 
      });
    }

    const { prefix, nom, prenom, mot_de_passe, newsletter } = donneesInscription;
    const utilisateur = await Utilisateur.create({
      prefix,
      nom,
      prenom,
      email,
      mot_de_passe,
      est_verifie: true,
      newsletter,
    });

    req.session.otp = null;
    req.session.otpExpires = null;
    req.session.donneesInscription = null;
    req.session.email = null;
    
    req.session.utilisateur = {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      est_verifie: utilisateur.est_verifie,
      role: utilisateur.role
    };

    const welcomeEmail = processTemplate(EMAIL_TEMPLATES.WELCOME, {
      PRENOM: prenom,
      NOM: nom,
      LOGIN_URL: `${process.env.FRONTEND_URL}/login`,
      CURRENT_YEAR: new Date().getFullYear()
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Bienvenue sur notre plateforme",
      html: welcomeEmail,
    });

    res.json({
      success: true,
      message: "Inscription réussie.",
      utilisateur: req.session.utilisateur
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ 
      success: false,
      error: "Échec de la vérification OTP." 
    });
  }
};

/* const connecterUtilisateur = async (req, res) => {
  try {
    console.log('Login attempt started for email:', req.body.email);
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: "Email et mot de passe sont obligatoires." 
      });
    }

    console.log('Looking for user in database');
    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) {
      console.log('User not found for email:', email);
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé." 
      });
    }

    console.log('Comparing passwords');
    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      console.log('Password comparison failed');
      return res.status(401).json({ 
        success: false,
        message: "Identifiants invalides." 
      });
    }

    if (!utilisateur.est_verifie) {
      console.log('Account not verified');
      return res.status(403).json({ 
        success: false,
        message: "Compte non vérifié." 
      });
    }

    console.log('Looking for client data');
    const client = await Client.findOne({ where: { utilisateur_id: utilisateur.id } }) || null;

    console.log('Creating session data');
    req.session.utilisateur = {
      id: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      est_verifie: utilisateur.est_verifie,
    };

    req.session.cookie.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
    
    console.log('Saving session');
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        } else {
          console.log('Session saved successfully');
          resolve();
        }
      });
    });

    console.log('Login successful for user:', utilisateur.id);
    res.json({
      success: true,
      message: "Connexion réussie",
      utilisateur: req.session.utilisateur,
      client,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: "Échec de la connexion." 
    });
  }
}; */


const connecterUtilisateur = async (req, res) => {
  try {
    console.log('Login attempt started for email:', req.body.email);
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        success: false,
        message: "Email et mot de passe sont obligatoires." 
      });
    }

    console.log('Looking for user in database');
    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) {
      console.log('User not found for email:', email);
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé." 
      });
    }

    // Add this check for account status
    if (!utilisateur.est_actif) {
      console.log('Account is deactivated');
      return res.status(403).json({ 
        success: false,
        message: "Ce compte a été désactivé. Contactez l'administrateur." 
      });
    }

    console.log('Comparing passwords');
    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      console.log('Password comparison failed');
      return res.status(401).json({ 
        success: false,
        message: "Identifiants invalides." 
      });
    }

    if (!utilisateur.est_verifie) {
      console.log('Account not verified');
      return res.status(403).json({ 
        success: false,
        message: "Compte non vérifié." 
      });
    }

    console.log('Looking for client data');
    const client = await Client.findOne({ where: { utilisateur_id: utilisateur.id } }) || null;

    console.log('Creating session data');
    req.session.utilisateur = {
      id: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      est_verifie: utilisateur.est_verifie,
      est_actif: utilisateur.est_actif // Include account status in session
    };

    req.session.cookie.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
    
    console.log('Saving session');
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          reject(err);
        } else {
          console.log('Session saved successfully');
          resolve();
        }
      });
    });

    console.log('Login successful for user:', utilisateur.id);
    res.json({
      success: true,
      message: "Connexion réussie",
      utilisateur: req.session.utilisateur,
      client,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      error: "Échec de la connexion." 
    });
  }
};
const connecterAdmin = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    if (!["admin", "super_admin"].includes(utilisateur.role)) {
      return res.status(403).json({ 
        success: false,
        message: "Admin privileges required" 
      });
    }

    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (!utilisateur.est_verifie) {
      return res.status(403).json({ 
        success: false,
        message: "Account not verified" 
      });
    }

// Create JWT token
const token = jwt.sign(
  {
    id: utilisateur.id,
    email: utilisateur.email,
    role: utilisateur.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: "8h" }
);

// ===== ADD THESE DEBUG LINES =====
console.log('=== JWT DEBUGGING ===');
console.log('1. Token generated:', token);

// Verify the token can be decoded (sanity check)
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('2. Token successfully decoded:', decoded);
  console.log('3. Token structure valid:', decoded.iat && decoded.exp && decoded.id);
  console.log('4. Token expiration:', new Date(decoded.exp * 1000).toISOString());
} catch (verifyErr) {
  console.error('2. Token verification failed:', verifyErr);
}

// Check token structure
const tokenParts = token.split('.');
console.log('5. Token parts count:', tokenParts.length);
console.log('6. Header:', tokenParts[0]?.length, 'chars');
console.log('7. Payload:', tokenParts[1]?.length, 'chars');
console.log('8. Signature:', tokenParts[2]?.length, 'chars');

// Environment check
console.log('9. JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('10. JWT_SECRET length:', process.env.JWT_SECRET?.length);
// ===== END DEBUG LINES =====

    // Create session data
    req.session.utilisateur = {
      id: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      est_verifie: utilisateur.est_verifie,
      token: token // Store the token in session
    };

    // Ensure session is saved before responding
    await new Promise((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      message: "Admin login successful",
      token: token, // Send token in response
      utilisateur: {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        est_verifie: utilisateur.est_verifie
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ 
      success: false,
      error: "Admin login failed" 
    });
  }
};

const deconnecterUtilisateur = (req, res) => {
  try {
    
    res.clearCookie("mgm_session_id", {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        throw new Error("Session cleanup failed");
      }
      
      res.json({ 
        success: true,
        message: "Déconnexion réussie" 
      });
    });
    
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Échec de la déconnexion"
    });
  }
};

const obtenirUtilisateur = async (req, res) => {
  try {
    if (!req.session.utilisateur) {
      return res.status(401).json({ 
        success: false,
        message: "Non authentifié." 
      });
    }

    const utilisateur = await Utilisateur.findByPk(req.session.utilisateur.id, {
      include: [{
        model: Client,
        as: 'client',
        attributes: { exclude: ['created_at', 'updated_at'] }
      }],
      attributes: { exclude: ['mot_de_passe', 'otp', 'otp_expires'] }
    });

    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      utilisateur 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};
const obtenirUtilisateurParId = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id, {
      attributes: { exclude: ['mot_de_passe', 'otp', 'otp_expires'] }
    });

    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        error: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      utilisateur 
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};
const connecterLivreur = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const utilisateur = await Utilisateur.findOne({ where: { email } });
    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        message: "Livreur not found" 
      });
    }

    if (!["livreur"].includes(utilisateur.role)) {
      return res.status(403).json({ 
        success: false,
        message: "livreur privileges required" 
      });
    }

    const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (!utilisateur.est_verifie) {
      return res.status(403).json({ 
        success: false,
        message: "Account not verified" 
      });
    }

    req.session.utilisateur = {
      id: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      est_verifie: utilisateur.est_verifie,
    };

    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } 
    );

    req.session.save();

    res.json({
      success: true,
      message: "Livreur login successful",
      token, 
      utilisateur: req.session.utilisateur,
    });

  } catch (err) {
    console.error('Livreur login error:', err);
    res.status(500).json({ 
      success: false,
      error: "Livreur login failed" 
    });
  }
};
module.exports = {
  inscrireUtilisateur,
  verifierOTP,
  connecterUtilisateur,
  connecterAdmin,
  deconnecterUtilisateur,
  obtenirUtilisateur,
  connecterLivreur,
  obtenirUtilisateurParId
};