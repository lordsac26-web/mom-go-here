import { useState, useEffect, useRef, useCallback } from "react";
import useHaptics from "../../hooks/useHaptics";
import { useMinigameSounds } from "@/hooks/useMinigameSounds";

/**
 * Canvas-based Plinko bonus mini-game — proper physics simulation.
 *
 * Physics improvements:
 *  - 13 peg rows (was 9) → longer, more chaotic path
 *  - True impulse-based peg collision (reflect off normal + realistic energy loss)
 *  - Angular momentum spin on the ball affects bounce direction
 *  - Drop position jitter ±35px so precise edge-aiming is unreliable
 *  - Narrower 50x edge slots — harder to hit deliberately
 *  - Denser center peg coverage funnels ball toward middle more naturally
 *  - No artificial MIN_BOUNCE_VX — ball can fall nearly straight down (real plinko)
 */

const CANVAS_W = 360;
const CANVAS_H = 560;
const PEG_ROWS = 13;          // was 9
const PEG_RADIUS = 5;
const BALL_RADIUS = 6;
const GRAVITY = 0.28;
const RESTITUTION = 0.52;     // energy kept on peg bounce
const FRICTION = 0.992;       // air friction
const SPIN_TRANSFER = 0.18;   // how much spin from peg hit affects next bounce
const TRAIL_MAX = 16;
const WALL_MARGIN = BALL_RADIUS + 3;
const DROP_JITTER = 35;       // ±px randomized from tap position

// Redesigned slot layout — 50x slots are very narrow, center slots wider
// [50, 15, 8, 4, 2, 1, 1, 2, 4, 8, 15, 50]
// Width weights: edge slots = 0.6 units, inner = 1.0, center = 1.4
const SLOT_CONFIG = [
  { multiplier: 50,  color: "#ec4899", widthWeight: 0.5 },
  { multiplier: 15,  color: "#a855f7", widthWeight: 0.8 },
  { multiplier: 8,   color: "#3b82f6", widthWeight: 1.0 },
  { multiplier: 4,   color: "#22c55e", widthWeight: 1.1 },
  { multiplier: 2,   color: "#eab308", widthWeight: 1.2 },
  { multiplier: 1,   color: "#64748b", widthWeight: 1.4 },
  { multiplier: 1,   color: "#64748b", widthWeight: 1.4 },
  { multiplier: 2,   color: "#eab308", widthWeight: 1.2 },
  { multiplier: 4,   color: "#22c55e", widthWeight: 1.1 },
  { multiplier: 8,   color: "#3b82f6", widthWeight: 1.0 },
  { multiplier: 15,  color: "#a855f7", widthWeight: 0.8 },
  { multiplier: 50,  color: "#ec4899", widthWeight: 0.5 },
];

function buildSlotBoundaries() {
  const totalWeight = SLOT_CONFIG.reduce((s, c) => s + c.widthWeight, 0);
  const usableW = CANVAS_W - 20;
  let x = 10;
  return SLOT_CONFIG.map(cfg => {
    const w = (cfg.widthWeight / totalWeight) * usableW;
    const slot = { x, width: w, multiplier: cfg.multiplier, color: cfg.color };
    x += w;
    return slot;
  });
}

function generatePegs() {
  const pegs = [];
  const startY = 55;
  const SLOT_AREA_H = 70;
  const availH = CANVAS_H - startY - SLOT_AREA_H;
  const rowSpacing = availH / PEG_ROWS;

  // Triangle layout — row i has (i+3) pegs, centered
  const SIDE_MARGIN = 22;
  const MAX_ROW_WIDTH = CANVAS_W - SIDE_MARGIN * 2;

  for (let row = 0; row < PEG_ROWS; row++) {
    const pegsInRow = row + 3;
    const spacing = Math.min(28, MAX_ROW_WIDTH / (pegsInRow - 1));
    const rowWidth = (pegsInRow - 1) * spacing;
    const startX = (CANVAS_W - rowWidth) / 2;
    for (let col = 0; col < pegsInRow; col++) {
      pegs.push({
        x: startX + col * spacing,
        y: startY + row * rowSpacing,
        hitTime: 0,
      });
    }
  }
  return pegs;
}

export default function PlinkoBonus({ baseWin, scatterCount, onComplete }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("ready"); // ready | dropping | landed
  const [drops, setDrops] = useState(0);
  const [totalMultiplier, setTotalMultiplier] = useState(0);
  const [lastMultiplier, setLastMultiplier] = useState(null);
  const [displayedTotal, setDisplayedTotal] = useState(0);

  const haptics = useHaptics();
  const sounds = useMinigameSounds();
  const ballsRef = useRef([]);
  const pegsRef = useRef(generatePegs());
  const slotsRef = useRef(buildSlotBoundaries());
  const particlesRef = useRef([]);
  const floatsRef = useRef([]);
  const animFrameRef = useRef(null);
  const shakeRef = useRef(0);
  const slotFlashRef = useRef({});
  const phaseRef = useRef("ready");
  const dropsRef = useRef(0);
  const totalMultRef = useRef(0);

  const maxDrops = scatterCount >= 5 ? 4 : scatterCount >= 4 ? 3 : 2;

  useEffect(() => { sounds.bonusEntrance(); }, []);

  const spawnParticles = useCallback((x, y, color, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.8;
      const speed = 1.5 + Math.random() * 3.5;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }, []);

  const spawnFloat = useCallback((x, y, text, color) => {
    floatsRef.current.push({ x, y, text, color, life: 1, scale: 1 });
  }, []);

  // Main physics + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function tick() {
      const aliveBalls = [];
      for (const ball of ballsRef.current) {
        if (ball.landed) { aliveBalls.push(ball); continue; }

        // --- Physics integration ---
        ball.vy += GRAVITY;
        ball.vx *= FRICTION;
        // Apply spin drift — accumulated spin slightly deflects horizontal
        ball.vx += ball.spin * SPIN_TRANSFER;
        ball.spin *= 0.92; // spin decay
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > TRAIL_MAX) ball.trail.shift();

        // Wall bounces — realistic reflection, no artificial minimum
        if (ball.x < WALL_MARGIN) {
          ball.x = WALL_MARGIN;
          ball.vx = Math.abs(ball.vx) * RESTITUTION + 0.3;
          ball.spin *= -0.5;
        }
        if (ball.x > CANVAS_W - WALL_MARGIN) {
          ball.x = CANVAS_W - WALL_MARGIN;
          ball.vx = -(Math.abs(ball.vx) * RESTITUTION + 0.3);
          ball.spin *= -0.5;
        }

        // Peg collisions — true impulse reflection off collision normal
        for (const peg of pegsRef.current) {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const distSq = dx * dx + dy * dy;
          const minDist = PEG_RADIUS + BALL_RADIUS;
          if (distSq < minDist * minDist && distSq > 0.01) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;

            // Push out of overlap
            const overlap = minDist - dist;
            ball.x += nx * (overlap + 0.5);
            ball.y += ny * (overlap + 0.5);

            // Reflect velocity off collision normal
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
            ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;

            // Add tangential spin-based deflection — makes each bounce slightly different
            // even from identical drop positions
            const tangent = -ny; // 90° rotation of normal
            const spinNudge = (Math.random() - 0.5) * 2.2 + ball.spin * 0.4;
            ball.vx += tangent * spinNudge;
            // Update ball spin from this impact
            ball.spin = spinNudge * 0.6;

            // Clamp away from walls
            ball.x = Math.max(WALL_MARGIN, Math.min(CANVAS_W - WALL_MARGIN, ball.x));

            peg.hitTime = Date.now();
            spawnParticles(peg.x, peg.y, "#fbbf24", 4);
            shakeRef.current = Math.min(shakeRef.current + 0.6, 5);
            sounds.plinkoTick();
            break; // only one peg collision per frame
          }
        }

        // Anti-stuck: extremely slow ball gets a random nudge
        const speedSq = ball.vx * ball.vx + ball.vy * ball.vy;
        if (speedSq < 0.25 && !ball.landed) {
          ball.vx += (Math.random() - 0.5) * 2;
          ball.vy = Math.max(ball.vy, 0.8);
        }

        // Landing detection
        if (ball.y >= CANVAS_H - 72) {
          let slotIdx = slotsRef.current.length - 1;
          for (let i = 0; i < slotsRef.current.length; i++) {
            const s = slotsRef.current[i];
            if (ball.x >= s.x && ball.x < s.x + s.width) { slotIdx = i; break; }
          }
          const slot = slotsRef.current[slotIdx];
          const mult = slot.multiplier;
          ball.landed = true;
          ball.slotIdx = slotIdx;
          slotFlashRef.current[slotIdx] = Date.now();
          spawnParticles(ball.x, CANVAS_H - 65, slot.color, mult >= 10 ? 22 : 12);
          spawnFloat(ball.x, CANVAS_H - 85, `${mult}×`, slot.color);
          shakeRef.current = Math.min(shakeRef.current + (mult >= 25 ? 10 : mult >= 8 ? 5 : 2), 14);

          sounds.plinkoLand(mult);
          if (mult >= 25) haptics.winVibrate?.();
          else if (mult >= 5) haptics.scoreMilestone?.();
          else haptics.tapVibrate?.();

          if (mult >= 10) {
            const flash = document.createElement("div");
            flash.style.cssText = `position:fixed;inset:0;background:${slot.color}20;z-index:9999;pointer-events:none;`;
            document.body.appendChild(flash);
            if (window.gsap) window.gsap.to(flash, { opacity: 0, duration: 0.5, onComplete: () => flash.remove() });
            else setTimeout(() => flash.remove(), 500);
          }

          setLastMultiplier(mult);
          totalMultRef.current += mult;
          setTotalMultiplier(totalMultRef.current);

          dropsRef.current += 1;
          setDrops(dropsRef.current);

          if (dropsRef.current >= maxDrops) {
            setTimeout(() => {
              phaseRef.current = "landed";
              setPhase("landed");
            }, 900);
          } else {
            setTimeout(() => {
              phaseRef.current = "ready";
              setPhase("ready");
            }, 700);
          }
        }
        aliveBalls.push(ball);
      }
      ballsRef.current = aliveBalls;

      // Particles
      particlesRef.current = particlesRef.current
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, vx: p.vx * 0.98, life: p.life - 0.03 }))
        .filter(p => p.life > 0);

      // Floats
      floatsRef.current = floatsRef.current
        .map(f => ({ ...f, y: f.y - 1.4, life: f.life - 0.018, scale: 1 + (1 - f.life) * 0.6 }))
        .filter(f => f.life > 0);

      shakeRef.current *= 0.85;
      render(ctx);
      animFrameRef.current = requestAnimationFrame(tick);
    }

    function render(ctx) {
      const sx = (Math.random() - 0.5) * shakeRef.current;
      const sy = (Math.random() - 0.5) * shakeRef.current;
      ctx.save();
      ctx.translate(sx, sy);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Side rails
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(WALL_MARGIN - 2, 40);
      ctx.lineTo(WALL_MARGIN - 2, CANVAS_H - 72);
      ctx.moveTo(CANVAS_W - WALL_MARGIN + 2, 40);
      ctx.lineTo(CANVAS_W - WALL_MARGIN + 2, CANVAS_H - 72);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pegs
      const now = Date.now();
      for (const peg of pegsRef.current) {
        const sinceHit = now - peg.hitTime;
        const flash = sinceHit < 300 ? 1 - sinceHit / 300 : 0;
        if (flash > 0) {
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, PEG_RADIUS + 7 * flash, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251,191,36,${flash * 0.45})`;
          ctx.fill();
        }
        // Peg body
        const pegGrad = ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, PEG_RADIUS);
        pegGrad.addColorStop(0, flash > 0 ? "#fef3c7" : "#e2e8f0");
        pegGrad.addColorStop(1, flash > 0 ? "#fbbf24" : "#94a3b8");
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = pegGrad;
        ctx.fill();
      }

      // Slot dividers (thin vertical lines between slots)
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      for (const s of slotsRef.current) {
        ctx.beginPath();
        ctx.moveTo(s.x, CANVAS_H - 72);
        ctx.lineTo(s.x, CANVAS_H - 4);
        ctx.stroke();
      }

      // Slots
      for (let i = 0; i < slotsRef.current.length; i++) {
        const slot = slotsRef.current[i];
        const flashTime = slotFlashRef.current[i] || 0;
        const sinceFlash = now - flashTime;
        const isFlashing = sinceFlash < 900;
        const flashAlpha = isFlashing ? 1 - sinceFlash / 900 : 0;

        // Body gradient
        const slotGrad = ctx.createLinearGradient(0, CANVAS_H - 68, 0, CANVAS_H - 4);
        slotGrad.addColorStop(0, slot.color + "28");
        slotGrad.addColorStop(1, slot.color + (isFlashing ? "CC" : "55"));
        ctx.fillStyle = slotGrad;
        ctx.fillRect(slot.x + 1, CANVAS_H - 68, slot.width - 2, 64);

        // Top neon bar
        ctx.fillStyle = slot.color;
        ctx.shadowColor = slot.color;
        ctx.shadowBlur = isFlashing ? 20 : 6;
        ctx.fillRect(slot.x + 1, CANVAS_H - 68, slot.width - 2, 3);
        ctx.shadowBlur = 0;

        // Label — scale font to fit narrow slots
        const maxFontSize = Math.min(14, slot.width * 0.55);
        ctx.fillStyle = isFlashing ? "#fff" : "#e2e8f0";
        ctx.font = `bold ${maxFontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = slot.color;
        ctx.shadowBlur = isFlashing ? 14 : 0;
        ctx.fillText(`${slot.multiplier}×`, slot.x + slot.width / 2, CANVAS_H - 36);
        ctx.shadowBlur = 0;

        if (flashAlpha > 0) {
          ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.35})`;
          ctx.fillRect(slot.x + 1, CANVAS_H - 68, slot.width - 2, 64);
        }
      }

      // Particles
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Balls
      for (const ball of ballsRef.current) {
        // Trail
        for (let i = 0; i < ball.trail.length; i++) {
          const t = ball.trail[i];
          const a = (i / ball.trail.length) * 0.45;
          ctx.globalAlpha = a;
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(t.x, t.y, BALL_RADIUS * (i / ball.trail.length) * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Glow halo
        const halo = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS * 3.5);
        halo.addColorStop(0, "rgba(251,191,36,0.55)");
        halo.addColorStop(1, "transparent");
        ctx.fillStyle = halo;
        ctx.fillRect(ball.x - 28, ball.y - 28, 56, 56);

        // Ball body with specular highlight
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 0, ball.x, ball.y, BALL_RADIUS);
        bg.addColorStop(0, "#fef9c3");
        bg.addColorStop(0.5, "#fbbf24");
        bg.addColorStop(1, "#b45309");
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Spin indicator — tiny dot showing rotation
        if (!ball.landed) {
          const dotAngle = now * 0.008 * Math.sign(ball.spin || 1);
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.beginPath();
          ctx.arc(
            ball.x + Math.cos(dotAngle) * (BALL_RADIUS - 2),
            ball.y + Math.sin(dotAngle) * (BALL_RADIUS - 2),
            1.2, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Floating multiplier popups
      for (const f of floatsRef.current) {
        ctx.globalAlpha = Math.min(f.life * 1.5, 1);
        ctx.font = `bold ${Math.round(18 * f.scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.8)";
        ctx.lineWidth = 4;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Drop indicator
      if (phaseRef.current === "ready" && ballsRef.current.length === 0) {
        ctx.fillStyle = "rgba(251,191,36,0.85)";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("👆 TAP TO DROP BALL", CANVAS_W / 2, 26);
      }

      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [spawnParticles, spawnFloat, haptics, maxDrops]);

  function dropBall(tapX) {
    if (phaseRef.current !== "ready") return;
    phaseRef.current = "dropping";
    setPhase("dropping");
    sounds.plinkoDrop();
    haptics.tapVibrate?.();

    // Critical: randomize drop position ±DROP_JITTER from tap — prevents reliable aiming
    const jitter = (Math.random() - 0.5) * 2 * DROP_JITTER;
    const dropX = Math.max(WALL_MARGIN + 5, Math.min(CANVAS_W - WALL_MARGIN - 5, tapX + jitter));

    ballsRef.current.push({
      x: dropX,
      y: 10,
      vx: (Math.random() - 0.5) * 1.0,  // small initial horizontal noise
      vy: 0.5,
      spin: (Math.random() - 0.5) * 3,   // random initial spin
      trail: [],
      landed: false,
    });
  }

  function handleCanvasTap(e) {
    if (phaseRef.current !== "ready") return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    dropBall(x);
  }

  // Count-up animation when all drops done
  useEffect(() => {
    if (phase !== "landed") return;
    const finalMult = totalMultRef.current || 1;
    const totalBonusValue = Math.round(baseWin * finalMult);
    const duration = 2000;
    const startTime = Date.now();
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedTotal(Math.round(totalBonusValue * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [phase, baseWin]);

  const finalMultiplier = totalMultiplier || 1;
  const totalBonusValue = Math.round(baseWin * finalMultiplier);
  const extraWinnings = totalBonusValue - baseWin;

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex items-start sm:items-center justify-center px-3 overflow-y-auto py-2">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="text-4xl mb-0.5 animate-bounce">📍</div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-400">
            PLINKO BONUS!
          </h2>
          <p className="text-sm text-gray-300 mt-0.5 font-bold">
            {phase === "ready" && drops < maxDrops && `Drop ${drops + 1} of ${maxDrops} — tap anywhere to drop!`}
            {phase === "dropping" && "🎱 Ball falling..."}
            {phase === "landed" && "✨ Calculating bonus..."}
          </p>
          <div className="flex items-center justify-center gap-3 mt-1 text-xs font-black">
            <span className="text-cyan-400">Base: {baseWin.toLocaleString()}</span>
            <span className="text-yellow-400">Drops: {drops}/{maxDrops}</span>
            {totalMultiplier > 0 && (
              <span className="text-green-400">Mult: {totalMultiplier}×</span>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center mb-2">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasTap}
            onTouchEnd={handleCanvasTap}
            className="rounded-2xl border-2 border-fuchsia-500/60 shadow-[0_0_40px_rgba(217,70,239,0.4)] cursor-pointer touch-none w-full max-w-[360px]"
            style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          />
        </div>

        {/* Last multiplier banner */}
        {lastMultiplier && phase !== "landed" && (
          <div className="text-center mb-2 bg-gray-800 rounded-xl py-1.5 border border-fuchsia-500/50">
            <span className="text-fuchsia-400 font-black text-xl">{lastMultiplier}×</span>
            <span className="text-gray-400 text-sm ml-2">last drop</span>
          </div>
        )}

        {/* Final results */}
        {phase === "landed" && (
          <div className="text-center space-y-3">
            <div className="bg-gradient-to-r from-fuchsia-600 via-purple-500 to-pink-600 rounded-2xl py-5 px-4 border-2 border-pink-300 shadow-[0_0_30px_rgba(217,70,239,0.6)]">
              <div className="text-sm font-black text-white/80 uppercase">Total Multiplier</div>
              <div className="text-5xl font-black text-white">{finalMultiplier}×</div>
              <div className="mt-3 bg-black/30 rounded-xl py-3 px-4">
                <div className="text-xs text-white/70 font-black uppercase">Total Bonus</div>
                <div className="text-4xl font-black text-yellow-300 tabular-nums">
                  {displayedTotal.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm font-black text-white">
                🎉 Extra: +{extraWinnings.toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => { sounds.collectBonus(); onComplete(extraWinnings); }}
              className="w-full text-xl font-black py-5 rounded-2xl bg-green-600 text-white border-2 border-green-400 active:scale-95 animate-pulse shadow-lg"
            >
              💰 Collect +{extraWinnings.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}