// =============================================
// Withdrawal Controller
// =============================================

const { query, transaction } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const pawaPayService = require('../services/pawaPayService');

// POST /api/withdrawals - Effectuer un retrait pour un joueur (par un admin)
const withdrawPlayer = async (req, res, next) => {
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

        if (!['USD', 'CDF'].includes(currency)) {
            throw new AppError('Devise invalide', 400);
        }

        // Détecter la gateway active pour le payout si Mobile Money
        let activeGateway = null;
        if (method === 'mobile_money' && phone && network) {
            const gatewayRes = await query('SELECT * FROM payment_gateways WHERE is_active = 1 LIMIT 1');
            if (gatewayRes.rows.length > 0) activeGateway = gatewayRes.rows[0];
        }

        const initialStatus = activeGateway ? 'pending' : 'completed';
        const gatewayRef = activeGateway ? `ADM-WTH-${Date.now()}` : null;

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

            // Vérifier si le solde est suffisant
            if (balanceBefore < amountUSD) {
                throw new AppError('Solde insuffisant pour ce retrait', 400);
            }

            const balanceAfter = balanceBefore - amountUSD;

            // Mettre à jour le solde
            await client.query(
                'UPDATE users SET balance_usd = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [balanceAfter, userId]
            );

            // Enregistrer dans l'historique des retraits
            await client.query(
                `INSERT INTO withdrawal_history 
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
                    'withdrawal',
                    amount,
                    currency === 'USD' ? amount : amountUSD,
                    currency === 'CDF' ? amount : null,
                    currency,
                    initialStatus,
                    reason,
                    adminId,
                    activeGateway ? null : new Date(),
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

        // Lancer le Payout si gateway active
        if (activeGateway && activeGateway.slug === 'pawapay') {
            await pawaPayService.initiatePayout({
                amount: parseFloat(amount),
                currency: currency,
                phone,
                network,
                externalId: gatewayRef
            });
        }

        res.json({
            success: true,
            message: activeGateway ? `Retrait initié via ${activeGateway.slug.toUpperCase()}` : 'Retrait effectué avec succès',
            data: result
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/withdrawals - Historique des retraits
const getWithdrawalHistory = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, userId } = req.query;
        const offset = (page - 1) * limit;

        let queryText = `
      SELECT 
        wh.id, wh.user_id, u.username as player_name,
        wh.amount_usd, wh.amount_cdf, wh.currency,
        wh.reason, wh.balance_before_usd, wh.balance_after_usd, wh.status,
        a.name as admin_name, wh.created_at
      FROM withdrawal_history wh
      JOIN users u ON wh.user_id = u.id
      JOIN admins a ON wh.admin_id = a.id
      WHERE 1=1
    `;
        const queryParams = [];
        let paramIndex = 1;

        if (userId) {
            queryText += ` AND wh.user_id = $${paramIndex}`;
            queryParams.push(userId);
            paramIndex++;
        }

        // Count
        const countResult = await query(
            queryText.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as count FROM'),
            queryParams
        );
        const total = countResult.rows[0] ? parseInt(countResult.rows[0].count) : 0;

        // Get data
        queryText += ` ORDER BY wh.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), parseInt(offset));

        const result = await query(queryText, queryParams);

        res.json({
            success: true,
            data: {
                withdrawals: result.rows,
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

module.exports = {
    withdrawPlayer,
    getWithdrawalHistory,
};
