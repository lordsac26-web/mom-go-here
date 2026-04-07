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
  // Aim for ~10-12 columns for that Space Invaders density
  const cols = Math.min(12, Math.max(8, Math.ceil(Math.sqrt(total * 1.8))));
  const rows = Math.ceil(total / cols);

  const padX = 20;
  const padTop = 30;
  const usableH = GAME_HEIGHT * 0.55; // top 55% for balloons
  const cellW = (GAME_WIDTH - padX * 2) / cols;
  const cellH = Math.min(usableH / rows, 38);

  const balloons = [];

  types.forEach((type, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const def = BALLOON_TYPES[type];

    const x = padX + col * cellW + cellW / 2;
    const y = padTop + row * cellH + cellH / 2;

    balloons.push({
      id: idx,
      type,
      ...def,
      hp: def.hp,
      maxHp: def.hp,
      x,
      y,
      targetX: x, // for magnetic collapse
      row,
      col,
      alive: true,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.015 + Math.random() * 0.01,
      wobbleAmp: 1.5 + Math.random() * 1.5,
      scaleAnim: 0,
    });
  });

  return balloons;
}

/**
 * Recalculate targetX for all alive balloons in each row
 * so they slide together (magnetically collapse) when one is popped.
 */
export function recalcCollapseTargets(balloons) {
  // Group alive balloons by row
  const rowMap = {};
  for (const b of balloons) {
    if (!b.alive) continue;
    if (!rowMap[b.row]) rowMap[b.row] = [];
    rowMap[b.row].push(b);
  }

  const padX = 20;
  const usableW = GAME_WIDTH - padX * 2;

  for (const rowBalloons of Object.values(rowMap)) {
    // Sort by current x so spacing is even
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