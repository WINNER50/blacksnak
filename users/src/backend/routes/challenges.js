const express = require('express');
const { query, transaction } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Créer un défi
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { prize } = req.body; // Le front envoie 'prize'

    if (!prize || prize < 2 || prize > 1000) {
      return res.status(400).json({ error: 'Le montant du défi doit être entre 2$ et 1000$' });
    }

    const result = await transaction(async (client) => {
      // Obtenir les infos de l'utilisateur avec verrouillage pour éviter les race conditions
      const userResult = await client.query(
        'SELECT balance_usd FROM users WHERE id = $1 FOR UPDATE',
        [req.userId]
      );

      const currentBalance = parseFloat(userResult.rows[0].balance_usd);
      const betAmount = parseFloat(prize);

      if (currentBalance < betAmount) {
        throw new Error('Solde insuffisant');
      }

      // Déduire la mise immédiatement du créateur
      await client.query(
        'UPDATE users SET balance_usd = balance_usd - $1 WHERE id = $2',
        [betAmount, req.userId]
      );

      // Créer le défi
      const challengeResult = await client.query(
        `INSERT INTO challenges (creator_id, bet_amount_usd, challenge_type, status) 
         VALUES ($1, $2, '1v1', 'pending') RETURNING *`,
        [req.userId, betAmount]
      );

      // Enregistrer la transaction de mise
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, amount_usd, status, description) 
         VALUES ($1, 'challenge_bet', $2, $2, 'completed', $3)`,
        [req.userId, betAmount, `Mise défi PvP (Création)`]
      );

      return challengeResult.rows[0];
    });

    res.status(201).json({
      message: 'Défi créé avec succès. La mise a été réservée.',
      challenge: result
    });
  } catch (error) {
    console.error('Erreur création défi:', error.message);
    res.status(error.message === 'Solde insuffisant' ? 400 : 500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Obtenir tous les défis disponibles (PvP)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // On JOIN avec users pour récupérer les infos du créateur (nom, avatar)
    const result = await query(
      `SELECT c.*, u.username as creator_username, u.avatar_url as creator_avatar 
       FROM challenges c
       JOIN users u ON c.creator_id = u.id
       WHERE c.status = 'pending' AND c.creator_id != $1
       ORDER BY c.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération défis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les templates de défis solo (Défis Dynamiques Admin)
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM personal_challenge_templates WHERE is_active = TRUE ORDER BY entry_fee_usd ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération templates défis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir le classement pour un template de défi spécifique
router.get('/templates/:id/leaderboard', authMiddleware, async (req, res) => {
  try {
    const templateId = req.params.id;
    const result = await query(
      `SELECT pc.score, u.username, u.avatar_url as avatar
       FROM personal_challenges pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.template_id = ? AND pc.status = 'won'
       ORDER BY pc.score DESC
       LIMIT 50`,
      [templateId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur récupération classement défi:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Démarrer un défi solo avec un template
router.post('/solo', authMiddleware, async (req, res) => {
  try {
    const { templateId, multiplier } = req.body;
    const speedMult = multiplier ? parseFloat(multiplier) : 1.0;

    await transaction(async (client) => {
      // Vérifier le template
      const templateResult = await client.query(
        'SELECT * FROM personal_challenge_templates WHERE id = $1 AND is_active = TRUE',
        [templateId]
      );

      if (templateResult.rows.length === 0) {
        throw new Error('Défi non trouvé ou inactif');
      }

      const template = templateResult.rows[0];

      // Vérifier le solde avec verrouillage
      const userResult = await client.query(
        'SELECT balance_usd FROM users WHERE id = $1 FOR UPDATE',
        [req.userId]
      );

      if (parseFloat(userResult.rows[0].balance_usd) < parseFloat(template.entry_fee_usd)) {
        throw new Error('Solde insuffisant');
      }

      // Débiter l'utilisateur
      await client.query(
        'UPDATE users SET balance_usd = balance_usd - $1 WHERE id = $2',
        [template.entry_fee_usd, req.userId]
      );

      // Créer l'entrée du défi solo avec le multiplicateur
      const result = await client.query(
        `INSERT INTO personal_challenges (user_id, template_id, bet_amount, target_score, multiplier, status) 
         VALUES ($1, $2, $3, $4, $5, 'ongoing') RETURNING *`,
        [req.userId, templateId, template.entry_fee_usd, template.target_score, speedMult]
      );

      // Enregistrer la transaction pour les revenus admin
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, amount_usd, status, description) 
         VALUES ($1, 'challenge_bet', $2, $2, 'completed', $3)`,
        [req.userId, template.entry_fee_usd, `Ticket défi: ${template.title} (Vitesse: x${speedMult})`]
      );

      // Impact sur le solde système (Crédit plateforme)
      const sysBalance = await client.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
      const balanceBefore = parseFloat(sysBalance.rows[0].balance);
      await client.query(
        `INSERT INTO system_transactions (type, amount_usd, reason, admin_id, balance_before_usd, balance_after_usd)
         VALUES ('credit', $1, $2, 1, $3, $4)`,
        [template.entry_fee_usd, `Vente ticket défi: ${template.title}`, balanceBefore, balanceBefore + parseFloat(template.entry_fee_usd)]
      );

      res.status(201).json({
        message: 'Défi démarré',
        challenge: {
          id: result.rows[0].id,
          target: template.target_score,
          timeLimit: template.time_limit_seconds,
          potential: (parseFloat(template.prize_usd) * speedMult).toFixed(2),
          multiplier: speedMult
        }
      });
    });
  } catch (error) {
    console.error('Erreur démarrage défi solo:', error);
    res.status(400).json({ error: error.message || 'Erreur serveur' });
  }
});

// Soumettre un score pour un défi solo
router.post('/solo/:id/score', authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
    const challengeId = req.params.id;

    await transaction(async (client) => {
      // Obtenir le défi
      const challengeResult = await client.query(
        'SELECT pc.*, pct.prize_usd, pct.time_limit_seconds FROM personal_challenges pc JOIN personal_challenge_templates pct ON pc.template_id = pct.id WHERE pc.id = $1 AND pc.user_id = $2',
        [challengeId, req.userId]
      );

      if (challengeResult.rows.length === 0) {
        throw new Error('Défi non trouvé');
      }

      const challenge = challengeResult.rows[0];

      if (challenge.status !== 'ongoing') {
        throw new Error('Défi déjà terminé');
      }

      const won = parseFloat(score) >= parseFloat(challenge.target_score);
      // Appliquer le multiplicateur au prix de base
      const multiplier = parseFloat(challenge.multiplier || 1.0);
      const earnings = won ? (parseFloat(challenge.prize_usd) * multiplier) : 0;
      const status = won ? 'won' : 'lost';

      // Mettre à jour le défi
      await client.query(
        'UPDATE personal_challenges SET score = $1, status = $2, earnings = $3, completed_at = NOW() WHERE id = $4',
        [score, status, earnings, challengeId]
      );

      // Créditer si gagné
      if (won) {
        await client.query(
          'UPDATE users SET balance_usd = balance_usd + $1, total_earnings = total_earnings + $1 WHERE id = $2',
          [earnings, req.userId]
        );

        // Historique des revenus
        await client.query(
          'INSERT INTO earnings_history (user_id, source, amount, description) VALUES ($1, $2, $3, $4)',
          [req.userId, 'solo_challenge', earnings, `Défi solo gagné: ${challenge.score}/${challenge.target_score} (x${multiplier})`]
        );
      }

      res.json({
        status,
        score,
        earnings: earnings.toFixed(2),
        message: won ? 'Félicitations ! Vous avez gagné.' : 'Désolé, objectif non atteint.'
      });
    });
  } catch (error) {
    console.error('Erreur soumission score solo:', error);
    res.status(400).json({ error: error.message || 'Erreur serveur' });
  }
});

// Obtenir les défis de l'utilisateur
router.get('/my-challenges', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
        u1.username as creator_username, u1.avatar_url as creator_avatar,
        u2.username as opponent_username, u2.avatar_url as opponent_avatar
       FROM challenges c
       JOIN users u1 ON c.creator_id = u1.id
       LEFT JOIN users u2 ON c.opponent_id = u2.id
       WHERE c.creator_id = $1 OR c.opponent_id = $1
       ORDER BY c.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération mes défis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Accepter un défi
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const challengeId = req.params.id;

    await transaction(async (client) => {
      // Obtenir le défi avec verrouillage
      const challengeResult = await client.query(
        'SELECT * FROM challenges WHERE id = $1 FOR UPDATE',
        [challengeId]
      );

      if (challengeResult.rows.length === 0) {
        throw new Error('Défi non trouvé');
      }

      const challenge = challengeResult.rows[0];

      if (challenge.status !== 'pending') {
        throw new Error('Défi déjà accepté ou terminé');
      }

      if (challenge.creator_id === req.userId) {
        throw new Error('Vous ne pouvez pas accepter votre propre défi');
      }

      // Vérifier le solde de l'opposant avec verrouillage
      const userResult = await client.query(
        'SELECT balance_usd FROM users WHERE id = $1 FOR UPDATE',
        [req.userId]
      );

      const betAmount = parseFloat(challenge.bet_amount_usd);
      if (parseFloat(userResult.rows[0].balance_usd) < betAmount) {
        throw new Error('Solde insuffisant');
      }

      // Déduire la mise pour l'opposant uniquement (le créateur a été débité à la création)
      await client.query(
        'UPDATE users SET balance_usd = balance_usd - $1 WHERE id = $2',
        [betAmount, req.userId]
      );

      // Enregistrer la transaction de mise
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, amount_usd, status, description) 
         VALUES ($1, 'challenge_bet', $2, $2, 'completed', $3)`,
        [req.userId, betAmount, `Mise défi PvP (Acceptation)`]
      );

      // Mettre à jour le défi
      await client.query(
        `UPDATE challenges 
         SET opponent_id = $1, status = 'accepted', accepted_at = NOW() 
         WHERE id = $2`,
        [req.userId, challengeId]
      );
    });

    res.json({ message: 'Défi accepté avec succès' });
  } catch (error) {
    console.error('Erreur acceptation défi:', error);
    res.status(error.message === 'Défi non trouvé' ? 404 : 400).json({ error: error.message || 'Erreur serveur' });
  }
});

// Soumettre un score pour un défi
router.post('/:id/score', authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
    const challengeId = req.params.id;

    await transaction(async (client) => {
      // Obtenir le défi
      const challengeResult = await client.query(
        'SELECT * FROM challenges WHERE id = $1',
        [challengeId]
      );

      if (challengeResult.rows.length === 0) {
        throw new Error('Défi non trouvé');
      }

      const challenge = challengeResult.rows[0];

      // Vérifier que l'utilisateur participe au défi
      if (challenge.creator_id !== req.userId && challenge.opponent_id !== req.userId) {
        throw new Error('Vous ne participez pas à ce défi');
      }

      // Mettre à jour le score
      if (challenge.creator_id === req.userId) {
        await client.query(
          'UPDATE challenges SET creator_score = $1 WHERE id = $2',
          [score, challengeId]
        );
      } else {
        await client.query(
          'UPDATE challenges SET opponent_score = $1 WHERE id = $2',
          [score, challengeId]
        );
      }

      // Vérifier si les deux ont joué (Note: On s'appuie sur le fait que score > 0 ou un autre flag)
      // On recharge le défi après l'update du score
      const updatedChallengeResult = await client.query(
        'SELECT * FROM challenges WHERE id = $1',
        [challengeId]
      );
      const updated = updatedChallengeResult.rows[0];

      if (updated.creator_score > 0 && updated.opponent_score > 0) {
        // Déterminer le gagnant
        const winnerId = updated.creator_score > updated.opponent_score
          ? updated.creator_id
          : updated.opponent_id;

        const winAmount = parseFloat(updated.bet_amount_usd) * 2;

        // Mettre à jour le défi
        await client.query(
          'UPDATE challenges SET status = $1, winner_id = $2, completed_at = NOW() WHERE id = $3',
          ['completed', winnerId, challengeId]
        );

        // Créditer le gagnant
        await client.query(
          'UPDATE users SET balance_usd = balance_usd + $1, total_earnings = total_earnings + $2 WHERE id = $3',
          [winAmount, updated.bet_amount_usd, winnerId]
        );

        // Ajouter à l'historique des revenus
        await client.query(
          'INSERT INTO earnings_history (user_id, source, amount, description) VALUES ($1, $2, $3, $4)',
          [winnerId, 'challenge', updated.bet_amount_usd, `Défi gagné`]
        );
      }
    });

    res.json({ message: 'Score enregistré' });
  } catch (error) {
    console.error('Erreur soumission score:', error);
    res.status(400).json({ error: error.message || 'Erreur serveur' });
  }
});

module.exports = router;
