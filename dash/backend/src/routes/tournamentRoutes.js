const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);


// Récupérer tous les tournois (Consultable par tous les admins)
router.get('/', authorize('super_admin', 'admin', 'moderator'), async (req, res) => {
    try {
        const result = await query(`
            SELECT t.*, 
                   (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as current_participants 
            FROM tournaments t 
            ORDER BY t.start_date DESC
        `);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des tournois:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});

// Créer un nouveau tournoi (Super Admin et Admin uniquement)
router.post('/', authorize('super_admin', 'admin'), async (req, res) => {
    try {
        const { name, description, entry_fee_usd, prize_pool_usd, max_participants, start_date, end_date, game_mode, rules } = req.body;

        // Validation basique
        if (!name || !entry_fee_usd || !prize_pool_usd || !max_participants || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: 'Tous les champs obligatoires doivent être remplis'
            });
        }

        // Calculer entry_fee_cdf (Taux fixe de 2500 pour l'instant, peut être dynamisé plus tard)
        const entry_fee_cdf = parseFloat(entry_fee_usd) * 2500;

        const result = await query(
            'INSERT INTO tournaments (name, description, entry_fee_usd, entry_fee_cdf, prize_pool_usd, max_participants, start_date, end_date, game_mode, rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, entry_fee_usd, entry_fee_cdf, prize_pool_usd, max_participants, start_date, end_date, game_mode || 'classic', rules]
        );

        res.status(201).json({
            success: true,
            id: result.insertId || (result.rows && result.rows[0]?.id),
            message: 'Tournoi créé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la création du tournoi:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la création du tournoi'
        });
    }
});

// Mettre à jour le statut d'un tournoi (Super Admin et Admin uniquement)
router.patch('/:id/status', authorize('super_admin', 'admin'), async (req, res) => {
    try {
        const { status } = req.body;
        await query('UPDATE tournaments SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({
            success: true,
            message: 'Statut du tournoi mis à jour'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});

// Supprimer un tournoi (Super Admin et Admin uniquement)
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM tournaments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tournoi non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Tournoi supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du tournoi:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression'
        });
    }
});

// Récupérer le classement d'un tournoi (Consultable par tous les admins)
router.get('/:id/leaderboard', authorize('super_admin', 'admin', 'moderator'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT tp.score, tp.joined_at, u.username, u.name, u.avatar_url 
            FROM tournament_participants tp
            JOIN users u ON tp.user_id = u.id
            WHERE tp.tournament_id = ?
            ORDER BY tp.score DESC, tp.joined_at ASC
        `, [id]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du classement:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});

module.exports = router;
