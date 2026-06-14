/**
 * Slot Machine Configuration
 * Symbols, paylines, payouts, and game settings
 */

export const SYMBOLS = [
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
];

export const WILD = { id: "wild", emoji: "🃏", name: "WILD", weight: 2 };
export const SCATTER = { id: "scatter", emoji: "💰", name: "SCATTER", weight: 3 };

export const ALL_SYMBOLS = [...SYMBOLS, WILD, SCATTER];

// 5 reels x 3 visible rows
export const REELS = 5;
export const ROWS = 3;

// 20 Paylines (row positions for each reel: 0=top, 1=mid, 2=bottom)
export const PAYLINES = [
  [1, 1, 1, 1, 1], // middle straight
  [0, 0, 0, 0, 0], // top straight
  [2, 2, 2, 2, 2], // bottom straight
  [0, 1, 2, 1, 0], // V shape
  [2, 1, 0, 1, 2], // inverted V
  [0, 0, 1, 0, 0], // slight dip
  [2, 2, 1, 2, 2], // slight bump
  [1, 0, 0, 0, 1], // U shape
  [1, 2, 2, 2, 1], // inverted U
  [0, 1, 1, 1, 0], // shallow V
  [2, 1, 1, 1, 2], // shallow inverted V
  [0, 1, 0, 1, 0], // zigzag up
  [2, 1, 2, 1, 2], // zigzag down
  [1, 0, 1, 0, 1], // wave up
  [1, 2, 1, 2, 1], // wave down
  [0, 0, 2, 0, 0], // deep dip
  [2, 2, 0, 2, 2], // deep bump
  [0, 2, 0, 2, 0], // big zigzag
  [2, 0, 2, 0, 2], // big zigzag inv
  [1, 0, 2, 0, 1], // diamond
];

export const PAYLINE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6",
  "#a855f7", "#6366f1", "#10b981", "#f59e0b", "#84cc16",
  "#e11d48", "#0ea5e9", "#d946ef", "#fb923c", "#2dd4bf",
];

// Bet levels
export const BET_LEVELS = [100, 250, 500, 1000, 2500, 5000];

// Starting balance
export const STARTING_BALANCE = 250000;
export const TOPOFF_THRESHOLD = 0.05; // 5%
export const TOPOFF_AMOUNT = 50000;

// Build weighted reel strip
export function buildReelStrip() {
  const strip = [];
  ALL_SYMBOLS.forEach(sym => {
    for (let i = 0; i < sym.weight; i++) strip.push(sym);
  });
  // Shuffle
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

// Check wins on all paylines
export function checkWins(grid, bet, activePaylines) {
  const wins = [];
  let totalWin = 0;
  let scatterCount = 0;

  // Count scatters anywhere on the grid
  for (let r = 0; r < REELS; r++) {
    for (let row = 0; row < ROWS; row++) {
      if (grid[r][row].id === "scatter") scatterCount++;
    }
  }

  // Scatter wins
  if (scatterCount >= 3) {
    const scatterPay = scatterCount === 3 ? 5 : scatterCount === 4 ? 20 : 100;
    const scatterWin = bet * scatterPay;
    totalWin += scatterWin;
    wins.push({ type: "scatter", count: scatterCount, payout: scatterWin, positions: [] });
  }

  // Payline wins
  for (let i = 0; i < activePaylines; i++) {
    const line = PAYLINES[i];
    const lineSymbols = line.map((row, reel) => grid[reel][row]);

    // Find matching run from left
    let matchSym = lineSymbols[0].id === "wild" ? null : lineSymbols[0];
    let matchCount = 0;
    const positions = [];

    for (let r = 0; r < REELS; r++) {
      const sym = lineSymbols[r];
      if (sym.id === "wild") {
        if (!matchSym) {
          matchCount++;
          positions.push([r, line[r]]);
          continue;
        }
        matchCount++;
        positions.push([r, line[r]]);
      } else if (!matchSym) {
        matchSym = sym.id;
        matchCount++;
        positions.push([r, line[r]]);
      } else if (sym.id === matchSym) {
        matchCount++;
        positions.push([r, line[r]]);
      } else {
        break;
      }
    }

    if (matchCount >= 3 && matchSym) {
    const symDef = SYMBOLS.find(s => s.id === matchSym) || WILD;
    const lineBet = bet / activePaylines;
    let payout = 0;
    if (matchCount === 3) payout = lineBet * symDef.multiplier * 0.5;
    else if (matchCount === 4) payout = lineBet * symDef.multiplier * 0.85;
    else payout = lineBet * symDef.multiplier;
      payout = Math.round(payout);
      if (payout > 0) {
        totalWin += payout;
        wins.push({ type: "line", lineIndex: i, symbol: matchSym, count: matchCount, payout, positions });
      }
    }
  }

  return { wins, totalWin, scatterCount };
}