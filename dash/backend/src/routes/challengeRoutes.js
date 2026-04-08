const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Récupérer tous les défis PvP avec jointures pour les usernames
router.get('/', authorize('super_admin', 'admin', 'moderator'), async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                c.*, 
                u1.username as creator_name, 
                u2.username as opponent_name
            FROM challenges c
            JOIN users u1 ON c.creator_id = u1.id
            LEFT JOIN users u2 ON c.opponent_id = u2.id
            ORDER BY c.created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des défis PvP:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Récupérer les statistiques des défis (En attente, En cours, Terminés)
router.get('/stats', authorize('super_admin', 'admin', 'moderator'), async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as waiting,
                COUNT(CASE WHEN status IN ('accepted', 'in_progress') THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as finished
            FROM challenges
        `);

        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des stats des défis:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

module.exports = router;
