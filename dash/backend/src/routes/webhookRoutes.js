const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// POST /api/webhooks/pawapay
router.post('/pawapay', async (req, res) => {
  const payload = req.body;
  console.log('Received PawaPay (Dash) webhook:', JSON.stringify(payload));

  try {
    const depositId = payload.depositId;
    const payoutId = payload.payoutId;
    const id = depositId || payoutId;
    const status = payload.status;

    if (!id) return res.status(400).send('No Reference Found');

    if (status === 'COMPLETED' || status === 'SUCCESS') {
       // Fetch transaction
       const txResult = await query('SELECT * FROM system_transactions WHERE gateway_reference = $1 AND status = "pending"', [id]);
       const tx = txResult.rows[0];

       if (tx) {
          const type = tx.type;
          const amount = parseFloat(tx.amount_usd);

          // Get current balance
          const balanceRes = await query(`
             SELECT COALESCE(SUM(CASE WHEN type = 'credit' AND status = 'completed' THEN amount_usd WHEN type = 'debit' AND status = 'completed' THEN -amount_usd ELSE 0 END), 0) as balance
             FROM system_transactions
          `);
          const balanceBefore = parseFloat(balanceRes.rows[0].balance);
          const balanceAfter = type === 'credit' ? balanceBefore + amount : balanceBefore - amount;

          // Update transaction
          await query(
             'UPDATE system_transactions SET status = "completed", balance_before_usd = $1, balance_after_usd = $2 WHERE id = $3',
             [balanceBefore, balanceAfter, tx.id]
          );
       }
    } else if (status === 'FAILED' || status === 'REJECTED') {
       await query('UPDATE system_transactions SET status = "failed" WHERE gateway_reference = $1 AND status = "pending"', [id]);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Dash Webhook Error:', error);
    res.status(500).json({ error: 'Internal Error' });
  }
});

module.exports = router;
