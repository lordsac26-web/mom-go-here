import { BALLOON_TYPES, GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

/**
 * Generate balloons in a tight Space Invaders-style grid.
 * Each balloon gets row/col indices + a targetX for magnetic collapse.
 */
export function generateBalloons(preset) {
  const counts = preset.balloons;
  const types = [];

  Object.entries(counts).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) types.push(type);
  });

  // Shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  const total = types.length;
  const cols = Math.min(12, Math.max(8, Math.ceil(Math.sqrt(total * 1.8))));
  const rows = Math.ceil(total / cols);

  const padX = 20;
  const padTop = 30;
  const usableH = GAME_HEIGHT * 0.55;
  const cellW = (GAME_WIDTH - padX * 2) / cols;
  const cellH = Math.min(usableH / rows, 38);

  const balloons = [];

  types.forEach((type, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const def = BALLOON_TYPES[type];

    const x = padX + col * cellW + cellW / 2;
    const y = padTop + row * cellH + cellH / 2;

    balloons.push(makeBalloon(idx, type, def, x, y, row, col));
  });

  return balloons;
}

/**
 * Create a single balloon object.
 */
export function makeBalloon(id, type, def, x, y, row, col) {
  return {
    id,
    type,
    ...def,
    hp: def.hp,
    maxHp: def.hp,
    x,
    y,
    targetX: x,
    row,
    col,
    alive: true,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.015 + Math.random() * 0.01,
    wobbleAmp: 1.5 + Math.random() * 1.5,
    scaleAnim: 0,
  };
}

/**
 * Spawn a random balloon at the top (for Endless mode).
 * Returns a new balloon positioned randomly in the upper area.
 */
let _nextId = 10000;
export function spawnRandomBalloon() {
  const keys = Object.keys(BALLOON_TYPES);
  // Weight: basic is more common
  const weights = { basic: 5, tough: 1, small: 2, gold: 1, bomb: 1 };
  const pool = [];
  for (const k of keys) {
    for (let i = 0; i < (weights[k] || 1); i++) pool.push(k);
  }
  const type = pool[Math.floor(Math.random() * pool.length)];
  const def = BALLOON_TYPES[type];

  const x = 30 + Math.random() * (GAME_WIDTH - 60);
  const y = 20 + Math.random() * (GAME_HEIGHT * 0.45);

  const id = _nextId++;
  return makeBalloon(id, type, def, x, y, 0, 0);
}

/**
 * Recalculate targetX for all alive balloons in each row
 * so they slide together (magnetically collapse) when one is popped.
 */
export function recalcCollapseTargets(balloons) {
  const rowMap = {};
  for (const b of balloons) {
    if (!b.alive) continue;
    if (!rowMap[b.row]) rowMap[b.row] = [];
    rowMap[b.row].push(b);
  }

  const padX = 20;
  const usableW = GAME_WIDTH - padX * 2;

  for (const rowBalloons of Object.values(rowMap)) {
    rowBalloons.sort((a, b) => a.col - b.col);
    const count = rowBalloons.length;
    if (count === 0) continue;

    const spacing = Math.min(usableW / count, 38);
    const totalW = (count - 1) * spacing;
    const startX = GAME_WIDTH / 2 - totalW / 2;

    rowBalloons.forEach((b, i) => {
      b.targetX = startX + i * spacing;
    });
  }
}