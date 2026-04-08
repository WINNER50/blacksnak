// =============================================
// Auth Controller
// =============================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const config = require('../config/config');
const { AppError } = require('../middleware/errorHandler');

// POST /api/auth/login - Connexion admin
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new AppError('Email et mot de passe requis', 400);
    }

    // Récupérer l'admin
    const result = await query(
      `SELECT id, email, name, password_hash, role, status 
       FROM admins 
       WHERE email = ?`,
      [email.toLowerCase()]
    );


    if (result.rows.length === 0) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    const admin = result.rows[0];

    // Vérifier le statut
    if (admin.status !== 'active') {
      throw new AppError('Compte désactivé', 403);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      throw new AppError('Email ou mot de passe incorrect', 401);
    }

    // Mettre à jour last_login
    await query(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );


    // Générer le token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Réponse (ne pas envoyer le password_hash)
    delete admin.password_hash;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        admin,
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout - Déconnexion
const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me - Profil actuel
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, email, name, role, status, created_at, last_login
       FROM admins 
       WHERE id = ?`,
      [req.admin.id]
    );


    if (result.rows.length === 0) {
      throw new AppError('Administrateur non trouvé', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh - Rafraîchir le token
const refreshToken = async (req, res, next) => {
  try {
    const token = jwt.sign(
      {
        id: req.admin.id,
        email: req.admin.email,
        role: req.admin.role
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: { token }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe,
  refreshToken,
};
