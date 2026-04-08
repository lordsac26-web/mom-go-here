import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const POOL_NAME = "lucky_slots_main";
const CONTRIBUTION_RATE = 0.02; // 2% of each bet goes to the pool
const JACKPOT_BASE_CHANCE = 0.0003; // 0.03% base chance per spin
const JACKPOT_WIN_PAYOUT_RATE = 0.6; // winner gets 60% of pool
const SEED_AMOUNT = 100000; // initial pool seed

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "get") {
    // Just fetch current jackpot
    const pools = await base44.asServiceRole.entities.ProgressiveJackpot.filter({ pool_name: POOL_NAME });
    if (pools.length === 0) {
      const pool = await base44.asServiceRole.entities.ProgressiveJackpot.create({
        pool_name: POOL_NAME,
        current_amount: SEED_AMOUNT,
        total_contributions: 0,
        total_spins: 0,
      });
      return Response.json({ jackpot: pool.current_amount, lastWinner: null });
    }
    const pool = pools[0];
    return Response.json({
      jackpot: pool.current_amount,
      lastWinner: pool.last_winner_name ? {
        name: pool.last_winner_name,
        amount: pool.last_win_amount,
        date: pool.last_win_date,
      } : null,
    });
  }

  if (action === "spin") {
    const { betAmount } = body;
    // Security: validate betAmount is a finite positive number, cap at max
    if (typeof betAmount !== "number" || !Number.isFinite(betAmount) || betAmount <= 0 || betAmount > 500000) {
      return Response.json({ error: "Invalid bet" }, { status: 400 });
    }

    // Get or create pool
    let pools = await base44.asServiceRole.entities.ProgressiveJackpot.filter({ pool_name: POOL_NAME });
    let pool;
    if (pools.length === 0) {
      pool = await base44.asServiceRole.entities.ProgressiveJackpot.create({
        pool_name: POOL_NAME,
        current_amount: SEED_AMOUNT,
        total_contributions: 0,
        total_spins: 0,
      });
    } else {
      pool = pools[0];
    }

    const contribution = Math.round(betAmount * CONTRIBUTION_RATE);
    const newAmount = pool.current_amount + contribution;
    const newTotalContributions = (pool.total_contributions || 0) + contribution;
    const newTotalSpins = (pool.total_spins || 0) + 1;

    // Check jackpot win — higher bets get slightly better odds
    const betMultiplier = Math.min(betAmount / 1000, 3); // cap at 3x
    const winChance = JACKPOT_BASE_CHANCE * Math.max(1, betMultiplier);
    const roll = Math.random();
    const isJackpotWin = roll < winChance && newAmount >= SEED_AMOUNT;

    if (isJackpotWin) {
      const winAmount = Math.round(newAmount * JACKPOT_WIN_PAYOUT_RATE);
      const remainingPool = SEED_AMOUNT; // Reset to seed

      await base44.asServiceRole.entities.ProgressiveJackpot.update(pool.id, {
        current_amount: remainingPool,
        total_contributions: newTotalContributions,
        total_spins: newTotalSpins,
        last_winner_name: user.full_name || user.email.split("@")[0],
        last_win_amount: winAmount,
        last_win_date: new Date().toISOString(),
      });

      return Response.json({
        jackpot: remainingPool,
        jackpotWin: true,
        winAmount,
        winnerName: user.full_name || user.email,
      });
    }

    // No jackpot — just update pool
    await base44.asServiceRole.entities.ProgressiveJackpot.update(pool.id, {
      current_amount: newAmount,
      total_contributions: newTotalContributions,
      total_spins: newTotalSpins,
    });

    return Response.json({
      jackpot: newAmount,
      jackpotWin: false,
    });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
});