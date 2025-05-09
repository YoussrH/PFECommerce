const { Utilisateur } = require("../models");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const jwt = require('jsonwebtoken');
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const envoyerEmailReinitialisation = async (email, replacements) => {
  const template = fs.readFileSync(
    path.join(__dirname, '../templates/password-reset.html'), 
    'utf8'
  );
  
  let html = template;
  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  await transporter.sendMail({
    from: `MGM <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html
  });
};

const motDePasseOublie = async (req, res) => {
  try {
    const { email } = req.body;
    const utilisateur = await Utilisateur.findOne({ where: { email } });

    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun compte associé à cet email." 
      });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jwt.sign(
      { userId: utilisateur.id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    await utilisateur.update({
      token_reinitialisation: token,
      code_reinitialisation: resetCode,
      expiration_token_reinitialisation: new Date(Date.now() + 3600000)
    });

    await envoyerEmailReinitialisation(email, {
      PRENOM: utilisateur.prenom,
      NOM: utilisateur.nom,
      RESET_CODE: resetCode,
      RESET_LINK: `${process.env.FRONTEND_URL}/auth?mode=reset&token=${token}`,
      CURRENT_YEAR: new Date().getFullYear()
    });

    res.json({ 
      success: true,
      message: "Email de réinitialisation envoyé avec succès.",
      code: resetCode
    });
  } catch (err) {
    console.error('Erreur motDePasseOublie:', err);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors de la demande de réinitialisation" 
    });
  }
};

const verifierCodeReinitialisation = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const utilisateur = await Utilisateur.findOne({ where: { email } });

    if (!utilisateur) {
      return res.status(404).json({ 
        success: false,
        error: "Aucun compte associé à cet email." 
      });
    }

    if (!utilisateur.code_reinitialisation || !utilisateur.expiration_token_reinitialisation) {
      return res.status(400).json({ 
        success: false,
        error: "Aucune demande de réinitialisation en cours." 
      });
    }

    if (new Date() > utilisateur.expiration_token_reinitialisation) {
      return res.status(400).json({ 
        success: false,
        error: "Le code de réinitialisation a expiré." 
      });
    }

    if (code !== utilisateur.code_reinitialisation) {
      return res.status(400).json({ 
        success: false,
        error: "Code de réinitialisation invalide." 
      });
    }

    
    res.json({ 
      success: true,
      message: "Code vérifié avec succès.",
      token: utilisateur.token_reinitialisation
    });

  } catch (err) {
    console.error('Erreur verification:', err);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors de la vérification du code" 
    });
  }
};

const reinitialiserMotDePasse = async (req, res) => {
  try {
    const { token, nouveau_mot_de_passe } = req.body;
    
    console.log('\n=== STARTING PASSWORD RESET ===');
    console.log('Incoming token:', token);
    console.log('Current time:', new Date());

    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('\nJWT decoded successfully:', {
        userId: decoded.userId,
        purpose: decoded.purpose,
        issuedAt: new Date(decoded.iat * 1000),
        expiresAt: new Date(decoded.exp * 1000)
      });
    } catch (jwtError) {
      console.error('\nJWT VERIFICATION FAILED:', jwtError.message);
      return res.status(401).json({ 
        success: false,
        error: `JWT Error: ${jwtError.message}` 
      });
    }

   
    const utilisateur = await Utilisateur.findOne({
      where: { id: decoded.userId },
      attributes: ['id', 'token_reinitialisation', 'expiration_token_reinitialisation']
    });

    if (!utilisateur) {
      console.error('\nUSER NOT FOUND FOR ID:', decoded.userId);
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    console.log('\nDATABASE TOKEN STATE:', {
      storedToken: utilisateur.token_reinitialisation,
      storedExpiration: utilisateur.expiration_token_reinitialisation,
      tokenMatches: utilisateur.token_reinitialisation === token,
      currentTime: new Date(),
      tokenValid: new Date() < new Date(utilisateur.expiration_token_reinitialisation)
    });

    
    if (utilisateur.token_reinitialisation !== token) {
      console.error('\nTOKEN MISMATCH:', {
        dbToken: utilisateur.token_reinitialisation,
        receivedToken: token
      });
      return res.status(401).json({ 
        success: false,
        error: "Token mismatch with database record" 
      });
    }

    if (new Date() > new Date(utilisateur.expiration_token_reinitialisation)) {
      console.error('\nTOKEN EXPIRED:', {
        now: new Date(),
        expires: utilisateur.expiration_token_reinitialisation
      });
      return res.status(401).json({ 
        success: false,
        error: "Token expired" 
      });
    }

   
    await utilisateur.update({
      mot_de_passe: await bcrypt.hash(nouveau_mot_de_passe, 10),
      token_reinitialisation: null,
      code_reinitialisation: null,
      expiration_token_reinitialisation: null
    });

    console.log('\nPASSWORD RESET SUCCESSFUL FOR USER:', utilisateur.id);
    return res.json({ 
      success: true,
      message: "Password reset successfully" 
    });

  } catch (error) {
    console.error('\nFINAL CATCH ERROR:', error);
    return res.status(500).json({ 
      success: false,
      error: "Server error during password reset" 
    });
  }
};

const changerMotDePasse = async (req, res) => {
  try {
    // Get user from request (added by auth middleware)
    const utilisateur = req.utilisateur;
    
    // Get passwords from body
    const { motDePasseActuel, nouveauMotDePasse } = req.body;

    // Validate input
    if (!motDePasseActuel || !nouveauMotDePasse) {
      return res.status(400).json({
        success: false,
        error: "Veuillez fournir le mot de passe actuel et le nouveau mot de passe"
      });
    }

    if (motDePasseActuel === nouveauMotDePasse) {
      return res.status(400).json({
        success: false,
        error: "Le nouveau mot de passe doit être différent de l'actuel"
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      motDePasseActuel,
      utilisateur.mot_de_passe
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Mot de passe actuel incorrect"
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(nouveauMotDePasse, 10);
    await utilisateur.update({
      mot_de_passe: hashedPassword,
      token_reinitialisation: null,
      code_reinitialisation: null,
      expiration_token_reinitialisation: null
    });

    // Send confirmation email (optional)
    try {
      await transporter.sendMail({
        from: `MGM <${process.env.EMAIL_USER}>`,
        to: utilisateur.email,
        subject: "Confirmation de changement de mot de passe",
        html: `
          <p>Bonjour ${utilisateur.prenom},</p>
          <p>Votre mot de passe a été modifié avec succès.</p>
          <p>Si vous n'avez pas effectué cette action, veuillez contacter immédiatement notre support.</p>
          <p>Merci,<br>L'équipe MGM</p>
        `
      });
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email de confirmation:", emailError);
    }

    return res.json({
      success: true,
      message: "Mot de passe changé avec succès"
    });

  } catch (error) {
    console.error('Erreur dans changerMotDePasse:', error);
    return res.status(500).json({
      success: false,
      error: "Erreur lors du changement de mot de passe"
    });
  }
};
module.exports = {
  motDePasseOublie,
  verifierCodeReinitialisation,
  reinitialiserMotDePasse,
  changerMotDePasse
  
};