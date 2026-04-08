const express = require('express');
const cryptoModule = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsapp');
const router = express.Router();

// Générer les tokens
const generateTokens = async (userId, username) => {
  const accessToken = jwt.sign(
    { userId, username },
    process.env.JWT_SECRET || 'blacksnack-default-secret-2026',
    { expiresIn: '24h' }
  );

  const refreshToken = cryptoModule.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours

  // Sauvegarder le refresh token en base
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
};

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { name, username, phone, password } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const userCheck = await query(
      'SELECT * FROM users WHERE username = $1 OR phone = $2',
      [username, phone]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Nom d\'utilisateur ou téléphone déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const result = await query(
      'INSERT INTO users (name, username, phone, password_hash, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, username, phone, hashedPassword, avatar]
    );

    const user = result.rows[0];

    await query('INSERT INTO user_settings (user_id) VALUES ($1)', [user.id]);

    const { accessToken, refreshToken } = await generateTokens(user.id, username);

    res.status(201).json({
      message: 'Inscription réussie',
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        name,
        username,
        phone,
        avatar_url: avatar,
        balance_usd: "0.00",
        balance_cdf: "0.00",
        total_earnings: "0.00"
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR phone = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = result.rows[0];
    const storedHash = user.password_hash || user.password;

    if (!storedHash) throw new Error('Structure DB invalide');

    const isPasswordValid = await bcrypt.compare(password, storedHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const { accessToken, refreshToken } = await generateTokens(user.id, user.username);

    // Supprimer les vieux tokens du même utilisateur (optionnel pour la sécurité)
    // await query('DELETE FROM refresh_tokens WHERE user_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)', [user.id]);

    const safeUser = { ...user };
    delete safeUser.password_hash;
    delete safeUser.password;

    res.json({
      message: 'Connexion réussie',
      token: accessToken,
      refreshToken: refreshToken,
      user: safeUser
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour rafraîchir le token d'accès
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token manquant' });
    }

    const result = await query(
      `SELECT rt.*, u.username 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = ? AND rt.expires_at > CURRENT_TIMESTAMP`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }

    const stored = result.rows[0];

    // Générer un nouvel Access Token
    const accessToken = jwt.sign(
      { userId: stored.user_id, username: stored.username },
      process.env.JWT_SECRET || 'blacksnack-default-secret-2026',
      { expiresIn: '24h' }
    );

    res.json({ token: accessToken });
  } catch (error) {
    console.error('Erreur refresh:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupération de mot de passe via WhatsApp
router.post('/forgot-password', async (req, res) => {
  const { phone } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({ error: 'Le numéro de téléphone est requis' });
    }

    const result = await query(
      'SELECT id, username FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Numéro de téléphone non trouvé' });
    }

    const user = result.rows[0];
    const code = Math.floor(1000000 + Math.random() * 9000000).toString();

    // Sauvegarder le code en base de données
    await query(
      'UPDATE users SET reset_code = $1 WHERE id = $2',
      [code, user.id]
    );

    // Envoyer via WhatsApp
    try {
      await sendWhatsAppMessage(phone, `*CODE BLACKSNACK*\n\nVoici votre code de validation pour réinitialiser votre mot de passe : *${code}*`);
    } catch (wsError) {
      console.error('[AUTH] Erreur envoi WhatsApp:', wsError.message);
      // Simulation pour le logs si Whapi échoue
      console.log(`[AUTH] SIMULATION: Code pour ${phone} est ${code}`);
    }

    res.json({
      message: 'Code de vérification envoyé sur WhatsApp',
      username: user.username
    });
  } catch (error) {
    console.error('[AUTH] Erreur ForgotPassword:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier le code de réinitialisation
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { username, code } = req.body;

    if (!username || !code) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const result = await query(
      'SELECT id FROM users WHERE username = $1 AND reset_code = $2',
      [username, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Code de validation incorrect' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Erreur verify-reset-code:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
  try {
    const { username, newPassword, code } = req.body;

    if (!username || !newPassword || !code) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier à nouveau le code pour la sécurité finale
    const checkCode = await query(
      'SELECT id FROM users WHERE username = $1 AND reset_code = $2',
      [username, code]
    );

    if (checkCode.rows.length === 0) {
      return res.status(400).json({ error: 'Code de validation invalide ou expiré' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et effacer le code de reset
    await query(
      'UPDATE users SET password_hash = $1, reset_code = NULL WHERE username = $2',
      [hashedPassword, username]
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
