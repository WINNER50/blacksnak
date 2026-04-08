const express = require('express');
const { query } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');
const router = express.Router();

// Upload de la photo de profil (Cloudinary)
router.post('/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const avatarUrl = req.file.path || req.file.secure_url;

    // Mettre à jour dans la base de données
    await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, req.userId]
    );

    console.log(`Avatar mis à jour pour user ${req.userId}: ${avatarUrl}`);

    res.json({ message: 'Photo de profil mise à jour', avatar_url: avatarUrl });
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload: ' + error.message });
  }
});


// Obtenir le profil de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, username, phone, avatar_url, balance_usd, balance_cdf, total_earnings, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les paramètres de l'utilisateur
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      // Créer les paramètres par défaut si inexistants
      await query(
        'INSERT INTO user_settings (user_id) VALUES ($1)',
        [req.userId]
      );
      return res.json({ speed_label: 'Normal', speed_value: 150, speed_multiplier: 1.0 });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour les paramètres
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      phone,
      speed_label = 'Normal',
      speed_value = 150,
      speed_multiplier = 1.0
    } = req.body || {};

    // Mettre à jour les infos de base de l'utilisateur
    if (name || phone) {
      await query(
        'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3',
        [name, phone, req.userId]
      );
    }

    // Convertir en types corrects et s'assurer qu'il n'y a pas d'undefined
    const safeLabel = speed_label !== undefined ? String(speed_label) : 'Normal';
    const safeValue = speed_value !== undefined ? parseInt(speed_value, 10) : 150;
    const safeMultiplier = speed_multiplier !== undefined ? parseFloat(speed_multiplier) : 1.0;

    await query(
      `INSERT INTO user_settings (user_id, speed_label, speed_value, speed_multiplier) 
       VALUES ($1, $2, $3, $4) 
       ON DUPLICATE KEY UPDATE speed_label = VALUES(speed_label), speed_value = VALUES(speed_value), speed_multiplier = VALUES(speed_multiplier)`,
      [req.userId, safeLabel, safeValue, safeMultiplier]
    );

    res.json({ message: 'Paramètres mis à jour', speed_label: safeLabel, speed_value: safeValue, speed_multiplier: safeMultiplier });
  } catch (error) {
    console.error('Erreur mise à jour paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir l'historique des revenus
router.get('/earnings', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM earnings_history WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération revenus:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
