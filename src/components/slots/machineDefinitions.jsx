/**
 * Multi-Machine Slot System
 * 5 themed machines with unique symbols, payouts, visuals, and unlock criteria.
 * Each machine has a different volatility profile and bonus type.
 */

// ─── MACHINE DEFINITIONS ───────────────────────────────────────────
export const MACHINES = [
  {
    id: "classic",
    name: "Lucky Classic",
    subtitle: "The Original",
    emoji: "🎰",
    unlockRequirement: null, // always unlocked
    unlockLabel: null,
    description: "The classic slot experience with balanced payouts and the original bonus round.",
    volatility: "medium",
    bonusType: "boxes", // original box-pick bonus
    reels: 5,
    rows: 3,
    paylineCount: 20,
    bgGradient: "from-gray-950 via-gray-900 to-gray-950",
    frameGradient: "from-gray-900 via-yellow-900/30 to-gray-900",
    accentColor: "yellow",
    borderColor: "border-yellow-600",
    neonColor: "#eab308",
    symbols: [
      { id: "seven", emoji: "7️⃣", name: "Lucky 7", weight: 3, multiplier: 50 },
      { id: "diamond", emoji: "💎", name: "Diamond", weight: 4, multiplier: 30 },
      { id: "bell", emoji: "🔔", name: "Bell", weight: 5, multiplier: 20 },
      { id: "cherry", emoji: "🍒", name: "Cherry", weight: 7, multiplier: 15 },
      { id: "bar", emoji: "🎰", name: "BAR", weight: 6, multiplier: 12 },
      { id: "star", emoji: "⭐", name: "Star", weight: 8, multiplier: 10 },
      { id: "clover", emoji: "🍀", name: "Clover", weight: 9, multiplier: 8 },
      { id: "lemon", emoji: "🍋", name: "Lemon", weight: 10, multiplier: 5 },
      { id: "grape", emoji: "🍇", name: "Grape", weight: 10, multiplier: 5 },
      { id: "watermelon", emoji: "🍉", name: "Melon", weight: 10, multiplier: 3 },
    ],
    wild: { id: "wild", emoji: "🃏", name: "WILD", weight: 2 },
    scatter: { id: "scatter", emoji: "💰", name: "SCATTER", weight: 3 },
  },
  {
    id: "ocean",
    name: "Deep Blue",
    subtitle: "Treasures of the Sea",
    emoji: "🌊",
    unlockRequirement: { type: "totalSpins", value: 100 },
    unlockLabel: "Spin 100 times on any machine",
    description: "Dive deep for underwater treasure! Higher wild frequency and a Plinko bonus round.",
    volatility: "low",
    bonusType: "plinko",
    reels: 5,
    rows: 3,
    paylineCount: 20,
    bgGradient: "from-blue-950 via-cyan-900 to-blue-950",
    frameGradient: "from-blue-900 via-cyan-800/30 to-blue-900",
    accentColor: "cyan",
    borderColor: "border-cyan-500",
    neonColor: "#06b6d4",
    symbols: [
      { id: "pearl", emoji: "🦪", name: "Pearl", weight: 3, multiplier: 55 },
      { id: "trident", emoji: "🔱", name: "Trident", weight: 4, multiplier: 35 },
      { id: "whale", emoji: "🐳", name: "Whale", weight: 5, multiplier: 22 },
      { id: "octopus", emoji: "🐙", name: "Octopus", weight: 6, multiplier: 16 },
      { id: "turtle", emoji: "🐢", name: "Turtle", weight: 7, multiplier: 12 },
      { id: "fish", emoji: "🐠", name: "Fish", weight: 8, multiplier: 10 },
      { id: "coral", emoji: "🪸", name: "Coral", weight: 9, multiplier: 8 },
      { id: "shell", emoji: "🐚", name: "Shell", weight: 10, multiplier: 5 },
      { id: "wave", emoji: "🌊", name: "Wave", weight: 10, multiplier: 4 },
      { id: "anchor", emoji: "⚓", name: "Anchor", weight: 10, multiplier: 3 },
    ],
    wild: { id: "wild", emoji: "🧜‍♀️", name: "MERMAID WILD", weight: 3 }, // higher wild frequency
    scatter: { id: "scatter", emoji: "🏴‍☠️", name: "TREASURE", weight: 3 },
  },
  {
    id: "pharaoh",
    name: "Pharaoh's Gold",
    subtitle: "Ancient Riches",
    emoji: "🏺",
    unlockRequirement: { type: "biggestWin", value: 5000 },
    unlockLabel: "Win 5,000+ credits in a single spin",
    description: "High-volatility Egyptian adventure! Bigger multipliers, rarer wins, and a free spins bonus.",
    volatility: "high",
    bonusType: "freeSpins",
    reels: 5,
    rows: 3,
    paylineCount: 20,
    bgGradient: "from-amber-950 via-yellow-900 to-amber-950",
    frameGradient: "from-amber-900 via-yellow-800/30 to-amber-900",
    accentColor: "amber",
    borderColor: "border-amber-500",
    neonColor: "#f59e0b",
    symbols: [
      { id: "pharaoh", emoji: "👑", name: "Pharaoh", weight: 2, multiplier: 75 },
      { id: "scarab", emoji: "🪲", name: "Scarab", weight: 3, multiplier: 45 },
      { id: "ankh", emoji: "☥", name: "Ankh", weight: 4, multiplier: 30 },
      { id: "eye", emoji: "👁️", name: "Eye of Ra", weight: 5, multiplier: 22 },
      { id: "snake", emoji: "🐍", name: "Cobra", weight: 6, multiplier: 16 },
      { id: "pyramid", emoji: "🔺", name: "Pyramid", weight: 7, multiplier: 12 },
      { id: "cat", emoji: "🐈‍⬛", name: "Cat", weight: 8, multiplier: 10 },
      { id: "scroll", emoji: "📜", name: "Scroll", weight: 10, multiplier: 6 },
      { id: "vase", emoji: "🏺", name: "Vase", weight: 10, multiplier: 4 },
      { id: "sand", emoji: "🏜️", name: "Desert", weight: 12, multiplier: 3 },
    ],
    wild: { id: "wild", emoji: "🌞", name: "SUN WILD", weight: 2 },
    scatter: { id: "scatter", emoji: "💀", name: "TOMB SCATTER", weight: 2 },
  },
  {
    id: "candy",
    name: "Sugar Rush",
    subtitle: "Sweet Wins",
    emoji: "🍭",
    unlockRequirement: { type: "totalWins", value: 50 },
    unlockLabel: "Win 50 times total across all machines",
    description: "Sweet, frequent wins! Lower volatility with cascading candy and a Plinko multiplier bonus.",
    volatility: "low",
    bonusType: "plinko",
    reels: 5,
    rows: 3,
    paylineCount: 20,
    bgGradient: "from-pink-950 via-fuchsia-900 to-pink-950",
    frameGradient: "from-pink-900 via-fuchsia-800/30 to-pink-900",
    accentColor: "pink",
    borderColor: "border-pink-500",
    neonColor: "#ec4899",
    symbols: [
      { id: "cake", emoji: "🎂", name: "Cake", weight: 3, multiplier: 40 },
      { id: "donut", emoji: "🍩", name: "Donut", weight: 4, multiplier: 28 },
      { id: "icecream", emoji: "🍦", name: "Ice Cream", weight: 5, multiplier: 20 },
      { id: "candy", emoji: "🍬", name: "Candy", weight: 6, multiplier: 15 },
      { id: "lollipop", emoji: "🍭", name: "Lollipop", weight: 7, multiplier: 12 },
      { id: "cookie", emoji: "🍪", name: "Cookie", weight: 8, multiplier: 10 },
      { id: "cupcake", emoji: "🧁", name: "Cupcake", weight: 9, multiplier: 8 },
      { id: "chocolate", emoji: "🍫", name: "Chocolate", weight: 10, multiplier: 6 },
      { id: "gummy", emoji: "🧸", name: "Gummy Bear", weight: 10, multiplier: 5 },
      { id: "cherry2", emoji: "🍒", name: "Cherry", weight: 11, multiplier: 3 },
    ],
    wild: { id: "wild", emoji: "🌈", name: "RAINBOW WILD", weight: 3 },
    scatter: { id: "scatter", emoji: "⭐", name: "STAR SCATTER", weight: 3 },
  },
  {
    id: "space",
    name: "Cosmic Fortune",
    subtitle: "Galactic Jackpots",
    emoji: "🚀",
    unlockRequirement: { type: "totalEarned", value: 100000 },
    unlockLabel: "Earn 100,000 total credits across all machines",
    description: "Ultra high-volatility cosmic adventure! Massive multipliers with both free spins AND Plinko!",
    volatility: "extreme",
    bonusType: "freeSpins", // free spins, but also has random plinko trigger
    hasRandomPlinko: true, // 10% chance of plinko on any win
    reels: 5,
    rows: 3,
    paylineCount: 20,
    bgGradient: "from-violet-950 via-indigo-900 to-violet-950",
    frameGradient: "from-violet-900 via-purple-800/30 to-violet-900",
    accentColor: "violet",
    borderColor: "border-violet-500",
    neonColor: "#8b5cf6",
    symbols: [
      { id: "blackhole", emoji: "🕳️", name: "Black Hole", weight: 1, multiplier: 100 },
      { id: "galaxy", emoji: "🌌", name: "Galaxy", weight: 2, multiplier: 60 },
      { id: "rocket", emoji: "🚀", name: "Rocket", weight: 3, multiplier: 40 },
      { id: "alien", emoji: "👽", name: "Alien", weight: 4, multiplier: 28 },
      { id: "ufo", emoji: "🛸", name: "UFO", weight: 5, multiplier: 20 },
      { id: "planet", emoji: "🪐", name: "Planet", weight: 7, multiplier: 14 },
      { id: "comet", emoji: "☄️", name: "Comet", weight: 8, multiplier: 10 },
      { id: "moon", emoji: "🌙", name: "Moon", weight: 10, multiplier: 6 },
      { id: "star2", emoji: "✨", name: "Star Dust", weight: 12, multiplier: 4 },
      { id: "meteor", emoji: "🌠", name: "Meteor", weight: 12, multiplier: 3 },
    ],
    wild: { id: "wild", emoji: "🛸", name: "UFO WILD", weight: 2 },
    scatter: { id: "scatter", emoji: "🌟", name: "SUPERNOVA", weight: 2 },
  },
];

// ─── UNLOCK CHECKER ──────────────────────────────────────────────
export function isMachineUnlocked(machine, globalStats) {
  if (!machine.unlockRequirement) return true;
  const { type, value } = machine.unlockRequirement;
  const stat = globalStats[type] || 0;
  return stat >= value;
}

export function getUnlockProgress(machine, globalStats) {
  if (!machine.unlockRequirement) return 1;
  const { type, value } = machine.unlockRequirement;
  const stat = globalStats[type] || 0;
  return Math.min(stat / value, 1);
}

// ─── MACHINE-SPECIFIC HELPERS ────────────────────────────────────
export function getMachineAllSymbols(machine) {
  return [...machine.symbols, machine.wild, machine.scatter];
}

export function buildMachineReelStrip(machine) {
  const allSyms = getMachineAllSymbols(machine);
  const strip = [];
  allSyms.forEach(sym => {
    for (let i = 0; i < sym.weight; i++) strip.push(sym);
  });
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

export function getMachineById(id) {
  return MACHINES.find(m => m.id === id) || MACHINES[0];
}

// Global stats key for localStorage
export const GLOBAL_STATS_KEY = "slots_global_stats";

export function loadGlobalStats() {
  try {
    const raw = localStorage.getItem(GLOBAL_STATS_KEY);
    return raw ? JSON.parse(raw) : defaultGlobalStats();
  } catch {
    return defaultGlobalStats();
  }
}

export function saveGlobalStats(stats) {
  try { localStorage.setItem(GLOBAL_STATS_KEY, JSON.stringify(stats)); } catch {}
}

export function defaultGlobalStats() {
  return {
    totalSpins: 0,
    totalWins: 0,
    totalSpent: 0,
    totalEarned: 0,
    biggestWin: 0,
    maxBet: 0,
    scatterWins: 0,
    maxLinesWon: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    unlockedKeys: [],
    machineSpins: {}, // { machineId: spinCount }
  };
}