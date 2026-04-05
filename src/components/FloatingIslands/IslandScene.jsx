import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

// ─── Island geometry builder ───
function IslandMesh({ position, color, scale = 1, label, emoji, path, index, onHover, onUnhover, onClick, isHovered }) {
  const groupRef = useRef();
  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle floating bob
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6 + floatOffset) * 0.15;
    // Subtle rotation
    groupRef.current.rotation.y = Math.sin(t * 0.3 + floatOffset) * 0.08;
    // Scale pulse on hover
    const targetScale = isHovered ? scale * 1.12 : scale;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  const topColor = useMemo(() => new THREE.Color(color), [color]);
  const darkColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.4), [color]);
  const grassColor = useMemo(() => new THREE.Color("#4ade80"), []);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); onHover(index); }}
      onPointerOut={(e) => { e.stopPropagation(); onUnhover(); }}
      onClick={(e) => { e.stopPropagation(); onClick(path); }}
    >
      {/* Top platform — flat cylinder with grass */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 24]} />
        <meshStandardMaterial color={grassColor} roughness={0.8} flatShading />
      </mesh>

      {/* Rock body — tapered cylinder underneath */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[1.2, 0.5, 1.2, 16]} />
        <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
      </mesh>

      {/* Bottom stalactite */}
      <mesh position={[0, -1.3, 0]}>
        <coneGeometry args={[0.4, 0.8, 8]} />
        <meshStandardMaterial color={darkColor} roughness={1} flatShading />
      </mesh>

      {/* Colored beacon glow on top */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial
          color={topColor}
          emissive={topColor}
          emissiveIntensity={isHovered ? 2 : 0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Small decorative trees */}
      <mesh position={[0.5, 0.55, 0.3]}>
        <coneGeometry args={[0.18, 0.5, 6]} />
        <meshStandardMaterial color="#166534" flatShading />
      </mesh>
      <mesh position={[-0.4, 0.55, -0.3]}>
        <coneGeometry args={[0.14, 0.4, 6]} />
        <meshStandardMaterial color="#15803d" flatShading />
      </mesh>
      <mesh position={[0.1, 0.5, -0.5]}>
        <coneGeometry args={[0.12, 0.35, 6]} />
        <meshStandardMaterial color="#22c55e" flatShading />
      </mesh>
    </group>
  );
}

// ─── Floating particles / fireflies ───
function Particles({ count = 60 }) {
  const meshRef = useRef();
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = Math.random() * 8 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const m = new THREE.PointsMaterial({ size: 0.06, color: "#fbbf24", transparent: true, opacity: 0.7, sizeAttenuation: true });
    return { geo: g, mat: m };
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(t * (0.2 + (i % 5) * 0.1) + i) * 0.003;
      pos[i * 3] += Math.cos(t * 0.3 + i) * 0.001;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={meshRef} geometry={geo} material={mat} />;
}

// ─── Cloud puffs ───
function Clouds() {
  const clouds = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      pos: [(Math.random() - 0.5) * 16, 3 + Math.random() * 2, (Math.random() - 0.5) * 12 - 3],
      scale: 0.6 + Math.random() * 1.2,
      speed: 0.05 + Math.random() * 0.1,
      offset: Math.random() * 100,
    }));
  }, []);

  return clouds.map((c, i) => <Cloud key={i} {...c} />);
}

function Cloud({ pos, scale, speed, offset }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.x = pos[0] + Math.sin(clock.getElapsedTime() * speed + offset) * 2;
  });

  return (
    <group ref={ref} position={pos} scale={scale}>
      <mesh><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#e2e8f0" transparent opacity={0.4} /></mesh>
      <mesh position={[0.4, 0.1, 0]}><sphereGeometry args={[0.4, 8, 8]} /><meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} /></mesh>
      <mesh position={[-0.3, 0.05, 0.2]}><sphereGeometry args={[0.35, 8, 8]} /><meshStandardMaterial color="#f1f5f9" transparent opacity={0.3} /></mesh>
    </group>
  );
}

// ─── Camera auto-rotation ───
function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.08) * 1.5;
    camera.position.z = 8 + Math.cos(t * 0.08) * 1;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Main scene content ───
function SceneContent({ islands, onNavigate }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight position={[-4, 6, -2]} intensity={0.6} color="#fbbf24" />
      <pointLight position={[3, -2, 4]} intensity={0.3} color="#7c3aed" />

      {/* Fog */}
      <primitive object={new THREE.Fog("#0f172a", 8, 20)} attach="fog" />

      {islands.map((island, i) => (
        <IslandMesh
          key={island.path}
          index={i}
          position={island.pos}
          color={island.beaconColor}
          scale={island.scale || 1}
          label={island.label}
          emoji={island.emoji}
          path={island.path}
          isHovered={hoveredIdx === i}
          onHover={setHoveredIdx}
          onUnhover={() => setHoveredIdx(null)}
          onClick={onNavigate}
        />
      ))}

      <Particles count={50} />
      <Clouds />
    </>
  );
}

// ─── Exported component ───
export default function IslandScene({ islands }) {
  const navigate = useNavigate();

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="w-full h-[45vh] min-h-[280px] max-h-[400px] rounded-3xl overflow-hidden border-2 border-border shadow-2xl touch-none">
      <Canvas
        shadows
        camera={{ position: [0, 4, 8], fov: 50, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)" }}
        dpr={[1, 1.5]}
      >
        <SceneContent islands={islands} onNavigate={handleNavigate} />
      </Canvas>
    </div>
  );
}