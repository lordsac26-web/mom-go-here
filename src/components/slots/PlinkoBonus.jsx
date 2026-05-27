import { useState, useEffect, useRef, useCallback } from "react";
import useHaptics from "../../hooks/useHaptics";
import { useMinigameSounds } from "@/hooks/useMinigameSounds";

/**
 * Canvas-based Plinko bonus mini-game (DartPop-style).
 * Highly interactive: glowing ball trails, peg light-bursts on hit,
 * neon multiplier slots, screen shake, floating score popups, and
 * a power meter that lets the player choose drop force + position.
 */

const CANVAS_W = 360;
const CANVAS_H = 520;
const PEG_ROWS = 9;
const PEG_RADIUS = 5;
const BALL_RADIUS = 7;   // smaller ball — more clearance between pegs and walls
const GRAVITY = 0.32;
const BOUNCE = 0.55;
const FRICTION = 0.988;
const TRAIL_MAX = 14;
const MIN_BOUNCE_VX = 1.2;  // minimum horizontal speed after any wall/peg hit
const WALL_MARGIN = BALL_RADIUS + 2; // safe inset from canvas edge

// Slot multipliers — symmetric, big middle for risk/reward feel
const SLOT_MULTIPLIERS = [50, 10, 5, 3, 2, 1, 2, 3, 5, 10, 50];
const SLOT_COLORS = [
  "#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#eab308", "#f97316",
  "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
];

function generatePegs() {
  const pegs = [];
  const startY = 70;
  const rowSpacing = (CANVAS_H - 160) / PEG_ROWS;
  // Keep pegs inset from walls so ball always has a clear path down the sides
  const SIDE_MARGIN = 28;
  const MAX_ROW_WIDTH = CANVAS_W - SIDE_MARGIN * 2;
  for (let row = 0; row < PEG_ROWS; row++) {
    const pegsInRow = row + 3;
    // Cap spacing so outermost pegs don't crowd the wall
    const spacing = Math.min(32, MAX_ROW_WIDTH / (pegsInRow - 1));
    const rowWidth = (pegsInRow - 1) * spacing;
    const startX = (CANVAS_W - rowWidth) / 2;
    for (let col = 0; col < pegsInRow; col++) {
      pegs.push({ x: startX + col * spacing, y: startY + row * rowSpacing, hitTime: 0 });
    }
  }
  return pegs;
}

function getSlotBoundaries() {
  const slotCount = SLOT_MULTIPLIERS.length;
  const totalWidth = CANVAS_W - 24;
  const slotWidth = totalWidth / slotCount;
  const slots = [];
  for (let i = 0; i < slotCount; i++) {
    slots.push({
      x: 12 + i * slotWidth,
      width: slotWidth,
      multiplier: SLOT_MULTIPLIERS[i],
      color: SLOT_COLORS[i],
    });
  }
  return slots;
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
  const slotsRef = useRef(getSlotBoundaries());
  const particlesRef = useRef([]);
  const floatsRef = useRef([]);
  const animFrameRef = useRef(null);
  const shakeRef = useRef(0);
  const slotFlashRef = useRef({}); // { slotIdx: timestamp }

  const maxDrops = scatterCount >= 5 ? 4 : scatterCount >= 4 ? 3 : 2;

  // Entrance sound
  useEffect(() => { sounds.bonusEntrance(); }, []);

  // Spawn a particle burst on peg hit
  const spawnParticles = useCallback((x, y, color, count = 6) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }, []);

  const spawnFloat = useCallback((x, y, text, color) => {
    floatsRef.current.push({ x, y, text, color, life: 1, scale: 1 });
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function tick() {
      // Update balls
      const aliveBalls = [];
      for (const ball of ballsRef.current) {
        if (ball.landed) { aliveBalls.push(ball); continue; }
        ball.vy += GRAVITY;
        ball.vx *= FRICTION;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > TRAIL_MAX) ball.trail.shift();

        // Wall bounces — enforce minimum outward velocity so ball never gets stuck
        if (ball.x < WALL_MARGIN) {
          ball.x = WALL_MARGIN;
          ball.vx = Math.max(Math.abs(ball.vx) * BOUNCE, MIN_BOUNCE_VX);
        }
        if (ball.x > CANVAS_W - WALL_MARGIN) {
          ball.x = CANVAS_W - WALL_MARGIN;
          ball.vx = -Math.max(Math.abs(ball.vx) * BOUNCE, MIN_BOUNCE_VX);
        }

        // Peg collisions
        for (const peg of pegsRef.current) {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = PEG_RADIUS + BALL_RADIUS;
          if (dist < minDist && dist > 0.1) {
            const nx = dx / dist;
            const ny = dy / dist;
            // Push ball fully out of overlap
            ball.x = peg.x + nx * (minDist + 0.5);
            ball.y = peg.y + ny * (minDist + 0.5);
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2 * dot * nx * BOUNCE;
            ball.vy -= 2 * dot * ny * BOUNCE;
            // Random horizontal nudge — ensure it always picks a direction
            const nudge = (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.2);
            ball.vx += nudge;
            // Guarantee minimum horizontal movement after peg hit
            if (Math.abs(ball.vx) < MIN_BOUNCE_VX) {
              ball.vx = (ball.vx >= 0 ? 1 : -1) * MIN_BOUNCE_VX;
            }
            // Clamp ball away from walls immediately after peg resolution
            ball.x = Math.max(WALL_MARGIN, Math.min(CANVAS_W - WALL_MARGIN, ball.x));
            peg.hitTime = Date.now();
            spawnParticles(peg.x, peg.y, "#fbbf24", 4);
            shakeRef.current = Math.min(shakeRef.current + 0.8, 5);
            sounds.plinkoTick();
          }
        }

        // Anti-stuck: if ball has very low total speed and hasn't landed, give it a nudge
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed < 0.5 && !ball.landed) {
          ball.vx += (Math.random() < 0.5 ? -1 : 1) * 1.5;
          ball.vy = Math.max(ball.vy, 1.0);
        }

        // Landing
        if (ball.y >= CANVAS_H - 70) {
          let slotIdx = 0;
          for (let i = 0; i < slotsRef.current.length; i++) {
            const s = slotsRef.current[i];
            if (ball.x >= s.x && ball.x < s.x + s.width) { slotIdx = i; break; }
          }
          const slot = slotsRef.current[slotIdx];
          const mult = slot.multiplier;
          ball.landed = true;
          ball.slotIdx = slotIdx;
          slotFlashRef.current[slotIdx] = Date.now();
          spawnParticles(ball.x, CANVAS_H - 60, slot.color, 18);
          spawnFloat(ball.x, CANVAS_H - 80, `${mult}x`, slot.color);
          shakeRef.current = Math.min(shakeRef.current + (mult >= 25 ? 8 : mult >= 5 ? 4 : 2), 14);

          // Haptic + audio feedback proportional to multiplier
          sounds.plinkoLand(mult);
          if (mult >= 25) haptics.winVibrate?.();
          else if (mult >= 5) haptics.scoreMilestone?.();
          else haptics.tapVibrate?.();

          // Lighting flash on big slots
          if (mult >= 10) {
            const flashColor = slot.color;
            const flash = document.createElement("div");
            flash.style.cssText = `position:fixed;inset:0;background:${flashColor}22;z-index:9999;pointer-events:none;`;
            document.body.appendChild(flash);
            if (window.gsap) window.gsap.to(flash, { opacity: 0, duration: 0.5, onComplete: () => flash.remove() });
            else setTimeout(() => flash.remove(), 500);
          }

          setLastMultiplier(mult);
          setTotalMultiplier(prev => prev + mult);
          setDrops(prev => {
            const newDrops = prev + 1;
            if (newDrops >= maxDrops) {
              setTimeout(() => setPhase("landed"), 900);
            } else {
              setTimeout(() => setPhase("ready"), 700);
            }
            return newDrops;
          });
        }
        aliveBalls.push(ball);
      }
      ballsRef.current = aliveBalls;

      // Update particles
      const aliveParticles = [];
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.vx *= 0.98;
        p.life -= 0.03;
        if (p.life > 0) aliveParticles.push(p);
      }
      particlesRef.current = aliveParticles;

      // Update floats
      const aliveFloats = [];
      for (const f of floatsRef.current) {
        f.y -= 1.4;
        f.life -= 0.018;
        f.scale = 1 + (1 - f.life) * 0.6;
        if (f.life > 0) aliveFloats.push(f);
      }
      floatsRef.current = aliveFloats;

      // Decay shake
      shakeRef.current *= 0.85;

      render(ctx);
      animFrameRef.current = requestAnimationFrame(tick);
    }

    function render(ctx) {
      const sx = (Math.random() - 0.5) * shakeRef.current;
      const sy = (Math.random() - 0.5) * shakeRef.current;
      ctx.save();
      ctx.translate(sx, sy);

      // Background — neon gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.5, "#0f172a");
      grad.addColorStop(1, "#1e1b4b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Neon side rails (drawn at WALL_MARGIN so they match the physics boundary)
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(WALL_MARGIN - 2, 50); ctx.lineTo(WALL_MARGIN - 2, CANVAS_H - 70);
      ctx.moveTo(CANVAS_W - WALL_MARGIN + 2, 50); ctx.lineTo(CANVAS_W - WALL_MARGIN + 2, CANVAS_H - 70);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pegs with hit-flash
      const now = Date.now();
      for (const peg of pegsRef.current) {
        const sinceHit = now - peg.hitTime;
        const flash = sinceHit < 300 ? 1 - sinceHit / 300 : 0;
        if (flash > 0) {
          ctx.beginPath();
          ctx.arc(peg.x, peg.y, PEG_RADIUS + 6 * flash, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251,191,36,${flash * 0.5})`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = flash > 0 ? "#fbbf24" : "#cbd5e1";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(peg.x - 1, peg.y - 1, PEG_RADIUS - 2, 0, Math.PI * 2);
        ctx.fillStyle = flash > 0 ? "#fef3c7" : "#f1f5f9";
        ctx.fill();
      }

      // Slots — neon backgrounds
      for (let i = 0; i < slotsRef.current.length; i++) {
        const slot = slotsRef.current[i];
        const flashTime = slotFlashRef.current[i] || 0;
        const sinceFlash = now - flashTime;
        const isFlashing = sinceFlash < 800;
        const flashAlpha = isFlashing ? 1 - sinceFlash / 800 : 0;

        // Slot body
        const slotGrad = ctx.createLinearGradient(0, CANVAS_H - 65, 0, CANVAS_H - 5);
        slotGrad.addColorStop(0, slot.color + "30");
        slotGrad.addColorStop(1, slot.color + (isFlashing ? "FF" : "60"));
        ctx.fillStyle = slotGrad;
        ctx.fillRect(slot.x, CANVAS_H - 65, slot.width - 2, 60);

        // Top neon bar
        ctx.fillStyle = slot.color;
        ctx.shadowColor = slot.color;
        ctx.shadowBlur = isFlashing ? 16 : 6;
        ctx.fillRect(slot.x + 1, CANVAS_H - 65, slot.width - 4, 3);
        ctx.shadowBlur = 0;

        // Multiplier label
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${slot.multiplier >= 50 ? 13 : 14}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = slot.color;
        ctx.shadowBlur = isFlashing ? 12 : 0;
        ctx.fillText(`${slot.multiplier}×`, slot.x + slot.width / 2, CANVAS_H - 32);
        ctx.shadowBlur = 0;

        if (flashAlpha > 0) {
          ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.4})`;
          ctx.fillRect(slot.x, CANVAS_H - 65, slot.width - 2, 60);
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

      // Ball trails + balls
      for (const ball of ballsRef.current) {
        // Trail
        for (let i = 0; i < ball.trail.length; i++) {
          const t = ball.trail[i];
          const a = (i / ball.trail.length) * 0.5;
          ctx.globalAlpha = a;
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(t.x, t.y, BALL_RADIUS * (i / ball.trail.length), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ball glow
        const ballGlow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS * 3);
        ballGlow.addColorStop(0, "rgba(251,191,36,0.6)");
        ballGlow.addColorStop(1, "transparent");
        ctx.fillStyle = ballGlow;
        ctx.fillRect(ball.x - 30, ball.y - 30, 60, 60);

        // Ball body
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, BALL_RADIUS);
        bg.addColorStop(0, "#fef3c7");
        bg.addColorStop(0.6, "#fbbf24");
        bg.addColorStop(1, "#d97706");
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Floats (multiplier popups)
      for (const f of floatsRef.current) {
        ctx.globalAlpha = Math.min(f.life * 1.5, 1);
        ctx.font = `bold ${Math.round(20 * f.scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.lineWidth = 4;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Drop indicator arrows during ready phase
      if (phase === "ready" && ballsRef.current.length === 0) {
        const arrowY = 28;
        ctx.fillStyle = "rgba(251,191,36,0.9)";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("👆 TAP ANYWHERE TO DROP", CANVAS_W / 2, arrowY);
      }

      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, maxDrops, spawnParticles, spawnFloat, haptics]);

  // Drop one ball at the chosen X
  function dropBall(startX) {
    if (phase !== "ready") return;
    setPhase("dropping");
    sounds.plinkoDrop();
    haptics.tapVibrate?.();
    const dropX = Math.max(20, Math.min(CANVAS_W - 20, startX));
    ballsRef.current.push({
      x: dropX,
      y: 12,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0,
      trail: [],
      landed: false,
    });
  }

  function handleCanvasTap(e) {
    if (phase !== "ready") return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_W;
    dropBall(x);
  }

  // Spin up totals when landed
  useEffect(() => {
    if (phase !== "landed") return;
    const finalMult = totalMultiplier || 1;
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
  }, [phase, totalMultiplier, baseWin]);

  const finalMultiplier = totalMultiplier || 1;
  const totalBonusValue = Math.round(baseWin * finalMultiplier);
  const extraWinnings = totalBonusValue - baseWin;

  return (
    <div className="fixed inset-0 z-[70] bg-black/95 flex items-start sm:items-center justify-center px-3 overflow-y-auto py-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="text-5xl mb-1 animate-bounce">📍</div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-400">
            PLINKO BONUS!
          </h2>
          <p className="text-sm text-gray-300 mt-1 font-bold">
            {phase === "ready" && drops < maxDrops && `Drop ${drops + 1} of ${maxDrops} — tap to drop!`}
            {phase === "dropping" && "Ball is falling..."}
            {phase === "landed" && "Calculating bonus..."}
          </p>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs font-black">
            <span className="text-cyan-400">Base: {baseWin.toLocaleString()}</span>
            <span className="text-yellow-400">Drops: {drops}/{maxDrops}</span>
            {totalMultiplier > 0 && (
              <span className="text-green-400">Total: {totalMultiplier}×</span>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex justify-center mb-3">
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
          <div className="text-center mb-2 bg-gray-800 rounded-xl py-2 border border-fuchsia-500/50">
            <span className="text-fuchsia-400 font-black text-2xl">{lastMultiplier}×</span>
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