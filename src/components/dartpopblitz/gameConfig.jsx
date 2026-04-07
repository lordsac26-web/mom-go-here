/**
 * Dart Pop Blitz - game configuration & constants
 */

// Balloon types — smaller radii for Space Invaders-style dense grids
export const BALLOON_TYPES = {
  basic:  { emoji: "🎈", hp: 1, points: 100, radius: 14, color: "#ef4444" },
  tough:  { emoji: "🛡️", hp: 3, points: 250, radius: 16, color: "#3b82f6" },
  small:  { emoji: "🫧", hp: 1, points: 175, radius: 10, color: "#a855f7" },
  gold:   { emoji: "⭐", hp: 2, points: 400, radius: 13, color: "#eab308" },
  bomb:   { emoji: "💣", hp: 1, points: 150, radius: 14, color: "#1e293b", explodeRadius: 50 },
};

// Power-up types
export const POWERUPS = {
  multishot: { emoji: "🔱", label: "Multi-Shot", desc: "Fires 3 darts at once!" },
  mirv:      { emoji: "💥", label: "MIRV Grenade", desc: "Explodes into cluster darts!" },
  sniper:    { emoji: "🎯", label: "Sniper Dart", desc: "Pierces through 5 balloons!" },
};

export const STREAK_FOR_POWERUP = 4;

// Dart presets — lots more balloons, Space Invaders density
export const DART_PRESETS = [
  {
    darts: 20, label: "Quick Game",
    balloons: { basic: 18, tough: 3, small: 8, gold: 2, bomb: 2 },
    obstacles: [],
  },
  {
    darts: 50, label: "Standard Game",
    balloons: { basic: 30, tough: 8, small: 14, gold: 5, bomb: 5 },
    obstacles: [
      { type: "platform", width: 60, speed: 0.8 },
    ],
  },
  {
    darts: 100, label: "Marathon",
    balloons: { basic: 50, tough: 15, small: 25, gold: 10, bomb: 10 },
    obstacles: [
      { type: "platform", width: 70, speed: 1.0 },
      { type: "spinner", armLength: 40, speed: 0.02 },
    ],
  },
];

// Physics
export const DART_SPEED = 14;
export const GRAVITY = 0.12;
export const SNIPER_PIERCE = 5;

// Canvas sizing
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;