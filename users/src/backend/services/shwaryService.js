const axios = require('axios');
const { pool } = require('../config/database');
require('dotenv').config();

/**
 * ShwaryService Integration
 * Documentation from merchant-en.md
 */
class ShwaryService {
  constructor() {
    this.baseUrl = 'https://api.shwary.com/api/v1';
  }

  async getSettings() {
    const [rows] = await pool.query('SELECT * FROM payment_gateways WHERE slug = "shwary"');
    if (rows.length === 0) throw new Error('Shwary configuration not found');
    return rows[0];
  }

  async getAxiosConfig() {
    const settings = await this.getSettings();
    if (!settings.is_active) throw new Error('Shwary is currently disabled');

    const headers = {
      'x-merchant-id': settings.merchant_id,
      'x-merchant-key': settings.api_key_secret,
      'Content-Type': 'application/json'
    };

    return {
      baseUrl: this.baseUrl,
      headers,
      environment: settings.environment
    };
  }

  /**
   * Initiate a Mobile Money Payment
   * @param {Object} data { amount, currency, phone, countryCode, callbackUrl }
   */
  async initiatePayment({ amount, currency, phone, countryCode = 'DRC', callbackUrl }) {
    const config = await this.getAxiosConfig();
    // 1. Convert to CDF if needed (Shwary DRC expects CDF)
    let finalAmount = amount;
    if (countryCode === 'DRC' && currency !== 'CDF') {
      const exchangeRate = 2500; // Taux par défaut ou dynamique
      finalAmount = amount * exchangeRate;
    }

    // 2. Normalize phone
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('+')) {
      if (countryCode === 'DRC' && !cleanPhone.startsWith('243')) {
        cleanPhone = `243${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
      } else if (countryCode === 'KE' && !cleanPhone.startsWith('254')) {
        cleanPhone = `254${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
      } else if (countryCode === 'UG' && !cleanPhone.startsWith('256')) {
        cleanPhone = `256${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
      }
      cleanPhone = `+${cleanPhone}`;
    }

    // 3. Determine Endpoint (Sandbox vs Live)
    const isSandbox = config.environment === 'sandbox';
    const endpoint = isSandbox
      ? `${config.baseUrl}/merchants/payment/sandbox/${countryCode}`
      : `${config.baseUrl}/merchants/payment/${countryCode}`;

    const payload = {
      amount: Math.round(finalAmount), // Use converted amount
      clientPhoneNumber: cleanPhone,
      callbackUrl: callbackUrl
    };

    console.log(`Sending Shwary (${isSandbox ? 'Sandbox' : 'Live'}) Payment Payload:`, JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(endpoint, payload, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'payment');
    }
  }

  /**
   * Check status of a transaction
   */
  async getTransactionStatus(id) {
    const config = await this.getAxiosConfig();

    try {
      const response = await axios.get(`${config.baseUrl}/merchants/transactions/${id}`, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      console.error(`Shwary Status Error:`, error.response?.data || error.message);
      return null;
    }
  }

  handleError(error, type) {
    if (error.response) {
      console.error(`--- SHWARY ERROR (${type.toUpperCase()}) ---`);
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      throw new Error(error.response.data.message || `Failed to initiate Shwary ${type}`);
    } else {
      console.error(`--- SHWARY ERROR (NO RESPONSE) ---`);
      console.error(error.message);
      throw new Error(`Connection to Shwary failed during ${type}`);
    }
  }
}

module.exports = new ShwaryService();
