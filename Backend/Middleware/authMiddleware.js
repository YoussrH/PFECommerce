const { Utilisateur } = require("../models");
const jwt = require('jsonwebtoken');

const authentifier = async (req, res, next) => {
  try {
    if (req.session.utilisateur) {
      const utilisateur = await Utilisateur.findByPk(req.session.utilisateur.id);
      if (utilisateur) {
        req.utilisateur = utilisateur;
        return next();
      }
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const utilisateur = await Utilisateur.findByPk(decoded.id);
      if (utilisateur) {
        req.utilisateur = utilisateur;
        return next();
      }
    }

    return res.status(401).json({ 
      success: false,
      message: "Authentification requise." 
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur d'authentification." 
    });
  }
};

const verifierAdmin = (req, res, next) => {
  try {
    const user = req.session?.utilisateur || req.utilisateur;
    
    if (user?.role && ["admin", "super_admin"].includes(user.role)) {
      req.utilisateur = user;
      return next();
    }
    
    return res.status(403).json({ 
      success: false,
      message: "Privilèges admin requis." 
    });
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      message: "Session/Token invalide" 
    });
  }
};

const verifierSuperAdmin = (req, res, next) => {
  try {
    const user = req.session?.utilisateur || req.utilisateur;
    
    if (user?.role === 'super_admin') {
      req.utilisateur = user;
      return next();
    }
    
    return res.status(403).json({ 
      success: false,
      message: "Privilèges super administrateur requis" 
    });
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      message: "Session/Token invalide" 
    });
  }
};



const synchroniserTokenPanier = (req, res, next) => {
  // Sync guest token between headers and session
  const guestToken = req.headers['x-guest-token'];
  if (guestToken && !req.utilisateur) {
    req.session.guestToken = guestToken;
  } else if (req.session?.guestToken && !req.headers['x-guest-token'] && !req.utilisateur) {
    res.set('X-Guest-Token', req.session.guestToken);
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    // Check session first
    if (req.session.utilisateur) {
      const utilisateur = await Utilisateur.findByPk(req.session.utilisateur.id);
      if (utilisateur) {
        req.utilisateur = utilisateur;
      }
    }
    
    // Then check JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (token && !req.utilisateur) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const utilisateur = await Utilisateur.findByPk(decoded.id);
      if (utilisateur) {
        req.utilisateur = utilisateur;
      }
    }
    
    // Sync cart token
    synchroniserTokenPanier(req, res, next);
  } catch (error) {
    console.error('Optional auth error:', error);
    synchroniserTokenPanier(req, res, next);
  }
};

const requireAuth = async (req, res, next) => {
  try {
    // Check session first
    if (req.session.utilisateur) {
      const utilisateur = await Utilisateur.findByPk(req.session.utilisateur.id);
      if (utilisateur) {
        req.utilisateur = utilisateur;
        return synchroniserTokenPanier(req, res, next);
      }
    }
    
    // Then check JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const utilisateur = await Utilisateur.findByPk(decoded.id);
      if (utilisateur) {
        req.utilisateur = utilisateur;
        return synchroniserTokenPanier(req, res, next);
      }
    }
    
    return res.status(401).json({ 
      success: false,
      message: "Authentification requise" 
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      error: "Erreur d'authentification" 
    });
  }
};




module.exports = {
  synchroniserTokenPanier,
  optionalAuth,
  requireAuth,
  verifierAdmin,
  verifierSuperAdmin,
    authentifier,

};
