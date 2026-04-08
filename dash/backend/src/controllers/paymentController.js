// =============================================
// Payment Controller
// =============================================

const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

// GET /api/payments/methods - Liste des méthodes de paiement
const getPaymentMethods = async (req, res, next) => {
    try {
        const { activeOnly } = req.query;

        let queryText = 'SELECT * FROM payment_methods';
        const params = [];

        if (activeOnly === 'true') {
            queryText += ' WHERE is_enabled = 1';
        }

        queryText += ' ORDER BY id ASC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/payments/methods/:id/toggle - Activer/désactiver une méthode
const togglePaymentMethod = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_enabled } = req.body;

        if (is_enabled === undefined) {
            throw new AppError('Le statut is_enabled est requis', 400);
        }

        const result = await query(
            'UPDATE payment_methods SET is_enabled = ? WHERE id = ?',
            [is_enabled ? 1 : 0, id]
        );

        if (result.rowCount === 0) {
            throw new AppError('Méthode de paiement non trouvée', 404);
        }

        res.json({
            success: true,
            message: `Méthode de paiement ${is_enabled ? 'activée' : 'désactivée'} avec succès`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPaymentMethods,
    togglePaymentMethod
};
