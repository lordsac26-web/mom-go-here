import { Canvas } from "@react-three/fiber";

export default function R3FTest() {
  return (
    <div style={{ width: "100%", aspectRatio: "3 / 4", background: "#0b1220" }}>
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 4]} />
        <mesh>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color={0xfacc15} />
        </mesh>
      </Canvas>
    </div>
  );
}