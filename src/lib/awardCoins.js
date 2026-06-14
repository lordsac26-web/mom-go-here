import { base44 } from "@/api/base44Client";

/**
 * Award coins to a player on a game win. Safe to call fire-and-forget.
 * Creates the PlayerCoins record if it doesn't exist yet.
 * Returns the amount awarded (0 if it failed or no email).
 */
export async function awardCoins(userEmail, amount) {
  if (!userEmail || !amount || amount <= 0) return 0;
  try {
    const rows = await base44.entities.PlayerCoins.filter({ user_email: userEmail });
    const rec = rows[0];
    if (rec) {
      await base44.entities.PlayerCoins.update(rec.id, {
        balance: (rec.balance ?? 0) + amount,
        total_earned: (rec.total_earned ?? 0) + amount,
      });
    } else {
      await base44.entities.PlayerCoins.create({
        user_email: userEmail,
        balance: 500 + amount,
        total_earned: 500 + amount,
        total_spent: 0,
      });
    }
    return amount;
  } catch (e) {
    console.error("awardCoins error:", e);
    return 0;
  }
}

/**
 * Compute a 1–3 star rating from a value against two thresholds.
 * Lower-is-better (e.g. moves, time, errors): pass lowerIsBetter=true.
 * - 3 stars if value <= great
 * - 2 stars if value <= good
 * - 1 star otherwise
 */
export function computeStars(value, great, good, lowerIsBetter = true) {
  if (lowerIsBetter) {
    if (value <= great) return 3;
    if (value <= good) return 2;
    return 1;
  }
  if (value >= great) return 3;
  if (value >= good) return 2;
  return 1;
}

/**
 * Coin reward for a win, scaled by star rating.
 * base = reward for 1 star; each extra star adds 50%.
 */
export function coinsForStars(stars, base = 20) {
  return Math.round(base * (1 + (stars - 1) * 0.5));
}