/**
 * Checkers cosmetic system — board styles and piece skins.
 *
 * Unlock methods:
 *  "default"     — always available
 *  "level"       — unlocked at a certain player level
 *  "achievement" — unlocked by earning a specific achievement
 *  "wins"        — unlocked after N checkers wins
 *  "rare_drop"   — 0.5% chance after winning a checkers game
 */

export const BOARD_STYLES = [
  {
    id: "classic",
    name: "Classic Wood",
    unlock: "default",
    darkColor: "from-green-900 via-green-800 to-green-900",
    lightColor: "from-amber-100 via-amber-50 to-amber-100",
    borderColor: "#5c3a1e",
    borderShadow: "#3a2510",
    grainOpacity: 0.10,
    emoji: "🌲",
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    unlock: "level",
    unlockValue: 3,
    darkColor: "from-slate-900 via-blue-900 to-slate-900",
    lightColor: "from-slate-200 via-slate-100 to-slate-200",
    borderColor: "#1e3a5c",
    borderShadow: "#0f1d2e",
    grainOpacity: 0.05,
    emoji: "🌙",
  },
  {
    id: "cherry",
    name: "Cherry Blossom",
    unlock: "level",
    unlockValue: 6,
    darkColor: "from-rose-900 via-pink-800 to-rose-900",
    lightColor: "from-pink-100 via-rose-50 to-pink-100",
    borderColor: "#6b2141",
    borderShadow: "#3d1227",
    grainOpacity: 0.08,
    emoji: "🌸",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    unlock: "wins",
    unlockValue: 10,
    darkColor: "from-cyan-900 via-teal-900 to-cyan-900",
    lightColor: "from-cyan-100 via-teal-50 to-cyan-100",
    borderColor: "#0f4c5c",
    borderShadow: "#072a33",
    grainOpacity: 0.06,
    emoji: "🌊",
  },
  {
    id: "volcano",
    name: "Volcanic",
    unlock: "level",
    unlockValue: 12,
    darkColor: "from-red-950 via-orange-900 to-red-950",
    lightColor: "from-orange-200 via-amber-100 to-orange-200",
    borderColor: "#7f1d1d",
    borderShadow: "#450a0a",
    grainOpacity: 0.12,
    emoji: "🌋",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    unlock: "level",
    unlockValue: 18,
    darkColor: "from-purple-950 via-indigo-900 to-purple-950",
    lightColor: "from-purple-200 via-indigo-100 to-purple-200",
    borderColor: "#4c1d95",
    borderShadow: "#2e1065",
    grainOpacity: 0.04,
    emoji: "🌌",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    unlock: "rare_drop",
    dropChance: 0.005, // 0.5%
    darkColor: "from-gray-950 via-gray-900 to-gray-950",
    lightColor: "from-gray-300 via-gray-200 to-gray-300",
    borderColor: "#18181b",
    borderShadow: "#09090b",
    grainOpacity: 0.02,
    emoji: "🖤",
    rarity: "Legendary",
  },
];

export const PIECE_SKINS = [
  {
    id: "classic",
    name: "Classic",
    unlock: "default",
    p1: { gradient: "radial-gradient(circle at 35% 35%, #ff6b6b, #dc2626 50%, #991b1b)", shadow: "#7f1d1d" },
    p2: { gradient: "radial-gradient(circle at 35% 35%, #6b7280, #1f2937 50%, #111827)", shadow: "#030712" },
    ringColor: "rgba(255,255,255,0.25)",
    emoji: "🔴",
  },
  {
    id: "royal",
    name: "Royal Gold",
    unlock: "level",
    unlockValue: 5,
    p1: { gradient: "radial-gradient(circle at 35% 35%, #fbbf24, #d97706 50%, #92400e)", shadow: "#78350f" },
    p2: { gradient: "radial-gradient(circle at 35% 35%, #a78bfa, #6d28d9 50%, #3b0764)", shadow: "#1e1b4b" },
    ringColor: "rgba(255,255,255,0.35)",
    emoji: "👑",
  },
  {
    id: "neon",
    name: "Neon",
    unlock: "level",
    unlockValue: 8,
    p1: { gradient: "radial-gradient(circle at 35% 35%, #22d3ee, #06b6d4 50%, #0e7490)", shadow: "#155e75", glow: "0 0 12px rgba(34,211,238,0.5)" },
    p2: { gradient: "radial-gradient(circle at 35% 35%, #f472b6, #ec4899 50%, #be185d)", shadow: "#831843", glow: "0 0 12px rgba(244,114,182,0.5)" },
    ringColor: "rgba(255,255,255,0.4)",
    emoji: "💡",
  },
  {
    id: "crystal",
    name: "Crystal",
    unlock: "wins",
    unlockValue: 25,
    p1: { gradient: "radial-gradient(circle at 30% 30%, #e0f2fe, #7dd3fc 40%, #0ea5e9 70%, #0369a1)", shadow: "#075985", glow: "0 0 10px rgba(125,211,252,0.4)" },
    p2: { gradient: "radial-gradient(circle at 30% 30%, #fef3c7, #fcd34d 40%, #f59e0b 70%, #b45309)", shadow: "#92400e", glow: "0 0 10px rgba(252,211,77,0.4)" },
    ringColor: "rgba(255,255,255,0.5)",
    emoji: "💎",
  },
  {
    id: "ember",
    name: "Ember",
    unlock: "level",
    unlockValue: 15,
    p1: { gradient: "radial-gradient(circle at 35% 35%, #fef08a, #f97316 50%, #c2410c)", shadow: "#7c2d12", glow: "0 0 14px rgba(249,115,22,0.5)" },
    p2: { gradient: "radial-gradient(circle at 35% 35%, #bbf7d0, #22c55e 50%, #15803d)", shadow: "#14532d", glow: "0 0 14px rgba(34,197,94,0.5)" },
    ringColor: "rgba(255,255,255,0.3)",
    emoji: "🔥",
  },
  {
    id: "shadow",
    name: "Shadow",
    unlock: "achievement",
    unlockAchievement: "streak_7",
    p1: { gradient: "radial-gradient(circle at 35% 35%, #a1a1aa, #52525b 50%, #27272a)", shadow: "#18181b", glow: "0 0 8px rgba(161,161,170,0.3)" },
    p2: { gradient: "radial-gradient(circle at 35% 35%, #fca5a5, #ef4444 50%, #7f1d1d)", shadow: "#450a0a", glow: "0 0 8px rgba(252,165,165,0.3)" },
    ringColor: "rgba(255,255,255,0.15)",
    emoji: "🌑",
  },
  {
    id: "stardust",
    name: "Stardust",
    unlock: "rare_drop",
    dropChance: 0.005,
    p1: { gradient: "radial-gradient(circle at 30% 30%, #fef9c3, #fde68a 30%, #a855f7 60%, #7c3aed)", shadow: "#4c1d95", glow: "0 0 16px rgba(168,85,247,0.6)" },
    p2: { gradient: "radial-gradient(circle at 30% 30%, #e0f2fe, #93c5fd 30%, #f43f5e 60%, #be123c)", shadow: "#881337", glow: "0 0 16px rgba(244,63,94,0.6)" },
    ringColor: "rgba(255,255,255,0.5)",
    emoji: "✨",
    rarity: "Legendary",
  },
];

/**
 * Check if a cosmetic is unlocked.
 * @param {object} cosmetic - board style or piece skin definition
 * @param {object} playerData - { level, checkersWins, achievements: string[], unlockedItems: string[] }
 */
export function isCosmeticUnlocked(cosmetic, playerData) {
  if (cosmetic.unlock === "default") return true;
  if (cosmetic.unlock === "level") return playerData.level >= cosmetic.unlockValue;
  if (cosmetic.unlock === "wins") return playerData.checkersWins >= cosmetic.unlockValue;
  if (cosmetic.unlock === "achievement") return playerData.achievements.includes(cosmetic.unlockAchievement);
  if (cosmetic.unlock === "rare_drop") return playerData.unlockedItems.includes(cosmetic.id);
  return false;
}

/**
 * Roll for rare drops after a checkers win. Returns array of newly dropped item IDs.
 */
export function rollRareDrops(currentUnlocked = []) {
  const drops = [];
  const allRares = [...BOARD_STYLES, ...PIECE_SKINS].filter(c => c.unlock === "rare_drop");
  for (const item of allRares) {
    if (currentUnlocked.includes(item.id)) continue;
    if (Math.random() < (item.dropChance || 0.005)) {
      drops.push(item.id);
    }
  }
  return drops;
}

export function getUnlockLabel(cosmetic) {
  if (cosmetic.unlock === "default") return "Default";
  if (cosmetic.unlock === "level") return `Level ${cosmetic.unlockValue}`;
  if (cosmetic.unlock === "wins") return `${cosmetic.unlockValue} Checkers Wins`;
  if (cosmetic.unlock === "achievement") return `Achievement: ${cosmetic.unlockAchievement}`;
  if (cosmetic.unlock === "rare_drop") return `🌟 Legendary — 0.5% drop chance`;
  return "Unknown";
}