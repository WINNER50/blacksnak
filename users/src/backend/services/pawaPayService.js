const axios = require('axios');
const { pool } = require('../config/database');
require('dotenv').config();

/**
 * PawaPayService - Version 2 Integration
 * Following documentation from documentationpawapy.md
 */
class PawaPayService {
  constructor() {
    this.baseUrlSandbox = 'https://api.sandbox.pawapay.io/v2';
    this.baseUrlLive = 'https://api.pawapay.io/v2'; 
  }

  async getSettings() {
    const [rows] = await pool.query('SELECT * FROM payment_gateways WHERE slug = "pawapay"');
    if (rows.length === 0) throw new Error('PawaPay configuration not found');
    return rows[0];
  }

  async getAxiosConfig() {
    const settings = await this.getSettings();
    if (!settings.is_active) throw new Error('PawaPay is currently disabled');
    
    const headers = {
      'Authorization': `Bearer ${settings.api_key_secret}`,
      'Content-Type': 'application/json'
    };

    return {
      baseUrl: settings.environment === 'live' ? this.baseUrlLive : this.baseUrlSandbox,
      headers
    };
  }

  /**
   * Initiate a Mobile Money Deposit (V2)
   * @param {Object} data { amount, currency, phone, network, externalId }
   */
  async initiateDeposit({ amount, currency, phone, network, externalId }) {
    const config = await this.getAxiosConfig();

    // 1. Normalize phone for DRC (Democratic Republic of Congo)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('243')) {
      cleanPhone = cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.length > 9) {
      cleanPhone = cleanPhone.substring(0, 9);
    }
    cleanPhone = `243${cleanPhone}`;

    // 2. Prepare V2 Payload
    const payload = {
      depositId: externalId,
      amount: amount.toString(),
      currency: currency,
      payer: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: cleanPhone,
          provider: network.toUpperCase() // e.g. VODACOM_MPESA_COD
        }
      }
    };

    console.log('Sending PawaPay V2 Deposit Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(`${config.baseUrl}/deposits`, payload, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'deposit');
    }
  }

  /**
   * Initiate a Mobile Money Payout (V2)
   * @param {Object} data { amount, currency, phone, network, externalId }
   */
  async initiatePayout({ amount, currency, phone, network, externalId }) {
    const config = await this.getAxiosConfig();

    // Normalize phone for DRC
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('243')) {
      cleanPhone = cleanPhone.substring(3);
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    cleanPhone = `243${cleanPhone.substring(0, 9)}`;

    const payload = {
      payoutId: externalId,
      amount: amount.toString(),
      currency: currency,
      recipient: {
        type: 'MMO',
        accountDetails: {
          phoneNumber: cleanPhone,
          provider: network.toUpperCase()
        }
      }
    };

    console.log('Sending PawaPay V2 Payout Payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post(`${config.baseUrl}/payouts`, payload, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'payout');
    }
  }

  /**
   * Check status of a transaction (V2)
   */
  async getTransactionStatus(type, id) {
    const config = await this.getAxiosConfig();
    const endpoint = type === 'deposit' ? 'deposits' : 'payouts';
    
    try {
      const response = await axios.get(`${config.baseUrl}/${endpoint}/${id}`, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      console.error(`PawaPay V2 Status Error (${type}):`, error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Predict provider and validate phone number
   */
  async predictProvider(phoneNumber) {
    const config = await this.getAxiosConfig();
    try {
      const response = await axios.post(`${config.baseUrl}/predict-provider`, { phoneNumber }, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      console.error('PawaPay Predict Provider Error:', error.response?.data || error.message);
      throw new Error('Invalid phone number or provider not found');
    }
  }

  /**
   * Fetch active configuration for a country
   */
  async getActiveConfig(country = 'COD', operationType = 'DEPOSIT') {
    const config = await this.getAxiosConfig();
    try {
      const response = await axios.get(`${config.baseUrl}/active-conf`, {
        params: { country, operationType },
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      console.error('PawaPay Active config Error:', error.response?.data || error.message);
      return null;
    }
  }

  handleError(error, type) {
    if (error.response) {
      console.error(`--- ERREUR PAWAPAY V2 (${type.toUpperCase()}) ---`);
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      throw new Error(error.response.data.failureReason?.failureMessage || `Failed to initiate PawaPay ${type}`);
    } else {
      console.error(`--- ERREUR PAWAPAY V2 (NO RESPONSE - ${type}) ---`);
      console.error(error.message);
      throw new Error(`Connection to PawaPay failed during ${type}`);
    }
  }
}

module.exports = new PawaPayService();
