// components/Dice3DPhysicsRoller.jsx
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RigidBody, Physics, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";

// ─── Pip dot textures for each face ───
// Face mapping for a standard die (opposite faces sum to 7):
// +X = 3, -X = 4, +Y = 2, -Y = 5, +Z = 1, -Z = 6
// Three.js box face order: +X, -X, +Y, -Y, +Z, -Z

const PIP_POSITIONS = {
  1: [[0, 0]],
  2: [[-0.3, -0.3], [0.3, 0.3]],
  3: [[-0.3, -0.3], [0, 0], [0.3, 0.3]],
  4: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]],
  5: [[-0.3, -0.3], [0.3, -0.3], [0, 0], [-0.3, 0.3], [0.3, 0.3]],
  6: [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0], [0.3, 0], [-0.3, 0.3], [0.3, 0.3]],
};

function createFaceTexture(pips, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Die face background — crisp white with rounded feel
  ctx.fillStyle = "#f5f5f0";
  ctx.fillRect(0, 0, size, size);

  // Subtle border/edge
  ctx.strokeStyle = "#d0d0c8";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  // Draw pips
  const positions = PIP_POSITIONS[pips];
  const center = size / 2;
  const scale = size * 0.38;
  const dotRadius = size * 0.08;

  ctx.fillStyle = "#1a1a1a";
  positions.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(center + x * scale, center + y * scale, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Standard die: +X=3, -X=4, +Y=2, -Y=5, +Z=1, -Z=6
const FACE_ORDER = [3, 4, 2, 5, 1, 6];

function useDiceMaterials() {
  return useMemo(() => {
    return FACE_ORDER.map((pips) => {
      const tex = createFaceTexture(pips);
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.35,
        metalness: 0.0,
      });
    });
  }, []);
}

// ─── Read the top face from a quaternion ───
function getTopFace(quaternion) {
  const q = quaternion;
  // Check which local axis points most upward (world +Y)
  const dirs = [
    new THREE.Vector3(1, 0, 0),  // +X → face 3
    new THREE.Vector3(-1, 0, 0), // -X → face 4
    new THREE.Vector3(0, 1, 0),  // +Y → face 2
    new THREE.Vector3(0, -1, 0), // -Y → face 5
    new THREE.Vector3(0, 0, 1),  // +Z → face 1
    new THREE.Vector3(0, 0, -1), // -Z → face 6
  ];
  const faceValues = [3, 4, 2, 5, 1, 6];

  let maxDot = -Infinity;
  let topFace = 1;

  dirs.forEach((dir, i) => {
    dir.applyQuaternion(q);
    const dot = dir.y; // how much this axis points up
    if (dot > maxDot) {
      maxDot = dot;
      topFace = faceValues[i];
    }
  });

  return topFace;
}

// ─── Single Die ───
const DIE_SIZE = 0.5;

function PhysicsDie({ index, held, onSettle, rollTrigger, totalDice }) {
  const rigidRef = useRef();
  const meshRef = useRef();
  const materials = useDiceMaterials();
  const settledRef = useRef(false);
  const settleCounterRef = useRef(0);
  const hasReportedRef = useRef(false);

  // Spread dice across X axis
  const spacing = 1.1;
  const totalWidth = (totalDice - 1) * spacing;
  const startX = -totalWidth / 2;
  const initialX = startX + index * spacing;

  // On roll trigger, apply impulse
  useEffect(() => {
    if (rollTrigger === 0) return;
    if (held) return;

    settledRef.current = false;
    settleCounterRef.current = 0;
    hasReportedRef.current = false;

    const body = rigidRef.current;
    if (!body) return;

    // Reset position above the tray
    body.setTranslation(
      { x: initialX + (Math.random() - 0.5) * 0.3, y: 3 + Math.random(), z: (Math.random() - 0.5) * 0.5 },
      true
    );

    // Random rotation
    const euler = new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    const quat = new THREE.Quaternion().setFromEuler(euler);
    body.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true);

    // Wake it up and apply forces
    body.wakeUp();
    body.setLinvel({ x: (Math.random() - 0.5) * 3, y: -2, z: (Math.random() - 0.5) * 3 }, true);
    body.setAngvel(
      {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
      },
      true
    );
  }, [rollTrigger, held, initialX]);

  // Check if die has settled
  useFrame(() => {
    if (hasReportedRef.current) return;
    const body = rigidRef.current;
    if (!body) return;

    const linvel = body.linvel();
    const angvel = body.angvel();
    const speed =
      Math.abs(linvel.x) + Math.abs(linvel.y) + Math.abs(linvel.z) +
      Math.abs(angvel.x) + Math.abs(angvel.y) + Math.abs(angvel.z);

    if (speed < 0.15) {
      settleCounterRef.current++;
      if (settleCounterRef.current > 30) {
        // Settled — read the top face
        const rot = body.rotation();
        const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
        const value = getTopFace(quat);
        hasReportedRef.current = true;
        onSettle(index, value);
      }
    } else {
      settleCounterRef.current = 0;
    }
  });

  // If held, make it kinematic (frozen in place)
  const bodyType = held ? "kinematicPosition" : "dynamic";

  return (
    <RigidBody
      ref={rigidRef}
      type={bodyType}
      colliders="cuboid"
      position={[initialX, held ? DIE_SIZE / 2 + 0.05 : 2, 0]}
      restitution={0.3}
      friction={0.8}
      mass={1}
      linearDamping={0.3}
      angularDamping={0.3}
    >
      <mesh ref={(node) => {
        meshRef.current = node;
        if (node) node.material = materials;
      }}>
        <boxGeometry args={[DIE_SIZE, DIE_SIZE, DIE_SIZE]} />
      </mesh>
    </RigidBody>
  );
}

// ─── Tray (walls + floor) ───
function DiceTray() {
  const wallThickness = 0.1;
  const floorY = -0.05;
  const trayWidth = 4;
  const trayDepth = 2;
  const wallHeight = 1.5;

  return (
    <>
      {/* Floor */}
      <RigidBody type="fixed" position={[0, floorY, 0]}>
        <CuboidCollider args={[trayWidth / 2, wallThickness, trayDepth / 2]} />
        <mesh>
          <boxGeometry args={[trayWidth, wallThickness * 2, trayDepth]} />
          <meshStandardMaterial color="#2d5a27" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Walls — invisible colliders */}
      {/* Left */}
      <RigidBody type="fixed" position={[-trayWidth / 2, wallHeight / 2, 0]}>
        <CuboidCollider args={[wallThickness, wallHeight / 2, trayDepth / 2]} />
      </RigidBody>
      {/* Right */}
      <RigidBody type="fixed" position={[trayWidth / 2, wallHeight / 2, 0]}>
        <CuboidCollider args={[wallThickness, wallHeight / 2, trayDepth / 2]} />
      </RigidBody>
      {/* Front */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, trayDepth / 2]}>
        <CuboidCollider args={[trayWidth / 2, wallHeight / 2, wallThickness]} />
      </RigidBody>
      {/* Back */}
      <RigidBody type="fixed" position={[0, wallHeight / 2, -trayDepth / 2]}>
        <CuboidCollider args={[trayWidth / 2, wallHeight / 2, wallThickness]} />
      </RigidBody>
    </>
  );
}

// ─── Scene ───
function DiceScene({ held, rollTrigger, onAllSettled }) {
  const diceCount = 5;
  const resultsRef = useRef(Array(diceCount).fill(null));
  const settledCountRef = useRef(0);
  const rollTriggerRef = useRef(0);

  // Reset tracking on new roll
  useEffect(() => {
    if (rollTrigger === 0) return;
    if (rollTrigger === rollTriggerRef.current) return;
    rollTriggerRef.current = rollTrigger;

    const unheldCount = held.filter((h) => !h).length;
    if (unheldCount === 0) {
      // All held — immediately report current values
      onAllSettled(resultsRef.current);
      return;
    }
    settledCountRef.current = 0;
    // Keep held dice results, clear unheld
    resultsRef.current = resultsRef.current.map((v, i) => (held[i] ? v : null));
  }, [rollTrigger, held, onAllSettled]);

  const handleSettle = useCallback(
    (index, value) => {
      resultsRef.current[index] = value;
      settledCountRef.current++;

      const unheldCount = held.filter((h) => !h).length;
      if (settledCountRef.current >= unheldCount) {
        onAllSettled([...resultsRef.current]);
      }
    },
    [held, onAllSettled]
  );

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[3, 8, 4]}
        intensity={1.2}
      />
      <pointLight position={[-2, 4, -1]} intensity={0.5} />

      <Physics gravity={[0, -15, 0]}>
        <DiceTray />
        {Array.from({ length: diceCount }).map((_, i) => (
          <PhysicsDie
            key={i}
            index={i}
            held={held[i]}
            rollTrigger={rollTrigger}
            onSettle={handleSettle}
            totalDice={diceCount}
          />
        ))}
      </Physics>
    </>
  );
}

// ─── Main Component ───
const Dice3DPhysicsRoller = forwardRef(({ onRollComplete, held }, ref) => {
  const [rollTrigger, setRollTrigger] = useState(0);

  useImperativeHandle(ref, () => ({
    roll: () => setRollTrigger((t) => t + 1),
  }));

  const handleAllSettled = useCallback(
    (results) => {
      if (onRollComplete) onRollComplete(results);
    },
    [onRollComplete]
  );

  return (
    <div style={{ width: "100%", height: "200px", touchAction: "none" }}>
      <Canvas
        camera={{ position: [0, 5, 4], fov: 45, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <DiceScene
          held={held}
          rollTrigger={rollTrigger}
          onAllSettled={handleAllSettled}
        />
      </Canvas>
    </div>
  );
});

Dice3DPhysicsRoller.displayName = "Dice3DPhysicsRoller";
export default Dice3DPhysicsRoller;