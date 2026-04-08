const { query } = require('../config/database');

let settingsCache = {};
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Récupère tous les paramètres globaux (avec cache)
 */
async function getAllSettings() {
    const now = Date.now();
    if (now - lastFetch < CACHE_DURATION && Object.keys(settingsCache).length > 0) {
        return settingsCache;
    }

    try {
        const result = await query('SELECT `key`, value FROM settings');
        const newCache = {};
        result.rows.forEach(row => {
            newCache[row.key] = row.value;
        });
        settingsCache = newCache;
        lastFetch = now;
        return settingsCache;
    } catch (error) {
        console.error('[SETTINGS] Erreur chargement settings cache:', error);
        return settingsCache; // Retourner l'ancien cache si erreur
    }
}

/**
 * Récupère un paramètre spécifique
 * @param {string} key - Clé du paramètre
 * @param {any} defaultValue - Valeur par défaut si absent
 */
async function getSetting(key, defaultValue = null) {
    const settings = await getAllSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
}

module.exports = {
    getAllSettings,
    getSetting
};
