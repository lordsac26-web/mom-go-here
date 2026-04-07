import { BALLOON_TYPES, GAME_WIDTH, GAME_HEIGHT } from "./gameConfig";

/**
 * Generate an array of balloon objects laid out in a grid-like pattern
 * with some randomness so it feels organic.
 */
export function generateBalloons(preset) {
  const balloons = [];
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
  const cols = Math.ceil(Math.sqrt(total * (GAME_WIDTH / GAME_HEIGHT)));
  const rows = Math.ceil(total / cols);
  const padX = 40;
  const padTop = 40;
  const padBot = 180;
  const cellW = (GAME_WIDTH - padX * 2) / cols;
  const cellH = (GAME_HEIGHT - padTop - padBot) / rows;

  types.forEach((type, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const def = BALLOON_TYPES[type];
    const jitterX = (Math.random() - 0.5) * cellW * 0.4;
    const jitterY = (Math.random() - 0.5) * cellH * 0.3;

    balloons.push({
      id: idx,
      type,
      ...def,
      hp: def.hp,
      maxHp: def.hp,
      x: padX + col * cellW + cellW / 2 + jitterX,
      y: padTop + row * cellH + cellH / 2 + jitterY,
      alive: true,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
      wobbleAmp: 2 + Math.random() * 3,
      scaleAnim: 0, // for pop animation
    });
  });

  return balloons;
}