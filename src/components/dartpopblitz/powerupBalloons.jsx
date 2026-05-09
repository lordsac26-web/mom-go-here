/**
 * Floating power-up balloons that drift lazily across the screen.
 * Hit one with a dart to collect the power-up.
 */
import {
  POWERUPS,
  POWERUP_BALLOON_SPEED,
  POWERUP_BALLOON_RADIUS,
  POWERUP_BALLOON_WOBBLE_AMP,
  POWERUP_BALLOON_WOBBLE_SPEED,
  GAME_WIDTH,
  GAME_HEIGHT,
} from "./gameConfig";

const POWERUP_KEYS = Object.keys(POWERUPS);
const POWERUP_COLORS = {
  multishot: "#22d3ee",  // cyan
  mirv: "#f97316",       // orange
  sniper: "#a855f7",     // purple
  freeze: "#38bdf8",     // sky blue
  gravity: "#8b5cf6",    // violet
};

/** Spawn a new floating power-up balloon from left or right edge */
export function spawnPowerupBalloon() {
  const key = POWERUP_KEYS[Math.floor(Math.random() * POWERUP_KEYS.length)];
  const fromLeft = Math.random() > 0.5;
  const yZone = 80 + Math.random() * (GAME_HEIGHT * 0.45); // upper-mid area

  return {
    x: fromLeft ? -POWERUP_BALLOON_RADIUS * 2 : GAME_WIDTH + POWERUP_BALLOON_RADIUS * 2,
    y: yZone,
    vx: (fromLeft ? 1 : -1) * (POWERUP_BALLOON_SPEED + Math.random() * 0.3),
    wobble: Math.random() * Math.PI * 2,
    radius: POWERUP_BALLOON_RADIUS,
    powerupKey: key,
    color: POWERUP_COLORS[key] || "#fbbf24",
    emoji: POWERUPS[key].emoji,
    alive: true,
    opacity: 0, // fade in
    age: 0,
  };
}

/** Update all floating power-up balloons. Returns filtered alive array. */
export function updatePowerupBalloons(balloons, timeScale = 1) {
  for (const b of balloons) {
    if (!b.alive) continue;
    b.x += b.vx * timeScale;
    b.wobble += POWERUP_BALLOON_WOBBLE_SPEED * timeScale;
    b.age++;
    // Fade in over first 30 frames
    if (b.opacity < 1) b.opacity = Math.min(1, b.age / 30);
    // Off-screen removal
    if (b.vx > 0 && b.x > GAME_WIDTH + POWERUP_BALLOON_RADIUS * 3) b.alive = false;
    if (b.vx < 0 && b.x < -POWERUP_BALLOON_RADIUS * 3) b.alive = false;
  }
  return balloons.filter(b => b.alive);
}

/** Draw all floating power-up balloons */
export function drawPowerupBalloons(ctx, balloons) {
  for (const b of balloons) {
    if (!b.alive) continue;
    ctx.save();
    ctx.globalAlpha = b.opacity;

    const bx = b.x;
    const by = b.y + Math.sin(b.wobble) * POWERUP_BALLOON_WOBBLE_AMP;

    // Glow ring
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 14;

    // Balloon body
    ctx.beginPath();
    ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Shine
    ctx.beginPath();
    ctx.arc(bx - b.radius * 0.3, by - b.radius * 0.3, b.radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fill();

    // Knot
    ctx.beginPath();
    ctx.moveTo(bx - 2, by + b.radius);
    ctx.lineTo(bx, by + b.radius + 5);
    ctx.lineTo(bx + 2, by + b.radius);
    ctx.fillStyle = b.color;
    ctx.fill();

    // Emoji
    ctx.font = `${Math.max(b.radius * 0.9, 10)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.emoji, bx, by - 1);

    // Pulsing ring
    const pulse = 0.5 + Math.sin(b.wobble * 2) * 0.5;
    ctx.beginPath();
    ctx.arc(bx, by, b.radius + 4 + pulse * 4, 0, Math.PI * 2);
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = b.opacity * (0.2 + pulse * 0.15);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }
}

/** Check dart vs power-up balloon collision. Returns hit balloon or null. */
export function checkDartPowerupCollision(dart, balloons) {
  for (const b of balloons) {
    if (!b.alive) continue;
    const by = b.y + Math.sin(b.wobble) * POWERUP_BALLOON_WOBBLE_AMP;
    const dx = dart.x - b.x;
    const dy = dart.y - by;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < b.radius + 8) {
      b.alive = false;
      return b;
    }
  }
  return null;
}