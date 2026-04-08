const express = require('express');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Fonction pour mettre à jour les statuts des tournois expirés et distribuer les gains
const updateTournamentStatuses = async () => {
  try {
    // 1. Trouver les tournois qui viennent d'expirer
    const expiredTournaments = await query(
      "SELECT id, name, prize_pool_usd FROM tournaments WHERE status = 'active' AND end_date < NOW()"
    );

    for (const tournament of expiredTournaments.rows) {
      await transaction(async (client) => {
        // Trouver le gagnant (meilleur score)
        const winnerResult = await client.query(
          `SELECT user_id, score FROM tournament_participants 
           WHERE tournament_id = $1 
           ORDER BY score DESC LIMIT 1`,
          [tournament.id]
        );

        if (winnerResult.rows.length > 0) {
          const winner = winnerResult.rows[0];
          const prize = tournament.prize_pool_usd;

          // Créditer le gagnant
          await client.query(
            "UPDATE users SET balance_usd = balance_usd + $1, total_earnings = total_earnings + $1 WHERE id = $2",
            [prize, winner.user_id]
          );

          // Enregistrer la transaction de gain
          await client.query(
            `INSERT INTO transactions (user_id, type, amount, amount_usd, status, description) 
             VALUES ($1, 'tournament_prize', $2, $2, 'completed', $3)`,
            [winner.user_id, prize, `Prix remporté : ${tournament.name}`]
          );

          // Impact sur le solde système (Débit)
          const sysBalance = await client.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
          const balanceBefore = parseFloat(sysBalance.rows[0].balance);
          await client.query(
            `INSERT INTO system_transactions (type, amount_usd, reason, admin_id, balance_before_usd, balance_after_usd)
             VALUES ('debit', $1, $2, 1, $3, $4)`,
            [prize, `Paiement prix tournoi: ${tournament.name}`, balanceBefore, balanceBefore - parseFloat(prize)]
          );

          // Marquer le gain dans la table des participants
          await client.query(
            "UPDATE tournament_participants SET prize_won_usd = $1 WHERE tournament_id = $2 AND user_id = $3",
            [prize, tournament.id, winner.user_id]
          );
        }

        // Marquer le tournoi comme terminé
        await client.query(
          "UPDATE tournaments SET status = 'completed' WHERE id = $1",
          [tournament.id]
        );
      });
    }
  } catch (error) {
    console.error('Erreur mise à jour automatique des tournois et distribution:', error);
  }
};

// Obtenir tous les tournois (actifs, à venir, terminés)
router.get('/', async (req, res) => {
  try {
    // Mettre à jour les statuts dès qu'on demande la liste
    await updateTournamentStatuses();

    // Si l'utilisateur est connecté, on vérifie sa participation
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          req.userId = decoded.userId;
        }
      } catch (e) {
        // Ignorer l'erreur de token, on continue comme invité
      }
    }

    const result = await query(
      `SELECT 
        t.id, 
        t.name, 
        t.description, 
        t.entry_fee_usd as entryFee, 
        t.prize_pool_usd as prize, 
        t.max_participants as maxPlayers, 
        t.current_participants as currentPlayers,
        t.start_date as startDate, 
        t.end_date as endDate, 
        t.status, 
        t.game_mode as gameMode, 
        t.rules,
        (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as actual_participants
       FROM tournaments t 
       WHERE t.status IN ('active', 'upcoming', 'completed')
       ORDER BY CASE 
         WHEN t.status = 'active' THEN 1 
         WHEN t.status = 'upcoming' THEN 2 
         ELSE 3 
       END, t.start_date ASC`
    );

    // Si l'utilisateur est connecté, on récupère ses participations pour marquer les tournois
    let userParticipations = [];
    if (req.userId) {
      const parts = await query('SELECT tournament_id FROM tournament_participants WHERE user_id = ?', [req.userId]);
      userParticipations = parts.rows.map(p => p.tournament_id);
    }

    // Formater les données pour le frontend
    const mappedTournaments = result.rows.map(t => ({
      ...t,
      currentPlayers: t.actual_participants || 0,
      isParticipating: userParticipations.includes(t.id),
      status: t.status === 'completed' ? 'finished' : t.status,
      leaderboard: [] // Sera chargé à la demande ou via GET /:id
    }));

    res.json({ success: true, data: mappedTournaments });
  } catch (error) {
    console.error('Erreur récupération tournois:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// Obtenir un tournoi spécifique avec son classement
router.get('/:id', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const tournamentResult = await query(
      `SELECT 
        id, 
        name, 
        description, 
        entry_fee_usd as entryFee, 
        prize_pool_usd as prize, 
        max_participants as maxPlayers, 
        current_participants as currentPlayers,
        start_date as startDate, 
        end_date as endDate, 
        status, 
        game_mode as gameMode, 
        rules
       FROM tournaments WHERE id = ?`,
      [tournamentId]
    );

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tournoi non trouvé' });
    }

    const tournament = tournamentResult.rows[0];
    // Mapper 'completed' -> 'finished'
    tournament.status = tournament.status === 'completed' ? 'finished' : tournament.status;

    const leaderboardResult = await query(
      `SELECT tp.score, u.username, u.avatar_url as avatar, tp.prize_won_usd as prize
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.tournament_id = ? 
       ORDER BY tp.score DESC`,
      [tournamentId]
    );

    res.json({
      success: true,
      data: {
        ...tournament,
        leaderboard: leaderboardResult.rows
      }
    });
  } catch (error) {
    console.error('Erreur récupération tournoi:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// S'inscrire à un tournoi
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const { currency } = req.body;
    const tournamentId = req.params.id;

    await transaction(async (client) => {
      // Obtenir les infos du tournoi
      const tournamentResult = await client.query(
        'SELECT * FROM tournaments WHERE id = $1',
        [tournamentId]
      );

      if (tournamentResult.rows.length === 0) {
        throw new Error('Tournoi non trouvé');
      }

      const tournament = tournamentResult.rows[0];

      // Vérifier si déjà inscrit
      const participantCheck = await client.query(
        'SELECT * FROM tournament_participants WHERE tournament_id = $1 AND user_id = $2',
        [tournamentId, req.userId]
      );

      if (participantCheck.rows.length > 0) {
        throw new Error('Déjà inscrit à ce tournoi');
      }

      // Calculer le coût en USD
      const cost = currency === 'USD' ? tournament.entry_fee_usd : tournament.entry_fee_cdf / 2500;

      // Vérifier le solde avec verrouillage (Pessimistic Locking)
      const userResult = await client.query(
        'SELECT balance_usd FROM users WHERE id = $1 FOR UPDATE',
        [req.userId]
      );

      if (parseFloat(userResult.rows[0].balance_usd) < parseFloat(cost)) {
        throw new Error('Solde insuffisant');
      }

      // Déduire les frais
      await client.query(
        'UPDATE users SET balance_usd = balance_usd - $1 WHERE id = $2',
        [cost, req.userId]
      );

      // Inscrire au tournoi (Note: Pas de username/avatar dans cette table dans blacksank.sql)
      await client.query(
        `INSERT INTO tournament_participants (tournament_id, user_id) 
         VALUES ($1, $2)`,
        [tournamentId, req.userId]
      );

      // Enregistrer la transaction pour les revenus admin
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, amount_usd, status, description) 
         VALUES ($1, 'tournament_entry', $2, $2, 'completed', $3)`,
        [req.userId, cost, `Inscription tournoi: ${tournament.name}`]
      );

      // Impact sur le solde système (Crédit plateforme)
      const sysBalance = await client.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
      const balanceBefore = parseFloat(sysBalance.rows[0].balance);
      await client.query(
        `INSERT INTO system_transactions (type, amount_usd, reason, admin_id, balance_before_usd, balance_after_usd)
         VALUES ('credit', $1, $2, 1, $3, $4)`,
        [cost, `Vente ticket tournoi: ${tournament.name}`, balanceBefore, balanceBefore + parseFloat(cost)]
      );

      // Mettre à jour le nombre de participants s'il y a une colonne current_players
      // Sinon, on s'appuie sur le subselect dans le GET /
    });

    res.json({ message: 'Inscription au tournoi réussie' });
  } catch (error) {
    console.error('Erreur inscription tournoi:', error);
    res.status(error.message === 'Tournoi non trouvé' ? 404 : 400).json({ error: error.message || 'Erreur serveur' });
  }
});

// Mettre à jour le score d'un participant
router.post('/:id/score', authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;
    const tournamentId = req.params.id;

    // Mettre à jour le score uniquement s'il est meilleur
    // RETURNING est supporté par notre couche de compatibilité via un SELECT automatique
    const updateResult = await query(
      `UPDATE tournament_participants 
       SET score = ? 
       WHERE tournament_id = ? AND user_id = ? AND score < ?`,
      [score, tournamentId, req.userId, score]
    );

    if (updateResult.affectedRows === 0) {
      // Vérifier si c'est parce que le score était déjà meilleur
      const current = await query('SELECT score FROM tournament_participants WHERE tournament_id = ? AND user_id = ?', [tournamentId, req.userId]);
      if (current.rows.length > 0 && current.rows[0].score >= score) {
        return res.json({ message: 'Score non mis à jour (score actuel meilleur)' });
      }
      return res.status(404).json({ error: 'Participation non trouvée' });
    }

    res.json({ message: 'Score mis à jour', score });
  } catch (error) {
    console.error('Erreur mise à jour score:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
