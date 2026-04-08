const axios = require('axios');
const { query } = require('../config/database');

/**
 * Envoie un message WhatsApp via Whapi.cloud
 * @param {string} to - Numéro de téléphone au format international (ex: 243...)
 * @param {string} message - Contenu du message
 */
const sendWhatsAppMessage = async (to, message) => {
    let token = process.env.WHAPI_API_TOKEN;

    // Si pas de token dans le .env, on cherche en base
    if (!token) {
        try {
            const result = await query("SELECT value FROM settings WHERE `key` = 'whapi_api_token'");
            if (result.rows && result.rows.length > 0) {
                token = result.rows[0].value;
            }
        } catch (e) {
            console.error('[WHATSAPP] Erreur lecture DB token:', e.message);
        }
    }

    if (!token) {
        console.warn('[WHATSAPP] Aucun token WHAPI_API_TOKEN configuré. Message non envoyé (mode simulation).');
        console.log(`[WHATSAPP] Destinataire: ${to}`);
        console.log(`[WHATSAPP] Message: ${message}`);
        return true;
    }

    // Nettoyer le numéro de téléphone (garder seulement les chiffres)
    let cleanNumber = to.replace(/\D/g, '');

    // Ajouter l'indicatif pays RDC si nécessaire
    if (cleanNumber.startsWith('0')) {
        cleanNumber = '243' + cleanNumber.substring(1);
    } else if (cleanNumber.length === 9 && !cleanNumber.startsWith('243')) {
        cleanNumber = '243' + cleanNumber;
    }

    try {
        const response = await axios.post('https://gate.whapi.cloud/messages/text', {
            typing_time: 0,
            to: `${cleanNumber}@s.whatsapp.net`,
            body: message
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`[WHATSAPP] Message envoyé à ${to} avec succès. ID: ${response.data.id || 'N/A'}`);
        return true;
    } catch (error) {
        console.error('[WHATSAPP] Erreur lors de l\'envoi du message:', error.response ? error.response.data : error.message);
        throw new Error('Erreur lors de l\'envoi du message WhatsApp');
    }
};

module.exports = { sendWhatsAppMessage };
