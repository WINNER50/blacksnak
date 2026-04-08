const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const pawaPayService = require('../services/pawaPayService');

// GET /api/webhooks/pawapay (Pour test de visibilité)
router.get('/pawapay', (req, res) => {
  res.json({ message: "Webhook endpoint is active. Use POST for PawaPay notifications." });
});

// POST /api/webhooks/pawapay
router.post('/pawapay', async (req, res) => {
  const payload = req.body;
  console.log('--- REÇU WEBHOOK PAWAPAY ---');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const depositId = payload.depositId;
    const payoutId = payload.payoutId;
    const id = depositId || payoutId;
    const isDeposit = !!depositId;
    const status = payload.status;

    if (!id) {
      console.error('Webhook Error: No Reference ID (depositId or payoutId) found in payload');
      return res.status(400).send('No Reference Found');
    }

    console.log(`Processing ${isDeposit ? 'Deposit' : 'Payout'}: ${id}, Status: ${status}`);

    if (status === 'COMPLETED' || status === 'SUCCESS') {
      await transaction(async (client) => {
        // Fetch transaction record
        const txResult = await client.query(
          'SELECT * FROM transactions WHERE gateway_reference = $1 AND status != "completed"',
          [id]
        );
        const tx = txResult.rows[0];

        if (!tx) {
          console.warn(`Webhook: Transaction ${id} not found or already completed.`);
          return;
        }

        console.log(`Found pending transaction ${tx.id} for user ${tx.user_id}`);

        // Update status for ALL related tables
        await client.query(
          'UPDATE transactions SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE gateway_reference = $1',
          [id]
        );
        await client.query(
          'UPDATE recharge_history SET status = "completed" WHERE gateway_reference = $1',
          [id]
        );
        await client.query(
          'UPDATE withdrawal_history SET status = "completed" WHERE gateway_reference = $1',
          [id]
        );

        // --- System Transactions Specifics ---
        const sysTxRes = await client.query('SELECT * FROM system_transactions WHERE gateway_reference = $1 AND status != "completed"', [id]);
        if (sysTxRes.rows.length > 0) {
          const sysTx = sysTxRes.rows[0];
          const amountUsd = parseFloat(sysTx.amount_usd || 0);

          // Re-calculate balance after safely for system
          const balanceResult = await client.query(`
              SELECT COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount_usd WHEN type = 'debit' AND status = 'completed' THEN -amount_usd ELSE 0 END), 0) as balance
              FROM system_transactions
            `);
          const currentBalance = parseFloat(balanceResult.rows[0].balance);
          const newBalance = sysTx.type === 'credit' ? currentBalance + amountUsd : currentBalance - amountUsd;

          await client.query(
            'UPDATE system_transactions SET status = "completed", balance_before_usd = $1, balance_after_usd = $2 WHERE id = $3',
            [currentBalance, newBalance, sysTx.id]
          );
          console.log(`SUCCESS: System Transaction ${sysTx.id} completed.`);
        }

        // Update User balance ONLY if it's a deposit (since payouts are deducted upfront)
        if (isDeposit) {
          const amountUSD = parseFloat(tx.amount_usd || 0);
          const amountCDF = parseFloat(tx.amount_cdf || 0);

          console.log(`Updating balance: +${amountUSD} USD / ${amountCDF} CDF for User ${tx.user_id}`);

          await client.query(
            'UPDATE users SET balance_usd = balance_usd + $1, balance_cdf = balance_cdf + $2 WHERE id = $3',
            [amountUSD, amountCDF, tx.user_id]
          );

          console.log(`SUCCESS: Balance updated for User ${tx.user_id}`);
        } else {
          console.log(`SUCCESS: Payout completed for User ${tx.user_id} (balance was already deducted upfront).`);
        }
      });
    } else if (status === 'FAILED' || status === 'REJECTED') {
      console.log(`Transaction ${id} marked as FAILED in gateway.`);
      await transaction(async (client) => {
        const txResult = await client.query(
          'SELECT * FROM transactions WHERE gateway_reference = $1 AND status != "completed"',
          [id]
        );
        const tx = txResult.rows[0];

        if (tx && tx.status !== 'failed') {
          await client.query(
            'UPDATE transactions SET status = "failed" WHERE id = $1',
            [tx.id]
          );

          // If it was a payout, refund the user since it was deducted upfront
          if (!isDeposit) {
            const amountUSD = parseFloat(tx.amount_usd || 0);
            const amountCDF = parseFloat(tx.amount_cdf || 0);
            await client.query(
              'UPDATE users SET balance_usd = balance_usd + ?, balance_cdf = balance_cdf + ? WHERE id = ?',
              [amountUSD, amountCDF, tx.user_id]
            );
            console.log(`REFUND: Restored ${amountUSD} USD to User ${tx.user_id} for failed payout.`);
          }
        }
      });
    } else {
      console.log(`Webhook: Status ${status} ignored.`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook Critical Error:', error.message);
    res.status(500).json({ error: 'Internal Error' });
  }
});

// GET /api/webhooks/shwary (Pour test de visibilité)
router.get('/shwary', (req, res) => {
  res.json({ message: "Shwary Webhook endpoint is active. Use POST for notifications." });
});

// POST /api/webhooks/shwary
router.post('/shwary', async (req, res) => {
  const payload = req.body;
  console.log('--- REÇU WEBHOOK SHWARY ---');
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const id = payload.id; // Shwary Transaction ID
    const status = payload.status; // pending, completed, failed, cancelled

    if (!id) {
      return res.status(400).send('No ID Found');
    }

    if (status === 'completed') {
      await transaction(async (client) => {
        // 1. Fetch transaction record
        const txResult = await client.query(
          'SELECT * FROM transactions WHERE gateway_reference = $1 AND status != "completed"',
          [id]
        );
        const tx = txResult.rows[0];

        if (!tx) {
          console.warn(`Shwary Webhook: Transaction ${id} not found or already completed.`);
          return;
        }

        console.log(`Shwary: Processing completion for Tx ${tx.id} (User ${tx.user_id})`);

        // 2. Update status for ALL related tables
        await client.query(
          'UPDATE transactions SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = $1',
          [tx.id]
        );
        await client.query(
          'UPDATE recharge_history SET status = "completed" WHERE gateway_reference = $1',
          [id]
        );
        await client.query(
          'UPDATE withdrawal_history SET status = "completed" WHERE gateway_reference = $1',
          [id]
        );

        // 3. Handle System Transactions balance reconciliation
        const sysTxRes = await client.query('SELECT * FROM system_transactions WHERE gateway_reference = $1 AND status != "completed"', [id]);
        if (sysTxRes.rows.length > 0) {
          const sysTx = sysTxRes.rows[0];
          const amountUsd = parseFloat(sysTx.amount_usd || 0);

          const balanceResult = await client.query(`
              SELECT COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount_usd WHEN type = 'debit' AND status = 'completed' THEN -amount_usd ELSE 0 END), 0) as balance
              FROM system_transactions
            `);
          const currentBalance = parseFloat(balanceResult.rows[0].balance);
          const newBalance = sysTx.type === 'credit' ? currentBalance + amountUsd : currentBalance - amountUsd;

          await client.query(
            'UPDATE system_transactions SET status = "completed", balance_before_usd = $1, balance_after_usd = $2 WHERE id = $3',
            [currentBalance, newBalance, sysTx.id]
          );
        }

        // 4. Update User balance ONLY if it's a deposit
        if (tx.type === 'deposit' || tx.type === 'admin_recharge') {
          const amountUSD = parseFloat(tx.amount_usd || 0);
          const amountCDF = parseFloat(tx.amount_cdf || 0);

          await client.query(
            'UPDATE users SET balance_usd = balance_usd + $1, balance_cdf = balance_cdf + $2 WHERE id = $3',
            [amountUSD, amountCDF, tx.user_id]
          );
          console.log(`SUCCESS SHWARY: Balance updated for User ${tx.user_id}`);
        }
      });
    } else if (status === 'failed' || status === 'cancelled') {
        console.log(`Shwary Transaction ${id} marked as ${status.toUpperCase()}.`);
        await transaction(async (client) => {
            await client.query(
                'UPDATE transactions SET status = "failed" WHERE gateway_reference = $1 AND status != "completed"',
                [id]
            );
            await client.query(
                'UPDATE recharge_history SET status = "failed" WHERE gateway_reference = $1 AND status != "completed"',
                [id]
            );
            await client.query(
                'UPDATE withdrawal_history SET status = "failed" WHERE gateway_reference = $1 AND status != "completed"',
                [id]
            );
            await client.query(
                'UPDATE system_transactions SET status = "failed" WHERE gateway_reference = $1 AND status != "completed"',
                [id]
            );
        });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Shwary Webhook Error:', error.message);
    res.status(500).json({ error: 'Internal Error' });
  }
});

module.exports = router;
