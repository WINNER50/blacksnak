const express = require('express');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const pawaPayService = require('../services/pawaPayService');
const shwaryService = require('../services/shwaryService');
const settingsService = require('../services/settingsService');

// Créer une transaction (dépôt ou retrait)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type, amount, currency, method, network, phone, details } = req.body;

    // Validation
    if (!type || !amount || !currency || !method) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Récupérer les paramètres financiers dynamiques
    const exchangeRate = parseFloat(await settingsService.getSetting('exchange_rate_usd_cdf', 2500));
    const minDeposit = parseFloat(await settingsService.getSetting('min_deposit_usd', 5));
    const minWithdrawal = parseFloat(await settingsService.getSetting('min_withdrawal_usd', 10));

    const amountUSD = currency === 'USD' ? parseFloat(amount) : parseFloat(amount) / exchangeRate;
    const amountCDF = currency === 'CDF' ? parseFloat(amount) : parseFloat(amount) * exchangeRate;

    // Validation des limites
    if (type === 'deposit' && amountUSD < minDeposit) {
      return res.status(400).json({ error: `Dépôt minimum de ${minDeposit} USD requis` });
    }
    if (type === 'withdrawal' && amountUSD < minWithdrawal) {
      return res.status(400).json({ error: `Retrait minimum de ${minWithdrawal} USD requis` });
    }

    const safeNetwork = network || details?.network || null;
    const safePhone = phone || details?.phone || null;

    let transactionId = null;
    let gatewayRef = null;
    let status = 'pending';

    await transaction(async (client) => {
      // Vérifier le solde pour les retraits
      if (type === 'withdrawal' || type === 'withdraw') {
        const userResult = await client.query('SELECT balance_usd FROM users WHERE id = $1 FOR UPDATE', [req.userId]);
        const rows = userResult.rows;
        const balance = parseFloat(rows[0].balance_usd ?? 0);
        if (balance < amountUSD) {
          throw new Error('Solde insuffisant');
        }
      }

      // Détecter la gateway active
      let activeGateway = null;
      try {
        const gatewayRes = await client.query('SELECT * FROM payment_gateways WHERE is_active = 1 LIMIT 1');
        const gateways = gatewayRes.rows;
        if (gateways && gateways.length > 0 && method === 'mobile_money') {
          activeGateway = gateways[0];
          console.log(`Active Gateway detected: ${activeGateway.slug} (ID: ${activeGateway.id})`);
        } else {
          console.log(`No active gateway found for method: ${method}`);
        }
      } catch (e) {
        console.error('Error detecting gateway:', e);
        // Ignorer si pas de gateway config, rester en mode factice
      }

      const isExternalGateway = !!activeGateway;
      status = isExternalGateway ? 'pending' : 'completed';
      gatewayRef = isExternalGateway ? crypto.randomUUID() : null;

      // Correspondant mapping for DRC (COD) - V2 Strict Nomenclature
      let rawNet = (safeNetwork || '').toUpperCase();
      let pawapayCorrespondent = rawNet;

      if (rawNet === 'VODACOM') pawapayCorrespondent = 'VODACOM_COD';
      else if (rawNet === 'AIRTEL') pawapayCorrespondent = 'AIRTEL_COD';
      else if (rawNet === 'ORANGE') pawapayCorrespondent = 'ORANGE_COD';
      else if (rawNet === 'AFRICELL') pawapayCorrespondent = 'AFRICELL_COD';

      // Créer la transaction
      const txResult = await client.query(
        `INSERT INTO transactions (user_id, type, amount, amount_usd, amount_cdf, currency, method, network, phone, status, gateway_reference) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [req.userId, type, parseFloat(amount), amountUSD, amountCDF, currency, method, safeNetwork, safePhone, status, gatewayRef]
      );

      // Déduire le solde IMMÉDIATEMENT pour les retraits pour éviter les abus (double dépense)
      if (type === 'withdrawal' || type === 'withdraw') {
        const amountOfUSD = parseFloat(amountUSD || 0);
        const amountOfCDF = parseFloat(amountCDF || 0);
        await client.query(
          'UPDATE users SET balance_usd = balance_usd - $1, balance_cdf = balance_cdf - $2 WHERE id = $3',
          [amountOfUSD, amountOfCDF, req.userId]
        );
        console.log(`Withdrawal created: Deducted ${amountOfUSD} USD from user ${req.userId}. Status: ${status}`);
      }

      // If not external, we update balance immediately for DEPOSITS (Legacy/Factice mode)
      if (!isExternalGateway) {
        if (type === 'deposit' || type === 'admin_recharge' || type.includes('prize')) {
          await client.query(
            'UPDATE users SET balance_usd = balance_usd + $1, balance_cdf = balance_cdf + $2 WHERE id = $3',
            [amountUSD, amountCDF, req.userId]
          );
          console.log(`Deposit completed offline: Added ${amountUSD} USD to user ${req.userId}`);
        }
      } else {
        // Initiate External Gateway call
        if (activeGateway.slug === 'pawapay') {
          if (type === 'deposit') {
            await pawaPayService.initiateDeposit({
              amount: parseFloat(amount),
              currency: currency,
              phone: safePhone,
              network: pawapayCorrespondent,
              externalId: gatewayRef
            });
          } else if (type === 'withdrawal' || type === 'withdraw') {
            await pawaPayService.initiatePayout({
              amount: parseFloat(amount),
              currency: currency,
              phone: safePhone,
              network: pawapayCorrespondent,
              externalId: gatewayRef
            });
          }
        } else if (activeGateway.slug === 'shwary') {
          // Get public domain for callback
          const protocol = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host;
          // Use DB webhook_url > .env PUBLIC_URL > current host
          const rawBaseUrl = activeGateway.webhook_url || process.env.PUBLIC_URL || `${protocol}://${host}`;
          const baseUrl = rawBaseUrl.trim();

          console.log(`Shwary using callback URL: ${baseUrl}/api/webhooks/shwary`);

          if (type === 'deposit') {
            const shwaryRes = await shwaryService.initiatePayment({
              amount: currency === 'CDF' ? parseFloat(amount) : amountCDF,
              currency: 'CDF',
              phone: safePhone,
              countryCode: 'DRC',
              callbackUrl: `${baseUrl}/api/webhooks/shwary`
            });

            // Update gatewayRef with Shwary's ID for reconciliation
            if (shwaryRes && shwaryRes.id) {
              gatewayRef = shwaryRes.id;
              await client.query(
                'UPDATE transactions SET gateway_reference = $1 WHERE id = $2',
                [gatewayRef, txResult.insertId]
              );
            }
          }
          // Shwary payout integration would go here if supported/needed
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `La requête de ${type.includes('deposit') ? 'dépôt' : 'retrait'} est en cours de traitement.`,
      transactionId: gatewayRef,
      status: status
    });
  } catch (error) {
    console.error('Erreur transaction:', error);
    res.status(error.message === 'Solde insuffisant' ? 400 : 500).json({ error: error.message || 'Erreur serveur' });
  }
});


// Obtenir l'historique des transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération transactions:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les méthodes de paiement actives
router.get('/methods', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM payment_methods WHERE is_enabled = 1 ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur récupération méthodes de paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

