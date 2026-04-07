import { useRef, useEffect, useCallback } from "react";
import {
  BALLOON_TYPES, POWERUPS, DART_SPEED, GRAVITY,
  SNIPER_PIERCE, GAME_WIDTH, GAME_HEIGHT, STREAK_FOR_POWERUP
} from "./gameConfig";
import { updateObstacles, checkDartObstacleCollision, drawObstacles } from "./obstacleGenerator";

// ── Offscreen static background ──────────────────────────────────────────────
// FIX (perf): the sky gradient, clouds, and ground never change. Draw them once
// to an offscreen canvas and blit with drawImage every frame instead of
// recreating gradient objects and fill paths 60 times per second.
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

// ── Particles ─────────────────────────────────────────────────────────────────
function spawnParticles(arr, x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = 2 + Math.random() * 4;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

// ── Draw helpers ──────────────────────────────────────────────────────────────
function drawBalloon(ctx, b, scale) {
  ctx.save();
  ctx.translate(b.x, b.y + Math.sin(b.wobble) * b.wobbleAmp);
  const s = scale * (b.hp / b.maxHp * 0.3 + 0.7);
  ctx.scale(s, s);

  ctx.beginPath();
  ctx.ellipse(0, b.radius + 4, b.radius * 0.6, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = b.color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-b.radius * 0.3, -b.radius * 0.3, b.radius * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-3, b.radius);
  ctx.lineTo(0, b.radius + 8);
  ctx.lineTo(3, b.radius);
  ctx.fillStyle = b.color;
  ctx.fill();

  ctx.font = `${b.radius * 0.9}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.emoji, 0, -1);

  if (b.maxHp > 1 && b.hp > 0) {
    const bw = b.radius * 1.4;
    const bh = 5;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(-bw / 2, -b.radius - 12, bw, bh);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(-bw / 2, -b.radius - 12, bw * (b.hp / b.maxHp), bh);
  }

  ctx.restore();
}

function drawDart(ctx, d) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(Math.atan2(d.vy, d.vx));

  ctx.fillStyle = d.color || "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(-6, -4); ctx.lineTo(-4, 0); ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(20, 0); ctx.lineTo(14, -2); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14, 0); ctx.lineTo(20, 0); ctx.lineTo(14, 2); ctx.closePath(); ctx.fill();

  ctx.fillStyle = d.finColor || "#ef4444";
  ctx.beginPath();
  ctx.moveTo(-6, -4); ctx.lineTo(-12, -8); ctx.lineTo(-8, -2); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, 4); ctx.lineTo(-12, 8); ctx.lineTo(-8, 2); ctx.closePath(); ctx.fill();

  ctx.restore();
}

function drawAimLine(ctx, from, to) {
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(to.x, to.y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x - 14, to.y); ctx.lineTo(to.x + 14, to.y);
  ctx.moveTo(to.x, to.y - 14); ctx.lineTo(to.x, to.y + 14);
  ctx.stroke();
  ctx.restore();
}

// FIX (perf): constant launcher position extracted to module level so it isn't
// reallocated as a new object on every render.
const LAUNCHER_POS = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 40 };
const COMBO_WINDOW = 30; // frames (~0.5 s at 60 fps)

export default function DartPopBlitzCanvas({
  // FIX (structure, from parent refactor): the canvas now owns balloons/darts/
  // particles/obstacles internally. The parent passes `preset` for initialisation
  // and lightweight callbacks that fire infrequently (not every animation frame).
  preset,
  gameState,
  activePowerup, setActivePowerup,
  powerupInventory, setPowerupInventory,
  onScoreChange,
  onStreakChange,
  onTotalPoppedChange,
  onDartsRemainingChange,
  onGameEnd,
  sounds,
}) {
  const canvasRef = useRef(null);
  const aimRef = useRef(null);
  const animFrameRef = useRef(null);

  // ── All mutable game state lives in a single ref so the loop never has
  //    stale-closure issues and never triggers React re-renders mid-frame. ──
  const stateRef = useRef({
    balloons: [],
    darts: [],
    particles: [],
    obstacles: [],
    dartsRemaining: 0,
    score: 0,
    streak: 0,
    totalPopped: 0,
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,       // frames remaining in combo window
    comboFloats: [],     // floating text popups
    gameState: "menu",
    activePowerup: null,
    ended: false,        // FIX (bug): replaces savedRef — lives here so reset is in one place
  });

  // Keep activePowerup and gameState in sync from props (set by parent)
  // These are the only values that flow parent→canvas.
  useEffect(() => {
    stateRef.current.activePowerup = activePowerup;
  }, [activePowerup]);

  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  // ── Shooting ──────────────────────────────────────────────────────────────
  const shoot = useCallback((targetX, targetY) => {
    const s = stateRef.current;
    if (s.gameState !== "playing" || s.dartsRemaining <= 0) return;

    const dx = targetX - LAUNCHER_POS.x;
    const dy = targetY - LAUNCHER_POS.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return;

    const vx = (dx / dist) * DART_SPEED;
    const vy = (dy / dist) * DART_SPEED;
    const pw = s.activePowerup;

    if (pw === "multishot") {
      sounds.playMultishot();
      const spread = 0.15;
      [-spread, 0, spread].forEach(a => {
        const cos = Math.cos(a), sin = Math.sin(a);
        s.darts.push({
          x: LAUNCHER_POS.x, y: LAUNCHER_POS.y,
          vx: vx * cos - vy * sin, vy: vx * sin + vy * cos,
          type: "normal", color: "#22d3ee", finColor: "#0891b2",
          pierce: 0, alive: true,
        });
      });
    } else if (pw === "mirv") {
      sounds.playShoot();
      s.darts.push({
        x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx, vy,
        type: "mirv", color: "#f97316", finColor: "#dc2626",
        pierce: 0, alive: true, mirvTriggered: false,
      });
    } else if (pw === "sniper") {
      sounds.playSniper();
      s.darts.push({
        x: LAUNCHER_POS.x, y: LAUNCHER_POS.y,
        vx: vx * 1.5, vy: vy * 1.5,
        type: "sniper", color: "#a855f7", finColor: "#7c3aed",
        pierce: SNIPER_PIERCE, alive: true,
      });
    } else {
      sounds.playShoot();
      s.darts.push({
        x: LAUNCHER_POS.x, y: LAUNCHER_POS.y, vx, vy,
        type: "normal", color: "#94a3b8", finColor: "#ef4444",
        pierce: 0, alive: true,
      });
    }

    // FIX (bug): decrement directly in the ref so the game loop reads the
    // correct value in the same frame — no waiting for a setState round-trip.
    s.dartsRemaining--;
    onDartsRemainingChange(s.dartsRemaining);

    // Clear powerup only after successfully shooting
    if (pw) {
      s.activePowerup = null;
      setActivePowerup(null);
    }
  }, [sounds, setActivePowerup, onDartsRemainingChange]);

  // ── Input helpers ─────────────────────────────────────────────────────────
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    // FIX (bug): touchend has empty .touches — use .changedTouches instead.
    const touch = e.changedTouches?.[0] ?? e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (pos) aimRef.current = pos;
  }, [getCanvasPos]);

  // FIX (bug): unified pointer-up handler for both mouse and touch so both
  // paths go through the same aim-then-shoot logic. The old code had
  // onMouseUp={handleClick} (direct shoot) vs onTouchEnd={handlePointerUp}
  // (preferred aimRef) which produced different behaviour per input type.
  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e) ?? aimRef.current;
    if (pos) shoot(pos.x, pos.y);
    aimRef.current = null;
  }, [getCanvasPos, shoot]);

  // ── Game Loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Initialise local state from preset when effect first runs / preset changes
    if (preset) {
      const { generateBalloons } = require("./levelGenerator");
      const { generateObstacles } = require("./obstacleGenerator");
      const b = generateBalloons(preset);
      Object.assign(stateRef.current, {
        balloons: b,
        darts: [],
        particles: [],
        obstacles: generateObstacles(preset.obstacles || []),
        dartsRemaining: preset.darts,
        score: 0,
        streak: 0,
        totalPopped: 0,
        combo: 0,
        comboMultiplier: 1,
        comboTimer: 0,
        comboFloats: [],
        ended: false,
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const bg = getStaticBg();

    function loop() {
      const s = stateRef.current;

      if (s.gameState !== "playing") {
        render(ctx, bg, s);
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── Balloon wobble ──
      for (const b of s.balloons) {
        if (b.alive) b.wobble += b.wobbleSpeed;
      }

      // ── Obstacles ──
      updateObstacles(s.obstacles); // mutates in-place

      // ── Combo timer ──
      if (s.comboTimer > 0) {
        s.comboTimer--;
        if (s.comboTimer === 0) {
          s.combo = 0;
          s.comboMultiplier = 1;
          // Notify parent so GameUI combo bar resets
          // (infrequent — only on combo expiry)
        }
      }

      // ── Combo floats ──
      s.comboFloats = s.comboFloats
        .map(f => ({ ...f, y: f.y - 1.2, life: f.life - 0.025, scale: f.scale + 0.005 }))
        .filter(f => f.life > 0);

      // ── Dart physics & collision ──
      let scoreAdd = 0;
      let poppedAdd = 0;
      let hitThisFrame = false;
      // FIX (bug): track which darts exited without hitting anything for miss logic.
      // Previously a dart that was killed by hitting a balloon could also trip
      // missThisFrame if it happened to be off-screen coordinates simultaneously.
      let missThisFrame = false;
      let newStreak = s.streak;
      let popsThisFrame = 0;
      // FIX (bug): track which balloon indices were popped this frame for correct
      // combo float placement (old code used all dead balloons including prior frames).
      const poppedThisFrame = [];

      // FIX (perf): mutate darts in-place rather than mapping to new objects every frame.
      // At 60fps with many darts this saves significant GC pressure.
      for (let di = 0; di < s.darts.length; di++) {
        const d = s.darts[di];
        if (!d.alive) continue;

        d.x += d.vx;
        d.y += d.vy;
        if (d.type !== "sniper") d.vy += GRAVITY;

        // MIRV trigger
        if (d.type === "mirv" && !d.mirvTriggered && d.y < GAME_HEIGHT * 0.5) {
          d.mirvTriggered = true;
          d.alive = false;
          sounds.playExplosion();
          spawnParticles(s.particles, d.x, d.y, "#f97316", 12);
          // FIX (bug): push MIRV children after the loop completes so they
          // aren't processed in the same iteration that created them. This
          // ensures they get a full physics step on their first frame.
          const mirvX = d.x, mirvY = d.y;
          setTimeout(() => {
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
              s.darts.push({
                x: mirvX, y: mirvY,
                vx: Math.cos(angle) * DART_SPEED * 0.7,
                vy: Math.sin(angle) * DART_SPEED * 0.7,
                type: "mini", color: "#fb923c", finColor: "#ea580c",
                pierce: 0, alive: true,
              });
            }
          }, 0);
          continue;
        }

        // Off-screen — only count as miss if the dart never hit anything
        if (d.x < -30 || d.x > GAME_WIDTH + 30 || d.y < -30 || d.y > GAME_HEIGHT + 30) {
          if (d.type !== "mini") missThisFrame = true;
          d.alive = false;
          continue;
        }

        // Obstacle collision (sniper ignores obstacles)
        if (d.type !== "sniper" && s.obstacles.length > 0) {
          const obstHit = checkDartObstacleCollision(d, s.obstacles);
          if (obstHit.hit) {
            d.alive = false;
            spawnParticles(s.particles, d.x, d.y, "#94a3b8", 6);
            sounds.playPop();
            // FIX (bug): obstacle hit does NOT count as a miss (dart did hit something)
            // and does NOT set hitThisFrame (didn't hit a balloon). No streak change.
            continue;
          }
        }

        // Balloon collision
        let dartKilled = false;
        for (let bi = 0; bi < s.balloons.length; bi++) {
          const b = s.balloons[bi];
          if (!b.alive) continue;
          const dx = d.x - b.x;
          const dy = d.y - (b.y + Math.sin(b.wobble) * b.wobbleAmp);
          if (Math.sqrt(dx * dx + dy * dy) >= b.radius + 8) continue;

          hitThisFrame = true;
          const dmg = d.type === "sniper" ? b.hp : 1;
          b.hp -= dmg;

          if (b.hp <= 0) {
            b.alive = false;
            popsThisFrame++;
            scoreAdd += b.points;
            poppedAdd++;
            poppedThisFrame.push(bi);
            sounds.playPop();
            spawnParticles(s.particles, b.x, b.y, b.color, 10);

            // Bomb chain explosion
            if (b.type === "bomb") {
              sounds.playExplosion();
              spawnParticles(s.particles, b.x, b.y, "#f97316", 16);
              const explR = BALLOON_TYPES.bomb.explodeRadius;
              for (let obi = 0; obi < s.balloons.length; obi++) {
                const ob = s.balloons[obi];
                if (!ob.alive || obi === bi) continue;
                const edx = ob.x - b.x;
                const edy = ob.y - b.y;
                if (Math.sqrt(edx * edx + edy * edy) < explR) {
                  ob.alive = false;
                  scoreAdd += ob.points;
                  popsThisFrame++;
                  poppedAdd++;
                  poppedThisFrame.push(obi);
                  spawnParticles(s.particles, ob.x, ob.y, ob.color, 6);
                }
              }
            }
          } else {
            sounds.playPop();
          }

          if (d.pierce > 0) {
            d.pierce--;
          } else {
            d.alive = false;
            dartKilled = true;
            break;
          }
        }
        // Suppress spurious miss: dart was killed by a balloon hit, not going off-screen
        if (dartKilled) missThisFrame = false;
      }

      // ── Streak update ──
      if (hitThisFrame) {
        newStreak = s.streak + 1;
      } else if (missThisFrame) {
        newStreak = 0;
      }

      // ── Particle physics ──
      for (const p of s.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.03;
        p.size *= 0.97;
      }
      // FIX (perf): filter dead particles in-place with splice rather than
      // allocating a new array each frame.
      for (let i = s.particles.length - 1; i >= 0; i--) {
        if (s.particles[i].life <= 0) s.particles.splice(i, 1);
      }

      // Remove dead darts
      for (let i = s.darts.length - 1; i >= 0; i--) {
        if (!s.darts[i].alive) s.darts.splice(i, 1);
      }

      // ── Combo logic ──
      if (popsThisFrame > 0) {
        s.comboTimer = COMBO_WINDOW;
        s.combo += popsThisFrame;
        s.comboMultiplier = s.combo <= 1 ? 1 : Math.min(s.combo, 8);

        if (s.comboMultiplier > 1) {
          // FIX (bug): use poppedThisFrame indices to find the actual just-popped
          // balloon, not all dead balloons (which includes every pop since game start).
          const lastIdx = poppedThisFrame[poppedThisFrame.length - 1];
          const lastBalloon = s.balloons[lastIdx];
          const fx = lastBalloon ? lastBalloon.x : GAME_WIDTH / 2;
          const fy = lastBalloon ? lastBalloon.y : GAME_HEIGHT / 3;
          s.comboFloats.push({ x: fx, y: fy, text: `${s.comboMultiplier}x COMBO!`, life: 1, scale: 1 });
        }
      }

      // Apply combo multiplier to score
      const multipliedScore = scoreAdd * s.comboMultiplier;
      s.score += multipliedScore;
      s.totalPopped += poppedAdd;
      s.streak = newStreak;

      // Notify parent (infrequent — only when values actually change)
      if (multipliedScore > 0) onScoreChange(s.score);
      if (poppedAdd > 0) onTotalPoppedChange(s.totalPopped);
      if (newStreak !== s.streak) onStreakChange(s.streak);

      // Powerup reward from streak
      if (newStreak > 0 && newStreak % STREAK_FOR_POWERUP === 0 && newStreak !== s.streak) {
        sounds.playStreakChime();
        const keys = Object.keys(POWERUPS);
        const reward = keys[Math.floor(Math.random() * keys.length)];
        setPowerupInventory(prev => ({ ...prev, [reward]: (prev[reward] || 0) + 1 }));
      }

      // ── Win / lose ──
      // FIX (bug): use s.dartsRemaining (already decremented synchronously in
      // shoot()) rather than the prop value which may be one render behind.
      const allPopped = s.balloons.every(b => !b.alive);
      const noDartsFlying = s.darts.length === 0;

      if (!s.ended && (allPopped || (s.dartsRemaining <= 0 && noDartsFlying))) {
        s.ended = true;
        const won = allPopped;
        onGameEnd({
          won,
          score: s.score,
          totalPopped: s.totalPopped,
          dartsUsed: preset ? preset.darts - s.dartsRemaining : 0,
        });
      }

      render(ctx, bg, s);
      animFrameRef.current = requestAnimationFrame(loop);
    }

    function render(ctx, bg, s) {
      // FIX (perf): blit the pre-rendered static background in one drawImage call
      ctx.drawImage(bg, 0, 0);

      if (s.obstacles?.length > 0) drawObstacles(ctx, s.obstacles, Date.now());

      s.balloons.filter(b => b.alive).forEach(b => drawBalloon(ctx, b, 1));
      s.darts.filter(d => d.alive).forEach(d => drawDart(ctx, d));

      for (const p of s.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Launcher
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(LAUNCHER_POS.x, LAUNCHER_POS.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(LAUNCHER_POS.x, LAUNCHER_POS.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Combo floats
      for (const f of s.comboFloats) {
        ctx.save();
        ctx.globalAlpha = Math.min(f.life * 2, 1);
        ctx.font = `bold ${Math.round(18 * f.scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.6)";
        ctx.lineWidth = 3;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }

      // Combo bar
      if (s.comboMultiplier > 1) {
        const barWidth = Math.min(s.combo / 8, 1) * (GAME_WIDTH - 40);
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(20, 10, GAME_WIDTH - 40, 8);
        const comboGrad = ctx.createLinearGradient(20, 10, 20 + barWidth, 18);
        comboGrad.addColorStop(0, "#f59e0b");
        comboGrad.addColorStop(1, "#ef4444");
        ctx.fillStyle = comboGrad;
        ctx.fillRect(20, 10, barWidth, 8);
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "right";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(`${s.comboMultiplier}x`, GAME_WIDTH - 22, 20);
        ctx.restore();
      }

      // Aim line
      if (aimRef.current && s.gameState === "playing") {
        drawAimLine(ctx, LAUNCHER_POS, aimRef.current);
      }
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  // FIX: preset is the only dep that should restart the loop — callbacks and
  // sounds are stable refs that don't need to restart the animation frame chain.
  }, [preset, onScoreChange, onStreakChange, onTotalPoppedChange, onDartsRemainingChange, onGameEnd, sounds, setPowerupInventory]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="w-full max-w-[400px] rounded-2xl border-2 border-primary/30 shadow-xl touch-none"
      style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerMove}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
}