import { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback } from "react";

/**
 * Top-down coin pusher with a Plinko-style drop zone.
 *
 * Ref API:  dropCoin(xFraction)  — drop a coin at 0..1 across the bed width
 * Props:    onCollect(count)     — called with number of coins that fell off the front
 *
 * Sim space (fractions of the bed):
 *   x: 0 (left) .. 1 (right)
 *   z: 0 (back / pusher) .. 1 (front ledge); z > 1 = collected
 *   y: drop-in height (px), 0 = resting on the bed
 *
 * Plinko: dropped coins fall through a field of pegs, bouncing left/right
 * randomly at each row before settling onto the bed in front of the pusher.
 */

const COIN_R = 0.065;             // fraction of bed width
const PEG_R = 0.022;
const MIN_GAP = COIN_R * 1.85;
const GRAVITY = 1100;              // px/s^2 for the drop-in animation
const FALL_VZ = 0.55;             // forward speed (fractions/s) while falling
const BOUNCE = 0.45;              // horizontal impulse per peg hit (fractions/s)
const FRICTION = 0.92;            // per-frame vx damping
const MAX = 80;

// Staggered Plinko peg field (z increases toward the front).
const PEGS = [
  { x: 0.50, z: 0.31 },
  { x: 0.37, z: 0.37 }, { x: 0.63, z: 0.37 },
  { x: 0.50, z: 0.43 },
  { x: 0.37, z: 0.49 }, { x: 0.63, z: 0.49 },
];

let _id = 1;
function makeCoin(x, z, y = 0) {
  return {
    id: _id++, x, z, y, vy: 0, vx: 0, vz: y > 0 ? FALL_VZ : 0,
    settled: y === 0, spin: Math.random() * 360, hitPegs: new Set(),
  };
}

const CoinPusherCanvas = forwardRef(function CoinPusherCanvas({ onCollect }, ref) {
  const coinsRef = useRef([]);
  const [, setTick] = useState(0);
  const onCollectRef = useRef(onCollect);
  onCollectRef.current = onCollect;
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const plateRef = useRef(0.1);

  const dropCoin = useCallback((xFraction = 0.5) => {
    if (coinsRef.current.length >= MAX) return;
    const x = Math.max(COIN_R, Math.min(1 - COIN_R, xFraction));
    coinsRef.current.push(makeCoin(x, 0.27, 110));
  }, []);

  useImperativeHandle(ref, () => ({ dropCoin }), [dropCoin]);

  // Seed a starter pile so the board isn't empty.
  useEffect(() => {
    const seed = [];
    for (let i = 0; i < 16; i++) {
      seed.push(makeCoin(0.15 + Math.random() * 0.7, 0.52 + Math.random() * 0.4, 0));
    }
    coinsRef.current = seed;
  }, []);

  useEffect(() => {
    function frame(ts) {
      const last = lastRef.current || ts;
      const dt = Math.min((ts - last) / 1000, 0.033);
      lastRef.current = ts;

      const t = ts / 1000;
      const offset = (Math.sin(t * 1.5) + 1) / 2;   // 0..1
      const plateFront = 0.08 + offset * 0.2;
      plateRef.current = plateFront;

      const coins = coinsRef.current;
      let collected = 0;

      // Falling coins: gravity + forward drift + Plinko peg bounces.
      for (const c of coins) {
        if (c.y > 0) {
          c.vy += GRAVITY * dt;
          c.y -= c.vy * dt;
          c.z += c.vz * dt;
          c.x += c.vx * dt;
          c.vx *= FRICTION;
          // Peg collisions: bounce when the coin's z crosses a peg row.
          for (let p = 0; p < PEGS.length; p++) {
            const peg = PEGS[p];
            if (c.hitPegs.has(p)) continue;
            if (Math.abs(c.z - peg.z) < COIN_R + PEG_R && Math.abs(c.x - peg.x) < COIN_R + PEG_R) {
              c.hitPegs.add(p);
              const dir = c.x < peg.x ? -1 : (c.x > peg.x ? 1 : (Math.random() < 0.5 ? -1 : 1));
              c.vx = dir * BOUNCE + (Math.random() - 0.5) * 0.1;
            }
          }
          if (c.y <= 0) { c.y = 0; c.vy = 0; c.vz = 0; c.vx = 0; c.settled = true; }
        }
        c.spin += dt * 30;
      }

      // Pusher shove: anything the plate face overlaps gets pushed forward.
      for (const c of coins) {
        if (c.settled && c.z < plateFront + COIN_R) {
          c.z = plateFront + COIN_R;
        }
      }

      // Forward collision propagation (resolve front-most first).
      coins.sort((a, b) => b.z - a.z);
      for (let i = 0; i < coins.length; i++) {
        for (let j = i + 1; j < coins.length; j++) {
          const a = coins[i], b = coins[j];
          if (Math.abs(a.x - b.x) > MIN_GAP) continue;
          const gap = a.z - b.z;
          if (gap >= 0 && gap < MIN_GAP && a.settled && b.settled) {
            a.z += (MIN_GAP - gap) * 0.5;
          }
        }
      }

      // Keep coins inside the side walls.
      for (const c of coins) {
        if (c.x < COIN_R) { c.x = COIN_R; c.vx = Math.abs(c.vx) * 0.5; }
        if (c.x > 1 - COIN_R) { c.x = 1 - COIN_R; c.vx = -Math.abs(c.vx) * 0.5; }
      }

      // Collect coins past the front ledge.
      for (let i = coins.length - 1; i >= 0; i--) {
        if (coins[i].z > 1) { coins.splice(i, 1); collected++; }
      }

      if (collected > 0) onCollectRef.current?.(collected);

      setTick(x => (x + 1) % 1000000);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const coins = coinsRef.current;
  const plateFront = plateRef.current;
  const coinSize = COIN_R * 2 * 100;
  const pegSize = PEG_R * 2 * 100;

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-inner touch-none"
      style={{ background: "linear-gradient(180deg,#1e293b 0%,#0f172a 100%)" }}
    >
      {/* Side rails */}
      <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-slate-600 to-slate-700/40 z-20" />
      <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-slate-600 to-slate-700/40 z-20" />

      {/* Back wall shadow */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-10" />

      {/* Plinko pegs */}
      {PEGS.map((p, i) => (
        <div
          key={`peg-${i}`}
          className="absolute rounded-full z-[15]"
          style={{
            width: `${pegSize}%`,
            aspectRatio: "1",
            left: `${p.x * 100}%`,
            top: `${p.z * 100}%`,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 35% 30%, #cbd5e1 0%, #64748b 60%, #334155 100%)",
            boxShadow: "0 2px 3px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.2)",
          }}
        />
      ))}

      {/* Drop-zone indicator — shows where dropped coins land */}
      <div
        className="absolute left-1/2 z-30 pointer-events-none flex flex-col items-center"
        style={{ top: `${plateFront * 100}%`, transform: "translate(-50%, -50%)" }}
      >
        <div className="animate-bounce text-sky-300 text-2xl drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]">▼</div>
        <div className="px-3 py-0.5 rounded-full bg-sky-400/25 border border-sky-300/60 text-sky-200 text-[10px] font-black tracking-wider">
          DROP ZONE
        </div>
      </div>

      {/* Reciprocating pusher plate (at the back) */}
      <div
        className="absolute left-3 right-3 rounded-b-md z-10"
        style={{
          top: 0,
          height: `${plateFront * 100}%`,
          background: "linear-gradient(180deg,#0369a1 0%,#38bdf8 85%,#7dd3fc 100%)",
          boxShadow: "0 8px 14px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,255,255,0.4)",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/40" />
      </div>

      {/* Coins */}
      {coins.map((c) => (
        <div
          key={c.id}
          className="absolute rounded-full z-10"
          style={{
            width: `${coinSize}%`,
            aspectRatio: "1",
            left: `${c.x * 100}%`,
            top: `${c.z * 100}%`,
            transform: `translate(-50%, calc(-50% - ${c.y}px)) rotate(${c.spin}deg)`,
            background: "radial-gradient(circle at 36% 30%, #fef3c7 0%, #fde047 40%, #f59e0b 70%, #b45309 100%)",
            boxShadow: `0 ${2 + c.y * 0.06}px ${3 + c.y * 0.08}px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(180,83,9,0.7)`,
          }}
        >
          <div className="absolute inset-[22%] rounded-full border border-amber-700/50" />
        </div>
      ))}

      {/* Front ledge — coins spill over this edge */}
      <div className="absolute left-0 right-0 bottom-0 h-3 bg-gradient-to-t from-yellow-400/70 to-yellow-300/30 z-20" />
      <div className="absolute left-0 right-0 bottom-3 h-4 bg-gradient-to-t from-black/40 to-transparent z-20" />
    </div>
  );
});

export default CoinPusherCanvas;