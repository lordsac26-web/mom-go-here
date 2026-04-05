import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";

export default function Dice3DPhysicsRoller({ onRollComplete }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const worldRef = useRef(null);
  const diceRef = useRef([]);
  const diceBodyRef = useRef([]);
  const [rolling, setRolling] = useState(false);
  const rollTimeRef = useRef(0);
  const ROLL_DURATION = 1.2;
  const TIME_STEP = 1 / 60;

  // Create pip texture for die face
  const createPipTexture = (number) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 252, 252);
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

  // Get die value from rotation (0-5, maps to 1-6)
  const getDieValue = (rotation) => {
    const x = Math.round((rotation.x / Math.PI) * 2) % 4;
    const y = Math.round((rotation.y / Math.PI) * 2) % 4;
    const z = Math.round((rotation.z / Math.PI) * 2) % 4;
    const val = (Math.abs(x) + Math.abs(y) + Math.abs(z)) % 6;
    return val + 1;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // THREE.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap for mobile
    renderer.shadowMap.enabled = true;

    // Lighting
    const directLight = new THREE.DirectionalLight(0xffffff, 1);
    directLight.position.set(5, 8, 7);
    directLight.castShadow = true;
    directLight.shadow.mapSize.width = 1024;
    directLight.shadow.mapSize.height = 1024;
    scene.add(directLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Cannon.js world
    const world = new CANNON.World();
    world.gravity.set(0, -20, 0);
    world.defaultContactMaterial.friction = 0.3;
    world.defaultContactMaterial.restitution = 0.6;
    worldRef.current = world;

    // Ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.y = -3;
    world.addBody(groundBody);

    // Walls (to keep dice contained)
    const wallMaterial = new CANNON.Material("wall");
    const walls = [
      { pos: [5, 0, 0], rot: [0, 0, Math.PI / 2] }, // right
      { pos: [-5, 0, 0], rot: [0, 0, -Math.PI / 2] }, // left
      { pos: [0, 0, 5], rot: [Math.PI / 2, 0, 0] }, // back
      { pos: [0, 0, -5], rot: [-Math.PI / 2, 0, 0] }, // front
    ];

    walls.forEach(({ pos, rot }) => {
      const wallShape = new CANNON.Plane();
      const wallBody = new CANNON.Body({ mass: 0, shape: wallShape });
      wallBody.position.set(...pos);
      const quat = new CANNON.Quaternion();
      quat.setFromEuler(rot[0], rot[1], rot[2]);
      wallBody.quaternion = quat;
      world.addBody(wallBody);
    });

    diceRef.current = [];
    diceBodyRef.current = [];

    const positions = [
      [-3, 0, 0],
      [0, 0, 0],
      [3, 0, 0],
      [-3, 2.5, 0],
      [0, 2.5, 0],
    ];

    // Create dice with physics
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
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      diceRef.current.push(mesh);

      // Physics body
      const shape = new CANNON.Box(new CANNON.Vec3(0.6, 0.6, 0.6));
      const body = new CANNON.Body({ mass: 1, shape });
      body.position.set(...positions[i]);
      body.linearDamping = 0.3;
      body.angularDamping = 0.4;
      world.addBody(body);
      diceBodyRef.current.push(body);
    }

    rollTimeRef.current = 0;
    let animationId;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Step physics
      world.step(TIME_STEP);

      // Update mesh positions/rotations from physics bodies
      diceRef.current.forEach((mesh, i) => {
        const body = diceBodyRef.current[i];
        mesh.position.copy(body.position);
        mesh.quaternion.copy(body.quaternion);
      });

      // Rolling logic
      if (rolling && rollTimeRef.current < ROLL_DURATION) {
        rollTimeRef.current += TIME_STEP;

        if (rollTimeRef.current >= ROLL_DURATION) {
          // Snap to final orientation and stop movement
          const results = diceBodyRef.current.map((body, i) => {
            const val = getDieValue(diceRef.current[i].rotation);
            const angles = {
              1: [0, 0, 0],
              2: [0, Math.PI / 2, 0],
              3: [0, Math.PI / 4, 0],
              4: [0, -Math.PI / 4, 0],
              5: [Math.PI / 2, 0, 0],
              6: [Math.PI, 0, 0],
            };
            const [x, y, z] = angles[val] || [0, 0, 0];
            const quat = new CANNON.Quaternion();
            quat.setFromEuler(x, y, z);
            body.quaternion = quat;
            body.velocity.set(0, 0, 0);
            body.angularVelocity.set(0, 0, 0);
            return val;
          });

          setRolling(false);
          if (onRollComplete) onRollComplete(results);
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
  }, [onRollComplete]);

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    rollTimeRef.current = 0;

    // Apply random impulses to each die
    diceBodyRef.current.forEach((body) => {
      const randomX = (Math.random() - 0.5) * 60;
      const randomY = (Math.random() - 0.5) * 60;
      const randomZ = (Math.random() - 0.5) * 60;

      body.velocity.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );
      body.angularVelocity.set(randomX, randomY, randomZ);
    });
  };

  return (
    <div className="w-full select-none">
      <canvas ref={canvasRef} className="w-full h-64 rounded-2xl" />
      <p className="text-center text-xs text-muted-foreground mt-2">
        Physics-based 3D dice roller ✨
      </p>
      <button
        onClick={roll}
        disabled={rolling}
        className={`w-full mt-3 text-2xl font-black py-4 rounded-2xl transition-all ${
          rolling
            ? "bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {rolling ? "🎲 Rolling..." : "🎲 Roll Dice"}
      </button>
    </div>
  );
}