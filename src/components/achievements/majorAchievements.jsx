/**
 * Achievement keys considered "major" — these trigger a full-screen
 * celebration modal instead of just a toast.
 *
 * Criteria: milestone level-ups, mass-mission completion, and rare prestige
 * unlocks that deserve extra fanfare.
 */
const MAJOR_ACHIEVEMENT_KEYS = new Set([
  // Level milestones
  "level_10",
  "level_15",
  "level_20",
  "level_25",
  // Big play counts (50+ games — proxy for "completing 50 missions")
  "play_50",
  "play_100",
  "play_250",
  "play_500",
  // Big win counts
  "win_50",
  "win_100",
  "win_200",
  // Big XP milestones
  "xp_20000",
  "xp_50000",
  // Long streaks
  "streak_10",
  "streak_15",
  // Login devotion
  "login_30",
]);

export function isMajorAchievement(key) {
  return MAJOR_ACHIEVEMENT_KEYS.has(key);
}

export default MAJOR_ACHIEVEMENT_KEYS;