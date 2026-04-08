const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Liste des clés de paramètres autorisées à être lues par l'application mobile (joueurs)
const PUBLIC_SETTINGS = [
    'whatsapp_group_link',
    'whatsapp_support_number',
    'beginner_guide_content',
    'exchange_rate_usd_cdf',
    'transaction_fee_percent',
    'min_deposit_usd',
    'min_withdrawal_usd'
];

router.get('/', async (req, res) => {
    try {
        const placeholders = PUBLIC_SETTINGS.map(() => '?').join(',');
        const result = await query(
            `SELECT \`key\`, value FROM settings WHERE \`key\` IN (${placeholders})`,
            PUBLIC_SETTINGS
        );

        const settings = {};
        // Initialiser avec des chaînes vides pour éviter les undefined sur mobile
        PUBLIC_SETTINGS.forEach(key => settings[key] = '');

        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        res.json(settings);
    } catch (error) {
        console.error('[SETTINGS] Erreur récupération paramètres publics:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
