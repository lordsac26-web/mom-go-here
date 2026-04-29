/**
 * Dynamic bet scaling based on player level, machine tier, and wallet balance.
 *
 * Rules:
 * - Player level unlocks higher bet tiers within a machine's bet range
 * - Max Bet button never exceeds 20% of wallet balance
 * - Emergency fund drip kicks in when balance < EMERGENCY_THRESHOLD
 */

// Machine tier order (index = tier)
const MACHINE_TIER = { classic: 0, ocean: 1, candy: 1, pharaoh: 2, space: 3 };

// How many bet levels a player can access based on level
// Level 1-2: first 3 tiers, Level 3-4: first 4, Level 5-7: first 5, Level 8+: all 6
function getAccessibleBetCount(playerLevel) {
  if (playerLevel >= 8) return 6;
  if (playerLevel >= 5) return 5;
  if (playerLevel >= 3) return 4;
  return 3;
}

/**
 * Returns the effective bet levels for a machine given the player's level.
 * @param {Array<number>} machineBetLevels - The machine's full bet range
 * @param {number} playerLevel - Current player level (1-10)
 * @returns {Array<number>} Accessible bet levels
 */
export function getEffectiveBetLevels(machineBetLevels, playerLevel) {
  const count = getAccessibleBetCount(playerLevel);
  return machineBetLevels.slice(0, Math.min(count, machineBetLevels.length));
}

/**
 * Calculates the maximum safe bet (20% of wallet balance), snapped down
 * to the nearest available bet level.
 * @param {number} balance - Current wallet balance
 * @param {Array<number>} betLevels - Available bet levels
 * @returns {number} The safe max bet
 */
export function getSafeMaxBet(balance, betLevels) {
  const cap = Math.floor(balance * 0.2);
  // Find the highest bet level that doesn't exceed the cap
  let safeBet = betLevels[0];
  for (const level of betLevels) {
    if (level <= cap) safeBet = level;
    else break;
  }
  return safeBet;
}

// Emergency fund thresholds
export const EMERGENCY_THRESHOLD = 5000; // balance below this triggers drip
export const EMERGENCY_DRIP_AMOUNT = 25000; // daily drip amount