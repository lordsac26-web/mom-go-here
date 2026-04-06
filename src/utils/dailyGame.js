import { ALL_GAMES } from "../components/GameTileManager";

// Filter to actual playable brain games (exclude art studio)
const BRAIN_GAMES = ALL_GAMES.filter(g => g.path !== "/games/artstudio");

/**
 * Deterministic daily game selection based on date string.
 * Same game for all users on the same day.
 */
export function getDailyGame(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % BRAIN_GAMES.length;
  return BRAIN_GAMES[idx];
}

/**
 * Returns today's date string in YYYY-MM-DD format.
 */
export function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}