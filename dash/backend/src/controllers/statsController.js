// =============================================
// Stats Controller
// =============================================

const { query, transaction } = require('../config/database');
const rechargeController = require('./rechargeController');


const syncHistoricalData = async () => {
  try {
    // 1. Créer les transactions d'inscription manquantes (type tournament_entry)
    const missingEntriesResult = await query(`
      SELECT tp.user_id, t.entry_fee_usd, t.name, tp.joined_at, tp.tournament_id
      FROM tournament_participants tp
      JOIN tournaments t ON tp.tournament_id = t.id
      LEFT JOIN transactions trans ON tp.user_id = trans.user_id 
           AND trans.type = 'tournament_entry' 
           AND ABS(TIMESTAMPDIFF(SECOND, trans.created_at, tp.joined_at)) < 600
      WHERE trans.id IS NULL
    `);

    for (const entry of missingEntriesResult.rows) {
      console.log(`Synchronisation inscription: User ${entry.user_id} -> Tournoi ${entry.tournament_id}`);
      await transaction(async (client) => {
        // Transaction utilisateur
        await client.query(
          "INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, created_at) VALUES (?, 'tournament_entry', ?, ?, 'USD', 'completed', ?, ?)",
          [entry.user_id, entry.entry_fee_usd, entry.entry_fee_usd, `Inscription retroactive: ${entry.name}`, entry.joined_at]
        );

        // Transaction système (Revenu plateforme)
        const sysBalanceRes = await client.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
        const balanceBefore = parseFloat(sysBalanceRes.rows[0].balance || 0);
        await client.query(
          "INSERT INTO system_transactions (type, amount_usd, reason, admin_id, balance_before_usd, balance_after_usd, created_at) VALUES ('credit', ?, ?, 1, ?, ?, ?)",
          [entry.entry_fee_usd, `Revenu tournoi: ${entry.name}`, balanceBefore, balanceBefore + parseFloat(entry.entry_fee_usd), entry.joined_at]
        );
      });
    }

    // 2. Récompenser les tournois terminés qui n'ont pas distribué de prix
    const unpaidTournamentsResult = await query(`
      SELECT t.id, t.name, t.prize_pool_usd 
      FROM tournaments t
      WHERE (t.status = 'completed' OR t.end_date < NOW())
      AND NOT EXISTS (
        SELECT 1 FROM tournament_participants tp WHERE tp.tournament_id = t.id AND tp.prize_won_usd > 0
      )
    `);

    for (const t of unpaidTournamentsResult.rows) {
      const winnerRes = await query(
        "SELECT user_id, score FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC, joined_at ASC LIMIT 1",
        [t.id]
      );

      if (winnerRes.rows.length > 0) {
        const winner = winnerRes.rows[0];
        const prize = parseFloat(t.prize_pool_usd);
        console.log(`Distribution prix tournoi ${t.id}: Winner ${winner.user_id}, Prize ${prize}`);

        await transaction(async (client) => {
          // Créditer le gagnant
          await client.query(
            "UPDATE users SET balance_usd = balance_usd + ?, total_earnings = total_earnings + ? WHERE id = ?",
            [prize, prize, winner.user_id]
          );

          // Transaction utilisateur
          await client.query(
            "INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description) VALUES (?, 'tournament_prize', ?, ?, 'USD', 'completed', ?)",
            [winner.user_id, prize, prize, `Prix retroactive : ${t.name}`]
          );

          // Transaction système (Débit plateforme)
          const sysBalanceRes = await client.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
          const balanceBefore = parseFloat(sysBalanceRes.rows[0].balance || 0);
          await client.query(
            "INSERT INTO system_transactions (type, amount_usd, reason, admin_id, balance_before_usd, balance_after_usd) VALUES ('debit', ?, ?, 1, ?, ?)",
            [prize, `Paiement prix tournoi: ${t.name}`, balanceBefore, balanceBefore - prize]
          );

          await client.query(
            "UPDATE tournament_participants SET prize_won_usd = ? WHERE tournament_id = ? AND user_id = ?",
            [prize, t.id, winner.user_id]
          );

          await client.query("UPDATE tournaments SET status = 'completed', winner_id = ? WHERE id = ?", [winner.user_id, t.id]);
        });
      } else {
        await query("UPDATE tournaments SET status = 'completed' WHERE id = ?", [t.id]);
      }
    }
  } catch (error) {
    console.error('Erreur synchronisation historique:', error);
  }
};


// GET /api/stats/revenue-30days - Revenus et pertes des 30 derniers jours
const getRevenue30Days = async (req, res, next) => {
  try {
    // Synchroniser les données
    await syncHistoricalData();

    const queryText = `
      WITH RECURSIVE dates AS (
        SELECT CURRENT_DATE as date
        UNION ALL
        SELECT date - INTERVAL 1 DAY
        FROM dates
        WHERE date > CURRENT_DATE - INTERVAL 29 DAY
      ),
      tournament_revenue AS (
        SELECT 
          DATE(t.created_at) as date,
          SUM(t.amount_usd) as amount
        FROM transactions t
        WHERE t.type = 'tournament_entry'
          AND t.created_at >= CURRENT_DATE - INTERVAL 29 DAY
          AND t.status = 'completed'
        GROUP BY DATE(t.created_at)
      ),
      challenge_revenue AS (
        SELECT 
          DATE(t.created_at) as date,
          SUM(t.amount_usd) as amount
        FROM transactions t
        WHERE t.type = 'challenge_bet'
          AND t.created_at >= CURRENT_DATE - INTERVAL 29 DAY
          AND t.status = 'completed'
        GROUP BY DATE(t.created_at)
      ),
      losses AS (
        SELECT 
          DATE(t.created_at) as date,
          SUM(t.amount_usd) as amount
        FROM transactions t
        WHERE t.type IN ('tournament_prize', 'challenge_prize')
          AND t.created_at >= CURRENT_DATE - INTERVAL 29 DAY
          AND t.status = 'completed'
        GROUP BY DATE(t.created_at)
      )
      SELECT 
        d.date,
        COALESCE(tr.amount, 0) + COALESCE(cr.amount, 0) as revenue,
        COALESCE(l.amount, 0) as loss
      FROM dates d
      LEFT JOIN tournament_revenue tr ON d.date = tr.date
      LEFT JOIN challenge_revenue cr ON d.date = cr.date
      LEFT JOIN losses l ON d.date = l.date
      ORDER BY d.date ASC;
    `;

    const result = await query(queryText);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue || 0),
        loss: parseFloat(row.loss || 0)
      }))
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/stats/global - Statistiques globales pour le dashboard
const getGlobalStats = async (req, res, next) => {
  try {
    // 0. Synchroniser les données (inclut la clôture des tournois et la distribution des prix)
    await syncHistoricalData();

    // 1. Total Joueurs
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    const usersToday = await query('SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY');

    // 2. Revenus Totaux
    const revenueResult = await query(`
      SELECT SUM(total) as amount FROM (
        SELECT SUM(amount_usd) as total FROM transactions WHERE type = 'tournament_entry' AND status = 'completed'
        UNION ALL
        SELECT SUM(amount_usd) as total FROM transactions WHERE type = 'challenge_bet' AND status = 'completed'
      ) as sub
    `);

    // 3. Tournois Actifs
    const tournamentsActive = await query("SELECT COUNT(*) as count FROM tournaments WHERE status = 'active'");
    const tournamentsTotal = await query("SELECT COUNT(*) as count FROM tournaments");

    // 4. Parties Aujourd'hui
    const gamesToday = await query("SELECT COUNT(*) as count FROM game_history WHERE created_at >= NOW() - INTERVAL 1 DAY");

    // 5. Données détaillées des tournois actifs pour le dashboard
    const activeTournamentsData = await query(`
      SELECT t.*, 
             (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as current_participants 
      FROM tournaments t 
      WHERE t.status = 'active'
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(usersCount.rows[0].count),
        usersChange: parseInt(usersToday.rows[0].count),
        totalRevenue: parseFloat(revenueResult.rows[0].amount || 0),
        revenueChange: 0,
        activeTournaments: parseInt(tournamentsActive.rows[0].count),
        totalTournaments: parseInt(tournamentsTotal.rows[0].count),
        todayGames: parseInt(gamesToday.rows[0].count),
        gamesChange: 0,
        activeTournamentsData: activeTournamentsData.rows
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/recent-transactions
const getRecentTransactions = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT t.*, u.username 
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC 
      LIMIT 10
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/recent-users
const getRecentUsers = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT 10');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};



// GET /api/stats/revenue-7days - Revenus et pertes des 7 derniers jours
const getRevenue7Days = async (req, res, next) => {
  try {
    // Synchroniser les données avant de répondre
    await syncHistoricalData();

    const queryText = `
      WITH RECURSIVE dates AS (
        SELECT CURRENT_DATE as date
        UNION ALL
        SELECT date - INTERVAL 1 DAY
        FROM dates
        WHERE date > CURRENT_DATE - INTERVAL 6 DAY
      ),
      tournament_revenue AS (
        SELECT 
          DATE(t.created_at) as date,
          SUM(t.amount_usd) as amount
        FROM transactions t
        WHERE t.type = 'tournament_entry'
          AND t.created_at >= CURRENT_DATE - INTERVAL 6 DAY
          AND t.status = 'completed'
        GROUP BY DATE(t.created_at)
      ),
      challenge_revenue AS (
        SELECT 
          DATE(t.created_at) as date,
          SUM(t.amount_usd) as amount
        FROM transactions t
        WHERE t.type = 'challenge_bet'
          AND t.created_at >= CURRENT_DATE - INTERVAL 6 DAY
          AND t.status = 'completed'
        GROUP BY DATE(t.created_at)
      )
      SELECT 
        d.date,
        COALESCE(tr.amount, 0) as tournamentFees,
        COALESCE(cr.amount, 0) as challengeFees,
        0 as subscriptions,
        COALESCE(tr.amount, 0) + COALESCE(cr.amount, 0) as total
      FROM dates d
      LEFT JOIN tournament_revenue tr ON d.date = tr.date
      LEFT JOIN challenge_revenue cr ON d.date = cr.date
      ORDER BY d.date ASC;
    `;

    // 2. Récupérer les données
    const result = await query(queryText);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        date: row.date,
        tournamentFees: parseFloat(row.tournamentFees || 0),
        challengeFees: parseFloat(row.challengeFees || 0),
        subscriptions: parseFloat(row.subscriptions || 0),
        total: parseFloat(row.total || 0)
      }))
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/stats/advanced - Statistiques avancées (ARR, LTV, Conversion, Tops)
const getAdvancedStats = async (req, res, next) => {
  try {
    // 1. ARR (Annual Recurring Revenue) - Basé sur les 30 derniers jours
    const revenue30d = await query(`
      SELECT SUM(amount_usd) as total 
      FROM transactions 
      WHERE type IN ('tournament_entry', 'challenge_bet') 
        AND status = 'completed' 
        AND created_at >= NOW() - INTERVAL 30 DAY
    `);

    // ARR Précédent (pour le calcul du %)
    const revenuePrev30d = await query(`
      SELECT SUM(amount_usd) as total 
      FROM transactions 
      WHERE type IN ('tournament_entry', 'challenge_bet') 
        AND status = 'completed' 
        AND created_at BETWEEN NOW() - INTERVAL 60 DAY AND NOW() - INTERVAL 30 DAY
    `);

    const monthlyRevenue = parseFloat(revenue30d.rows[0].total || 0);
    const prevMonthlyRevenue = parseFloat(revenuePrev30d.rows[0].total || 0);
    const arr = monthlyRevenue * 12;
    const arrChange = prevMonthlyRevenue > 0 ? ((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100 : 0;

    // 2. LTV Moyen (Lifetime Value) - Revenu total / Nombre de déposants unique
    const totalRevResult = await query(`
      SELECT SUM(amount_usd) as total 
      FROM transactions 
      WHERE type IN ('tournament_entry', 'challenge_bet') 
        AND status = 'completed'
    `);
    const depositorsCount = await query(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM transactions 
      WHERE type = 'deposit' AND status = 'completed'
    `);
    const totalRev = parseFloat(totalRevResult.rows[0].total || 0);
    const uniqueDepositors = parseInt(depositorsCount.rows[0].count || 0);
    const ltv = uniqueDepositors > 0 ? totalRev / uniqueDepositors : 0;

    // LTV Précédent (estimation simple basé sur le mois dernier)
    const prevTotalRevResult = await query(`
        SELECT SUM(amount_usd) as total 
        FROM transactions 
        WHERE type IN ('tournament_entry', 'challenge_bet') 
          AND status = 'completed'
          AND created_at < NOW() - INTERVAL 30 DAY
      `);
    const prevDepositorsCount = await query(`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM transactions 
        WHERE type = 'deposit' AND status = 'completed'
        AND created_at < NOW() - INTERVAL 30 DAY
      `);
    const prevTotalRev = parseFloat(prevTotalRevResult.rows[0].total || 0);
    const prevUniqueDepositors = parseInt(prevDepositorsCount.rows[0].count || 0);
    const prevLtv = prevUniqueDepositors > 0 ? prevTotalRev / prevUniqueDepositors : 0;
    const ltvChange = prevLtv > 0 ? ((ltv - prevLtv) / prevLtv) * 100 : 0;

    // 3. Taux de Conversion - Utilisateurs ayant déposé / Total utilisateurs
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count || 1);
    const conversionRate = (uniqueDepositors / totalUsers) * 100;

    const prevUsersResult = await query('SELECT COUNT(*) as count FROM users WHERE created_at < NOW() - INTERVAL 30 DAY');
    const prevTotalUsers = parseInt(prevUsersResult.rows[0].count || 1);
    const prevConversionRate = (prevUniqueDepositors / prevTotalUsers) * 100;
    const conversionChange = prevConversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0;

    // 4. Top 10 Gains
    const topWinners = await query(`
      SELECT u.username, SUM(t.amount_usd) as total_prize
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type IN ('tournament_prize', 'challenge_prize') AND t.status = 'completed'
      GROUP BY u.id
      ORDER BY total_prize DESC
      LIMIT 10
    `);

    // 5. Top 10 Dépôts
    const topDepositors = await query(`
      SELECT u.username, SUM(t.amount_usd) as total_deposit
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.type = 'deposit' AND t.status = 'completed'
      GROUP BY u.id
      ORDER BY total_deposit DESC
      LIMIT 10
    `);

    // 6. Croissance du Chiffre d'Affaires (30 derniers jours)
    const revenueGrowth = await query(`
      WITH RECURSIVE dates AS (
        SELECT CURRENT_DATE - INTERVAL 29 DAY as date
        UNION ALL
        SELECT date + INTERVAL 1 DAY FROM dates WHERE date < CURRENT_DATE
      )
      SELECT d.date, COALESCE(SUM(t.amount_usd), 0) as revenue
      FROM dates d
      LEFT JOIN transactions t ON DATE(t.created_at) = d.date 
        AND t.type IN ('tournament_entry', 'challenge_bet') 
        AND t.status = 'completed'
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    // 7. Croissance des Utilisateurs (30 derniers jours)
    const userGrowth = await query(`
      WITH RECURSIVE dates AS (
        SELECT CURRENT_DATE - INTERVAL 29 DAY as date
        UNION ALL
        SELECT date + INTERVAL 1 DAY FROM dates WHERE date < CURRENT_DATE
      )
      SELECT d.date, COUNT(u.id) as registrations
      FROM dates d
      LEFT JOIN users u ON DATE(u.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    res.json({
      success: true,
      data: {
        arr,
        arrChange,
        ltv,
        ltvChange,
        conversionRate,
        conversionChange,
        retentionD7: 65,
        retentionChange: 2.1,
        revenueChart: revenueGrowth.rows.map(r => ({
          date: r.date.toISOString().split('T')[0],
          revenue: parseFloat(r.revenue)
        })),
        userChart: userGrowth.rows.map(r => ({
          date: r.date.toISOString().split('T')[0],
          registrations: parseInt(r.registrations)
        })),
        topWinners: topWinners.rows.map((r, i) => ({
          rank: i + 1,
          name: r.username,
          amount: parseFloat(r.total_prize)
        })),
        topDepositors: topDepositors.rows.map((r, i) => ({
          rank: i + 1,
          name: r.username,
          amount: parseFloat(r.total_deposit)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdvancedStats,
  getRevenue30Days,
  getRevenue7Days,
  getGlobalStats,
  getRecentTransactions,
  getRecentUsers,
  getSystemBalance: rechargeController.getSystemBalance,
  getRechargeHistory: rechargeController.getRechargeHistory,
  getSystemOperations: rechargeController.getSystemHistory,
  createSystemOperation: rechargeController.systemOperation,
  rechargeUser: rechargeController.rechargePlayer,
};
