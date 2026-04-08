// =============================================
// Recharge Controller
// =============================================

const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

// POST /api/recharges - Recharger un compte joueur
const rechargePlayer = async (req, res, next) => {
  try {
    const { userId, amount, currency, reason, method, phone, network } = req.body;
    const adminId = req.admin.id;

    // Validation
    if (!userId || !amount || !currency || !reason) {
      throw new AppError('Tous les champs sont requis', 400);
    }

    if (amount <= 0) {
      throw new AppError('Le montant doit être positif', 400);
    }
    let activeGateway = null;
    if ((method === 'mobile_money' || method === 'cartes_bancaires') && phone && network) {
      const gatewayRes = await query('SELECT * FROM payment_gateways WHERE is_active = 1 LIMIT 1');
      if (gatewayRes.rows.length > 0) activeGateway = gatewayRes.rows[0];
    }

    const initialStatus = activeGateway ? 'pending' : 'completed';
    const gatewayRef = activeGateway ? `ADM-DEP-${Date.now()}` : null;

    // Utiliser une transaction
    const result = await transaction(async (client) => {
      // Récupérer le joueur
      const userResult = await client.query(
        'SELECT id, username, balance_usd FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('Joueur non trouvé', 404);
      }

      const user = userResult.rows[0];
      const balanceBefore = parseFloat(user.balance_usd);

      // Convertir en USD si nécessaire
      const amountUSD = currency === 'USD' ? amount : amount / 2500;
      const balanceAfter = initialStatus === 'completed' ? balanceBefore + amountUSD : balanceBefore;

      // Mettre à jour le solde (Seulement si complété immédiatement)
      if (initialStatus === 'completed') {
        await client.query(
          'UPDATE users SET balance_usd = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [balanceAfter, userId]
        );
      }

      // Enregistrer dans l'historique
      const rechargeResult = await client.query(
        `INSERT INTO recharge_history 
         (user_id, amount_usd, amount_cdf, currency, reason, admin_id, balance_before_usd, balance_after_usd, status, gateway_reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          currency === 'USD' ? amount : null,
          currency === 'CDF' ? amount : null,
          currency,
          reason,
          adminId,
          balanceBefore,
          balanceAfter,
          initialStatus,
          gatewayRef
        ]
      );

      // Créer une transaction globale
      await client.query(
        `INSERT INTO transactions 
         (user_id, type, amount, amount_usd, amount_cdf, currency, status, description, processed_by_admin_id, completed_at, gateway_reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userId,
          'admin_recharge',
          amount,
          currency === 'USD' ? amount : amountUSD,
          currency === 'CDF' ? amount : null,
          currency,
          initialStatus,
          reason,
          adminId,
          initialStatus === 'completed' ? new Date() : null,
          gatewayRef
        ]
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          balanceBefore,
          balanceAfter
        }
      };
    });

    // Lancer le dépôt via Gateway si active
    if (activeGateway) {
      if (activeGateway.slug === 'pawapay') {
        await pawaPayService.initiateDeposit({
          amount: parseFloat(amount),
          currency: currency,
          phone,
          network,
          externalId: gatewayRef
        });
      } else if (activeGateway.slug === 'shwary') {
        await shwaryService.initiatePayment({
          amount: parseFloat(amount),
          currency: currency,
          phone,
          countryCode: 'DRC',
          callbackUrl: activeGateway.webhook_url,
          referenceId: gatewayRef
        });
      }
    }

    res.json({
      success: true,
      message: 'Recharge effectuée avec succès',
      data: result
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/recharges - Historique des recharges
const getRechargeHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        rh.id, rh.user_id, u.username as player_name,
        rh.amount_usd, rh.amount_cdf, rh.currency,
        rh.reason, rh.balance_before_usd, rh.balance_after_usd, rh.status,
        a.name as admin_name, rh.created_at
      FROM recharge_history rh
      JOIN users u ON rh.user_id = u.id
      JOIN admins a ON rh.admin_id = a.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (userId) {
      queryText += ` AND rh.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    // Count total
    const countResult = await query(
      queryText.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM'),
      queryParams
    );
    const total = countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;



    // Get data
    queryText += ` ORDER BY rh.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        recharges: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

const pawaPayService = require('../services/pawaPayService');
const shwaryService = require('../services/shwaryService');

// POST /api/recharges/system - Opération système
const systemOperation = async (req, res, next) => {
  try {
    const { type, amount, reason, paymentMethod, paymentReference, phone, network } = req.body;
    const adminId = req.admin.id;

    // Validation
    if (!type || !amount || !reason) {
      throw new AppError('Type, montant et raison sont requis', 400);
    }

    if (!['credit', 'debit'].includes(type)) {
      throw new AppError('Type invalide (credit ou debit)', 400);
    }

    if (amount <= 0) {
      throw new AppError('Le montant doit être positif', 400);
    }

    // Détecter la gateway active
    let activeGateway = null;
    try {
      const gatewayRes = await query('SELECT * FROM payment_gateways WHERE is_active = 1 LIMIT 1');
      if (gatewayRes.rows && gatewayRes.rows.length > 0 && paymentMethod === 'mobile_money' && phone) {
        activeGateway = gatewayRes.rows[0];
      }
    } catch (e) {
      console.error('Error detecting active gateway:', e);
    }

    const isExternalGateway = !!activeGateway;
    const initialStatus = isExternalGateway ? 'pending' : 'completed';
    const gatewayRef = isExternalGateway ? `SYS-${Date.now()}-${Math.floor(Math.random() * 1000)}` : (paymentReference || null);

    // Récupérer le solde système actuel
    const balanceResult = await query(`
      SELECT COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount_usd WHEN type = 'debit' AND status = 'completed' THEN -amount_usd ELSE 0 END), 0) as balance
      FROM system_transactions
    `);

    const balanceBefore = parseFloat(balanceResult.rows[0].balance);
    let balanceAfter = balanceBefore;

    if (!isExternalGateway) {
      balanceAfter = type === 'credit' ? balanceBefore + amount : balanceBefore - amount;
      if (type === 'debit' && balanceAfter < 0) {
        throw new AppError('Fonds insuffisants dans le système', 400);
      }
    }

    // Enregistrer l'opération
    await query(
      `INSERT INTO system_transactions 
       (type, amount_usd, reason, payment_method_type, payment_reference, admin_id, balance_before_usd, balance_after_usd, status, gateway_reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [type, amount, reason, paymentMethod, gatewayRef, adminId, balanceBefore, balanceAfter, initialStatus, gatewayRef]
    );

    const lastOpResult = await query(
      'SELECT * FROM system_transactions WHERE id = LAST_INSERT_ID()'
    );
    const lastOp = lastOpResult.rows[0];

    // Si une gateway externe est active, on lance l'initiation
    if (isExternalGateway) {
      if (activeGateway.slug === 'pawapay') {
        if (type === 'credit') {
          await pawaPayService.initiateDeposit({
            amount,
            currency: 'USD',
            phone,
            network,
            externalId: gatewayRef
          });
        } else {
          await pawaPayService.initiatePayout({
            amount,
            currency: 'USD',
            phone,
            network,
            externalId: gatewayRef
          });
        }
      } else if (activeGateway.slug === 'shwary') {
        if (type === 'credit') {
          // Récupérer le domaine public pour le callback
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host;
          const baseUrl = activeGateway.webhook_url || `${protocol}://${host}`;

          await shwaryService.initiatePayment({
            amount,
            currency: 'USD',
            phone,
            countryCode: 'DRC',
            callbackUrl: `${baseUrl}/api/webhooks/shwary`
          });
        }
        // Note: Shwary Payout est manuel ou nécessite une autre route selon leur doc
      }
    }

    res.json({
      success: true,
      message: isExternalGateway ? `Opération ${activeGateway.slug.toUpperCase()} initiée.` : 'Opération système effectuée avec succès',
      data: lastOp
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/recharges/system - Historique système
const getSystemHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        st.id, st.type, st.amount_usd, st.reason,
        st.payment_method_type, st.payment_reference,
        st.balance_before_usd, st.balance_after_usd, st.status,
        a.name as admin_name, st.created_at
      FROM system_transactions st
      JOIN admins a ON st.admin_id = a.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (type && ['credit', 'debit'].includes(type)) {
      queryText += ` AND st.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    // Count
    const countResult = await query(
      queryText.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM'),
      queryParams
    );
    const total = countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;



    // Get data
    queryText += ` ORDER BY st.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/recharges/system/balance - Solde système
const getSystemBalance = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount_usd ELSE 0 END), 0) as total_credits,
        COALESCE(SUM(CASE WHEN type = 'debit' AND status = 'completed' THEN amount_usd ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount_usd WHEN type = 'debit' AND status = 'completed' THEN -amount_usd ELSE 0 END), 0) as current_balance
      FROM system_transactions
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  rechargePlayer,
  getRechargeHistory,
  systemOperation,
  getSystemHistory,
  getSystemBalance,
};
