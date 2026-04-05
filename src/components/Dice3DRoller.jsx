import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGesture } from "@use-gesture/react";

export default function Dice3DRoller({ dice, isRolling, onRollComplete }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const diceRef = useRef([]);
  const velocitiesRef = useRef([]);
  const rollTimeRef = useRef(0);
  const [shaking, setShaking] = useState(false);

  const ROLL_DURATION = 0.6;
  const DAMPING = 0.93;

  // Create pip texture for a die face
  const createPipTexture = (number) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 256);

    // Subtle border
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 252, 252);

    // Draw pips (black dots)
    ctx.fillStyle = "#000000";
    const pipRadius = 20;
    const positions = {
      1: [[128, 128]],
      2: [[85, 85], [171, 171]],
      3: [[85, 85], [128, 128], [171, 171]],
      4: [[85, 85], [171, 85], [85, 171], [171, 171]],
      5: [[85, 85], [171, 85], [128, 128], [85, 171], [171, 171]],
      6: [[85, 85], [171, 85], [85, 128], [171, 128], [85, 171], [171, 171]],
    };

    (positions[number] || []).forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, pipRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  };

  useGesture(
    {
      onDrag: ({ offset: [dx, dy], velocity: [vx, vy], last }) => {
        if (!diceRef.current.length) return;

        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude < 10) return; // Minimum drag distance

        if (!last) {
          setShaking(true);
          diceRef.current.forEach((die, i) => {
            velocitiesRef.current[i] = {
              x: (dy / 100) * 30 + vx * 10,
              y: (dx / 100) * 30 + vy * 10,
              z: (Math.random() - 0.5) * 20,
            };
          });
        } else {
          setShaking(false);
          rollTimeRef.current = 0;
        }
      },
    },
    { target: canvasRef }
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lighting
    const directLight = new THREE.DirectionalLight(0xffffff, 1);
    directLight.position.set(5, 8, 7);
    directLight.castShadow = true;
    directLight.shadow.mapSize.width = 2048;
    directLight.shadow.mapSize.height = 2048;
    scene.add(directLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    diceRef.current = [];
    velocitiesRef.current = [];

    const positions = [
      [-3, 0, 0],
      [0, 0, 0],
      [3, 0, 0],
      [-3, 3, 0],
      [0, 3, 0],
    ];

    // Create dice with proper materials
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const materials = [1, 6, 2, 5, 3, 4].map((num) => {
        const texture = createPipTexture(num);
        return new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.1,
          roughness: 0.5,
        });
      });

      const mesh = new THREE.Mesh(geometry, materials);
      mesh.position.set(...positions[i]);
      mesh.userData.value = dice[i] || 1;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      diceRef.current.push(mesh);

      velocitiesRef.current.push({ x: 0, y: 0, z: 0 });
    }

    rollTimeRef.current = 0;
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Handle rolling or shaking animation
      if ((isRolling || shaking) && rollTimeRef.current < ROLL_DURATION) {
        rollTimeRef.current += 1 / 60;

        diceRef.current.forEach((die, i) => {
          const vel = velocitiesRef.current[i];
          die.rotation.x += vel.x * 0.02;
          die.rotation.y += vel.y * 0.02;
          die.rotation.z += vel.z * 0.02;

          vel.x *= DAMPING;
          vel.y *= DAMPING;
          vel.z *= DAMPING;
        });

        if (rollTimeRef.current >= ROLL_DURATION) {
          // Snap to final orientation based on die value
          diceRef.current.forEach((die) => {
            const val = die.userData.value;
            const angles = {
              1: [0, 0, 0],
              2: [0, Math.PI / 2, 0],
              3: [0, Math.PI / 4, 0],
              4: [0, -Math.PI / 4, 0],
              5: [Math.PI / 2, 0, 0],
              6: [Math.PI, 0, 0],
            };
            die.rotation.set(...(angles[val] || [0, 0, 0]));
          });

          if (isRolling && onRollComplete) onRollComplete();
          setShaking(false);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, [dice, isRolling, onRollComplete, shaking]);

  return (
    <div className="w-full select-none">
      <canvas ref={canvasRef} className="w-full h-64 rounded-2xl cursor-grab active:cursor-grabbing" />
      <p className="text-center text-xs text-muted-foreground mt-2">Drag and fling to shake the dice 👇</p>
    </div>
  );
}