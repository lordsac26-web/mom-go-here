/**
 * Pool of ~45 daily mission templates.
 * Each day, 3 are randomly selected for the player.
 * type = category used for progress tracking via useGameActivity / stores
 *
 * Mission types:
 *  play_any       — play any game N times
 *  win_any        — win any game N times
 *  play_specific  — play a specific game (game field)
 *  win_specific   — win a specific game (game field)
 *  streak         — achieve a win streak of N
 *  spin_wheel     — spin the daily wheel
 *  visit_page     — visit a specific page
 *  daily_login    — claim daily login bonus
 *  journal        — write a journal entry
 *  gallery        — post or like in the gallery
 *  checkers_king  — crown a king in checkers
 *  score_threshold — reach a score threshold in a game
 */

const MISSION_POOL = [
  // ── Play Games ──
  { id: "play_1",        title: "Game Time",           description: "Play 1 game",                    emoji: "🎮", target: 1, xp_reward: 25,  type: "play_any" },
  { id: "play_2",        title: "Double Feature",      description: "Play 2 games",                   emoji: "🎮", target: 2, xp_reward: 40,  type: "play_any" },
  { id: "play_3",        title: "Triple Threat",       description: "Play 3 games",                   emoji: "🎮", target: 3, xp_reward: 60,  type: "play_any" },
  { id: "play_5",        title: "Marathon Session",    description: "Play 5 games",                   emoji: "🏃", target: 5, xp_reward: 100, type: "play_any" },

  // ── Win Games ──
  { id: "win_1",         title: "Victory Lap",         description: "Win 1 game",                     emoji: "🏆", target: 1, xp_reward: 35,  type: "win_any" },
  { id: "win_2",         title: "Double Win",          description: "Win 2 games",                    emoji: "🏆", target: 2, xp_reward: 60,  type: "win_any" },
  { id: "win_3",         title: "Three-Peat",          description: "Win 3 games",                    emoji: "🏆", target: 3, xp_reward: 90,  type: "win_any" },

  // ── Specific Games ──
  { id: "play_memory",   title: "Memory Lane",         description: "Play a Memory game",             emoji: "🧠", target: 1, xp_reward: 30,  type: "play_specific", game: "Memory Game" },
  { id: "play_yahtzee",  title: "Roll the Dice",       description: "Play Yahtzee",                   emoji: "🎲", target: 1, xp_reward: 30,  type: "play_specific", game: "Yahtzee" },
  { id: "play_wordsearch", title: "Word Hunter",       description: "Play Word Search",               emoji: "🔍", target: 1, xp_reward: 30,  type: "play_specific", game: "Word Search" },
  { id: "play_sudoku",   title: "Number Cruncher",     description: "Play Sudoku",                    emoji: "🔢", target: 1, xp_reward: 30,  type: "play_specific", game: "Sudoku" },
  { id: "play_checkers", title: "Board Master",        description: "Play Checkers",                  emoji: "♟️", target: 1, xp_reward: 30,  type: "play_specific", game: "Checkers" },
  { id: "play_mahjong",  title: "Tile Matcher",        description: "Play Mahjong",                   emoji: "🀄", target: 1, xp_reward: 30,  type: "play_specific", game: "Mahjong" },
  { id: "play_solitaire",title: "Card Shark",          description: "Play Solitaire",                 emoji: "🃏", target: 1, xp_reward: 30,  type: "play_specific", game: "Solitaire" },
  { id: "play_buzzword", title: "Buzz Buzz",           description: "Play BuzzWord",                  emoji: "🐝", target: 1, xp_reward: 30,  type: "play_specific", game: "Buzz Word" },
  { id: "play_slots",    title: "Feeling Lucky",       description: "Play the Slots",                 emoji: "🎰", target: 1, xp_reward: 30,  type: "play_specific", game: "Lucky Slots" },
  { id: "play_dartpop",  title: "Pop Pop Pop",         description: "Play Dart Pop Blitz",            emoji: "🎯", target: 1, xp_reward: 30,  type: "play_specific", game: "Dart Pop Blitz" },
  { id: "play_art",      title: "Creative Spark",      description: "Create art in AI Art Studio",    emoji: "🎨", target: 1, xp_reward: 30,  type: "play_specific", game: "AI Art Studio" },

  // ── Win Specific Games ──
  { id: "win_checkers",  title: "Checker Champion",    description: "Win a Checkers game",            emoji: "♟️", target: 1, xp_reward: 50,  type: "win_specific", game: "Checkers" },
  { id: "win_memory",    title: "Memory Master",       description: "Win a Memory game",              emoji: "🧠", target: 1, xp_reward: 50,  type: "win_specific", game: "Memory Game" },
  { id: "win_solitaire", title: "Solitaire Star",      description: "Win a Solitaire game",           emoji: "🃏", target: 1, xp_reward: 50,  type: "win_specific", game: "Solitaire" },
  { id: "win_sudoku",    title: "Sudoku Solver",       description: "Win a Sudoku game",              emoji: "🔢", target: 1, xp_reward: 50,  type: "win_specific", game: "Sudoku" },
  { id: "win_wordsearch",title: "Word Wizard",         description: "Win a Word Search game",         emoji: "🔍", target: 1, xp_reward: 50,  type: "win_specific", game: "Word Search" },

  // ── Streaks ──
  { id: "streak_2",      title: "Winning Pair",        description: "Win 2 games in a row",           emoji: "🔥", target: 2, xp_reward: 60,  type: "streak" },
  { id: "streak_3",      title: "On a Roll",           description: "Win 3 games in a row",           emoji: "🔥", target: 3, xp_reward: 100, type: "streak" },

  // ── Social & Features ──
  { id: "spin_wheel",    title: "Spin to Win",         description: "Spin the Daily Wheel",           emoji: "🎡", target: 1, xp_reward: 20,  type: "spin_wheel" },
  { id: "claim_login",   title: "Show Up!",            description: "Claim your daily login bonus",   emoji: "📅", target: 1, xp_reward: 20,  type: "daily_login" },
  { id: "journal_entry", title: "Dear Diary",          description: "Write a journal entry",          emoji: "📝", target: 1, xp_reward: 30,  type: "journal" },
  { id: "gallery_post",  title: "Art Share",           description: "Post to the Gallery",            emoji: "🖼️", target: 1, xp_reward: 30,  type: "gallery_post" },
  { id: "gallery_like",  title: "Art Lover",           description: "Like 2 gallery posts",           emoji: "❤️", target: 2, xp_reward: 20,  type: "gallery_like" },
  { id: "visit_progress",title: "Self Reflection",     description: "Check your Progress page",       emoji: "📊", target: 1, xp_reward: 15,  type: "visit_page", page: "/progress" },
  { id: "visit_rankings",title: "Leaderboard Scout",   description: "Visit the Rankings page",        emoji: "📈", target: 1, xp_reward: 15,  type: "visit_page", page: "/rankings" },
  { id: "visit_achieve", title: "Badge Hunter",        description: "View your Achievements",         emoji: "🏅", target: 1, xp_reward: 15,  type: "visit_page", page: "/achievements" },

  // ── Checkers Specific ──
  { id: "checkers_king", title: "Crown Royale",        description: "Crown a king in Checkers",       emoji: "👑", target: 1, xp_reward: 40,  type: "checkers_king" },
  { id: "checkers_3cap", title: "Triple Capture",      description: "Capture 3+ pieces in Checkers",  emoji: "⚔️", target: 3, xp_reward: 50,  type: "checkers_capture" },

  // ── Variety ──
  { id: "variety_2",     title: "Mix It Up",           description: "Play 2 different games today",   emoji: "🎯", target: 2, xp_reward: 50,  type: "variety" },
  { id: "variety_3",     title: "Game Sampler",        description: "Play 3 different games today",   emoji: "🎪", target: 3, xp_reward: 80,  type: "variety" },

  // ── Challenge ──
  { id: "daily_challenge", title: "Brain Teaser",      description: "Complete the Daily Challenge",   emoji: "🧩", target: 1, xp_reward: 40,  type: "daily_challenge" },
  { id: "scripture_read",  title: "Soul Food",         description: "Read today's scripture",         emoji: "📖", target: 1, xp_reward: 20,  type: "visit_page", page: "/daily" },
];

export const ALL_COMPLETE_BONUS_XP = 75;

/**
 * Pick N random missions from the pool, avoiding duplicates.
 */
export function pickRandomMissions(count = 3) {
  const shuffled = [...MISSION_POOL].sort(() => Math.random() - 0.5);
  // Ensure variety: pick at most 1 from each type prefix
  const picked = [];
  const usedTypes = new Set();
  for (const m of shuffled) {
    if (picked.length >= count) break;
    // Allow same broad type but not exact same mission
    const typeKey = m.type + (m.game || m.page || "");
    if (usedTypes.has(typeKey)) continue;
    usedTypes.add(typeKey);
    picked.push({
      ...m,
      progress: 0,
      completed: false,
    });
  }
  return picked;
}

export default MISSION_POOL;