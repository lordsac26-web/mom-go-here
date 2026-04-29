import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

/**
 * Canvas-based Plinko bonus mini-game.
 * Ball drops from top, bounces off pegs, lands in a multiplier slot.
 * Player can choose drop position (left, center, right).
 */

const CANVAS_W = 320;
const CANVAS_H = 420;
const PEG_ROWS = 8;
const PEG_RADIUS = 5;
const BALL_RADIUS = 8;
const GRAVITY = 0.25;
const BOUNCE = 0.6;
const FRICTION = 0.98;

const SLOT_MULTIPLIERS = [1, 2, 3, 5, 10, 25, 10, 5, 3, 2, 1];
const SLOT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#a855f7",
  "#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444",
];

function generatePegs() {
  const pegs = [];
  const startY = 60;
  const rowSpacing = (CANVAS_H - 120) / PEG_ROWS;

  for (let row = 0; row < PEG_ROWS; row++) {
    const pegsInRow = row + 3;
    const rowWidth = (pegsInRow - 1) * 30;
    const startX = (CANVAS_W - rowWidth) / 2;
    for (let col = 0; col < pegsInRow; col++) {
      pegs.push({ x: startX + col * 30, y: startY + row * rowSpacing });
    }
  }
  return pegs;
}

function getSlotBoundaries() {
  const slotCount = SLOT_MULTIPLIERS.length;
  const totalWidth = CANVAS_W - 40;
  const slotWidth = totalWidth / slotCount;
  const slots = [];
  for (let i = 0; i < slotCount; i++) {
    slots.push({
      x: 20 + i * slotWidth,
      width: slotWidth,
      multiplier: SLOT_MULTIPLIERS[i],
      color: SLOT_COLORS[i],
    });
  }
  return slots;
}

export default function PlinkoBonus({ baseWin, scatterCount, onComplete, accentColor = "yellow" }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("choose"); // choose | dropping | landed
  const [drops, setDrops] = useState(0);
  const [totalMultiplier, setTotalMultiplier] = useState(0);
  const [lastMultiplier, setLastMultiplier] = useState(null);
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const collectBtnRef = useRef(null);
  const ballRef = useRef(null);
  const pegsRef = useRef(generatePegs());
  const slotsRef = useRef(getSlotBoundaries());
  const animFrameRef = useRef(null);

  const maxDrops = scatterCount >= 5 ? 3 : scatterCount >= 4 ? 2 : 1;

  // Draw the board
  const drawBoard = useCallback((ctx, ball = null, highlightSlot = null) => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, "#1a1a2e");
    grad.addColorStop(1, "#16213e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Pegs
    pegsRef.current.forEach(peg => {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#64748b";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, PEG_RADIUS - 1, 0, Math.PI * 2);
      ctx.fillStyle = "#94a3b8";
      ctx.fill();
    });

    // Slots at bottom
    slotsRef.current.forEach((slot, i) => {
      const isHighlight = highlightSlot === i;
      ctx.fillStyle = isHighlight ? slot.color : slot.color + "40";
      ctx.fillRect(slot.x, CANVAS_H - 45, slot.width - 2, 40);

      // Multiplier text
      ctx.fillStyle = isHighlight ? "#fff" : "#ccc";
      ctx.font = `bold ${slot.multiplier >= 10 ? "11" : "13"}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`${slot.multiplier}x`, slot.x + slot.width / 2, CANVAS_H - 20);

      // Dividers
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(slot.x, CANVAS_H - 48);
        ctx.lineTo(slot.x, CANVAS_H - 5);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Ball
    if (ball) {
      // Glow
      const glow = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, BALL_RADIUS * 2);
      glow.addColorStop(0, "rgba(234,179,8,0.4)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(ball.x - 20, ball.y - 20, 40, 40);

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, BALL_RADIUS * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "#fef3c7";
      ctx.fill();
    }

    // Drop position indicators (top)
    if (!ball) {
      const positions = [CANVAS_W * 0.3, CANVAS_W * 0.5, CANVAS_W * 0.7];
      const labels = ["←", "●", "→"];
      positions.forEach((x, i) => {
        ctx.beginPath();
        ctx.arc(x, 25, 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(234,179,8,0.3)";
        ctx.fill();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(labels[i], x, 30);
      });
    }
  }, []);

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    drawBoard(ctx);
  }, [drawBoard]);

  function dropBall(startX) {
    setPhase("dropping");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const ball = { x: startX, y: 15, vx: (Math.random() - 0.5) * 2, vy: 0 };
    ballRef.current = ball;

    function animate() {
      ball.vy += GRAVITY;
      ball.vx *= FRICTION;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collisions
      if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx) * BOUNCE; }
      if (ball.x > CANVAS_W - BALL_RADIUS) { ball.x = CANVAS_W - BALL_RADIUS; ball.vx = -Math.abs(ball.vx) * BOUNCE; }

      // Peg collisions
      pegsRef.current.forEach(peg => {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = PEG_RADIUS + BALL_RADIUS;

        if (dist < minDist) {
          const nx = dx / dist;
          const ny = dy / dist;
          ball.x = peg.x + nx * minDist;
          ball.y = peg.y + ny * minDist;
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 2 * dot * nx * BOUNCE;
          ball.vy -= 2 * dot * ny * BOUNCE;
          // Add randomness
          ball.vx += (Math.random() - 0.5) * 1.5;
        }
      });

      drawBoard(ctx, ball);

      // Check if landed
      if (ball.y >= CANVAS_H - 50) {
        // Find slot
        let slotIdx = 0;
        for (let i = 0; i < slotsRef.current.length; i++) {
          const slot = slotsRef.current[i];
          if (ball.x >= slot.x && ball.x < slot.x + slot.width) {
            slotIdx = i;
            break;
          }
        }

        const mult = SLOT_MULTIPLIERS[slotIdx];
        drawBoard(ctx, null, slotIdx);

        setLastMultiplier(mult);
        setTotalMultiplier(prev => prev + mult);
        setDrops(prev => {
          const newDrops = prev + 1;
          if (newDrops >= maxDrops) {
            setTimeout(() => setPhase("landed"), 600);
          } else {
            setTimeout(() => setPhase("choose"), 600);
          }
          return newDrops;
        });
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Spin up total when landed
  useEffect(() => {
    if (phase !== "landed") return;
    const finalMult = totalMultiplier || 1;
    const totalBonusValue = Math.round(baseWin * finalMult);
    const duration = 2000;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedTotal(Math.round(totalBonusValue * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [phase, totalMultiplier, baseWin]);

  function handleCanvasTap(e) {
    if (phase !== "choose") return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;

    // Clamp to playable area
    const dropX = Math.max(30, Math.min(CANVAS_W - 30, x));
    dropBall(dropX);
  }

  const finalMultiplier = totalMultiplier || 1;
  const totalBonusValue = Math.round(baseWin * finalMultiplier);
  const extraWinnings = totalBonusValue - baseWin;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-start sm:items-center justify-center px-4 overflow-y-auto py-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="text-4xl mb-1">📍</div>
          <h2 className="text-2xl font-black text-yellow-400">PLINKO BONUS!</h2>
          <p className="text-sm text-gray-300 mt-1">
            {phase === "choose"
              ? `Tap the board to drop your ball! (${drops + 1}/${maxDrops})`
              : phase === "dropping"
              ? "Ball is dropping..."
              : "Calculating your winnings..."}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs font-bold">
            <span className="text-cyan-400">Base: {baseWin.toLocaleString()}</span>
            <span className="text-yellow-400">Drops: {drops}/{maxDrops}</span>
            {totalMultiplier > 0 && (
              <span className="text-green-400">Total: {totalMultiplier}x</span>
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
            className="rounded-2xl border-2 border-yellow-600/50 shadow-lg cursor-pointer"
            style={{ width: "100%", maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          />
        </div>

        {/* Last multiplier flash */}
        {lastMultiplier && phase !== "landed" && (
          <div className="text-center mb-3 bg-gray-800 rounded-xl py-2 border border-yellow-600/50">
            <span className="text-yellow-400 font-black text-2xl">{lastMultiplier}x</span>
            <span className="text-gray-400 text-sm ml-2">last drop</span>
          </div>
        )}

        {/* Final results */}
        {phase === "landed" && (
          <div className="text-center space-y-3">
            <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-2xl py-5 px-4 border-2 border-yellow-300">
              <div className="text-sm font-bold text-yellow-900 uppercase">Total Multiplier</div>
              <div className="text-4xl font-black text-gray-900">{finalMultiplier}x</div>
              <div className="mt-3 bg-gray-900/30 rounded-xl py-3 px-4">
                <div className="text-xs text-yellow-900/70 font-bold uppercase">Total Bonus</div>
                <div className="text-4xl font-black text-gray-900 tabular-nums">
                  {displayedTotal.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm font-black text-gray-900">
                🎉 Extra: +{extraWinnings.toLocaleString()}
              </div>
            </div>

            <button
              ref={collectBtnRef}
              onClick={() => onComplete(extraWinnings)}
              className="w-full text-xl font-black py-5 rounded-2xl border-2 transition-transform active:scale-95 bg-green-600 text-white border-green-400 animate-pulse"
            >
              💰 Collect +{extraWinnings.toLocaleString()} & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}