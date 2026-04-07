/**
 * Master list of all achievements.
 * Each has a unique key, display info, and a `check` function
 * that receives player stats and returns true if unlocked.
 *
 * Stats shape (built in useAchievements):
 * { totalGames, totalWins, winStreak, bestStreak, level, totalXP, distinctGames }
 */

const ACHIEVEMENTS = [
  // ── Games Played ──
  { key: "play_1",      emoji: "🎮", title: "First Steps",       description: "Play your first game",                  category: "Games",  check: s => s.totalGames >= 1 },
  { key: "play_10",     emoji: "🕹️", title: "Getting Started",   description: "Play 10 games",                          category: "Games",  check: s => s.totalGames >= 10 },
  { key: "play_25",     emoji: "🎲", title: "Game Enthusiast",    description: "Play 25 games",                          category: "Games",  check: s => s.totalGames >= 25 },
  { key: "play_50",     emoji: "🏅", title: "Dedicated Player",   description: "Play 50 games",                          category: "Games",  check: s => s.totalGames >= 50 },
  { key: "play_100",    emoji: "💯", title: "Centurion",          description: "Play 100 games",                         category: "Games",  check: s => s.totalGames >= 100 },
  { key: "play_250",    emoji: "🌟", title: "Game Fanatic",       description: "Play 250 games",                         category: "Games",  check: s => s.totalGames >= 250 },

  // ── Wins ──
  { key: "win_1",       emoji: "🏆", title: "First Victory",      description: "Win your first game",                    category: "Wins",   check: s => s.totalWins >= 1 },
  { key: "win_10",      emoji: "⭐", title: "Winner",              description: "Win 10 games",                           category: "Wins",   check: s => s.totalWins >= 10 },
  { key: "win_25",      emoji: "🔥", title: "On Fire",             description: "Win 25 games",                           category: "Wins",   check: s => s.totalWins >= 25 },
  { key: "win_50",      emoji: "💎", title: "Diamond Player",      description: "Win 50 games",                           category: "Wins",   check: s => s.totalWins >= 50 },
  { key: "win_100",     emoji: "👑", title: "Royalty",             description: "Win 100 games",                          category: "Wins",   check: s => s.totalWins >= 100 },

  // ── Win Streaks ──
  { key: "streak_3",    emoji: "🔥", title: "Hat Trick",          description: "Win 3 games in a row",                   category: "Streaks", check: s => s.bestStreak >= 3 },
  { key: "streak_5",    emoji: "⚡", title: "Hot Streak",          description: "Win 5 games in a row",                   category: "Streaks", check: s => s.bestStreak >= 5 },
  { key: "streak_7",    emoji: "🌋", title: "Unstoppable",         description: "Win 7 games in a row",                   category: "Streaks", check: s => s.bestStreak >= 7 },
  { key: "streak_10",   emoji: "💫", title: "Legendary Streak",    description: "Win 10 games in a row",                  category: "Streaks", check: s => s.bestStreak >= 10 },

  // ── Levels ──
  { key: "level_2",     emoji: "🌿", title: "Rookie Rank",        description: "Reach Level 2",                          category: "Levels", check: s => s.level >= 2 },
  { key: "level_5",     emoji: "💎", title: "Expert Rank",         description: "Reach Level 5",                          category: "Levels", check: s => s.level >= 5 },
  { key: "level_7",     emoji: "👑", title: "Master Rank",         description: "Reach Level 7",                          category: "Levels", check: s => s.level >= 7 },
  { key: "level_10",    emoji: "💫", title: "Grand Master",        description: "Reach Level 10",                         category: "Levels", check: s => s.level >= 10 },

  // ── XP ──
  { key: "xp_500",      emoji: "✨", title: "XP Collector",       description: "Earn 500 XP",                            category: "XP",     check: s => s.totalXP >= 500 },
  { key: "xp_2000",     emoji: "🌟", title: "XP Hoarder",         description: "Earn 2,000 XP",                          category: "XP",     check: s => s.totalXP >= 2000 },
  { key: "xp_5000",     emoji: "💰", title: "XP Tycoon",          description: "Earn 5,000 XP",                          category: "XP",     check: s => s.totalXP >= 5000 },

  // ── Variety ──
  { key: "variety_3",   emoji: "🎯", title: "Variety Player",     description: "Play 3 different games",                 category: "Variety", check: s => s.distinctGames >= 3 },
  { key: "variety_5",   emoji: "🎪", title: "Jack of All Trades", description: "Play 5 different games",                 category: "Variety", check: s => s.distinctGames >= 5 },
  { key: "variety_7",   emoji: "🌈", title: "Renaissance Gamer",  description: "Play 7 different games",                 category: "Variety", check: s => s.distinctGames >= 7 },
];

export default ACHIEVEMENTS;

export const CATEGORIES = ["Games", "Wins", "Streaks", "Levels", "XP", "Variety"];