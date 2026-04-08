// =============================================
// User Controller
// =============================================

const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

// GET /api/users - Liste des utilisateurs
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = 'all',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let queryText = `
      SELECT 
        id, username, email, phone, balance_usd, balance_cdf,
        total_earnings, total_games_played, total_wins, total_losses,
        win_rate, highest_score, level, country,
        status, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Filters
    if (search) {
      queryText += ` AND (username LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (status !== 'all') {
      queryText += ` AND status = ?`;
      queryParams.push(status);
      paramIndex++;
    }

    // Count total
    let countQuery = `SELECT COUNT(*) as count FROM users WHERE 1=1`;
    const countParams = [];

    if (search) {
      countQuery += ` AND (username LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status !== 'all') {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const countResult = await query(countQuery, countParams);
    const total = countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;


    // Sort and paginate
    queryText += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id - Détails d'un utilisateur
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        id, username, email, phone, balance_usd, balance_cdf,
        total_earnings, total_games_played, total_wins, total_losses,
        win_rate, highest_score, level, avatar_url,
        country, status, email_verified, 
        created_at, updated_at, last_login
      FROM users 
      WHERE id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id - Modifier un utilisateur
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email, country, level } = req.body;

    const checkResult = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (checkResult.rows.length === 0) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    await query(
      `UPDATE users 
       SET username = COALESCE(?, username),
           email = COALESCE(?, email),
           country = COALESCE(?, country),
           level = COALESCE(?, level),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [username, email, country, level, id]
    );

    const updatedUser = await query('SELECT * FROM users WHERE id = ?', [id]);


    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: updatedUser.rows[0]
    });


  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id - Supprimer un utilisateur
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM users WHERE id = ?', [id]);

    if (result.rowCount === 0) {

      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/status - Changer le statut
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'banned'].includes(status)) {
      throw new AppError('Statut invalide', 400);
    }

    await query(
      `UPDATE users 
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, id]
    );

    const updatedUser = await query('SELECT * FROM users WHERE id = ?', [id]);

    if (updatedUser.rows.length === 0) {

      throw new AppError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: updatedUser.rows[0]
    });


  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id/stats - Statistiques d'un utilisateur
const getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userResult = await query(
      `SELECT 
        total_games_played, total_wins, total_losses,
        win_rate, highest_score, balance_usd
      FROM users 
      WHERE id = ?`,
      [id]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    const gamesResult = await query(
      `SELECT score, duration_seconds, game_mode, result, created_at
       FROM game_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    const tournamentResult = await query(
      `SELECT COUNT(*) as total_tournaments, 
              SUM(prize_won_usd) as total_prizes
       FROM tournament_participants
       WHERE user_id = ?`,
      [id]
    );

    const challengeResult = await query(
      `SELECT 
        COUNT(*) as total_challenges,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as challenges_won
       FROM challenges
       WHERE creator_id = ? OR opponent_id = ?`,
      [id, id, id]
    );

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        recentGames: gamesResult.rows,
        tournaments: tournamentResult.rows[0],
        challenges: challengeResult.rows[0]
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getUserStats,
};
