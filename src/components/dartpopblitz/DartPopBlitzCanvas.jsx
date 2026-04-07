import { useRef, useEffect, useCallback, useState } from "react";
import {
  BALLOON_TYPES, POWERUPS, DART_SPEED, GRAVITY,
  SNIPER_PIERCE, GAME_WIDTH, GAME_HEIGHT, STREAK_FOR_POWERUP
} from "./gameConfig";

// ── Particles ──
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

// ── Draw helpers ──
function drawBalloon(ctx, b, scale) {
  ctx.save();
  ctx.translate(b.x, b.y + Math.sin(b.wobble) * b.wobbleAmp);
  const s = scale * (b.hp / b.maxHp * 0.3 + 0.7); // shrinks slightly when damaged
  ctx.scale(s, s);

  // Shadow
  ctx.beginPath();
  ctx.ellipse(0, b.radius + 4, b.radius * 0.6, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fill();

  // Body
  ctx.beginPath();
  ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
  ctx.fillStyle = b.color;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Highlight
  ctx.beginPath();
  ctx.arc(-b.radius * 0.3, -b.radius * 0.3, b.radius * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fill();

  // Knot
  ctx.beginPath();
  ctx.moveTo(-3, b.radius);
  ctx.lineTo(0, b.radius + 8);
  ctx.lineTo(3, b.radius);
  ctx.fillStyle = b.color;
  ctx.fill();

  // Emoji label
  ctx.font = `${b.radius * 0.9}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.emoji, 0, -1);

  // HP bar for tough
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
  const angle = Math.atan2(d.vy, d.vx);
  ctx.rotate(angle);

  // Dart body
  ctx.fillStyle = d.color || "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-6, -4);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();

  // Tip
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(20, 0);
  ctx.lineTo(14, -2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(20, 0);
  ctx.lineTo(14, 2);
  ctx.closePath();
  ctx.fill();

  // Fins
  ctx.fillStyle = d.finColor || "#ef4444";
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(-12, -8);
  ctx.lineTo(-8, -2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-12, 8);
  ctx.lineTo(-8, 2);
  ctx.closePath();
  ctx.fill();

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
  // Crosshair at end
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(to.x, to.y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x - 14, to.y);
  ctx.lineTo(to.x + 14, to.y);
  ctx.moveTo(to.x, to.y - 14);
  ctx.lineTo(to.x, to.y + 14);
  ctx.stroke();
  ctx.restore();
}

export default function DartPopBlitzCanvas({
  balloons, setBalloons,
  darts, setDarts,
  particles, setParticles,
  dartsRemaining, setDartsRemaining,
  score, setScore,
  streak, setStreak,
  activePowerup, setActivePowerup,
  powerupInventory, setPowerupInventory,
  gameState, setGameState,
  totalPopped, setTotalPopped,
  sounds,
}) {
  const canvasRef = useRef(null);
  const aimRef = useRef(null); // {x,y} of current aim position
  const launcherPos = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 40 };
  const animFrameRef = useRef(null);
  const gameDataRef = useRef({ balloons, darts, particles, dartsRemaining, score, streak, activePowerup, gameState, totalPopped });

  // Keep ref in sync
  useEffect(() => {
    gameDataRef.current = { balloons, darts, particles, dartsRemaining, score, streak, activePowerup, gameState, totalPopped };
  });

  // ── Shooting ──
  const shoot = useCallback((targetX, targetY) => {
    const gd = gameDataRef.current;
    if (gd.gameState !== "playing" || gd.dartsRemaining <= 0) return;

    const dx = targetX - launcherPos.x;
    const dy = targetY - launcherPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) return;
    const vx = (dx / dist) * DART_SPEED;
    const vy = (dy / dist) * DART_SPEED;

    const pw = gd.activePowerup;

    if (pw === "multishot") {
      sounds.playMultishot();
      const spread = 0.15;
      const newDarts = [-spread, 0, spread].map((a, i) => {
        const cos = Math.cos(a); const sin = Math.sin(a);
        return { x: launcherPos.x, y: launcherPos.y, vx: vx * cos - vy * sin, vy: vx * sin + vy * cos, type: "normal", color: "#22d3ee", finColor: "#0891b2", pierce: 0, alive: true };
      });
      setDarts(prev => [...prev, ...newDarts]);
      setDartsRemaining(prev => prev - 1);
      setActivePowerup(null);
    } else if (pw === "mirv") {
      sounds.playShoot();
      setDarts(prev => [...prev, { x: launcherPos.x, y: launcherPos.y, vx, vy, type: "mirv", color: "#f97316", finColor: "#dc2626", pierce: 0, alive: true, mirvTriggered: false }]);
      setDartsRemaining(prev => prev - 1);
      setActivePowerup(null);
    } else if (pw === "sniper") {
      sounds.playSniper();
      setDarts(prev => [...prev, { x: launcherPos.x, y: launcherPos.y, vx: vx * 1.5, vy: vy * 1.5, type: "sniper", color: "#a855f7", finColor: "#7c3aed", pierce: SNIPER_PIERCE, alive: true }]);
      setDartsRemaining(prev => prev - 1);
      setActivePowerup(null);
    } else {
      sounds.playShoot();
      setDarts(prev => [...prev, { x: launcherPos.x, y: launcherPos.y, vx, vy, type: "normal", color: "#94a3b8", finColor: "#ef4444", pierce: 0, alive: true }]);
      setDartsRemaining(prev => prev - 1);
    }
  }, [sounds, setDarts, setDartsRemaining, setActivePowerup]);

  // ── Input handlers ──
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    if (pos) aimRef.current = pos;
  }, [getCanvasPos]);

  const handlePointerUp = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e) || aimRef.current;
    if (pos) shoot(pos.x, pos.y);
    aimRef.current = null;
  }, [getCanvasPos, shoot]);

  const handleClick = useCallback((e) => {
    const pos = getCanvasPos(e);
    if (pos) shoot(pos.x, pos.y);
  }, [getCanvasPos, shoot]);

  // ── Game Loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function loop() {
      const gd = gameDataRef.current;
      if (gd.gameState !== "playing") {
        animFrameRef.current = requestAnimationFrame(loop);
        render(ctx, gd);
        return;
      }

      // Update balloons wobble
      let updatedBalloons = gd.balloons.map(b => {
        if (!b.alive) return b;
        return { ...b, wobble: b.wobble + b.wobbleSpeed };
      });

      // Update darts
      let updatedDarts = [...gd.darts];
      let updatedParticles = [...gd.particles];
      let scoreAdd = 0;
      let poppedAdd = 0;
      let hitThisFrame = false;
      let missThisFrame = false;
      let newStreak = gd.streak;

      updatedDarts = updatedDarts.map(d => {
        if (!d.alive) return d;
        let nd = { ...d, x: d.x + d.vx, y: d.y + d.vy };
        if (d.type !== "sniper") nd.vy += GRAVITY;

        // MIRV trigger: if it hits first balloon or travels 60% up
        if (nd.type === "mirv" && !nd.mirvTriggered && nd.y < GAME_HEIGHT * 0.5) {
          nd.mirvTriggered = true;
          nd.alive = false;
          sounds.playExplosion();
          spawnParticles(updatedParticles, nd.x, nd.y, "#f97316", 12);
          // Spawn 6 mini darts
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            updatedDarts.push({
              x: nd.x, y: nd.y,
              vx: Math.cos(angle) * DART_SPEED * 0.7,
              vy: Math.sin(angle) * DART_SPEED * 0.7,
              type: "mini", color: "#fb923c", finColor: "#ea580c",
              pierce: 0, alive: true,
            });
          }
          return nd;
        }

        // Off screen
        if (nd.x < -30 || nd.x > GAME_WIDTH + 30 || nd.y < -30 || nd.y > GAME_HEIGHT + 30) {
          if (nd.type !== "mini") missThisFrame = true;
          nd.alive = false;
          return nd;
        }

        // Collision with balloons
        for (let i = 0; i < updatedBalloons.length; i++) {
          const b = updatedBalloons[i];
          if (!b.alive) continue;
          const dx = nd.x - b.x;
          const dy = nd.y - (b.y + Math.sin(b.wobble) * b.wobbleAmp);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < b.radius + 8) {
            hitThisFrame = true;
            // Sniper kills instantly
            const dmg = d.type === "sniper" ? b.hp : 1;
            const newHp = b.hp - dmg;
            if (newHp <= 0) {
              updatedBalloons[i] = { ...b, alive: false };
              scoreAdd += b.points;
              poppedAdd++;
              sounds.playPop();
              spawnParticles(updatedParticles, b.x, b.y, b.color, 10);
              // Bomb explosion
              if (b.type === "bomb") {
                sounds.playExplosion();
                spawnParticles(updatedParticles, b.x, b.y, "#f97316", 16);
                const explR = BALLOON_TYPES.bomb.explodeRadius;
                updatedBalloons = updatedBalloons.map(ob => {
                  if (!ob.alive || ob.id === b.id) return ob;
                  const edx = ob.x - b.x;
                  const edy = ob.y - b.y;
                  if (Math.sqrt(edx * edx + edy * edy) < explR) {
                    scoreAdd += ob.points;
                    poppedAdd++;
                    spawnParticles(updatedParticles, ob.x, ob.y, ob.color, 6);
                    return { ...ob, alive: false };
                  }
                  return ob;
                });
              }
            } else {
              updatedBalloons[i] = { ...b, hp: newHp };
              sounds.playPop();
            }
            if (nd.pierce > 0) {
              nd.pierce--;
            } else {
              nd.alive = false;
            }
            break;
          }
        }
        return nd;
      });

      // Streak logic
      if (hitThisFrame) {
        newStreak = gd.streak + 1;
      } else if (missThisFrame) {
        newStreak = 0;
      }

      // Update particles
      updatedParticles = updatedParticles.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.1,
        life: p.life - 0.03,
        size: p.size * 0.97,
      })).filter(p => p.life > 0);

      // Clean dead darts
      updatedDarts = updatedDarts.filter(d => d.alive);

      // Apply state
      setBalloons(updatedBalloons);
      setDarts(updatedDarts);
      setParticles(updatedParticles);
      if (scoreAdd > 0) setScore(prev => prev + scoreAdd);
      if (poppedAdd > 0) setTotalPopped(prev => prev + poppedAdd);
      if (newStreak !== gd.streak) setStreak(newStreak);

      // Powerup reward from streak
      if (newStreak > 0 && newStreak % STREAK_FOR_POWERUP === 0 && newStreak !== gd.streak) {
        sounds.playStreakChime();
        const keys = Object.keys(POWERUPS);
        const reward = keys[Math.floor(Math.random() * keys.length)];
        setPowerupInventory(prev => ({ ...prev, [reward]: (prev[reward] || 0) + 1 }));
      }

      // Win / lose check (only when no darts in flight)
      const allPopped = updatedBalloons.every(b => !b.alive);
      const noDartsFlying = updatedDarts.length === 0;
      if (allPopped) {
        setGameState("won");
      } else if (gd.dartsRemaining <= 0 && noDartsFlying) {
        setGameState("lost");
      }

      render(ctx, {
        ...gd,
        balloons: updatedBalloons,
        darts: updatedDarts,
        particles: updatedParticles,
      });

      animFrameRef.current = requestAnimationFrame(loop);
    }

    function render(ctx, gd) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      grad.addColorStop(0, "#0ea5e9");
      grad.addColorStop(0.6, "#7dd3fc");
      grad.addColorStop(1, "#22c55e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Clouds
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      [[60, 50, 40], [200, 30, 30], [330, 70, 25]].forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.7, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.arc(cx - r * 0.5, cy + r * 0.1, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
      ctx.fillStyle = "#15803d";
      for (let gx = 0; gx < GAME_WIDTH; gx += 20) {
        ctx.fillRect(gx, GAME_HEIGHT - 50, 2, 8 + Math.sin(gx) * 4);
      }

      // Balloons
      gd.balloons.filter(b => b.alive).forEach(b => drawBalloon(ctx, b, 1));

      // Darts
      gd.darts.filter(d => d.alive).forEach(d => drawDart(ctx, d));

      // Particles
      gd.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Launcher
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.arc(launcherPos.x, launcherPos.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(launcherPos.x, launcherPos.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Aim line
      if (aimRef.current && gd.gameState === "playing") {
        drawAimLine(ctx, launcherPos, aimRef.current);
      }
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [setBalloons, setDarts, setParticles, setScore, setStreak, setTotalPopped, setGameState, setPowerupInventory, sounds]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="w-full max-w-[400px] rounded-2xl border-2 border-primary/30 shadow-xl touch-none"
      style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
      onMouseMove={handlePointerMove}
      onMouseUp={handleClick}
      onTouchStart={handlePointerMove}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
}