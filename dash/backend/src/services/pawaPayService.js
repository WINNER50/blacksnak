const axios = require('axios');
const { query } = require('../config/database');
require('dotenv').config();

class PawaPayService {
  constructor() {
    this.baseUrlSandbox = 'https://api.pawapay.cloud';
    this.baseUrlLive = 'https://api.pawapay.cloud';
  }

  async getSettings() {
    const result = await query('SELECT * FROM payment_gateways WHERE slug = "pawapay"');
    if (result.rows.length === 0) throw new Error('PawaPay configuration not found');
    return result.rows[0];
  }

  async getAxiosConfig() {
    const settings = await this.getSettings();
    if (!settings.is_active) throw new Error('PawaPay is currently disabled');

    return {
      baseUrl: settings.environment === 'live' ? this.baseUrlLive : this.baseUrlSandbox,
      headers: {
        'Authorization': `Bearer ${settings.api_key_secret}`,
        'Content-Type': 'application/json'
      }
    };
  }

  async initiateDeposit({ amount, currency, phone, network, externalId }) {
    const config = await this.getAxiosConfig();
    const payload = {
      depositId: externalId,
      amount: amount.toString(),
      currency: currency,
      country: 'RDC',
      correspondent: network.toUpperCase(),
      payer: {
        type: 'MSISDN',
        address: { value: phone }
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: 'Blacksnack System Recharge'
    };

    try {
      const response = await axios.post(`${config.baseUrl}/v1/momo/deposits`, payload, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      console.error('PawaPay System Deposit Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initiate PawaPay system deposit');
    }
  }

  async initiatePayout({ amount, currency, phone, network, externalId }) {
    const config = await this.getAxiosConfig();
    const payload = {
      payoutId: externalId,
      amount: amount.toString(),
      currency: currency,
      country: 'COD',
      correspondent: network.toUpperCase(),
      recipient: {
        type: 'MSISDN',
        address: { value: phone }
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: 'Blacksnack Revenue Payout'
    };

    try {
      const response = await axios.post(`${config.baseUrl}/v1/momo/payouts`, payload, {
        headers: config.headers
      });
      return response.data;
    } catch (error) {
      console.error('PawaPay System Payout Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initiate PawaPay system payout');
    }
  }
}

module.exports = new PawaPayService();
