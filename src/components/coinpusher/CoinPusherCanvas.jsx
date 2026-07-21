import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import Matter from "matter-js";

/**
 * Physics-driven coin pusher.
 * A pusher plate slides back and forth. Coins are dropped from the top and
 * pile up on the bed; the plate shoves the pile toward the front ledge.
 * Coins that fall past the ledge sensor are counted as winnings and removed.
 *
 * Ref API:
 *   dropCoin(xFraction)   — drop a coin at 0..1 across the bed width
 * Props:
 *   onCollect(count)      — called when coins fall off the front (1 per coin)
 */
const COIN_R = 15;

const CoinPusherCanvas = forwardRef(function CoinPusherCanvas({ onCollect }, ref) {
  const wrapRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const pusherRef = useRef(null);
  const dimsRef = useRef({ w: 360, h: 520 });
  const onCollectRef = useRef(onCollect);
  onCollectRef.current = onCollect;

  const dropCoin = useCallback((xFraction = 0.5) => {
    const engine = engineRef.current;
    if (!engine) return;
    const { w } = dimsRef.current;
    const margin = 40;
    const x = margin + Math.max(0, Math.min(1, xFraction)) * (w - margin * 2);
    const coin = Matter.Bodies.circle(x, 30, COIN_R, {
      restitution: 0.05,
      friction: 0.35,
      frictionStatic: 0.6,
      density: 0.004,
      label: "coin",
      render: { fillStyle: "#facc15", strokeStyle: "#b45309", lineWidth: 3 },
    });
    Matter.Composite.add(engine.world, coin);
  }, []);

  useImperativeHandle(ref, () => ({ dropCoin }), [dropCoin]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const w = wrap.clientWidth;
    const h = Math.min(Math.round(w * 1.35), 560);
    dimsRef.current = { w, h };

    const {
      Engine, Render, Runner, Composite, Bodies, Body, Events,
    } = Matter;

    const engine = Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;

    const render = Render.create({
      element: wrap,
      engine,
      options: {
        width: w,
        height: h,
        wireframes: false,
        background: "transparent",
      },
    });
    renderRef.current = render;

    const wall = 20;
    const bedY = h * 0.62;          // top surface of the lower (fixed) bed
    const shelfTopY = h * 0.34;     // top surface of the upper pusher bed
    const ledgeY = h - 90;          // front drop-off point

    // Side walls
    const leftWall = Bodies.rectangle(-wall / 2 + 4, h / 2, wall, h, {
      isStatic: true, render: { fillStyle: "#1e293b" },
    });
    const rightWall = Bodies.rectangle(w + wall / 2 - 4, h / 2, wall, h, {
      isStatic: true, render: { fillStyle: "#1e293b" },
    });

    // Upper fixed shelf (back) — coins land here first, then get pushed
    const upperShelf = Bodies.rectangle(w / 2, shelfTopY + 10, w, 20, {
      isStatic: true, render: { fillStyle: "#334155" },
    });
    // Back wall behind the upper shelf
    const backWall = Bodies.rectangle(w / 2, shelfTopY - 30, w, 8, {
      isStatic: true, render: { fillStyle: "#475569" },
    });

    // Lower fixed bed that ends at the ledge
    const lowerBed = Bodies.rectangle((w - 60) / 2, bedY, w - 60, 18, {
      isStatic: true, render: { fillStyle: "#475569" },
    });

    // The reciprocating pusher plate — a kinematic body we move manually.
    const pusherW = w;
    const pusher = Bodies.rectangle(w / 2, shelfTopY + 40, pusherW, 40, {
      isStatic: true, render: { fillStyle: "#0ea5e9" },
    });
    pusherRef.current = pusher;

    // Ledge lip so coins don't slide off too easily until pushed
    const lip = Bodies.rectangle(w - 34, bedY - 14, 10, 26, {
      isStatic: true, render: { fillStyle: "#64748b" },
    });

    // Sensor at the very bottom-front — anything reaching here is "collected"
    const collector = Bodies.rectangle(w / 2, h - 10, w, 20, {
      isStatic: true, isSensor: true, label: "collector",
      render: { fillStyle: "rgba(250,204,21,0.12)" },
    });

    Composite.add(engine.world, [
      leftWall, rightWall, upperShelf, backWall, lowerBed, pusher, lip, collector,
    ]);

    // Pre-seed a modest pile so there is always something to push.
    for (let i = 0; i < 14; i++) {
      const c = Bodies.circle(
        60 + Math.random() * (w - 120),
        shelfTopY - 40 - i * 8,
        COIN_R,
        {
          restitution: 0.05, friction: 0.35, frictionStatic: 0.6, density: 0.004,
          label: "coin",
          render: { fillStyle: "#facc15", strokeStyle: "#b45309", lineWidth: 3 },
        },
      );
      Composite.add(engine.world, c);
    }

    // Reciprocating motion for the pusher.
    const baseX = w / 2;
    const strokeStart = shelfTopY + 40;
    const strokeLen = 46;
    let t = 0;
    const beforeUpdate = () => {
      t += 0.02;
      const offset = (Math.sin(t) + 1) / 2; // 0..1
      Body.setPosition(pusher, { x: baseX, y: strokeStart + offset * strokeLen });
    };
    Events.on(engine, "beforeUpdate", beforeUpdate);

    // Count + remove coins that reach the collector or fall out of bounds.
    const collided = (pair, other) => {
      const coin = pair.bodyA.label === "coin" ? pair.bodyA
        : pair.bodyB.label === "coin" ? pair.bodyB : null;
      return coin;
    };
    const onCollision = (evt) => {
      for (const pair of evt.pairs) {
        const isCollector = pair.bodyA.label === "collector" || pair.bodyB.label === "collector";
        if (!isCollector) continue;
        const coin = collided(pair);
        if (coin && !coin._collected) {
          coin._collected = true;
          Composite.remove(engine.world, coin);
          onCollectRef.current?.(1);
        }
      }
    };
    Events.on(engine, "collisionStart", onCollision);

    // Safety net: cull anything that escapes below the canvas.
    const cullInterval = setInterval(() => {
      const bodies = Composite.allBodies(engine.world);
      for (const b of bodies) {
        if (b.label === "coin" && b.position.y > h + 60) {
          Composite.remove(engine.world, b);
        }
      }
    }, 1000);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    return () => {
      clearInterval(cullInterval);
      Events.off(engine, "beforeUpdate", beforeUpdate);
      Events.off(engine, "collisionStart", onCollision);
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      render.canvas?.remove();
      render.textures = {};
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="w-full rounded-2xl overflow-hidden border-2 border-sky-500/40 bg-gradient-to-b from-slate-800 to-slate-950 shadow-inner touch-none"
    />
  );
});

export default CoinPusherCanvas;