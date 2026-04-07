/**
 * Dart Pop Blitz - game configuration & constants
 */

// Balloon types
export const BALLOON_TYPES = {
  basic:  { emoji: "🎈", hp: 1, points: 100, radius: 22, color: "#ef4444" },
  tough:  { emoji: "🛡️", hp: 3, points: 250, radius: 26, color: "#3b82f6" },
  small:  { emoji: "🫧", hp: 1, points: 175, radius: 15, color: "#a855f7" },
  gold:   { emoji: "⭐", hp: 2, points: 400, radius: 20, color: "#eab308" },
  bomb:   { emoji: "💣", hp: 1, points: 150, radius: 24, color: "#1e293b", explodeRadius: 60 },
};

// Power-up types
export const POWERUPS = {
  multishot: { emoji: "🔱", label: "Multi-Shot", desc: "Fires 3 darts at once!" },
  mirv:      { emoji: "💥", label: "MIRV Grenade", desc: "Explodes into cluster darts!" },
  sniper:    { emoji: "🎯", label: "Sniper Dart", desc: "Pierces through 5 balloons!" },
};

export const STREAK_FOR_POWERUP = 4; // consecutive pops to earn a power-up

// Dart limit presets  → balloon counts are roughly 60-70% of darts
// (a skilled player should be able to clear, a less skilled one might not)
export const DART_PRESETS = [
  { darts: 10,  label: "Quick Game",   balloons: { basic: 5, tough: 1, small: 2, gold: 1, bomb: 0 } },
  { darts: 50,  label: "Standard Game", balloons: { basic: 20, tough: 5, small: 8, gold: 4, bomb: 3 } },
  { darts: 100, label: "Marathon",      balloons: { basic: 35, tough: 12, small: 15, gold: 8, bomb: 6 } },
];

// Physics
export const DART_SPEED = 14;        // px per frame
export const GRAVITY = 0.12;         // slight gravity on darts
export const SNIPER_PIERCE = 5;

// Canvas sizing
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;