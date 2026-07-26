import { useRef, useImperativeHandle, forwardRef, useCallback, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * True 3D WebGL coin pusher (pure Three.js via React Three Fiber).
 *
 * A reciprocating pusher plate shoves a pile of coins toward the front ledge.
 * A compact custom simulation handles gravity, resting on the bed, coin-to-coin
 * shoving from the plate, and falling off the front edge into the collector.
 * Coins that pass the front edge are counted as winnings and removed.
 *
 * Ref API:  dropCoin(xFraction)   — drop a coin at 0..1 across the bed width
 * Props:    onCollect(count)      — called when a coin falls off the front (1 per coin)
 *
 * World space:
 *   x: left(-) .. right(+),   bed half-width ~2.2
 *   y: up(+),                 bed surface at 0, drop from ~4
 *   z: back(-) .. front(+),   pusher near back, ledge at front (+3)
 */

const BED_HALF_X = 2.2;
const BED_BACK_Z = -3.0;
const BED_FRONT_Z = 3.0;      // front edge — past this coins fall
const COIN_R = 0.42;
const COIN_H = 0.14;
const GRAVITY = 14;
const FLOOR_Y = 0;

// Pusher plate travel
const PUSH_BASE_Z = BED_BACK_Z + 0.4;
const PUSH_STROKE = 1.0;
const PUSH_HALF_DEPTH = 0.9;
const PUSH_FRONT_FACE = () => 0; // filled per frame

function makeCoin(x, z, y = 4.0) {
  return {
    x, y, z,
    vy: 0,
    settled: false,
    spin: Math.random() * Math.PI,
    tiltX: (Math.random() - 0.5) * 0.25,
    tiltZ: (Math.random() - 0.5) * 0.25,
  };
}

function SceneEnv() {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(0x0b1220);
    scene.fog = new THREE.Fog(0x0b1220, 11, 24);
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 10, 5]} intensity={1.4} />
      <directionalLight position={[-5, 6, -2]} intensity={0.55} color={0x7dd3fc} />
      <pointLight position={[0, 3, 5]} intensity={0.5} color={0xfacc15} />
    </>
  );
}

/* Static machine geometry (visual only; sim uses constants above) */
function Machine() {
  const bedGeo = new THREE.BoxGeometry(BED_HALF_X * 2, 0.5, BED_FRONT_Z - BED_BACK_Z);
  const bedMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.75 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.2, roughness: 0.6, transparent: true, opacity: 0.5 });
  const backMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.25, roughness: 0.6 });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.45, roughness: 0.5 });
  const bedMidZ = (BED_FRONT_Z + BED_BACK_Z) / 2;
  const bedDepth = BED_FRONT_Z - BED_BACK_Z;

  return (
    <group>
      {/* Bed */}
      <mesh geometry={bedGeo} material={bedMat} position={[0, FLOOR_Y - 0.25, bedMidZ]} />
      {/* Side walls */}
      <mesh material={wallMat} position={[-(BED_HALF_X + 0.15), FLOOR_Y + 0.7, bedMidZ]}>
        <boxGeometry args={[0.3, 2.4, bedDepth + 0.8]} />
      </mesh>
      <mesh material={wallMat} position={[(BED_HALF_X + 0.15), FLOOR_Y + 0.7, bedMidZ]}>
        <boxGeometry args={[0.3, 2.4, bedDepth + 0.8]} />
      </mesh>
      {/* Back wall */}
      <mesh material={backMat} position={[0, FLOOR_Y + 0.7, BED_BACK_Z - 0.15]}>
        <boxGeometry args={[BED_HALF_X * 2 + 0.6, 2.4, 0.3]} />
      </mesh>
      {/* Front lip */}
      <mesh material={lipMat} position={[0, FLOOR_Y + 0.1, BED_FRONT_Z]}>
        <boxGeometry args={[BED_HALF_X * 2, 0.2, 0.18]} />
      </mesh>
      {/* Collector glow just past the ledge */}
      <mesh position={[0, FLOOR_Y - 1.1, BED_FRONT_Z + 1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BED_HALF_X * 2 + 0.6, 1.8]} />
        <meshBasicMaterial color={0xfacc15} transparent opacity={0.14} />
      </mesh>
    </group>
  );
}

/* The reciprocating pusher plate (visual) + exposes its front face z each frame */
function Pusher({ frontZRef }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const offset = (Math.sin(t * 1.5) + 1) / 2; // 0..1
    const z = PUSH_BASE_Z + offset * PUSH_STROKE;
    if (ref.current) ref.current.position.z = z;
    frontZRef.current = z + PUSH_HALF_DEPTH; // front face of plate
  });
  return (
    <mesh ref={ref} position={[0, FLOOR_Y + 0.35, PUSH_BASE_Z]}>
      <boxGeometry args={[BED_HALF_X * 2, 0.7, PUSH_HALF_DEPTH * 2]} />
      <meshStandardMaterial color={0x0ea5e9} metalness={0.55} roughness={0.35} />
    </mesh>
  );
}

/* Instanced coins driven by the custom simulation */
const MAX = 200;

const Coins = forwardRef(function Coins({ frontZRef, onCollect }, ref) {
  const coinsRef = useRef([]);
  const dummy = useRef(new THREE.Object3D()).current;
  const onCollectRef = useRef(onCollect);
  onCollectRef.current = onCollect;

  // Build the InstancedMesh imperatively with REAL geometry+material.
  // (Passing null geometry via `args` to <instancedMesh> throws in Three 0.171.)
  const instanced = useMemo(() => {
    const geo = new THREE.CylinderGeometry(COIN_R, COIN_R, COIN_H, 26);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, metalness: 0.9, roughness: 0.3,
      emissive: 0x5a3600, emissiveIntensity: 0.25,
    });
    const im = new THREE.InstancedMesh(geo, mat, MAX);
    im.count = 0;
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    return im;
  }, []);
  const meshRef = { current: instanced };

  // Seed a starter pile
  useEffect(() => {
    const seed = [];
    for (let i = 0; i < 16; i++) {
      seed.push(makeCoin(
        (Math.random() - 0.5) * BED_HALF_X * 1.5,
        BED_BACK_Z + 1.0 + Math.random() * 1.6,
        0.1 + i * 0.16,
      ));
    }
    coinsRef.current = seed;
  }, []);

  const dropCoin = useCallback((xFraction = 0.5) => {
    if (coinsRef.current.length >= MAX) return;
    const x = (Math.max(0, Math.min(1, xFraction)) - 0.5) * BED_HALF_X * 1.6;
    coinsRef.current.push(makeCoin(x, BED_BACK_Z + 0.9, 4.2));
  }, []);

  useImperativeHandle(ref, () => ({ dropCoin }), [dropCoin]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);
    const coins = coinsRef.current;
    const plateFront = frontZRef.current ?? 0;
    let collected = 0;

    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];

      // Gravity + vertical rest on bed
      c.vy -= GRAVITY * dt;
      c.y += c.vy * dt;
      if (c.y <= FLOOR_Y + COIN_H / 2) {
        c.y = FLOOR_Y + COIN_H / 2;
        c.vy = 0;
        c.settled = true;
      }

      // Pusher shove: if the plate's front face is behind (< coin) and close, push coin forward
      if (c.settled && plateFront > c.z - COIN_R && plateFront < c.z + COIN_R + 0.6) {
        c.z = plateFront + COIN_R;
      }

      // Keep within side walls
      const maxX = BED_HALF_X - COIN_R;
      if (c.x > maxX) c.x = maxX;
      if (c.x < -maxX) c.x = -maxX;

      // gentle idle spin for coins mid-air
      if (!c.settled) c.spin += dt * 4;
    }

    // Coin-to-coin forward propagation (simple 1D push along z, resolve front→back)
    // Sort by z descending so front coins resolve first.
    coins.sort((a, b) => b.z - a.z);
    for (let i = 0; i < coins.length; i++) {
      for (let j = i + 1; j < coins.length; j++) {
        const a = coins[i], b = coins[j];
        if (Math.abs(a.x - b.x) > COIN_R * 1.6) continue;
        const gap = a.z - b.z; // a is in front of b
        const minGap = COIN_R * 1.7;
        if (gap >= 0 && gap < minGap) {
          // push front coin (a) forward by the overlap (b shoves a)
          if (a.settled && b.settled) a.z += (minGap - gap) * 0.5;
        }
      }
    }

    // Collect coins that fall off the front edge
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (c.z > BED_FRONT_Z + COIN_R) {
        // let it drop a moment then remove/collect
        c.settled = false;
        if (c.y < FLOOR_Y - 1.4) {
          coins.splice(i, 1);
          collected++;
        }
      }
      // Cull escapees
      if (c.y < -6) coins.splice(i, 1);
    }

    if (collected > 0) onCollectRef.current?.(collected);

    // Render instances
    const mesh = meshRef.current;
    if (mesh) {
      const n = Math.min(coins.length, MAX);
      for (let i = 0; i < n; i++) {
        const c = coins[i];
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(Math.PI / 2 + c.tiltX, c.spin, c.tiltZ);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return <primitive object={instanced} />;
});

const Scene = forwardRef(function Scene({ onCollect }, ref) {
  const frontZRef = useRef(0);
  return (
    <>
      <SceneEnv />
      <Lights />
      <Machine />
      <Pusher frontZRef={frontZRef} />
      <Coins ref={ref} frontZRef={frontZRef} onCollect={onCollect} />
    </>
  );
});

const CoinPusherCanvas = forwardRef(function CoinPusherCanvas({ onCollect }, ref) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-inner touch-none"
      style={{ aspectRatio: "3 / 4" }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 5.2, 6.8], fov: 42, near: 0.1, far: 50 }}
        gl={{ antialias: true }}
        style={{ background: "#0b1220" }}
      >
        <Scene ref={ref} onCollect={onCollect} />
      </Canvas>
    </div>
  );
});

export default CoinPusherCanvas;