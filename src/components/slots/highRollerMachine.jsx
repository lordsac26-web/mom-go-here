/**
 * Hi-Roller High Stakes Slot Machine
 * Unlocked once a player accumulates 10,000,000+ coins.
 * Max bet: 100,000. Bonus type "both" — triggers Mystery Boxes
 * AND Plinko in sequence on every scatter trigger.
 */
export const HIGH_ROLLER_MACHINE = {
  id: "highroller",
  name: "Diamond Vault",
  subtitle: "Hi-Roller — 100k Max Bet",
  emoji: "💎",
  unlockRequirement: { type: "totalEarned", value: 500_000 },
  unlockLabel: "Earn 500,000 total credits across all machines",
  description: "The ultimate VIP slot. Diamond-only symbols, mega multipliers, and BOTH Mystery Boxes + Plinko trigger together on every scatter win!",
  volatility: "extreme",
  bonusType: "both", // chained: boxes → plinko
  hasRandomPlinko: false,
  betLevels: [5000, 10000, 25000, 50000, 75000, 100000],
  topOffAmount: 500_000,
  reels: 5,
  rows: 3,
  paylineCount: 20,
  bgGradient: "from-slate-950 via-purple-950 to-slate-950",
  frameGradient: "from-purple-950 via-fuchsia-900/40 to-purple-950",
  accentColor: "purple",
  borderColor: "border-fuchsia-500",
  neonColor: "#d946ef",
  symbols: [
    { id: "vault",    emoji: "🏦", name: "Vault",         weight: 1, multiplier: 250 },
    { id: "diamond7", emoji: "7️⃣", name: "Lucky Seven",    weight: 2, multiplier: 150 },
    { id: "bigdiamond", emoji: "💎", name: "Big Diamond",  weight: 3, multiplier: 100 },
    { id: "crown",    emoji: "👑", name: "Crown",          weight: 4, multiplier: 70 },
    { id: "moneybag", emoji: "💰", name: "Money Bag",      weight: 5, multiplier: 50 },
    { id: "ring",     emoji: "💍", name: "Diamond Ring",   weight: 6, multiplier: 35 },
    { id: "champagne",emoji: "🍾", name: "Champagne",      weight: 7, multiplier: 25 },
    { id: "watch",    emoji: "⌚", name: "Gold Watch",     weight: 8, multiplier: 18 },
    { id: "card",     emoji: "💳", name: "Black Card",     weight: 9, multiplier: 12 },
    { id: "chip",     emoji: "🎰", name: "VIP Chip",       weight: 10, multiplier: 8 },
  ],
  wild:    { id: "wild",    emoji: "🎩", name: "TOP HAT WILD",   weight: 3 },
  scatter: { id: "scatter", emoji: "💎", name: "DIAMOND SCATTER", weight: 3 },
};