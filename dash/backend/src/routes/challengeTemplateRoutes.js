const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);


// Récupérer tous les templates de défis (Consultable par tous les admins)
router.get('/', authorize('super_admin', 'admin', 'moderator'), async (req, res) => {
    try {
        const result = await query('SELECT * FROM personal_challenge_templates ORDER BY created_at DESC');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des templates de défis:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});

// Créer un nouveau template (Super Admin et Admin uniquement)
router.post('/', authorize('super_admin', 'admin'), async (req, res) => {
    try {
        const { title, description, entry_fee_usd, prize_usd, target_score, time_limit_seconds, difficulty } = req.body;

        const result = await query(
            'INSERT INTO personal_challenge_templates (title, description, entry_fee_usd, prize_usd, target_score, time_limit_seconds, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, description, entry_fee_usd, prize_usd, target_score, time_limit_seconds, difficulty]
        );

        res.status(201).json({
            success: true,
            id: result.insertId || (result.rows && result.rows[0]?.id),
            message: 'Template créé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la création du template:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});

// Supprimer un template (Super Admin et Admin uniquement)
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
    try {
        await query('DELETE FROM personal_challenge_templates WHERE id = ?', [req.params.id]);
        res.json({
            success: true,
            message: 'Template supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du template:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur'
        });
    }
});

module.exports = router;
