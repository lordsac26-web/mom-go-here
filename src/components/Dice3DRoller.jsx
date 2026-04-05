import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function Dice3DRoller({ dice, isRolling, onRollComplete }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const diceRef = useRef([]);
  const velocitiesRef = useRef([]);
  const rollTimeRef = useRef(0);

  const ROLL_DURATION = 0.6; // seconds

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
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

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Create dice geometries
    diceRef.current = [];
    velocitiesRef.current = [];

    const positions = [
      [-3, 0, 0],
      [0, 0, 0],
      [3, 0, 0],
      [-3, 3, 0],
      [0, 3, 0],
    ];

    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.3,
        roughness: 0.4,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...positions[i]);
      mesh.userData.value = dice[i] || 1;
      scene.add(mesh);
      diceRef.current.push(mesh);

      // Random initial velocity for rolling
      velocitiesRef.current.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
      });
    }

    // Add pip dots on dice (face labels)
    diceRef.current.forEach((die, idx) => {
      const canvas2d = document.createElement("canvas");
      canvas2d.width = 256;
      canvas2d.height = 256;
      const ctx = canvas2d.getContext("2d");
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#2d1515";
      ctx.font = "bold 120px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(dice[idx], 128, 128);

      const texture = new THREE.CanvasTexture(canvas2d);
      die.material = new THREE.MeshStandardMaterial({ map: texture });
    });

    rollTimeRef.current = 0;
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (isRolling && rollTimeRef.current < ROLL_DURATION) {
        rollTimeRef.current += 1 / 60;

        diceRef.current.forEach((die, i) => {
          const vel = velocitiesRef.current[i];
          die.rotation.x += vel.x * 0.02;
          die.rotation.y += vel.y * 0.02;
          die.rotation.z += vel.z * 0.02;

          // Dampen velocity
          vel.x *= 0.95;
          vel.y *= 0.95;
          vel.z *= 0.95;
        });

        if (rollTimeRef.current >= ROLL_DURATION) {
          // Final positioning based on die values
          diceRef.current.forEach((die) => {
            const val = die.userData.value;
            const angle = (val - 1) * (Math.PI / 3);
            die.rotation.set(
              Math.cos(angle) * Math.PI,
              Math.sin(angle) * Math.PI,
              Math.random() * Math.PI
            );
          });
          if (onRollComplete) onRollComplete();
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
  }, [dice, isRolling, onRollComplete]);

  return <canvas ref={canvasRef} className="w-full h-64 rounded-2xl" />;
}