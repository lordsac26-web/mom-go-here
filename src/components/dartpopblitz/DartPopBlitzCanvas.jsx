import { useRef, useEffect, useCallback } from "react";
import {
  BALLOON_TYPES, POWERUPS, DART_SPEED, GRAVITY,
  SNIPER_PIERCE, GAME_WIDTH, GAME_HEIGHT, STREAK_FOR_POWERUP,
  ENDLESS_SPAWN_INTERVAL, ENDLESS_MAX_BALLOONS,
  RICOCHET_DAMPING, MAX_RICOCHETS,
  WIND_MAX_STRENGTH, WIND_CHANGE_INTERVAL,
  TRAJECTORY_DOTS,
  AIM_SPEED, AIM_MIN_ANGLE, AIM_MAX_ANGLE, AIM_START_ANGLE,
  POWER_MIN, POWER_MAX, POWER_OSCILLATE_SPEED,
  SHAKE_INTENSITY, SHAKE_DECAY,
  SLOW_MO_DURATION, SLOW_MO_FACTOR,
  FREEZE_DURATION, GRAVITY_BOMB_RADIUS, GRAVITY_BOMB_PULL_FRAMES,
  ZIPPER_MAX_BOUNCES, ZIPPER_SPEED_BOOST,
} from "./gameConfig";
import { updateObstacles, checkDartObstacleCollision, drawObstacles, generateObstacles } from "./obstacleGenerator";
import { generateBalloons, recalcCollapseTargets, spawnRandomBalloon } from "./levelGenerator";
import {
  spawnPowerupBalloon, updatePowerupBalloons, drawPowerupBalloons, checkDartPowerupCollision,
} from "./powerupBalloons";
import { POWERUP_BALLOON_SPAWN_INTERVAL } from "./gameConfig";

// ── Offscreen static background ──
// Bump version to invalidate cache when ground layout changes
let staticBg = null; const _bgVer = 2;
function getStaticBg() {
  if (staticBg) return staticBg;
  const oc = document.createElement("canvas");
  oc.width = GAME_WIDTH;
  oc.height = GAME_HEIGHT;
  const ctx = oc.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
  grad.addColorStop(0, "#0ea5e9");
  grad.addColorStop(0.6, "#7dd3fc");
  grad.addColorStop(1, "#22c55e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  [[60, 50, 40], [200, 30, 30], [330, 70, 25]].forEach(([cx, cy, r]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.5, cy + r * 0.1, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // Dirt layer under grass
  const GROUND_TOP = GAME_HEIGHT - 80;
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(0, GROUND_TOP + 12, GAME_WIDTH, GAME_HEIGHT - GROUND_TOP);
  // Darker dirt stripe
  ctx.fillStyle = "#6B4F12";
  ctx.fillRect(0, GROUND_TOP + 24, GAME_WIDTH, GAME_HEIGHT - GROUND_TOP - 24);
  // Dirt texture dots
  ctx.fillStyle = "#7A5C13";
  for (let dx = 5; dx < GAME_WIDTH; dx += 14) {
    for (let dy = GROUND_TOP + 28; dy < GAME_HEIGHT; dy += 12) {
      ctx.globalAlpha = 0.3 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.arc(dx + Math.random() * 6, dy + Math.random() * 4, 1.5 + Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  // Grass layer on top of dirt
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(0, GROUND_TOP, GAME_WIDTH, 14);
  // Grass blades
  ctx.fillStyle = "#15803d";
  for (let gx = 0; gx < GAME_WIDTH; gx += 12) {
    const h = 6 + Math.sin(gx * 0.3) * 3 + Math.random() * 3;
    ctx.fillRect(gx, GROUND_TOP - 2, 3, h);
  }
  // Lighter grass highlights
  ctx.fillStyle = "#22c55e";
  for (let gx = 6; gx < GAME_WIDTH; gx += 18) {
    ctx.fillRect(gx, GROUND_TOP, 2, 5 + Math.random() * 3);
  }
  staticBg = oc;
  return oc;
}

// Confetti palette per balloon color for multi-color bursts
const CONFETTI_PALETTES = {
  "#ef4444": ["#ef4444", "#f87171", "#fca5a5", "#fbbf24", "#fb923c"], // red
  "#3b82f6": ["#3b82f6", "#60a5fa", "#93c5fd", "#a78bfa", "#38bdf8"], // blue
  "#a855f7": ["#a855f7", "#c084fc", "#d8b4fe", "#f0abfc", "#818cf8"], // purple
  "#eab308": ["#eab308", "#facc15", "#fde047", "#fb923c", "#fbbf24"], // gold
  "#1e293b": ["#f97316", "#ef4444", "#fbbf24", "#fb923c", "#fdba74"], // bomb → fiery
  "#22c55e": ["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#34d399"], // green
  "#94a3b8": ["#94a3b8", "#cbd5e1", "#e2e8f0", "#64748b", "#f1f5f9"], // ricochet sparks
  "#f97316": ["#f97316", "#fb923c", "#fdba74", "#ef4444", "#fbbf24"], // orange/mirv
  "#f59e0b": ["#f59e0b", "#fbbf24", "#fde047", "#fb923c", "#f97316"], // speed
  "#6366f1": ["#6366f1", "#818cf8", "#a78bfa", "#c084fc", "#e0e7ff"], // ghost
  "#ec4899": ["#ec4899", "#f472b6", "#fb7185", "#fda4af", "#fbbf24"], // magnet
  "#38bdf8": ["#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe", "#fff"],    // freeze
  "#8b5cf6": ["#8b5cf6", "#a78bfa", "#c084fc", "#ddd6fe", "#6366f1"], // gravity
  "#facc15": ["#facc15", "#fde047", "#fbbf24", "#f97316", "#fff"],    // zipper
};

function getConfettiColors(baseColor) {
  return CONFETTI_PALETTES[baseColor] || [baseColor, "#fff", "#fbbf24", "#f87171", "#60a5fa"];
}

const PARTICLE_SHAPES = ["circle", "square", "star", "triangle"];

function spawnParticles(arr, x, y, color, count = 8) {
  const colors = getConfettiColors(color);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 2.5 + Math.random() * 5;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2, // slight upward bias
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 5,
      shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
  // Add a shockwave ring for big bursts (8+ particles)
  if (count >= 8) {
    arr.push({
      x, y, vx: 0, vy: 0,
      life: 1,
      color,
      size: 4,
      shape: "ring",
      rotation: 0,
      rotationSpeed: 0,
      ringGrowth: 1.8 + count * 0.1,
    });
  }
}

function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = p.life;
  ctx.translate(p.x, p.y);

  if (p.shape === "ring") {
    // Expanding shockwave ring
    const radius = p.size + (1 - p.life) * 40 * (p.ringGrowth || 1.5);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(2 * p.life, 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.rotate(p.rotation);
  ctx.fillStyle = p.color;

  if (p.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.shape === "square") {
    const half = p.size;
    ctx.fillRect(-half, -half, half * 2, half * 1.2);
  } else if (p.shape === "star") {
    const r = p.size;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const ax = Math.cos(a) * r, ay = Math.sin(a) * r;
      const ia = a + Math.PI / 5;
      const ix = Math.cos(ia) * r * 0.4, iy = Math.sin(ia) * r * 0.4;
      if (i === 0) ctx.moveTo(ax, ay);
      else ctx.lineTo(ax, ay);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.shape === "triangle") {
    const r = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.866, r * 0.5);
    ctx.lineTo(r * 0.866, r * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBalloon(ctx, b, frozen) {
  ctx.save();
  const bx = b.x;
  const by = b.y + Math.sin(b.wobble) * b.wobbleAmp;
  ctx.translate(bx, by);
  const s = b.hp / b.maxHp * 0.3 + 0.7;
  ctx.scale(s, s);

  // Ghost transparency
  if (b.type === "ghost" && b._ghostAlpha !== undefined) {
    ctx.globalAlpha = b._ghostAlpha;
  }

  ctx.beginPath();
  ctx.ellipse(0, b.radius + 3, b.radius * 0.5, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = b.color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-b.radius * 0.3, -b.radius * 0.3, b.radius * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-2, b.radius);
  ctx.lineTo(0, b.radius + 5);
  ctx.lineTo(2, b.radius);
  ctx.fillStyle = b.color;
  ctx.fill();

  ctx.font = `${Math.max(b.radius * 0.8, 8)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.emoji, 0, -1);

  if (b.maxHp > 1 && b.hp > 0) {
    const bw = b.radius * 1.2;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(-bw / 2, -b.radius - 8, bw, 4);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(-bw / 2, -b.radius - 8, bw * (b.hp / b.maxHp), 4);
  }

  // Frozen ice crystal overlay
  if (frozen) {
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#bae6fd";
    ctx.beginPath();
    ctx.arc(0, 0, b.radius + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Magnet field ring
  if (b.type === "magnet") {
    ctx.globalAlpha = 0.2 + Math.sin(b.wobble * 3) * 0.1;
    ctx.strokeStyle = "#ec4899";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, b.radius + 8 + Math.sin(b.wobble * 2) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawDart(ctx, d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  const angle = Math.atan2(d.vy, d.vx);
  ctx.rotate(angle);

  // Special glow trail for MIRV and gravity darts
  if (d.type === "mirv") {
    ctx.shadowColor = "#f97316";
    ctx.shadowBlur = 14;
    // Thruster flame trail
    ctx.fillStyle = "rgba(251,146,60,0.6)";
    ctx.beginPath();
    ctx.ellipse(-14, 0, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(239,68,68,0.4)";
    ctx.beginPath();
    ctx.ellipse(-22, 0, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.type === "gravity") {
    ctx.shadowColor = "#8b5cf6";
    ctx.shadowBlur = 16;
    // Purple vortex trail
    ctx.fillStyle = "rgba(139,92,246,0.5)";
    ctx.beginPath();
    ctx.ellipse(-14, 0, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(99,102,241,0.35)";
    ctx.beginPath();
    ctx.ellipse(-24, 0, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (d.type === "mini") {
    ctx.shadowColor = "#fb923c";
    ctx.shadowBlur = 6;
  } else if (d.type === "sniper") {
    ctx.shadowColor = "#a855f7";
    ctx.shadowBlur = 10;
  } else if (d.type === "zipper") {
    ctx.shadowColor = "#facc15";
    ctx.shadowBlur = 18;
    // Electric yellow streak trail
    ctx.fillStyle = "rgba(250,204,21,0.55)";
    ctx.beginPath();
    ctx.ellipse(-16, 0, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(250,204,21,0.25)";
    ctx.beginPath();
    ctx.ellipse(-28, 0, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // Zigzag spark lines behind dart
    ctx.strokeStyle = "rgba(253,224,71,0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10, 0); ctx.lineTo(-14, -4); ctx.lineTo(-18, 2); ctx.lineTo(-22, -3);
    ctx.stroke();
  }

  // Scale mini-darts slightly smaller
  const sc = d.type === "mini" ? 0.7 : 1;
  ctx.scale(sc, sc);

  ctx.fillStyle = d.color || "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(12, 0); ctx.lineTo(-5, -3); ctx.lineTo(-3, 0); ctx.lineTo(-5, 3);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f97316";
  ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(16, 0); ctx.lineTo(12, -2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(16, 0); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = d.finColor || "#ef4444";
  ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(-10, -6); ctx.lineTo(-7, -1); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(-10, 6); ctx.lineTo(-7, 1); ctx.closePath(); ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Trajectory preview ──
function drawTrajectoryPreview(ctx, launchX, launchY, vx, vy, wind) {
  const dt = 1;
  let px = launchX, py = launchY, pvx = vx, pvy = vy;
  ctx.save();
  for (let i = 0; i < TRAJECTORY_DOTS; i++) {
    px += pvx * dt;
    py += pvy * dt;
    pvy += GRAVITY * dt;
    pvx += wind * dt;
    if (px <= 6) { px = 6; pvx = Math.abs(pvx) * RICOCHET_DAMPING; }
    if (px >= GAME_WIDTH - 6) { px = GAME_WIDTH - 6; pvx = -Math.abs(pvx) * RICOCHET_DAMPING; }
    if (py <= 6) { py = 6; pvy = Math.abs(pvy) * RICOCHET_DAMPING; }
    if (py > GAME_HEIGHT + 10) break;
    const alpha = 1 - i / TRAJECTORY_DOTS;
    const size = 2.5 - i * 0.06;
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px, py, Math.max(size, 1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Rotating dart launcher (missile pod) ──
function drawLauncher(ctx, pos, aimAngle) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  // Base platform
  ctx.fillStyle = "#374151";
  ctx.beginPath();
  ctx.moveTo(-26, 6); ctx.lineTo(26, 6); ctx.lineTo(20, 20); ctx.lineTo(-20, 20);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(-18, 7, 36, 4);
  // Rotating turret
  ctx.rotate(aimAngle + Math.PI / 2);
  const bLen = 34, bW = 10;
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(-bW, -bLen, bW * 2, bLen);
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(-bW + 2, -bLen, (bW - 2) * 2, bLen);
  // Muzzle
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(-bW - 2, -bLen - 6, bW * 2 + 4, 7);
  ctx.fillStyle = "#1f2937";
  ctx.beginPath(); ctx.arc(0, -bLen - 3, 4, 0, Math.PI * 2); ctx.fill();
  // Fins
  ctx.fillStyle = "#9ca3af";
  ctx.beginPath(); ctx.moveTo(-bW - 4, -5); ctx.lineTo(-bW - 12, 8); ctx.lineTo(-bW, 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bW + 4, -5); ctx.lineTo(bW + 12, 8); ctx.lineTo(bW, 3); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Hinge
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath(); ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#d97706"; ctx.lineWidth = 2; ctx.stroke();
}

// ── Power meter bar (right side) ──
function drawPowerMeter(ctx, powerT, locked) {
  const barX = GAME_WIDTH - 28, barY = 60, barW = 16, barH = GAME_HEIGHT - 140;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 4); ctx.fill(); ctx.stroke();
  const grad = ctx.createLinearGradient(barX, barY + barH, barX, barY);
  grad.addColorStop(0, "#22c55e"); grad.addColorStop(0.4, "#eab308");
  grad.addColorStop(0.7, "#f97316"); grad.addColorStop(1, "#ef4444");
  ctx.fillStyle = grad;
  const fillH = barH * powerT;
  ctx.fillRect(barX, barY + barH - fillH, barW, fillH);
  // Indicator arrows
  const indY = barY + barH - fillH;
  ctx.fillStyle = locked ? "#22d3ee" : "#fff";
  ctx.shadowColor = locked ? "#22d3ee" : "#fbbf24"; ctx.shadowBlur = locked ? 8 : 4;
  ctx.beginPath(); ctx.moveTo(barX - 6, indY); ctx.lineTo(barX - 1, indY - 4); ctx.lineTo(barX - 1, indY + 4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(barX + barW + 6, indY); ctx.lineTo(barX + barW + 1, indY - 4); ctx.lineTo(barX + barW + 1, indY + 4); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("PWR", barX + barW / 2, barY - 6);
  ctx.fillText(`${Math.round(powerT * 100)}%`, barX + barW / 2, barY + barH + 14);
}

// ── Aim arc indicator (left side) ──
function drawAimArc(ctx, pos, currentAngle) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 50, AIM_MIN_ANGLE, AIM_MAX_ANGLE);
  ctx.stroke();
  // Current aim tick
  const tx = pos.x + Math.cos(currentAngle) * 50;
  const ty = pos.y + Math.sin(currentAngle) * 50;
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── Wind indicator on canvas ──
function drawWindIndicator(ctx, wind) {
  const cx = GAME_WIDTH / 2;
  const y = GAME_HEIGHT - 84;
  const maxW = 40;
  const strength = wind / WIND_MAX_STRENGTH; // -1 to 1
  const barLen = Math.abs(strength) * maxW;

  ctx.save();
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("WIND", cx, y - 8);

  // Arrow bar
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - maxW, y); ctx.lineTo(cx + maxW, y);
  ctx.stroke();

  if (Math.abs(strength) > 0.05) {
    const endX = cx + strength * maxW;
    const grad = ctx.createLinearGradient(cx, y, endX, y);
    grad.addColorStop(0, "rgba(59,130,246,0.3)");
    grad.addColorStop(1, "rgba(59,130,246,0.8)");
    ctx.fillStyle = grad;
    ctx.fillRect(Math.min(cx, endX), y - 3, barLen, 6);

    // Arrowhead
    const dir = Math.sign(strength);
    ctx.fillStyle = "rgba(59,130,246,0.9)";
    ctx.beginPath();
    ctx.moveTo(endX, y - 6);
    ctx.lineTo(endX + dir * 6, y);
    ctx.lineTo(endX, y + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

const LAUNCHER_POS = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 68 };

// ── Power-up slots in the dirt area ──
const POWERUP_KEYS_ORDER = ["multishot", "mirv", "sniper", "freeze", "gravity", "zipper"];
const SLOT_SIZE = 28;
const SLOT_GAP = 5;
const SLOT_TOTAL_W = POWERUP_KEYS_ORDER.length * SLOT_SIZE + (POWERUP_KEYS_ORDER.length - 1) * SLOT_GAP;
const SLOT_START_X = (GAME_WIDTH - SLOT_TOTAL_W) / 2;
const SLOT_Y = GAME_HEIGHT - 36;
const SLOT_COLORS = { multishot: "#22d3ee", mirv: "#f97316", sniper: "#a855f7", freeze: "#38bdf8", gravity: "#8b5cf6", zipper: "#facc15" };

function getSlotRects() {
  return POWERUP_KEYS_ORDER.map((key, i) => ({
    key,
    x: SLOT_START_X + i * (SLOT_SIZE + SLOT_GAP),
    y: SLOT_Y,
    w: SLOT_SIZE,
    h: SLOT_SIZE,
  }));
}

function drawPowerupSlots(ctx, inventory, activeKey, time) {
  const slots = getSlotRects();
  for (const slot of slots) {
    const pw = POWERUPS[slot.key];
    const count = inventory[slot.key] || 0;
    const isActive = activeKey === slot.key;
    const baseColor = SLOT_COLORS[slot.key];

    ctx.save();

    // Slot background — carved-into-dirt look
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.roundRect(slot.x - 1, slot.y - 1, slot.w + 2, slot.h + 2, 8);
    ctx.fill();

    if (isActive) {
      // Glowing active border
      ctx.shadowColor = baseColor;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 7);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Fill with tinted bg
      ctx.fillStyle = baseColor + "30"; // alpha
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 7);
      ctx.fill();
    } else if (count > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 7);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
    } else {
      // Empty / dimmed slot
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.w, slot.h, 7);
      ctx.fill();
    }

    // Emoji
    const alpha = count > 0 || isActive ? 1 : 0.3;
    ctx.globalAlpha = alpha;
    ctx.font = `${SLOT_SIZE * 0.55}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pw.emoji, slot.x + slot.w / 2, slot.y + slot.h / 2);
    ctx.globalAlpha = 1;

    // Count badge
    if (count > 0 && !isActive) {
      const bx = slot.x + slot.w - 4;
      const by = slot.y + 4;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(count, bx, by);
    }

    // Active checkmark
    if (isActive) {
      const bx = slot.x + slot.w - 4;
      const by = slot.y + 4;
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✓", bx, by);
    }

    ctx.restore();
  }

  // "POWER-UPS" label above slots
  ctx.font = "bold 9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("POWER-UPS", GAME_WIDTH / 2, SLOT_Y - 6);
}

/** Check if a canvas-relative point hits a power-up slot. Returns key or null. */
function hitTestPowerupSlot(cx, cy) {
  const slots = getSlotRects();
  for (const slot of slots) {
    if (cx >= slot.x && cx <= slot.x + slot.w && cy >= slot.y && cy <= slot.y + slot.h) {
      return slot.key;
    }
  }
  return null;
}
const COMBO_WINDOW = 30;
const MAGNETIC_SPEED = 1.5;

// Firing phases: "aiming" → "power" → "cooldown"
// aiming: aim oscillates left/right, tap to lock angle → moves to "power"
// power: power bar oscillates, tap to lock power → fires dart → "cooldown"
// cooldown: brief pause then back to "aiming"
const COOLDOWN_FRAMES = 15;

export default function DartPopBlitzCanvas({
  preset, gameState,
  activePowerup, setActivePowerup,
  powerupInventory, setPowerupInventory,
  onScoreChange, onStreakChange, onTotalPoppedChange, onDartsRemainingChange,
  onGameEnd, onWindChange, aimSpeedMultiplier = 1.0, sounds,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const initIdRef = useRef(null);
  const callbacksRef = useRef(null);

  // Launcher control state
  const launcherRef = useRef({
    phase: "aiming", // "aiming" | "power" | "cooldown"
    aimAngle: AIM_START_ANGLE,
    aimDir: 1, // 1 = sweeping toward max, -1 = toward min
    powerT: 0, // 0-1 power level
    powerDir: 1, // oscillation direction
    lockedAngle: AIM_START_ANGLE,
    cooldownTimer: 0,
  });

  const stateRef = useRef({
    balloons: [], darts: [], particles: [], obstacles: [],
    dartsRemaining: 0, score: 0, streak: 0, totalPopped: 0,
    combo: 0, comboMultiplier: 1, comboTimer: 0, comboFloats: [],
    gameState: "menu", activePowerup: null, ended: false,
    wind: 0, windTimer: 0,
    shakeX: 0, shakeY: 0, shakeIntensity: 0,
    slowMoTimer: 0, timeScale: 1,
    freezeTimer: 0,           // frames remaining for freeze effect
    gravityBombs: [],         // active gravity bomb pull effects
  });

  useEffect(() => { stateRef.current.activePowerup = activePowerup; }, [activePowerup]);
  useEffect(() => { stateRef.current.gameState = gameState; }, [gameState]);

  // Keep callbacksRef in sync with latest inventory/powerup/speed state for canvas rendering
  useEffect(() => {
    if (callbacksRef.current) {
      callbacksRef.current.powerupInventory = powerupInventory;
      callbacksRef.current.activePowerup = activePowerup;
      callbacksRef.current.aimSpeedMultiplier = aimSpeedMultiplier;
    }
  }, [powerupInventory, activePowerup, aimSpeedMultiplier]);

  // ── Fire dart at locked angle + power ──
  const fireDart = useCallback((angle, powerT) => {
    const s = stateRef.current;
    if (s.gameState !== "playing") return;
    if (!s.endless && s.dartsRemaining <= 0) return;

    const speed = POWER_MIN + powerT * (POWER_MAX - POWER_MIN);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const pw = s.activePowerup;

    if (pw === "multishot") {
      sounds.playMultishot();
      [-0.15, 0, 0.15].forEach(a => {
        const cos = Math.cos(a), sin = Math.sin(a);
        s.darts.push({ x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx: vx * cos - vy * sin, vy: vx * sin + vy * cos, type: "normal", color: "#22d3ee", finColor: "#0891b2", pierce: 0, alive: true, bounces: 0 });
      });
    } else if (pw === "mirv") {
      sounds.playShoot();
      s.darts.push({ x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx, vy, type: "mirv", color: "#f97316", finColor: "#dc2626", pierce: 0, alive: true, mirvTriggered: false, bounces: 0 });
    } else if (pw === "sniper") {
      sounds.playSniper();
      s.darts.push({ x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx: vx * 1.3, vy: vy * 1.3, type: "sniper", color: "#a855f7", finColor: "#7c3aed", pierce: SNIPER_PIERCE, alive: true, bounces: 0 });
    } else if (pw === "freeze") {
      sounds.playStreakChime();
      s.freezeTimer = FREEZE_DURATION;
      // Visual feedback: icy particles at launcher
      spawnParticles(s.particles, LAUNCHER_POS.x, LAUNCHER_POS.y - 30, "#38bdf8", 16);
      s.comboFloats.push({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 3, text: "❄️ FREEZE!", life: 1, scale: 1.2 });
      // Don't fire a dart — just activate the effect
      if (!s.endless) { s.dartsRemaining++; onDartsRemainingChange(s.dartsRemaining); } // refund the dart
    } else if (pw === "gravity") {
      sounds.playExplosion();
      s.darts.push({ x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx, vy, type: "gravity", color: "#8b5cf6", finColor: "#6366f1", pierce: 0, alive: true, bounces: 0, gravTriggered: false });
    } else if (pw === "zipper") {
      sounds.playRicochet();
      s.darts.push({ x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx, vy, type: "zipper", color: "#facc15", finColor: "#ca8a04", pierce: 0, alive: true, bounces: 0, zipBounces: 0 });
    } else {
      sounds.playShoot();
      s.darts.push({ x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx, vy, type: "normal", color: "#94a3b8", finColor: "#ef4444", pierce: 0, alive: true, bounces: 0 });
    }

    if (!s.endless) {
      s.dartsRemaining--;
      onDartsRemainingChange(s.dartsRemaining);
    }
    if (pw) { s.activePowerup = null; setActivePowerup(null); }
  }, [sounds, setActivePowerup, onDartsRemainingChange]);

  // ── Canvas coordinate helper ──
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  // ── Input: Tap to advance phase OR equip power-up ──
  const handleTap = useCallback((e) => {
    e.preventDefault();
    const s = stateRef.current;
    if (s.gameState !== "playing") return;

    // Check if tap hit a power-up slot
    const pos = getCanvasPos(e);
    if (pos) {
      const slotKey = hitTestPowerupSlot(pos.x, pos.y);
      if (slotKey) {
        // Toggle equip/unequip via React state setters
        const cb = callbacksRef.current;
        if (activePowerup === slotKey) {
          // Unequip — return to inventory
          setPowerupInventory(prev => ({ ...prev, [slotKey]: (prev[slotKey] || 0) + 1 }));
          setActivePowerup(null);
        } else {
          const inv = powerupInventory;
          if ((inv[slotKey] || 0) > 0) {
            // Return currently equipped one first
            if (activePowerup) {
              setPowerupInventory(prev => ({ ...prev, [activePowerup]: (prev[activePowerup] || 0) + 1 }));
            }
            setPowerupInventory(prev => ({ ...prev, [slotKey]: prev[slotKey] - 1 }));
            setActivePowerup(slotKey);
          }
        }
        return; // Don't advance aim/power phase
      }
    }

    if (!s.endless && s.dartsRemaining <= 0) return;

    const lr = launcherRef.current;
    if (lr.phase === "aiming") {
      lr.lockedAngle = lr.aimAngle;
      lr.phase = "power";
      lr.powerT = 0;
      lr.powerDir = 1;
    } else if (lr.phase === "power") {
      fireDart(lr.lockedAngle, lr.powerT);
      lr.phase = "cooldown";
      lr.cooldownTimer = COOLDOWN_FRAMES;
    }
  }, [fireDart, getCanvasPos, activePowerup, powerupInventory, setActivePowerup, setPowerupInventory]);

  // ── Initialization ──
  useEffect(() => {
    if (!preset) return;
    const id = preset._initId;
    if (id !== undefined && id === initIdRef.current) return;
    initIdRef.current = id;

    const b = generateBalloons(preset);
    Object.assign(stateRef.current, {
      balloons: b, darts: [], particles: [],
      obstacles: generateObstacles(preset.obstacles || []),
      powerupBalloons: [], powerupSpawnTimer: 0,
      dartsRemaining: preset.darts, score: 0, streak: 0, totalPopped: 0,
      combo: 0, comboMultiplier: 1, comboTimer: 0, comboFloats: [],
      ended: false, endless: !!preset.endless, endlessSpawnTimer: 0,
      wind: 0, windTimer: 0,
      shakeX: 0, shakeY: 0, shakeIntensity: 0,
      slowMoTimer: 0, timeScale: 1,
      freezeTimer: 0, gravityBombs: [],
    });
    // Reset launcher
    const lr = launcherRef.current;
    lr.phase = "aiming"; lr.aimAngle = AIM_START_ANGLE; lr.aimDir = 1;
    lr.powerT = 0; lr.powerDir = 1; lr.cooldownTimer = 0;
  }, [preset]);

  // ── Game Loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const bg = getStaticBg();

    callbacksRef.current = { onScoreChange, onStreakChange, onTotalPoppedChange, onDartsRemainingChange, onGameEnd, onWindChange, sounds, setPowerupInventory, powerupInventory, activePowerup, aimSpeedMultiplier };

    function loop() {
      const s = stateRef.current;
      const cb = callbacksRef.current;
      const lr = launcherRef.current;

      if (s.gameState !== "playing") {
        render(ctx, bg, s, lr, cb);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── Launcher phase updates ──
      const aimMult = cb.aimSpeedMultiplier || 1.0;
      if (lr.phase === "aiming") {
        lr.aimAngle += AIM_SPEED * aimMult * lr.aimDir;
        if (lr.aimAngle >= AIM_MAX_ANGLE) { lr.aimAngle = AIM_MAX_ANGLE; lr.aimDir = -1; }
        if (lr.aimAngle <= AIM_MIN_ANGLE) { lr.aimAngle = AIM_MIN_ANGLE; lr.aimDir = 1; }
      } else if (lr.phase === "power") {
        lr.powerT += POWER_OSCILLATE_SPEED * lr.powerDir;
        if (lr.powerT >= 1) { lr.powerT = 1; lr.powerDir = -1; }
        if (lr.powerT <= 0) { lr.powerT = 0; lr.powerDir = 1; }
      } else if (lr.phase === "cooldown") {
        lr.cooldownTimer--;
        if (lr.cooldownTimer <= 0) {
          lr.phase = "aiming";
          lr.aimDir = 1;
        }
      }

      // Time scale (slow-mo)
      const ts = s.timeScale;

      // ── Wind ──
      s.windTimer++;
      if (s.windTimer >= WIND_CHANGE_INTERVAL) {
        s.windTimer = 0;
        s.wind = (Math.random() * 2 - 1) * WIND_MAX_STRENGTH;
        if (cb.onWindChange) cb.onWindChange(s.wind);
      }

      // ── Screen shake decay ──
      if (s.shakeIntensity > 0.5) {
        s.shakeX = (Math.random() * 2 - 1) * s.shakeIntensity;
        s.shakeY = (Math.random() * 2 - 1) * s.shakeIntensity;
        s.shakeIntensity *= SHAKE_DECAY;
      } else {
        s.shakeX = 0; s.shakeY = 0; s.shakeIntensity = 0;
      }

      // ── Slow-mo timer ──
      if (s.slowMoTimer > 0) {
        s.slowMoTimer--;
        s.timeScale = SLOW_MO_FACTOR + (1 - SLOW_MO_FACTOR) * (1 - s.slowMoTimer / SLOW_MO_DURATION);
        if (s.slowMoTimer <= 0) s.timeScale = 1;
      }

      // Endless spawn
      if (s.endless) {
        s.endlessSpawnTimer++;
        if (s.endlessSpawnTimer >= ENDLESS_SPAWN_INTERVAL) {
          s.endlessSpawnTimer = 0;
          const aliveCount = s.balloons.filter(b => b.alive).length;
          if (aliveCount < ENDLESS_MAX_BALLOONS) {
            const count = 1 + Math.floor(Math.random() * 3);
            for (let si = 0; si < count && aliveCount + si < ENDLESS_MAX_BALLOONS; si++) {
              s.balloons.push(spawnRandomBalloon());
            }
          }
        }
      }

      // ── Floating power-up balloons ──
      s.powerupSpawnTimer++;
      if (s.powerupSpawnTimer >= POWERUP_BALLOON_SPAWN_INTERVAL) {
        s.powerupSpawnTimer = 0;
        // Max 3 on screen at once
        if (s.powerupBalloons.filter(pb => pb.alive).length < 3) {
          s.powerupBalloons.push(spawnPowerupBalloon());
        }
      }
      s.powerupBalloons = updatePowerupBalloons(s.powerupBalloons, ts);

      // ── Freeze timer ──
      if (s.freezeTimer > 0) s.freezeTimer--;

      // ── Gravity bombs ──
      for (let gi = s.gravityBombs.length - 1; gi >= 0; gi--) {
        const gb = s.gravityBombs[gi];
        gb.timer--;
        // Pull nearby balloons toward center with increasing strength as timer counts down
        const pullProgress = 1 - gb.timer / GRAVITY_BOMB_PULL_FRAMES; // 0→1 as time expires
        const pullStrength = 2.5 + pullProgress * 4.5; // accelerates from 2.5 to 7
        for (const b of s.balloons) {
          if (!b.alive) continue;
          const dx = gb.x - b.x, dy = gb.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < GRAVITY_BOMB_RADIUS && dist > 4) {
            const force = pullStrength * ts * (1 - dist / GRAVITY_BOMB_RADIUS); // stronger near center
            b.x += (dx / dist) * force;
            b.y += (dy / dist) * force;
            b.targetX = b.x;
          }
        }
        // Explode after pull phase
        if (gb.timer <= 0) {
          cb.sounds.playExplosion();
          spawnParticles(s.particles, gb.x, gb.y, "#8b5cf6", 24);
          s.shakeIntensity = SHAKE_INTENSITY * 2.5;
          let poppedByGravity = 0;
          for (const b of s.balloons) {
            if (!b.alive) continue;
            const dist = Math.sqrt((b.x - gb.x) ** 2 + (b.y - gb.y) ** 2);
            if (dist < GRAVITY_BOMB_RADIUS) {
              b.alive = false;
              s.score += b.points * s.comboMultiplier;
              s.totalPopped++;
              poppedByGravity++;
              spawnParticles(s.particles, b.x, b.y, b.color, 8);
            }
          }
          if (poppedByGravity > 0) {
            s.comboFloats.push({ x: gb.x, y: gb.y - 20, text: `💫 ${poppedByGravity} POPPED!`, life: 1.2, scale: 1.1 });
          }
          cb.onScoreChange(s.score);
          cb.onTotalPoppedChange(s.totalPopped);
          recalcCollapseTargets(s.balloons);
          s.gravityBombs.splice(gi, 1);
        }
      }

      // Balloon wobble + magnetic slide + special behaviors
      const frozen = s.freezeTimer > 0;
      for (const b of s.balloons) {
        if (!b.alive) continue;
        if (frozen) continue; // frozen balloons don't move

        b.wobble += b.wobbleSpeed * ts;
        const diff = b.targetX - b.x;
        if (Math.abs(diff) > 0.5) {
          b.x += Math.sign(diff) * Math.min(Math.abs(diff), MAGNETIC_SPEED * ts);
        }

        // Speed balloons: extra horizontal drift
        if (b.type === "speed") {
          if (!b._speedDir) b._speedDir = Math.random() > 0.5 ? 1 : -1;
          b.x += b._speedDir * 1.2 * ts;
          if (b.x < 20) { b.x = 20; b._speedDir = 1; }
          if (b.x > GAME_WIDTH - 20) { b.x = GAME_WIDTH - 20; b._speedDir = -1; }
          b.targetX = b.x;
        }

        // Ghost balloons: oscillating opacity
        if (b.type === "ghost") {
          b._ghostPhase = (b._ghostPhase || b.wobble) + 0.03 * ts;
          b._ghostAlpha = 0.25 + Math.abs(Math.sin(b._ghostPhase)) * 0.75;
        }
      }

      // Obstacles
      if (s.obstacles.length > 0) updateObstacles(s.obstacles);

      // Combo timer
      if (s.comboTimer > 0) {
        s.comboTimer--;
        if (s.comboTimer === 0) { s.combo = 0; s.comboMultiplier = 1; }
      }

      // Combo floats
      s.comboFloats = s.comboFloats
        .map(f => ({ ...f, y: f.y - 1.2 * ts, life: f.life - 0.025, scale: f.scale + 0.005 }))
        .filter(f => f.life > 0);

      // ── Dart physics ──
      let scoreAdd = 0, poppedAdd = 0, hitThisFrame = false, missThisFrame = false;
      let newStreak = s.streak, popsThisFrame = 0;
      const poppedThisFrame = [];
      let needsCollapse = false;

      for (let di = 0; di < s.darts.length; di++) {
        const d = s.darts[di];
        if (!d.alive) continue;

        d.x += d.vx * ts;
        d.y += d.vy * ts;
        if (d.type !== "sniper") d.vy += GRAVITY * ts;
        // Wind affects all darts
        d.vx += s.wind * ts;

        // Gravity bomb dart — triggers ONLY on direct balloon hit
        if (d.type === "gravity" && !d.gravTriggered) {
          let gravHit = false;
          for (const b of s.balloons) {
            if (!b.alive) continue;
            const dx = d.x - b.x, dy = d.y - (b.y + Math.sin(b.wobble) * b.wobbleAmp);
            if (Math.sqrt(dx * dx + dy * dy) < b.radius + 6) {
              gravHit = true;
              break;
            }
          }
          if (gravHit) {
            d.gravTriggered = true; d.alive = false;
            spawnParticles(s.particles, d.x, d.y, "#8b5cf6", 14);
            s.gravityBombs.push({ x: d.x, y: d.y, timer: GRAVITY_BOMB_PULL_FRAMES });
            s.comboFloats.push({ x: d.x, y: d.y, text: "🌀 GRAVITY!", life: 1, scale: 1.1 });
            cb.sounds.playExplosion();
            continue;
          }
        }

        // Magnet balloon deflection — alive magnet balloons push darts sideways
        if (d.type !== "sniper") {
          for (const b of s.balloons) {
            if (!b.alive || b.type !== "magnet") continue;
            const mdx = d.x - b.x, mdy = d.y - b.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mDist < 60 && mDist > 2) {
              d.vx += (mdx / mDist) * 0.3;
              d.vy += (mdy / mDist) * 0.3;
            }
          }
        }

        // MIRV — triggers when near a balloon OR when it has passed into balloon cluster area
        if (d.type === "mirv" && !d.mirvTriggered) {
          const aliveBalloons = s.balloons.filter(b => b.alive);
          // Proximity trigger: any balloon within 70px
          const nearbyBalloon = aliveBalloons.find(b => {
            const dx = d.x - b.x, dy = d.y - b.y;
            return Math.sqrt(dx * dx + dy * dy) < 70;
          });
          // Altitude fallback: dart has reached the topmost balloon row
          const minBalloonY = aliveBalloons.length > 0
            ? aliveBalloons.reduce((minY, b) => Math.min(minY, b.y), Infinity)
            : GAME_HEIGHT * 0.3;
          const altitudeTrigger = d.y <= minBalloonY + 40;

          if (nearbyBalloon || altitudeTrigger) {
            d.mirvTriggered = true; d.alive = false;
            cb.sounds.playExplosion();
            spawnParticles(s.particles, d.x, d.y, "#f97316", 16);
            s.comboFloats.push({ x: d.x, y: d.y - 10, text: "💥 MIRV!", life: 1, scale: 1.1 });
            s.shakeIntensity = SHAKE_INTENSITY;
            const mx = d.x, my = d.y;
            // Spawn 6 mini-darts in a fan pattern aimed at balloon cluster center
            // Find center of alive balloons to aim toward
            const clusterCX = aliveBalloons.length > 0
              ? aliveBalloons.reduce((sum, b) => sum + b.x, 0) / aliveBalloons.length
              : mx;
            const clusterCY = aliveBalloons.length > 0
              ? aliveBalloons.reduce((sum, b) => sum + b.y, 0) / aliveBalloons.length
              : my - 80;
            const baseAngle = Math.atan2(clusterCY - my, clusterCX - mx);
            for (let i = 0; i < 6; i++) {
              // Fan spread: -60° to +60° around cluster center direction
              const spread = (i / 5 - 0.5) * (Math.PI * 0.7);
              const angle = baseAngle + spread;
              const speed = DART_SPEED * 0.85;
              s.darts.push({
                x: mx, y: my,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                type: "mini", color: "#fb923c", finColor: "#ea580c",
                pierce: 0, alive: true, bounces: 1,
              });
            }
            continue;
          }
        }

        // ── Zipper: bounces off ALL 4 walls including floor, depletes after ZIPPER_MAX_BOUNCES ──
        if (d.type === "zipper") {
          let zipBounced = false;
          if (d.x <= 6 && d.vx < 0)              { d.x = 6;              d.vx = Math.abs(d.vx);  zipBounced = true; }
          if (d.x >= GAME_WIDTH - 6 && d.vx > 0) { d.x = GAME_WIDTH - 6; d.vx = -Math.abs(d.vx); zipBounced = true; }
          if (d.y <= 6 && d.vy < 0)              { d.y = 6;              d.vy = Math.abs(d.vy);  zipBounced = true; }
          const FLOOR_Y = GAME_HEIGHT - 90;
          if (d.y >= FLOOR_Y && d.vy > 0)        { d.y = FLOOR_Y;        d.vy = -Math.abs(d.vy); zipBounced = true; }
          if (zipBounced) {
            d.zipBounces = (d.zipBounces || 0) + 1;
            cb.sounds.playRicochet();
            spawnParticles(s.particles, d.x, d.y, "#facc15", 4);
            if (d.zipBounces >= ZIPPER_MAX_BOUNCES) { d.alive = false; continue; }
          }
          // Cancel gravity & wind — zipper flies in a straight line between bounces
          d.vy -= GRAVITY * ts;
          d.vx -= s.wind * ts;
        }

        // ── Wall ricochet — all dart types including mini ──
        const maxBounces = d.type === "mini" ? 1 : MAX_RICOCHETS;
        // Left wall
        if (d.x <= 6 && d.vx < 0 && (d.bounces || 0) < maxBounces) {
          d.x = 6; d.vx = Math.abs(d.vx) * RICOCHET_DAMPING; d.bounces = (d.bounces || 0) + 1;
          if (d.type !== "mini") { cb.sounds.playRicochet(); spawnParticles(s.particles, d.x, d.y, "#94a3b8", 3); }
        }
        // Right wall
        if (d.x >= GAME_WIDTH - 6 && d.vx > 0 && (d.bounces || 0) < maxBounces) {
          d.x = GAME_WIDTH - 6; d.vx = -Math.abs(d.vx) * RICOCHET_DAMPING; d.bounces = (d.bounces || 0) + 1;
          if (d.type !== "mini") { cb.sounds.playRicochet(); spawnParticles(s.particles, d.x, d.y, "#94a3b8", 3); }
        }
        // Top wall
        if (d.y <= 6 && d.vy < 0 && (d.bounces || 0) < maxBounces) {
          d.y = 6; d.vy = Math.abs(d.vy) * RICOCHET_DAMPING; d.bounces = (d.bounces || 0) + 1;
          if (d.type !== "mini") { cb.sounds.playRicochet(); spawnParticles(s.particles, d.x, d.y, "#94a3b8", 3); }
        }

        // Off-screen (only bottom and far out of bounds after bounces exhausted)
        if (d.y > GAME_HEIGHT + 30 || d.x < -50 || d.x > GAME_WIDTH + 50 || d.y < -50) {
          if (d.type !== "mini") missThisFrame = true;
          d.alive = false;
          continue;
        }

        // Obstacle collision
        if (d.type !== "sniper" && s.obstacles.length > 0) {
          const obstHit = checkDartObstacleCollision(d, s.obstacles);
          if (obstHit.hit) {
            d.alive = false;
            spawnParticles(s.particles, d.x, d.y, "#94a3b8", 6);
            cb.sounds.playPop();
            continue;
          }
        }

        // ── Power-up balloon collision ──
        const hitPU = checkDartPowerupCollision(d, s.powerupBalloons);
        if (hitPU) {
          // Award the power-up to inventory
          cb.sounds.playStreakChime();
          spawnParticles(s.particles, hitPU.x, hitPU.y, hitPU.color, 12);
          s.comboFloats.push({
            x: hitPU.x, y: hitPU.y,
            text: `${hitPU.emoji} ${hitPU.powerupKey.toUpperCase()}!`,
            life: 1, scale: 1,
          });
          cb.setPowerupInventory(prev => ({
            ...prev,
            [hitPU.powerupKey]: (prev[hitPU.powerupKey] || 0) + 1,
          }));
          // Dart passes through (not consumed)
        }

        // Balloon collision
        let dartKilled = false;
        for (let bi = 0; bi < s.balloons.length; bi++) {
          const b = s.balloons[bi];
          if (!b.alive) continue;
          const bdx = d.x - b.x;
          const bdy = d.y - (b.y + Math.sin(b.wobble) * b.wobbleAmp);
          if (Math.sqrt(bdx * bdx + bdy * bdy) >= b.radius + 6) continue;

          hitThisFrame = true;
          b.hp -= d.type === "sniper" ? b.hp : 1;

          if (b.hp <= 0) {
            b.alive = false;
            popsThisFrame++; scoreAdd += b.points; poppedAdd++;
            poppedThisFrame.push(bi);
            needsCollapse = true;
            cb.sounds.playPop();
            spawnParticles(s.particles, b.x, b.y, b.color, 8);

            if (b.type === "bomb") {
              cb.sounds.playExplosion();
              spawnParticles(s.particles, b.x, b.y, "#f97316", 14);
              // Screen shake on bomb!
              s.shakeIntensity = SHAKE_INTENSITY * 1.5;
              const explR = BALLOON_TYPES.bomb.explodeRadius;
              for (let obi = 0; obi < s.balloons.length; obi++) {
                const ob = s.balloons[obi];
                if (!ob.alive || obi === bi) continue;
                if (Math.sqrt((ob.x - b.x) ** 2 + (ob.y - b.y) ** 2) < explR) {
                  ob.alive = false;
                  scoreAdd += ob.points; popsThisFrame++; poppedAdd++;
                  poppedThisFrame.push(obi);
                  spawnParticles(s.particles, ob.x, ob.y, ob.color, 5);
                }
              }
            }

            // Check if this was the last balloon — trigger slow-mo
            if (!s.endless) {
              const remaining = s.balloons.filter(bb => bb.alive).length;
              if (remaining === 0 && s.slowMoTimer <= 0) {
                s.slowMoTimer = SLOW_MO_DURATION;
                s.timeScale = SLOW_MO_FACTOR;
              }
            }
          } else {
            cb.sounds.playPop();
          }

          // Zipper: speed up and deflect off the balloon's surface normal
          if (d.type === "zipper") {
            const nx = (d.x - b.x) / (b.radius + 6);
            const ny = (d.y - (b.y + Math.sin(b.wobble) * b.wobbleAmp)) / (b.radius + 6);
            const dot = d.vx * nx + d.vy * ny;
            d.vx = (d.vx - 2 * dot * nx) * ZIPPER_SPEED_BOOST;
            d.vy = (d.vy - 2 * dot * ny) * ZIPPER_SPEED_BOOST;
            spawnParticles(s.particles, b.x, b.y, "#facc15", 5);
            // Don't deplete on balloon hit — just reflect
          } else if (d.pierce > 0) { d.pierce--; } else { d.alive = false; dartKilled = true; break; }
        }
        if (dartKilled) missThisFrame = false;
      }

      // Magnetic collapse
      if (needsCollapse) {
        recalcCollapseTargets(s.balloons);
      }

      // Streak
      if (hitThisFrame) newStreak = s.streak + 1;
      else if (missThisFrame) newStreak = 0;

      // Particles
      for (const p of s.particles) {
        p.x += p.vx * ts;
        p.y += p.vy * ts;
        if (p.shape !== "ring") {
          p.vy += 0.15 * ts; // gravity
          p.vx *= 0.99;      // air drag
        }
        p.rotation += (p.rotationSpeed || 0) * ts;
        p.life -= 0.025;
        if (p.shape !== "ring") p.size *= 0.975;
      }
      for (let i = s.particles.length - 1; i >= 0; i--) { if (s.particles[i].life <= 0) s.particles.splice(i, 1); }
      for (let i = s.darts.length - 1; i >= 0; i--) { if (!s.darts[i].alive) s.darts.splice(i, 1); }

      // Combo — screen shake on big combos
      if (popsThisFrame > 0) {
        s.comboTimer = COMBO_WINDOW;
        s.combo += popsThisFrame;
        s.comboMultiplier = s.combo <= 1 ? 1 : Math.min(s.combo, 8);
        if (s.comboMultiplier > 1) {
          const lastIdx = poppedThisFrame[poppedThisFrame.length - 1];
          const lb = s.balloons[lastIdx];
          s.comboFloats.push({ x: lb ? lb.x : GAME_WIDTH / 2, y: lb ? lb.y : GAME_HEIGHT / 3, text: `${s.comboMultiplier}x COMBO!`, life: 1, scale: 1 });
          // Screen shake scales with combo
          s.shakeIntensity = Math.min(SHAKE_INTENSITY * s.comboMultiplier * 0.4, SHAKE_INTENSITY * 2);
        }
      }

      const multipliedScore = scoreAdd * s.comboMultiplier;
      s.score += multipliedScore;
      s.totalPopped += poppedAdd;
      // (s.streak already updated in streak award block above)

      if (multipliedScore > 0) cb.onScoreChange(s.score);
      if (poppedAdd > 0) cb.onTotalPoppedChange(s.totalPopped);

      // Award powerup on streak milestone BEFORE updating s.streak so comparison is valid
      if (newStreak > 0 && newStreak % STREAK_FOR_POWERUP === 0 && newStreak !== s.streak) {
        cb.sounds.playStreakChime();
        const keys = Object.keys(POWERUPS);
        const reward = keys[Math.floor(Math.random() * keys.length)];
        cb.setPowerupInventory(prev => ({ ...prev, [reward]: (prev[reward] || 0) + 1 }));
        s.comboFloats.push({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 3, text: `🔥 ${POWERUPS[reward].emoji} EARNED!`, life: 1.2, scale: 1.2 });
      }
      if (newStreak !== s.streak) cb.onStreakChange(newStreak);
      s.streak = newStreak;

      // Win / lose
      if (!s.ended && !s.endless) {
        const allPopped = s.balloons.every(b => !b.alive);
        const noDartsFlying = s.darts.length === 0;
        if (allPopped && s.slowMoTimer <= 0) {
          // Wait for slow-mo to finish before ending
          s.ended = true;
          cb.onGameEnd({ won: true, score: s.score, totalPopped: s.totalPopped, dartsUsed: preset ? preset.darts - s.dartsRemaining : 0, endless: false });
        } else if (!allPopped && s.dartsRemaining <= 0 && noDartsFlying) {
          s.ended = true;
          cb.onGameEnd({ won: false, score: s.score, totalPopped: s.totalPopped, dartsUsed: preset ? preset.darts - s.dartsRemaining : 0, endless: false });
        }
      }

      render(ctx, bg, s, lr, cb);
      animFrameRef.current = requestAnimationFrame(loop);
    }

    function render(ctx, bg, s, lr, cb) {
      ctx.save();
      ctx.translate(s.shakeX, s.shakeY);

      ctx.drawImage(bg, 0, 0);
      if (s.obstacles?.length > 0) drawObstacles(ctx, s.obstacles, Date.now());
      const isFrozen = s.freezeTimer > 0;
      for (const b of s.balloons) { if (b.alive) drawBalloon(ctx, b, isFrozen); }
      drawPowerupBalloons(ctx, s.powerupBalloons);
      for (const d of s.darts) { if (d.alive) drawDart(ctx, d); }
      for (const p of s.particles) drawParticle(ctx, p);
      ctx.globalAlpha = 1;

      // ── Dart launcher ──
      const displayAngle = lr.phase === "aiming" ? lr.aimAngle : lr.lockedAngle;
      drawLauncher(ctx, LAUNCHER_POS, displayAngle);

      // Aim arc
      if (lr.phase === "aiming") {
        drawAimArc(ctx, LAUNCHER_POS, lr.aimAngle);
      }

      // Trajectory preview (during power phase, show where the dart will go)
      if (lr.phase === "power") {
        const speed = POWER_MIN + lr.powerT * (POWER_MAX - POWER_MIN);
        const tvx = Math.cos(lr.lockedAngle) * speed;
        const tvy = Math.sin(lr.lockedAngle) * speed;
        drawTrajectoryPreview(ctx, LAUNCHER_POS.x, LAUNCHER_POS.y, tvx, tvy, s.wind);
      }

      // Power meter
      if (s.gameState === "playing" && (lr.phase === "power" || lr.phase === "cooldown")) {
        drawPowerMeter(ctx, lr.powerT, lr.phase === "cooldown");
      }

      // Phase hint text — positioned between launcher and power-up slots
      if (s.gameState === "playing" && s.dartsRemaining > 0) {
        ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        if (lr.phase === "aiming") {
          ctx.fillText("Tap to lock aim!", GAME_WIDTH / 2, LAUNCHER_POS.y + 34);
        } else if (lr.phase === "power") {
          ctx.fillText("Tap to set power!", GAME_WIDTH / 2, LAUNCHER_POS.y + 34);
        }
      }

      // Wind indicator (moved above launcher area)
      drawWindIndicator(ctx, s.wind);

      // Power-up slots in dirt
      drawPowerupSlots(ctx, cb.powerupInventory, cb.activePowerup, Date.now());

      // Combo floats
      for (const f of s.comboFloats) {
        ctx.save();
        ctx.globalAlpha = Math.min(f.life * 2, 1);
        ctx.font = `bold ${Math.round(16 * f.scale)}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 3;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = "#fbbf24"; ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      // Combo bar
      if (s.comboMultiplier > 1) {
        const cw = Math.min(s.combo / 8, 1) * (GAME_WIDTH - 40);
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(20, 10, GAME_WIDTH - 40, 8);
        const cg = ctx.createLinearGradient(20, 10, 20 + cw, 18);
        cg.addColorStop(0, "#f59e0b"); cg.addColorStop(1, "#ef4444");
        ctx.fillStyle = cg; ctx.fillRect(20, 10, cw, 8);
        ctx.font = "bold 12px sans-serif"; ctx.textAlign = "right";
        ctx.fillStyle = "#fbbf24"; ctx.fillText(`${s.comboMultiplier}x`, GAME_WIDTH - 22, 20);
        ctx.restore();
      }

      // Freeze overlay
      if (s.freezeTimer > 0) {
        ctx.fillStyle = "rgba(56,189,248,0.08)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(186,230,253,0.8)";
        ctx.fillText(`❄️ FROZEN ${Math.ceil(s.freezeTimer / 60)}s`, GAME_WIDTH / 2, 28);
      }

      // Gravity bomb vortex visuals — animated contracting rings + rotating spiral
      for (const gb of (s.gravityBombs || [])) {
        const progress = 1 - gb.timer / GRAVITY_BOMB_PULL_FRAMES; // 0→1
        const t = Date.now() * 0.003;
        ctx.save();
        ctx.translate(gb.x, gb.y);

        // Outer field boundary ring (shows pull radius clearly)
        ctx.globalAlpha = 0.25 + progress * 0.2;
        ctx.strokeStyle = "#8b5cf6";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, GRAVITY_BOMB_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Contracting concentric rings (shrink toward center as timer counts down)
        for (let ri = 0; ri < 4; ri++) {
          const ringPhase = ((t + ri * 0.5) % 1); // 0→1 cycling
          const rad = GRAVITY_BOMB_RADIUS * (1 - ringPhase) * (1 - progress * 0.3);
          if (rad < 4) continue;
          ctx.globalAlpha = (1 - ringPhase) * (0.5 + progress * 0.3);
          ctx.strokeStyle = ri % 2 === 0 ? "#8b5cf6" : "#6366f1";
          ctx.lineWidth = 2 - ringPhase;
          ctx.beginPath();
          ctx.arc(0, 0, rad, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Spinning spiral arms
        ctx.globalAlpha = 0.6 + progress * 0.3;
        for (let arm = 0; arm < 3; arm++) {
          const armAngle = t * 4 + (arm * Math.PI * 2) / 3;
          const len = GRAVITY_BOMB_RADIUS * (0.4 + progress * 0.25);
          ctx.strokeStyle = "#a78bfa";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(armAngle) * len, Math.sin(armAngle) * len);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.shadowColor = "#8b5cf6";
        ctx.shadowBlur = 10 + progress * 10;
        ctx.font = `${20 + progress * 6}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🌀", 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Slow-mo overlay
      if (s.slowMoTimer > 0) {
        ctx.fillStyle = "rgba(0,0,40,0.15)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("🎯 FINAL POP!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
      }

      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="w-full max-w-[400px] rounded-2xl border-2 border-primary/30 shadow-xl touch-none"
      style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
      onClick={handleTap}
      onTouchEnd={handleTap}
    />
  );
}