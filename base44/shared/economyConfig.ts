// Server-authoritative economy config.
// The client may only reference item IDs / star counts — never coin amounts.

export const STARTER_BALANCE = 500;

// Shop catalog prices (mirror of src/components/shop/shopCatalog.jsx).
// Only the fields the server needs to validate a purchase.
export const BALLOON_SKINS: Record<string, { price: number }> = {
  neon_purple: { price: 300 },
  golden_hour: { price: 500 },
  ocean_breeze: { price: 450 },
  cherry_blossom: { price: 600 },
  midnight: { price: 750 },
  fire: { price: 900 },
  rainbow: { price: 1200 },
  mint_fresh: { price: 400 },
  bubblegum: { price: 550 },
  royal_indigo: { price: 700 },
  toxic_lime: { price: 800 },
  aurora: { price: 1400 },
};

export const WHEEL_THEMES: Record<string, { price: number }> = {
  gold_vegas: { price: 1500 },
  cosmic: { price: 1500 },
  galaxy: { price: 400 },
  tropical: { price: 350 },
  sunset: { price: 500 },
  emerald: { price: 600 },
  monochrome: { price: 700 },
  candy_pop: { price: 450 },
  volcano: { price: 650 },
  arctic: { price: 550 },
};

export const DART_POWERUPS: Record<string, { price: number; maxOwn: number }> = {
  multishot: { price: 150, maxOwn: 5 },
  mirv: { price: 200, maxOwn: 5 },
  sniper: { price: 175, maxOwn: 5 },
  freeze: { price: 225, maxOwn: 5 },
  gravity: { price: 250, maxOwn: 5 },
  zipper: { price: 300, maxOwn: 5 },
};

// ── Coin Pusher ──
// Each drop costs a fixed number of coins; the client reports how many coins
// fell off the ledge for a payout. Payout per call is clamped so a tampered
// client can't request an arbitrary win.
export const PUSHER_DROP_COST = 1;
export const PUSHER_MAX_PAYOUT_PER_CALL = 40; // realistic ceiling for one physics settle

// Coin reward for a game win, scaled by star rating (1-3).
// Mirrors coinsForStars() in src/lib/awardCoins.js.
// `base` is the 1-star reward; it is clamped server-side so a tampered client
// can't request an unreasonable base amount.
export const MAX_GAME_BASE = 50;
export function coinsForStars(stars: number, base = 20): number {
  const s = Math.max(1, Math.min(3, Math.round(stars || 1)));
  const b = Math.max(1, Math.min(MAX_GAME_BASE, Math.round(base || 20)));
  return Math.round(b * (1 + (s - 1) * 0.5));
}