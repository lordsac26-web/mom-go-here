import { base44 } from "@/api/base44Client";

/**
 * Award coins to a player on a game win via the secure `economy` backend function.
 * The server computes the coin amount from the star rating — the client cannot
 * dictate an arbitrary amount. Safe to call fire-and-forget.
 * Returns the amount awarded (0 if it failed).
 */
export async function awardCoinsForStars(stars, base = 20) {
  try {
    const res = await base44.functions.invoke("economy", { action: "award", stars, base });
    return res?.data?.awarded ?? 0;
  } catch (e) {
    console.error("awardCoinsForStars error:", e);
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