const { query, transaction } = require('./src/config/database');

const syncHistoricalData = async () => {
    console.log('--- START SYNC ---');
    try {
        const missingEntriesResult = await query(`
      SELECT tp.user_id, t.entry_fee_usd, t.name, tp.joined_at, tp.tournament_id
      FROM tournament_participants tp
      JOIN tournaments t ON tp.tournament_id = t.id
      LEFT JOIN transactions trans ON tp.user_id = trans.user_id 
           AND trans.type = 'tournament_entry' 
           AND ABS(TIMESTAMPDIFF(SECOND, trans.created_at, tp.joined_at)) < 600
      WHERE trans.id IS NULL
    `);

        console.log(`Found ${missingEntriesResult.rows.length} missing entries.`);

        for (const entry of missingEntriesResult.rows) {
            console.log(`Process entry: User ${entry.user_id} for Tournament ${entry.tournament_id}`);
            await transaction(async (client) => {
                console.log('  Inserting transaction...');
                await client.query(
                    "INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description, created_at) VALUES (?, 'tournament_entry', ?, ?, 'USD', 'completed', ?, ?)",
                    [entry.user_id, entry.entry_fee_usd, entry.entry_fee_usd, `Inscription retroactive: ${entry.name}`, entry.joined_at]
                );

                console.log('  Updating system balance...');
                const sysBalanceRes = await client.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
                const balanceBefore = parseFloat(sysBalanceRes.rows[0].balance || 0);
                await client.query(
                    "INSERT INTO system_transactions (type, amount_usd, reason, admin_id, balance_before_usd, balance_after_usd, created_at) VALUES ('credit', ?, ?, 1, ?, ?, ?)",
                    [entry.entry_fee_usd, `Revenu tournoi: ${entry.name}`, balanceBefore, balanceBefore + parseFloat(entry.entry_fee_usd), entry.joined_at]
                );
            });
        }

        const unpaidTournamentsResult = await query(`
      SELECT t.id, t.name, t.prize_pool_usd 
      FROM tournaments t
      WHERE (t.status = 'completed' OR t.end_date < NOW())
      AND NOT EXISTS (
        SELECT 1 FROM tournament_participants tp WHERE tp.tournament_id = t.id AND tp.prize_won_usd > 0
      )
    `);

        console.log(`Found ${unpaidTournamentsResult.rows.length} unpaid tournaments.`);

        for (const t of unpaidTournamentsResult.rows) {
            const winnerRes = await query(
                "SELECT user_id, score FROM tournament_participants WHERE tournament_id = ? ORDER BY score DESC, joined_at ASC LIMIT 1",
                [t.id]
            );

            if (winnerRes.rows.length > 0) {
                const winner = winnerRes.rows[0];
                const prize = parseFloat(t.prize_pool_usd);
                console.log(`Rewarding Tournament ${t.id}: User ${winner.user_id} with ${prize} USD`);

                await transaction(async (client) => {
                    console.log('  Updating user balance...');
                    await client.query(
                        "UPDATE users SET balance_usd = balance_usd + ?, total_earnings = total_earnings + ? WHERE id = ?",
                        [prize, prize, winner.user_id]
                    );

                    console.log('  Inserting prize transaction...');
                    await client.query(
                        "INSERT INTO transactions (user_id, type, amount, amount_usd, currency, status, description) VALUES (?, 'tournament_prize', ?, ?, 'USD', 'completed', ?)",
                        [winner.user_id, prize, prize, `Prix retroactive : ${t.name}`]
                    );

                    console.log('  Updating system balance (debit)...');
                    const sysBalanceRes = await client.query("SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount_usd ELSE -amount_usd END), 0) as balance FROM system_transactions");
                    const balanceBefore = parseFloat(sysBalanceRes.rows[0].balance || 0);
                    await client.query(
                        "INSERT INTO system_transactions (type, amount_usd, reason, admin_id, balance_before_usd, balance_after_usd) VALUES ('debit', ?, ?, 1, ?, ?)",
                        [prize, `Paiement prix tournoi: ${t.name}`, balanceBefore, balanceBefore - prize]
                    );

                    console.log('  Updating participant record...');
                    await client.query(
                        "UPDATE tournament_participants SET prize_won_usd = ? WHERE tournament_id = ? AND user_id = ?",
                        [prize, t.id, winner.user_id]
                    );

                    console.log('  Closing tournament...');
                    await client.query("UPDATE tournaments SET status = 'completed', winner_id = ? WHERE id = ?", [winner.user_id, t.id]);
                });
            }
        }
        console.log('--- END SYNC ---');
    } catch (error) {
        console.error('--- SYNC ERROR ---');
        console.error(error);
    } finally {
        process.exit();
    }
};

syncHistoricalData();
