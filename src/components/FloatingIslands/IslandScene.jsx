import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

// ─── Imperative island mesh ───
function IslandMesh({ position, color, scale = 1, path, index, onHover, onUnhover, onClick, isHovered }) {
  const groupRef = useRef();
  const beaconRef = useRef();
  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  const meshData = useMemo(() => {
    const topColor = new THREE.Color(color);
    const darkColor = new THREE.Color(color).multiplyScalar(0.4);

    // Platform
    const platformGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 24);
    const platformMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });

    // Rock body
    const rockGeo = new THREE.CylinderGeometry(1.2, 0.5, 1.2, 16);
    const rockMat = new THREE.MeshLambertMaterial({ color: darkColor });

    // Stalactite
    const coneGeo = new THREE.ConeGeometry(0.4, 0.8, 8);
    const coneMat = new THREE.MeshLambertMaterial({ color: darkColor });

    // Beacon
    const beaconGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: topColor, transparent: true, opacity: 0.9 });

    // Trees
    const tree1Geo = new THREE.ConeGeometry(0.18, 0.5, 6);
    const tree1Mat = new THREE.MeshLambertMaterial({ color: 0x166534 });
    const tree2Geo = new THREE.ConeGeometry(0.14, 0.4, 6);
    const tree2Mat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const tree3Geo = new THREE.ConeGeometry(0.12, 0.35, 6);
    const tree3Mat = new THREE.MeshLambertMaterial({ color: 0x22c55e });

    return {
      platformGeo, platformMat, rockGeo, rockMat, coneGeo, coneMat,
      beaconGeo, beaconMat, tree1Geo, tree1Mat, tree2Geo, tree2Mat, tree3Geo, tree3Mat, topColor,
    };
  }, [color]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6 + floatOffset) * 0.15;
    groupRef.current.rotation.y = Math.sin(t * 0.3 + floatOffset) * 0.08;
    const target = isHovered ? scale * 1.12 : scale;
    const s = groupRef.current.scale.x;
    const next = s + (target - s) * 0.1;
    groupRef.current.scale.set(next, next, next);

    // Beacon pulse
    if (beaconRef.current) {
      const pulse = isHovered ? 1.3 + Math.sin(t * 4) * 0.3 : 1;
      beaconRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); onHover(index); }}
      onPointerOut={(e) => { e.stopPropagation(); onUnhover(); }}
      onClick={(e) => { e.stopPropagation(); onClick(path); }}
    >
      <mesh position={[0, 0.15, 0]} geometry={meshData.platformGeo} material={meshData.platformMat} />
      <mesh position={[0, -0.5, 0]} geometry={meshData.rockGeo} material={meshData.rockMat} />
      <mesh position={[0, -1.3, 0]} geometry={meshData.coneGeo} material={meshData.coneMat} />
      <mesh ref={beaconRef} position={[0, 0.5, 0]} geometry={meshData.beaconGeo} material={meshData.beaconMat} />
      <mesh position={[0.5, 0.55, 0.3]} geometry={meshData.tree1Geo} material={meshData.tree1Mat} />
      <mesh position={[-0.4, 0.55, -0.3]} geometry={meshData.tree2Geo} material={meshData.tree2Mat} />
      <mesh position={[0.1, 0.5, -0.5]} geometry={meshData.tree3Geo} material={meshData.tree3Mat} />
    </group>
  );
}

// ─── Particles (fully imperative) ───
function Particles({ count = 50 }) {
  const ref = useRef();
  const { geo, mat } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = Math.random() * 8 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size: 0.06, color: 0xfbbf24, transparent: true, opacity: 0.7, sizeAttenuation: true });
    return { geo: g, mat: m };
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * (0.2 + (i % 5) * 0.1) + i) * 0.003;
      arr[i * 3] += Math.cos(t * 0.3 + i) * 0.001;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={ref} geometry={geo} material={mat} />;
}

// ─── Clouds (imperative materials) ───
function Cloud({ pos, cloudScale, speed, offset }) {
  const ref = useRef();
  const mats = useMemo(() => ({
    a: new THREE.MeshLambertMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.4 }),
    b: new THREE.MeshLambertMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.35 }),
    c: new THREE.MeshLambertMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.3 }),
  }), []);
  const geos = useMemo(() => ({
    a: new THREE.SphereGeometry(0.5, 8, 8),
    b: new THREE.SphereGeometry(0.4, 8, 8),
    c: new THREE.SphereGeometry(0.35, 8, 8),
  }), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.x = pos[0] + Math.sin(clock.getElapsedTime() * speed + offset) * 2;
  });

  return (
    <group ref={ref} position={pos} scale={cloudScale}>
      <mesh geometry={geos.a} material={mats.a} />
      <mesh position={[0.4, 0.1, 0]} geometry={geos.b} material={mats.b} />
      <mesh position={[-0.3, 0.05, 0.2]} geometry={geos.c} material={mats.c} />
    </group>
  );
}

function Clouds() {
  const clouds = useMemo(() =>
    Array.from({ length: 8 }, () => ({
      pos: [(Math.random() - 0.5) * 16, 3 + Math.random() * 2, (Math.random() - 0.5) * 12 - 3],
      cloudScale: 0.6 + Math.random() * 1.2,
      speed: 0.05 + Math.random() * 0.1,
      offset: Math.random() * 100,
    })), []);

  return clouds.map((c, i) => <Cloud key={i} {...c} />);
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

// ─── Fog setup ───
function SceneFog() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog(0x0f172a, 8, 20);
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
}

// ─── Lights (imperative to avoid R3F applyProps issues) ───
function Lights() {
  const ambientRef = useRef();
  const dirRef = useRef();
  const p1Ref = useRef();
  const p2Ref = useRef();

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.4} />
      <directionalLight ref={dirRef} position={[5, 8, 5]} intensity={1.2} />
      <pointLight ref={p1Ref} position={[-4, 6, -2]} intensity={0.6} color={0xfbbf24} />
      <pointLight ref={p2Ref} position={[3, -2, 4]} intensity={0.3} color={0x7c3aed} />
    </>
  );
}

// ─── Main scene content ───
function SceneContent({ islands, onNavigate }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <>
      <CameraRig />
      <SceneFog />
      <Lights />

      {islands.map((island, i) => (
        <IslandMesh
          key={island.path}
          index={i}
          position={island.pos}
          color={island.beaconColor}
          scale={island.scale || 1}
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