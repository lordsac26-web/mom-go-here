import { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback } from "react";

/**
 * CSS-3D coin pusher — no WebGL dependency (R3F v8 is incompatible with three 0.171
 * in this environment and crashes on mount). This renders a tilted 3D playfield with
 * a reciprocating pusher plate and a lightweight 2D physics sim projected into a
 * perspective scene. Runs at 60fps on mobile.
 *
 * Ref API:  dropCoin(xFraction)  — drop a coin at 0..1 across the bed width
 * Props:    onCollect(count)     — called (1 per coin) when a coin falls off the front
 *
 * Sim space (top-down, in "bed units"):
 *   x: 0 (left) .. 1 (right)
 *   z: 0 (back / pusher) .. 1 (front ledge); z > 1 means falling off
 *   y: drop height, 0 = resting on bed
 */

const COIN_R = 0.06;          // fraction of bed width
const MIN_GAP = COIN_R * 1.9;
const GRAVITY = 3.2;          // z-units / s^2 for drop height
const MAX = 90;

let _id = 1;
function makeCoin(x, z, y = 1.2) {
  return { id: _id++, x, z, y, vy: 0, settled: false, spin: Math.random() * 360 };
}

const CoinPusherCanvas = forwardRef(function CoinPusherCanvas({ onCollect }, ref) {
  const coinsRef = useRef([]);
  const [, setTick] = useState(0);
  const onCollectRef = useRef(onCollect);
  onCollectRef.current = onCollect;
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const plateRef = useRef({ z: 0.12 });

  const dropCoin = useCallback((xFraction = 0.5) => {
    if (coinsRef.current.length >= MAX) return;
    const x = Math.max(COIN_R, Math.min(1 - COIN_R, xFraction));
    coinsRef.current.push(makeCoin(x, 0.14 + Math.random() * 0.06, 1.3));
  }, []);

  useImperativeHandle(ref, () => ({ dropCoin }), [dropCoin]);

  // Seed a starter pile
  useEffect(() => {
    const seed = [];
    for (let i = 0; i < 14; i++) {
      seed.push(makeCoin(0.2 + Math.random() * 0.6, 0.18 + Math.random() * 0.45, 0));
    }
    coinsRef.current = seed;
  }, []);

  useEffect(() => {
    function frame(ts) {
      const last = lastRef.current || ts;
      const dt = Math.min((ts - last) / 1000, 0.033);
      lastRef.current = ts;

      const t = ts / 1000;
      // Reciprocating pusher: front face travels forward and back
      const offset = (Math.sin(t * 1.4) + 1) / 2;   // 0..1
      const plateFront = 0.06 + offset * 0.24;       // pusher front face z
      plateRef.current.z = plateFront;

      const coins = coinsRef.current;
      let collected = 0;

      // Drop height (y) gravity
      for (const c of coins) {
        if (c.y > 0) {
          c.vy -= GRAVITY * dt;
          c.y += c.vy * dt;
          if (c.y <= 0) { c.y = 0; c.vy = 0; c.settled = true; }
        } else {
          c.settled = true;
        }
        c.spin += dt * 40;
      }

      // Pusher shove
      for (const c of coins) {
        if (c.settled && plateFront > c.z - COIN_R && plateFront < c.z + COIN_R + 0.12) {
          c.z = plateFront + COIN_R;
        }
      }

      // Coin-to-coin forward propagation (front resolves first)
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

      // Clamp x within walls
      for (const c of coins) {
        if (c.x < COIN_R) c.x = COIN_R;
        if (c.x > 1 - COIN_R) c.x = 1 - COIN_R;
      }

      // Collect coins that go past the front edge — let them tip off then remove
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (c.z > 1) {
          c.y -= dt * 1.4;      // tip forward and down off the ledge
          if (c.y < -0.5) { coins.splice(i, 1); collected++; }
        }
      }

      if (collected > 0) onCollectRef.current?.(collected);

      setTick(x => (x + 1) % 1000000);
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const coins = coinsRef.current;
  const plateFront = plateRef.current.z;

  // Project sim (x 0..1, z 0..1) into the tilted board's local coords (percent).
  // The board is CSS-rotated in 3D by the parent; here z maps to top(back)->bottom(front).
  const toStyle = (c) => {
    const leftPct = c.x * 100;
    const topPct = (1 - c.z) * 100;               // z=0 back(top), z=1 front(bottom)
    const lift = c.y * 60;                         // drop-height lift in px
    const scale = 1 + c.z * 0.35;                  // nearer (front) coins bigger
    return {
      left: `${leftPct}%`,
      top: `${topPct}%`,
      transform: `translate(-50%, -50%) translateY(${-lift}px) scale(${scale}) rotateX(60deg) rotateZ(${c.spin}deg)`,
      zIndex: Math.round(c.z * 100) + 10,
    };
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-inner touch-none"
      style={{ aspectRatio: "3 / 4", background: "linear-gradient(180deg,#0b1220 0%,#0f2440 60%,#0b1220 100%)", perspective: "760px" }}
    >
      {/* Tilted 3D playfield */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: "82%",
          height: "88%",
          transform: "translate(-50%,-46%) rotateX(52deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Bed surface */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(180deg,#334155 0%,#243244 100%)",
            boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 20px 40px rgba(0,0,0,0.5)",
            border: "2px solid #475569",
          }}
        >
          {/* Side rails */}
          <div className="absolute top-0 bottom-0 -left-1 w-2 rounded-l bg-slate-600/70" />
          <div className="absolute top-0 bottom-0 -right-1 w-2 rounded-r bg-slate-600/70" />
          {/* Front ledge highlight */}
          <div className="absolute left-0 right-0 bottom-0 h-2 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400 rounded-b" />
          {/* Collector glow just past the ledge */}
          <div className="absolute left-0 right-0 -bottom-6 h-6 bg-yellow-400/20 blur-md rounded" />
        </div>

        {/* Reciprocating pusher plate */}
        <div
          className="absolute left-0 right-0 rounded"
          style={{
            top: `${(1 - plateFront) * 100}%`,
            height: "10%",
            transform: "translateY(-100%)",
            background: "linear-gradient(180deg,#38bdf8 0%,#0ea5e9 100%)",
            boxShadow: "0 6px 12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4)",
            border: "1px solid #7dd3fc",
            zIndex: 5,
          }}
        />

        {/* Coins */}
        {coins.map((c) => (
          <div
            key={c.id}
            className="absolute rounded-full"
            style={{
              width: `${COIN_R * 2 * 100}%`,
              aspectRatio: "1",
              background: "radial-gradient(circle at 35% 30%, #fde68a 0%, #facc15 45%, #b45309 100%)",
              boxShadow: "0 2px 3px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(180,83,9,0.6)",
              ...toStyle(c),
            }}
          />
        ))}
      </div>
    </div>
  );
});

export default CoinPusherCanvas;