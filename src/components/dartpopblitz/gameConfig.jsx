/**
 * Dart Pop Blitz - game configuration & constants
 */

// Balloon types with clear descriptions for the legend
export const BALLOON_TYPES = {
  basic:  { emoji: "🎈", hp: 1, points: 100, radius: 14, color: "#ef4444", label: "Basic", desc: "One hit to pop" },
  tough:  { emoji: "🛡️", hp: 3, points: 250, radius: 16, color: "#3b82f6", label: "Tough", desc: "Takes 3 hits" },
  small:  { emoji: "🫧", hp: 1, points: 175, radius: 10, color: "#a855f7", label: "Tiny", desc: "Small & tricky" },
  gold:   { emoji: "⭐", hp: 2, points: 400, radius: 13, color: "#eab308", label: "Gold", desc: "2 hits, big points" },
  bomb:   { emoji: "💣", hp: 1, points: 150, radius: 14, color: "#1e293b", label: "Bomb", desc: "Chain explosion!", explodeRadius: 50 },
};

// Power-up types
export const POWERUPS = {
  multishot: { emoji: "🔱", label: "Multi-Shot", desc: "Fires 3 darts at once!" },
  mirv:      { emoji: "💥", label: "MIRV Bomb", desc: "Explodes into cluster darts!" },
  sniper:    { emoji: "🎯", label: "Sniper", desc: "Pierces through 5 balloons!" },
};

export const STREAK_FOR_POWERUP = 4;

// Three game modes
export const DART_PRESETS = [
  {
    mode: "beginner",
    darts: 30,
    label: "🟢 Beginner",
    subtitle: "Easy targets, no obstacles",
    balloons: { basic: 20, tough: 2, small: 5, gold: 3, bomb: 3 },
    obstacles: [],
  },
  {
    mode: "advanced",
    darts: 50,
    label: "🔴 Advanced",
    subtitle: "More balloons, moving obstacles",
    balloons: { basic: 35, tough: 10, small: 15, gold: 6, bomb: 6 },
    obstacles: [
      { type: "platform", width: 60, speed: 0.8 },
      { type: "spinner", armLength: 40, speed: 0.02 },
    ],
  },
  {
    mode: "endless",
    darts: Infinity,
    label: "♾️ Endless Pop",
    subtitle: "Unlimited darts! Balloons keep spawning!",
    balloons: { basic: 12, tough: 2, small: 4, gold: 1, bomb: 2 },
    obstacles: [],
    endless: true,
  },
];

// Physics
export const DART_SPEED = 14;
export const GRAVITY = 0.12;
export const SNIPER_PIERCE = 5;

// Ricochet — darts bounce off side walls and top wall
export const RICOCHET_ENABLED = true;
export const RICOCHET_DAMPING = 0.75; // velocity kept after bounce
export const MAX_RICOCHETS = 3;       // max bounces per dart

// Wind — horizontal force on darts in flight
export const WIND_ENABLED = true;
export const WIND_MAX_STRENGTH = 0.06; // max horizontal accel per frame
export const WIND_CHANGE_INTERVAL = 300; // frames between wind shifts (~5s)

// Launcher aiming
export const TRAJECTORY_DOTS = 25;        // number of preview dots
export const AIM_SPEED = 0.0075;          // radians per frame for aim rotation (1.25x)
export const AIM_MIN_ANGLE = -Math.PI * 0.85; // leftmost aim (nearly left)
export const AIM_MAX_ANGLE = -Math.PI * 0.15; // rightmost aim (nearly right)
export const AIM_START_ANGLE = -Math.PI / 2;  // straight up

// Power meter
export const POWER_MIN = 5;              // minimum launch speed
export const POWER_MAX = 15;             // maximum launch speed (reaches top of screen)
export const POWER_OSCILLATE_SPEED = 0.015; // oscillation speed (0-1 range per frame)

// Screen shake
export const SHAKE_INTENSITY = 6;         // max px offset
export const SHAKE_DECAY = 0.85;          // per-frame decay

// Slow-motion on last balloon
export const SLOW_MO_DURATION = 90;       // frames of slow-mo (~1.5s)
export const SLOW_MO_FACTOR = 0.3;        // time scale during slow-mo

// Floating power-up balloons
export const POWERUP_BALLOON_SPAWN_INTERVAL = 600; // frames (~10s at 60fps)
export const POWERUP_BALLOON_SPEED = 0.6;          // horizontal px/frame
export const POWERUP_BALLOON_RADIUS = 16;
export const POWERUP_BALLOON_WOBBLE_AMP = 12;      // vertical wobble pixels
export const POWERUP_BALLOON_WOBBLE_SPEED = 0.04;

// Canvas sizing
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;

// Endless mode config
export const ENDLESS_SPAWN_INTERVAL = 90; // frames between spawns (~1.5s at 60fps)
export const ENDLESS_MAX_BALLOONS = 40;   // max alive balloons on screen