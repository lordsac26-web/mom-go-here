/**
 * Master list of all achievements.
 * Each has a unique key, display info, and a `check` function
 * that receives player stats and returns true if unlocked.
 *
 * Stats shape (built in useAchievements):
 * { totalGames, totalWins, winStreak, bestStreak, level, totalXP, distinctGames,
 *   loginStreak, dailyStreak, totalSpins, solitaireWins, checkersWins,
 *   dartPopBest, yahtzeeHigh, memoryWins, wordSearchWins, buzzwordWins,
 *   mahjongWins, slotsBigWin }
 */

const ACHIEVEMENTS = [
  // ── Games Played ──
  { key: "play_1",      emoji: "🎮", title: "First Steps",       description: "Play your first game",                  category: "Games",  check: s => s.totalGames >= 1 },
  { key: "play_10",     emoji: "🕹️", title: "Getting Started",   description: "Play 10 games",                          category: "Games",  check: s => s.totalGames >= 10 },
  { key: "play_25",     emoji: "🎲", title: "Game Enthusiast",    description: "Play 25 games",                          category: "Games",  check: s => s.totalGames >= 25 },
  { key: "play_50",     emoji: "🏅", title: "Dedicated Player",   description: "Play 50 games",                          category: "Games",  check: s => s.totalGames >= 50 },
  { key: "play_100",    emoji: "💯", title: "Centurion",          description: "Play 100 games",                         category: "Games",  check: s => s.totalGames >= 100 },
  { key: "play_250",    emoji: "🌟", title: "Game Fanatic",       description: "Play 250 games",                         category: "Games",  check: s => s.totalGames >= 250 },
  { key: "play_500",    emoji: "🏰", title: "Game Legend",        description: "Play 500 games",                         category: "Games",  check: s => s.totalGames >= 500 },

  // ── Wins ──
  { key: "win_1",       emoji: "🏆", title: "First Victory",      description: "Win your first game",                    category: "Wins",   check: s => s.totalWins >= 1 },
  { key: "win_10",      emoji: "⭐", title: "Winner",              description: "Win 10 games",                           category: "Wins",   check: s => s.totalWins >= 10 },
  { key: "win_25",      emoji: "🔥", title: "On Fire",             description: "Win 25 games",                           category: "Wins",   check: s => s.totalWins >= 25 },
  { key: "win_50",      emoji: "💎", title: "Diamond Player",      description: "Win 50 games",                           category: "Wins",   check: s => s.totalWins >= 50 },
  { key: "win_100",     emoji: "👑", title: "Royalty",             description: "Win 100 games",                          category: "Wins",   check: s => s.totalWins >= 100 },
  { key: "win_200",     emoji: "🦅", title: "Soaring Victor",     description: "Win 200 games",                          category: "Wins",   check: s => s.totalWins >= 200 },

  // ── Win Streaks ──
  { key: "streak_3",    emoji: "🔥", title: "Hat Trick",          description: "Win 3 games in a row",                   category: "Streaks", check: s => s.bestStreak >= 3 },
  { key: "streak_5",    emoji: "⚡", title: "Hot Streak",          description: "Win 5 games in a row",                   category: "Streaks", check: s => s.bestStreak >= 5 },
  { key: "streak_7",    emoji: "🌋", title: "Unstoppable",         description: "Win 7 games in a row",                   category: "Streaks", check: s => s.bestStreak >= 7 },
  { key: "streak_10",   emoji: "💫", title: "Legendary Streak",    description: "Win 10 games in a row",                  category: "Streaks", check: s => s.bestStreak >= 10 },
  { key: "streak_15",   emoji: "🌠", title: "Supernova",           description: "Win 15 games in a row",                  category: "Streaks", check: s => s.bestStreak >= 15 },

  // ── Levels ──
  { key: "level_2",     emoji: "🌿", title: "Rookie Rank",        description: "Reach Level 2",                          category: "Levels", check: s => s.level >= 2 },
  { key: "level_5",     emoji: "💎", title: "Player Rank",         description: "Reach Level 5",                          category: "Levels", check: s => s.level >= 5 },
  { key: "level_8",     emoji: "⚡", title: "Expert Rank",         description: "Reach Level 8",                          category: "Levels", check: s => s.level >= 8 },
  { key: "level_10",    emoji: "🎖️", title: "Elite Rank",          description: "Reach Level 10",                         category: "Levels", check: s => s.level >= 10 },
  { key: "level_15",    emoji: "🎵", title: "Virtuoso Rank",       description: "Reach Level 15",                         category: "Levels", check: s => s.level >= 15 },
  { key: "level_20",    emoji: "🔮", title: "Immortal Rank",       description: "Reach Level 20",                         category: "Levels", check: s => s.level >= 20 },
  { key: "level_25",    emoji: "💫", title: "Grand Master",        description: "Reach Level 25 — Max Level!",            category: "Levels", check: s => s.level >= 25 },

  // ── XP ──
  { key: "xp_500",      emoji: "✨", title: "XP Collector",       description: "Earn 500 XP",                            category: "XP",     check: s => s.totalXP >= 500 },
  { key: "xp_2000",     emoji: "🌟", title: "XP Hoarder",         description: "Earn 2,000 XP",                          category: "XP",     check: s => s.totalXP >= 2000 },
  { key: "xp_5000",     emoji: "💰", title: "XP Tycoon",          description: "Earn 5,000 XP",                          category: "XP",     check: s => s.totalXP >= 5000 },
  { key: "xp_20000",    emoji: "🏦", title: "XP Mogul",            description: "Earn 20,000 XP",                         category: "XP",     check: s => s.totalXP >= 20000 },
  { key: "xp_50000",    emoji: "💎", title: "XP Legend",            description: "Earn 50,000 XP",                         category: "XP",     check: s => s.totalXP >= 50000 },

  // ── Variety ──
  { key: "variety_3",   emoji: "🎯", title: "Variety Player",     description: "Play 3 different games",                 category: "Variety", check: s => s.distinctGames >= 3 },
  { key: "variety_5",   emoji: "🎪", title: "Jack of All Trades", description: "Play 5 different games",                 category: "Variety", check: s => s.distinctGames >= 5 },
  { key: "variety_7",   emoji: "🌈", title: "Renaissance Gamer",  description: "Play 7 different games",                 category: "Variety", check: s => s.distinctGames >= 7 },
  { key: "variety_9",   emoji: "🎭", title: "Master of All",      description: "Play 9 different games",                 category: "Variety", check: s => s.distinctGames >= 9 },

  // ── Daily Login Streaks ──
  { key: "login_7",     emoji: "📅", title: "Week Warrior",       description: "Log in 7 days in a row",                 category: "Daily",  check: s => s.loginStreak >= 7 },
  { key: "login_14",    emoji: "🗓️", title: "Fortnight Fan",      description: "Log in 14 days in a row",                category: "Daily",  check: s => s.loginStreak >= 14 },
  { key: "login_30",    emoji: "📆", title: "Monthly Devotee",    description: "Log in 30 days in a row",                category: "Daily",  check: s => s.loginStreak >= 30 },

  // ── Daily Devotional Streaks ──
  { key: "daily_7",     emoji: "📖", title: "Weekly Faith",       description: "Visit Daily page 7 days in a row",       category: "Daily",  check: s => s.dailyStreak >= 7 },
  { key: "daily_30",    emoji: "🙏", title: "Monthly Devotion",   description: "Visit Daily page 30 days in a row",      category: "Daily",  check: s => s.dailyStreak >= 30 },

  // ── Game-Specific: Solitaire ──
  { key: "sol_win_1",   emoji: "♠️", title: "First Solitaire Win", description: "Win your first Solitaire game",         category: "Solitaire", check: s => s.solitaireWins >= 1 },
  { key: "sol_win_10",  emoji: "♣️", title: "Card Shark",          description: "Win 10 Solitaire games",                category: "Solitaire", check: s => s.solitaireWins >= 10 },
  { key: "sol_win_25",  emoji: "🃏", title: "Solitaire Master",    description: "Win 25 Solitaire games",                category: "Solitaire", check: s => s.solitaireWins >= 25 },

  // ── Game-Specific: Checkers ──
  { key: "chk_win_1",   emoji: "♟️", title: "First Checkers Win",  description: "Win your first Checkers game",           category: "Checkers", check: s => s.checkersWins >= 1 },
  { key: "chk_win_10",  emoji: "🏁", title: "Checkers Champ",     description: "Win 10 Checkers games",                  category: "Checkers", check: s => s.checkersWins >= 10 },

  // ── Game-Specific: Dart Pop Blitz ──
  { key: "dart_1k",     emoji: "🎯", title: "Dart Starter",       description: "Score 1,000+ in Dart Pop Blitz",         category: "Dart Pop", check: s => s.dartPopBest >= 1000 },
  { key: "dart_5k",     emoji: "🎈", title: "Balloon Buster",     description: "Score 5,000+ in Dart Pop Blitz",         category: "Dart Pop", check: s => s.dartPopBest >= 5000 },
  { key: "dart_10k",    emoji: "💥", title: "Dart Pop Legend",     description: "Score 10,000+ in Dart Pop Blitz",        category: "Dart Pop", check: s => s.dartPopBest >= 10000 },

  // ── Game-Specific: Yahtzee ──
  { key: "ytz_200",     emoji: "🎲", title: "Yahtzee Roller",     description: "Score 200+ in Yahtzee",                  category: "Yahtzee", check: s => s.yahtzeeHigh >= 200 },
  { key: "ytz_300",     emoji: "🎰", title: "Yahtzee High Roller", description: "Score 300+ in Yahtzee",                 category: "Yahtzee", check: s => s.yahtzeeHigh >= 300 },

  // ── Game-Specific: Memory Match ──
  { key: "mem_win_5",   emoji: "🧠", title: "Memory Ace",         description: "Win 5 Memory Match games",               category: "Memory", check: s => s.memoryWins >= 5 },
  { key: "mem_win_15",  emoji: "🧩", title: "Memory Master",      description: "Win 15 Memory Match games",              category: "Memory", check: s => s.memoryWins >= 15 },

  // ── Game-Specific: Word Search ──
  { key: "ws_win_5",    emoji: "🔤", title: "Word Finder",        description: "Complete 5 Word Search puzzles",          category: "Word Search", check: s => s.wordSearchWins >= 5 },
  { key: "ws_win_15",   emoji: "📝", title: "Word Search Pro",    description: "Complete 15 Word Search puzzles",         category: "Word Search", check: s => s.wordSearchWins >= 15 },

  // ── Game-Specific: BuzzWord ──
  { key: "bw_win_5",    emoji: "🐝", title: "Busy Bee",           description: "Win 5 BuzzWord games",                   category: "BuzzWord", check: s => s.buzzwordWins >= 5 },

  // ── Game-Specific: Mahjong ──
  { key: "mj_win_5",    emoji: "🀄", title: "Mahjong Novice",     description: "Win 5 Mahjong games",                    category: "Mahjong", check: s => s.mahjongWins >= 5 },
  { key: "mj_win_15",   emoji: "🏯", title: "Mahjong Master",     description: "Win 15 Mahjong games",                   category: "Mahjong", check: s => s.mahjongWins >= 15 },

  // ── Wheel Spins ──
  { key: "spin_10",     emoji: "🎡", title: "Lucky Spinner",      description: "Spin the daily wheel 10 times",          category: "Daily",  check: s => s.totalSpins >= 10 },
  { key: "spin_50",     emoji: "🎰", title: "Wheel Warrior",      description: "Spin the daily wheel 50 times",          category: "Daily",  check: s => s.totalSpins >= 50 },

  // ── Slot Machine ──
  { key: "slot_big",    emoji: "🍒", title: "Jackpot!",           description: "Win 500+ coins in a single slots spin",  category: "Slots",  check: s => s.slotsBigWin >= 500 },
];

export default ACHIEVEMENTS;

export const CATEGORIES = [
  "Games", "Wins", "Streaks", "Levels", "XP", "Variety", "Daily",
  "Solitaire", "Checkers", "Dart Pop", "Yahtzee", "Memory",
  "Word Search", "BuzzWord", "Mahjong", "Slots",
];