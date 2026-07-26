import { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback } from "react";

/**
 * Top-down coin pusher — reliable flat 2D board (no WebGL; R3F v8 is incompatible
 * with three 0.171 here and crashes on mount). A reciprocating pusher plate at the
 * back shoves the pile toward the front ledge; coins that cross the ledge are
 * collected. Every coin stays fully on-screen. Runs at 60fps on mobile.
 *
 * Ref API:  dropCoin(xFraction)  — drop a coin at 0..1 across the bed width
 * Props:    onCollect(count)     — called with number of coins that fell off the front
 *
 * Sim space (fractions of the bed):
 *   x: 0 (left) .. 1 (right)
 *   z: 0 (back / pusher) .. 1 (front ledge); z > 1 = collected
 *   y: drop-in height (px), 0 = resting on the bed
 */

const COIN_R = 0.065;             // fraction of bed width
const MIN_GAP = COIN_R * 1.85;
const GRAVITY = 900;              // px/s^2 for the drop-in animation
const MAX = 80;

let _id = 1;
function makeCoin(x, z, y = 0) {
  return { id: _id++, x, z, y, vy: 0, settled: y === 0, spin: Math.random() * 360 };
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
    // Land just in front of the pusher, dropping in from above.
    coinsRef.current.push(makeCoin(x, 0.28 + Math.random() * 0.1, 90));
  }, []);

  useImperativeHandle(ref, () => ({ dropCoin }), [dropCoin]);

  // Seed a starter pile so the board isn't empty.
  useEffect(() => {
    const seed = [];
    for (let i = 0; i < 16; i++) {
      seed.push(makeCoin(0.15 + Math.random() * 0.7, 0.32 + Math.random() * 0.5, 0));
    }
    coinsRef.current = seed;
  }, []);

  useEffect(() => {
    function frame(ts) {
      const last = lastRef.current || ts;
      const dt = Math.min((ts - last) / 1000, 0.033);
      lastRef.current = ts;

      const t = ts / 1000;
      // Reciprocating pusher front face
      const offset = (Math.sin(t * 1.5) + 1) / 2;   // 0..1
      const plateFront = 0.08 + offset * 0.2;
      plateRef.current = plateFront;

      const coins = coinsRef.current;
      let collected = 0;

      // Drop-in gravity (y)
      for (const c of coins) {
        if (c.y > 0) {
          c.vy += GRAVITY * dt;
          c.y -= c.vy * dt;
          if (c.y <= 0) { c.y = 0; c.vy = 0; c.settled = true; }
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
        if (c.x < COIN_R) c.x = COIN_R;
        if (c.x > 1 - COIN_R) c.x = 1 - COIN_R;
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
  const coinSize = COIN_R * 2 * 100; // percent of width

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-inner touch-none"
      style={{ aspectRatio: "3 / 4", background: "linear-gradient(180deg,#1e293b 0%,#0f172a 100%)" }}
    >
      {/* Side rails */}
      <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-slate-600 to-slate-700/40 z-20" />
      <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-slate-600 to-slate-700/40 z-20" />

      {/* Back wall shadow */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/50 to-transparent z-10" />

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