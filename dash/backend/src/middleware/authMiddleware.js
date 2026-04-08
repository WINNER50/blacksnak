// =============================================
// Authentication Middleware
// =============================================

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query } = require('../config/database');

// Vérifier le token JWT
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant ou invalide'
      });
    }

    const token = authHeader.split(' ')[1];

    // Vérifier le token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Vérifier que l'admin existe toujours
    const result = await query(
      'SELECT id, email, name, role, status FROM admins WHERE id = ?',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Administrateur non trouvé'
      });
    }

    const admin = result.rows[0];

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Compte administrateur désactivé'
      });
    }

    // Attacher l'admin au request
    req.admin = admin;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

// Vérifier les rôles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé - Permissions insuffisantes'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
