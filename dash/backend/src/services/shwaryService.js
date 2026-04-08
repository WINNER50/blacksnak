const axios = require('axios');
const { query } = require('../config/database');
require('dotenv').config();

/**
 * ShwaryService Integration
 */
class ShwaryService {
    constructor() {
        this.baseUrl = 'https://api.shwary.com/api/v1';
    }

    async getSettings() {
        const result = await query('SELECT * FROM payment_gateways WHERE slug = "shwary"');
        if (result.rows.length === 0) throw new Error('Shwary configuration not found');
        return result.rows[0];
    }

    async getAxiosConfig() {
        const settings = await this.getSettings();
        if (!settings.is_active) throw new Error('Shwary is currently disabled');

        return {
            baseUrl: this.baseUrl,
            headers: {
                'x-merchant-id': settings.merchant_id,
                'x-merchant-key': settings.api_key_secret,
                'Content-Type': 'application/json'
            },
            environment: settings.environment
        };
    }

    async initiatePayment({ amount, currency, phone, countryCode = 'DRC', callbackUrl, referenceId }) {
        const config = await this.getAxiosConfig();

        // Convert to CDF if needed (Shwary DRC expects CDF)
        let finalAmount = amount;
        if (countryCode === 'DRC' && currency !== 'CDF') {
            const exchangeRate = 2500; // Taux par défaut ou dynamique
            finalAmount = amount * exchangeRate;
        }

        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('+')) {
            if (countryCode === 'DRC' && !cleanPhone.startsWith('243')) {
                cleanPhone = `243${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
            }
            cleanPhone = `+${cleanPhone}`;
        }

        const isSandbox = config.environment === 'sandbox';
        const endpoint = isSandbox
            ? `${config.baseUrl}/merchants/payment/sandbox/${countryCode}`
            : `${config.baseUrl}/merchants/payment/${countryCode}`;

        const payload = {
            amount: Math.round(finalAmount),
            clientPhoneNumber: cleanPhone,
            callbackUrl: callbackUrl,
            referenceId: referenceId
        };

        try {
            const response = await axios.post(endpoint, payload, { headers: config.headers });
            return response.data;
        } catch (error) {
            console.error('Shwary Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Failed to initiate Shwary payment');
        }
    }
}

module.exports = new ShwaryService();
