import { useRef, useEffect, useCallback } from "react";
import {
  BALLOON_TYPES, POWERUPS, DART_SPEED, GRAVITY,
  SNIPER_PIERCE, GAME_WIDTH, GAME_HEIGHT, STREAK_FOR_POWERUP,
  ENDLESS_SPAWN_INTERVAL, ENDLESS_MAX_BALLOONS,
  RICOCHET_DAMPING, MAX_RICOCHETS,
  WIND_MAX_STRENGTH, WIND_CHANGE_INTERVAL,
  SLINGSHOT_MAX_PULL, TRAJECTORY_DOTS,
  SHAKE_INTENSITY, SHAKE_DECAY,
  SLOW_MO_DURATION, SLOW_MO_FACTOR,
} from "./gameConfig";
import { updateObstacles, checkDartObstacleCollision, drawObstacles, generateObstacles } from "./obstacleGenerator";
import { generateBalloons, recalcCollapseTargets, spawnRandomBalloon } from "./levelGenerator";

// ── Offscreen static background ──
let staticBg = null;
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
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
  ctx.fillStyle = "#15803d";
  for (let gx = 0; gx < GAME_WIDTH; gx += 20) {
    ctx.fillRect(gx, GAME_HEIGHT - 50, 2, 8 + Math.sin(gx) * 4);
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

function drawBalloon(ctx, b) {
  ctx.save();
  const bx = b.x;
  const by = b.y + Math.sin(b.wobble) * b.wobbleAmp;
  ctx.translate(bx, by);
  const s = b.hp / b.maxHp * 0.3 + 0.7;
  ctx.scale(s, s);

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
  ctx.restore();
}

function drawDart(ctx, d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(Math.atan2(d.vy, d.vx));
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
  ctx.restore();
}

// ── Slingshot trajectory preview ──
function drawTrajectoryPreview(ctx, launchX, launchY, vx, vy, wind, obstacles) {
  const dt = 1;
  let px = launchX, py = launchY, pvx = vx, pvy = vy;
  ctx.save();
  for (let i = 0; i < TRAJECTORY_DOTS; i++) {
    px += pvx * dt;
    py += pvy * dt;
    pvy += GRAVITY * dt;
    pvx += wind * dt;

    // Wall ricochets for preview
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

// ── Slingshot rubber band drawing ──
function drawSlingshot(ctx, launchPos, pullPos, power) {
  const dx = pullPos.x - launchPos.x;
  const dy = pullPos.y - launchPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 5) return;

  ctx.save();
  // Rubber bands from launcher to pull point
  const offsetX = 12;
  ctx.lineWidth = 3;
  ctx.strokeStyle = `rgba(234,179,8,${0.5 + power * 0.5})`;
  ctx.beginPath();
  ctx.moveTo(launchPos.x - offsetX, launchPos.y);
  ctx.lineTo(pullPos.x, pullPos.y);
  ctx.moveTo(launchPos.x + offsetX, launchPos.y);
  ctx.lineTo(pullPos.x, pullPos.y);
  ctx.stroke();

  // Dart preview at pull point — rotated toward launch direction
  const angle = Math.atan2(launchPos.y - pullPos.y, launchPos.x - pullPos.x);
  ctx.translate(pullPos.x, pullPos.y);
  ctx.rotate(angle);
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(10, 0); ctx.lineTo(-4, -2.5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 2.5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ef4444";
  ctx.beginPath(); ctx.moveTo(-4, -2.5); ctx.lineTo(-8, -5); ctx.lineTo(-6, -0.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, 2.5); ctx.lineTo(-8, 5); ctx.lineTo(-6, 0.5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ── Wind indicator on canvas ──
function drawWindIndicator(ctx, wind) {
  const cx = GAME_WIDTH / 2;
  const y = GAME_HEIGHT - 18;
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

const LAUNCHER_POS = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 40 };
const COMBO_WINDOW = 30;
const MAGNETIC_SPEED = 1.5;

export default function DartPopBlitzCanvas({
  preset, gameState,
  activePowerup, setActivePowerup,
  powerupInventory, setPowerupInventory,
  onScoreChange, onStreakChange, onTotalPoppedChange, onDartsRemainingChange,
  onGameEnd, onWindChange, sounds,
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const initIdRef = useRef(null);
  const callbacksRef = useRef(null);

  // Slingshot state
  const slingshotRef = useRef({
    active: false,
    startX: 0, startY: 0,
    currentX: 0, currentY: 0,
  });

  const stateRef = useRef({
    balloons: [], darts: [], particles: [], obstacles: [],
    dartsRemaining: 0, score: 0, streak: 0, totalPopped: 0,
    combo: 0, comboMultiplier: 1, comboTimer: 0, comboFloats: [],
    gameState: "menu", activePowerup: null, ended: false,
    // Wind
    wind: 0, windTimer: 0,
    // Screen shake
    shakeX: 0, shakeY: 0, shakeIntensity: 0,
    // Slow-motion
    slowMoTimer: 0, timeScale: 1,
  });

  useEffect(() => { stateRef.current.activePowerup = activePowerup; }, [activePowerup]);
  useEffect(() => { stateRef.current.gameState = gameState; }, [gameState]);

  // ── Shooting (slingshot release) ──
  const shoot = useCallback((launchVx, launchVy) => {
    const s = stateRef.current;
    if (s.gameState !== "playing") return;
    if (!s.endless && s.dartsRemaining <= 0) return;

    const speed = Math.sqrt(launchVx * launchVx + launchVy * launchVy);
    if (speed < 2) return;

    const vx = launchVx;
    const vy = launchVy;
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

  // ── Input: Slingshot pull-back ──
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const touch = e.changedTouches?.[0] ?? e.touches?.[0];
    const cx = touch ? touch.clientX : e.clientX;
    const cy = touch ? touch.clientY : e.clientY;
    return { x: (cx - rect.left) * scaleX, y: (cy - rect.top) * scaleY };
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (!pos) return;
    const sl = slingshotRef.current;
    sl.active = true;
    sl.startX = pos.x;
    sl.startY = pos.y;
    sl.currentX = pos.x;
    sl.currentY = pos.y;
  }, [getCanvasPos]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (!pos) return;
    const sl = slingshotRef.current;
    if (!sl.active) return;
    sl.currentX = pos.x;
    sl.currentY = pos.y;
  }, [getCanvasPos]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    const sl = slingshotRef.current;
    if (!sl.active) return;
    sl.active = false;

    // Calculate pull vector: from current (pull point) toward launcher = launch direction
    const pullDx = LAUNCHER_POS.x - sl.currentX;
    const pullDy = LAUNCHER_POS.y - sl.currentY;
    const pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy);
    if (pullDist < 15) return; // too small, ignore

    // Clamp and normalize
    const clampedDist = Math.min(pullDist, SLINGSHOT_MAX_PULL);
    const power = clampedDist / SLINGSHOT_MAX_PULL; // 0-1
    const speed = DART_SPEED * (0.4 + power * 0.6); // min 40% speed

    const nx = pullDx / pullDist;
    const ny = pullDy / pullDist;

    shoot(nx * speed, ny * speed);
  }, [shoot]);

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
      dartsRemaining: preset.darts, score: 0, streak: 0, totalPopped: 0,
      combo: 0, comboMultiplier: 1, comboTimer: 0, comboFloats: [],
      ended: false, endless: !!preset.endless, endlessSpawnTimer: 0,
      wind: 0, windTimer: 0,
      shakeX: 0, shakeY: 0, shakeIntensity: 0,
      slowMoTimer: 0, timeScale: 1,
    });
  }, [preset]);

  // ── Game Loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const bg = getStaticBg();

    callbacksRef.current = { onScoreChange, onStreakChange, onTotalPoppedChange, onDartsRemainingChange, onGameEnd, onWindChange, sounds, setPowerupInventory };

    function loop() {
      const s = stateRef.current;
      const cb = callbacksRef.current;

      if (s.gameState !== "playing") {
        render(ctx, bg, s);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
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

      // Balloon wobble + magnetic slide
      for (const b of s.balloons) {
        if (!b.alive) continue;
        b.wobble += b.wobbleSpeed * ts;
        const diff = b.targetX - b.x;
        if (Math.abs(diff) > 0.5) {
          b.x += Math.sign(diff) * Math.min(Math.abs(diff), MAGNETIC_SPEED * ts);
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

        // MIRV
        if (d.type === "mirv" && !d.mirvTriggered && d.y < GAME_HEIGHT * 0.5) {
          d.mirvTriggered = true; d.alive = false;
          cb.sounds.playExplosion();
          spawnParticles(s.particles, d.x, d.y, "#f97316", 12);
          const mx = d.x, my = d.y;
          setTimeout(() => {
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
              s.darts.push({ x: mx, y: my, vx: Math.cos(angle) * DART_SPEED * 0.7, vy: Math.sin(angle) * DART_SPEED * 0.7, type: "mini", color: "#fb923c", finColor: "#ea580c", pierce: 0, alive: true, bounces: 0 });
            }
          }, 0);
          continue;
        }

        // ── Wall ricochet ──
        if (d.type !== "mini") {
          // Left wall
          if (d.x <= 6 && d.vx < 0 && (d.bounces || 0) < MAX_RICOCHETS) {
            d.x = 6; d.vx = Math.abs(d.vx) * RICOCHET_DAMPING; d.bounces = (d.bounces || 0) + 1;
            cb.sounds.playRicochet();
            spawnParticles(s.particles, d.x, d.y, "#94a3b8", 3);
          }
          // Right wall
          if (d.x >= GAME_WIDTH - 6 && d.vx > 0 && (d.bounces || 0) < MAX_RICOCHETS) {
            d.x = GAME_WIDTH - 6; d.vx = -Math.abs(d.vx) * RICOCHET_DAMPING; d.bounces = (d.bounces || 0) + 1;
            cb.sounds.playRicochet();
            spawnParticles(s.particles, d.x, d.y, "#94a3b8", 3);
          }
          // Top wall
          if (d.y <= 6 && d.vy < 0 && (d.bounces || 0) < MAX_RICOCHETS) {
            d.y = 6; d.vy = Math.abs(d.vy) * RICOCHET_DAMPING; d.bounces = (d.bounces || 0) + 1;
            cb.sounds.playRicochet();
            spawnParticles(s.particles, d.x, d.y, "#94a3b8", 3);
          }
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

          if (d.pierce > 0) { d.pierce--; } else { d.alive = false; dartKilled = true; break; }
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
      s.streak = newStreak;

      if (multipliedScore > 0) cb.onScoreChange(s.score);
      if (poppedAdd > 0) cb.onTotalPoppedChange(s.totalPopped);
      if (newStreak !== s.streak) cb.onStreakChange(s.streak);

      if (newStreak > 0 && newStreak % STREAK_FOR_POWERUP === 0 && newStreak !== s.streak) {
        cb.sounds.playStreakChime();
        const keys = Object.keys(POWERUPS);
        const reward = keys[Math.floor(Math.random() * keys.length)];
        cb.setPowerupInventory(prev => ({ ...prev, [reward]: (prev[reward] || 0) + 1 }));
      }

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

      render(ctx, bg, s);
      animFrameRef.current = requestAnimationFrame(loop);
    }

    function render(ctx, bg, s) {
      ctx.save();
      // Apply screen shake
      ctx.translate(s.shakeX, s.shakeY);

      ctx.drawImage(bg, 0, 0);
      if (s.obstacles?.length > 0) drawObstacles(ctx, s.obstacles, Date.now());
      for (const b of s.balloons) { if (b.alive) drawBalloon(ctx, b); }
      for (const d of s.darts) { if (d.alive) drawDart(ctx, d); }
      for (const p of s.particles) drawParticle(ctx, p);
      ctx.globalAlpha = 1;

      // ── Launcher (slingshot fork) ──
      ctx.fillStyle = "#5b4a3a";
      ctx.fillRect(LAUNCHER_POS.x - 16, LAUNCHER_POS.y - 8, 4, 20);
      ctx.fillRect(LAUNCHER_POS.x + 12, LAUNCHER_POS.y - 8, 4, 20);
      // Fork base
      ctx.fillStyle = "#3e2f22";
      ctx.fillRect(LAUNCHER_POS.x - 4, LAUNCHER_POS.y + 6, 8, 14);
      // Fork tips (nubs)
      ctx.fillStyle = "#7c6650";
      ctx.beginPath();
      ctx.arc(LAUNCHER_POS.x - 14, LAUNCHER_POS.y - 8, 4, 0, Math.PI * 2);
      ctx.arc(LAUNCHER_POS.x + 14, LAUNCHER_POS.y - 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // ── Slingshot pull-back visuals ──
      const sl = slingshotRef.current;
      if (sl.active && s.gameState === "playing") {
        const pullDx = LAUNCHER_POS.x - sl.currentX;
        const pullDy = LAUNCHER_POS.y - sl.currentY;
        const pullDist = Math.sqrt(pullDx * pullDx + pullDy * pullDy);
        const clampedDist = Math.min(pullDist, SLINGSHOT_MAX_PULL);

        if (pullDist > 10) {
          const power = clampedDist / SLINGSHOT_MAX_PULL;
          // Clamp pull point position
          const clampedX = pullDist > SLINGSHOT_MAX_PULL
            ? LAUNCHER_POS.x - (pullDx / pullDist) * SLINGSHOT_MAX_PULL
            : sl.currentX;
          const clampedY = pullDist > SLINGSHOT_MAX_PULL
            ? LAUNCHER_POS.y - (pullDy / pullDist) * SLINGSHOT_MAX_PULL
            : sl.currentY;

          drawSlingshot(ctx, LAUNCHER_POS, { x: clampedX, y: clampedY }, power);

          // Trajectory preview
          const speed = DART_SPEED * (0.4 + power * 0.6);
          const nx = pullDx / pullDist;
          const ny = pullDy / pullDist;
          drawTrajectoryPreview(ctx, LAUNCHER_POS.x, LAUNCHER_POS.y, nx * speed, ny * speed, s.wind, s.obstacles);

          // Power readout
          ctx.font = "bold 14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = `rgba(255,255,255,${0.6 + power * 0.4})`;
          ctx.fillText(`${Math.round(power * 100)}%`, clampedX, clampedY + 20);
        }
      }

      // Idle hint
      if (!sl.active && s.dartsRemaining > 0 && s.darts.length === 0 && s.gameState === "playing") {
        ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("Pull back & release to fire!", GAME_WIDTH / 2, LAUNCHER_POS.y + 26);
      }

      // Wind indicator
      drawWindIndicator(ctx, s.wind);

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

      // Slow-mo overlay
      if (s.slowMoTimer > 0) {
        ctx.fillStyle = "rgba(0,0,40,0.15)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("🎯 FINAL POP!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
      }

      ctx.restore(); // end shake transform
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
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
}