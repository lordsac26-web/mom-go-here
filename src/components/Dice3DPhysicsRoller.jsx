import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";

/**
 * 3D Dice Roller using Three.js with animated tumbling (no physics engine).
 * Each die spins and lands on a deterministic face.
 * Parent controls via ref.roll() and receives results via onRollComplete.
 */

const PIP_POSITIONS = {
  1: [[128, 128]],
  2: [[85, 85], [171, 171]],
  3: [[85, 85], [128, 128], [171, 171]],
  4: [[85, 85], [171, 85], [85, 171], [171, 171]],
  5: [[85, 85], [171, 85], [128, 128], [85, 171], [171, 171]],
  6: [[85, 85], [171, 85], [85, 128], [171, 128], [85, 171], [171, 171]],
};

function createPipTexture(number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 252);
  ctx.fillStyle = "#1a1a2e";
  (PIP_POSITIONS[number] || []).forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  });
  return new THREE.CanvasTexture(canvas);
}

// Standard die: opposite faces sum to 7
// BoxGeometry face order: +x, -x, +y, -y, +z, -z
const FACE_MAP = [2, 5, 1, 6, 3, 4];

// Quaternion rotations to show each face on top (facing +Y)
const FACE_ROTATIONS = {
  1: { x: Math.PI / 2, z: 0 },    // face 1 on +y → rotate so -y face (which is 6's opposite=1) faces up
  2: { x: 0, z: -Math.PI / 2 },
  3: { x: 0, z: Math.PI },
  4: { x: 0, z: 0 },
  5: { x: 0, z: Math.PI / 2 },
  6: { x: -Math.PI / 2, z: 0 },
};

// Get the target euler angles so a specific number faces up
function getTargetRotation(number) {
  const r = FACE_ROTATIONS[number];
  return { x: r.x, y: 0, z: r.z };
}

const REST_POSITIONS = [
  { x: -2.4, z: 0 },
  { x: -1.2, z: 0 },
  { x: 0, z: 0 },
  { x: 1.2, z: 0 },
  { x: 2.4, z: 0 },
];

const GROUND_Y = -1.5;
const ANIM_DURATION = 1.2; // seconds

const Dice3DPhysicsRoller = forwardRef(function Dice3DPhysicsRoller({ onRollComplete, held = [] }, ref) {
  const canvasRef = useRef(null);
  const sceneDataRef = useRef(null);
  const animStateRef = useRef(null);
  const onRollCompleteRef = useRef(onRollComplete);
  const heldRef = useRef(held);
  const currentValuesRef = useRef([1, 1, 1, 1, 1]);

  useEffect(() => { onRollCompleteRef.current = onRollComplete; }, [onRollComplete]);
  useEffect(() => { heldRef.current = held; }, [held]);

  useImperativeHandle(ref, () => ({
    roll: () => doRoll(),
  }));

  const doRoll = useCallback(() => {
    if (animStateRef.current?.rolling) return;
    const { diceMeshes } = sceneDataRef.current || {};
    if (!diceMeshes) return;
    const currentHeld = heldRef.current;

    // Check if any dice are free to roll
    const freeCount = currentHeld.filter(h => !h).length;
    if (freeCount === 0) return;

    // Generate random results for free dice
    const results = currentValuesRef.current.map((val, i) =>
      currentHeld[i] ? val : Math.floor(Math.random() * 6) + 1
    );

    // Set up animation state
    const startTime = performance.now();
    const anims = diceMeshes.map((mesh, i) => {
      if (currentHeld[i]) return null;

      const startPos = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
      const startRot = { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z };
      const target = getTargetRotation(results[i]);
      const restPos = REST_POSITIONS[i];

      // Add extra full spins for visual excitement
      const spinX = (Math.random() > 0.5 ? 1 : -1) * Math.PI * (4 + Math.random() * 4);
      const spinY = (Math.random() > 0.5 ? 1 : -1) * Math.PI * (2 + Math.random() * 3);
      const spinZ = (Math.random() > 0.5 ? 1 : -1) * Math.PI * (2 + Math.random() * 4);

      return {
        startPos,
        startRot,
        // Target position: back to rest
        endPos: { x: restPos.x, y: GROUND_Y + 0.5, z: restPos.z },
        // Target rotation: the specific face up + extra spins
        endRot: {
          x: target.x + spinX,
          y: target.y + spinY,
          z: target.z + spinZ,
        },
        // Final clean rotation (just the face, no extra spins modulo)
        finalRot: target,
        // Random scatter at peak
        peakY: 1.5 + Math.random() * 1.5,
        peakX: restPos.x + (Math.random() - 0.5) * 2,
        peakZ: (Math.random() - 0.5) * 2,
      };
    });

    animStateRef.current = {
      rolling: true,
      startTime,
      anims,
      results,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5.5, 6);
    camera.lookAt(0, -1, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(4, 10, 6);
    dirLight.castShadow = true;
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Ground
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = GROUND_Y;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Create 5 dice at rest positions
    const diceMeshes = [];
    for (let i = 0; i < 5; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const materials = FACE_MAP.map((num) =>
        new THREE.MeshStandardMaterial({
          map: createPipTexture(num),
          metalness: 0.05,
          roughness: 0.6,
        })
      );
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set(REST_POSITIONS[i].x, GROUND_Y + 0.5, REST_POSITIONS[i].z);
      // Set initial rotation to show face 1
      const initRot = getTargetRotation(1);
      mesh.rotation.set(initRot.x, 0, initRot.z);
      scene.add(mesh);
      diceMeshes.push(mesh);
    }

    sceneDataRef.current = { scene, camera, renderer, diceMeshes };

    // Easing: ease-out bounce feel
    function easeOutBack(t) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // Animation loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const state = animStateRef.current;
      if (state?.rolling) {
        const elapsed = (performance.now() - state.startTime) / 1000;
        const t = Math.min(elapsed / ANIM_DURATION, 1);

        state.anims.forEach((anim, i) => {
          if (!anim) return; // held die
          const mesh = diceMeshes[i];

          // Position: arc up then down
          const tEased = easeInOutQuad(t);
          const arcT = t < 0.4 ? t / 0.4 : (1 - t) / 0.6; // peaks around t=0.4
          const arcHeight = Math.sin(arcT * Math.PI) * anim.peakY;

          if (t < 0.4) {
            // Going up and scattering
            const upT = t / 0.4;
            mesh.position.x = anim.startPos.x + (anim.peakX - anim.startPos.x) * upT;
            mesh.position.z = anim.startPos.z + (anim.peakZ - anim.startPos.z) * upT;
            mesh.position.y = anim.startPos.y + arcHeight;
          } else {
            // Coming down to rest
            const downT = (t - 0.4) / 0.6;
            const eased = easeOutBack(downT);
            mesh.position.x = anim.peakX + (anim.endPos.x - anim.peakX) * eased;
            mesh.position.z = anim.peakZ + (anim.endPos.z - anim.peakZ) * eased;
            mesh.position.y = anim.endPos.y + arcHeight;
          }

          // Rotation: spin throughout, converge to target at end
          const spinProgress = easeInOutQuad(t);
          mesh.rotation.x = anim.startRot.x + (anim.endRot.x - anim.startRot.x) * spinProgress;
          mesh.rotation.y = anim.startRot.y + (anim.endRot.y - anim.startRot.y) * spinProgress;
          mesh.rotation.z = anim.startRot.z + (anim.endRot.z - anim.startRot.z) * spinProgress;
        });

        if (t >= 1) {
          // Snap to exact final rotation and position
          state.anims.forEach((anim, i) => {
            if (!anim) return;
            const mesh = diceMeshes[i];
            mesh.position.set(anim.endPos.x, anim.endPos.y, anim.endPos.z);
            mesh.rotation.set(anim.finalRot.x, 0, anim.finalRot.z);
          });

          currentValuesRef.current = state.results;
          animStateRef.current = { rolling: false };
          onRollCompleteRef.current?.(state.results);
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
      cancelAnimationFrame(animId);
      renderer.dispose();
      sceneDataRef.current = null;
    };
  }, []);

  return (
    <div className="w-full select-none">
      <div className="bg-gradient-to-b from-red-500 to-red-700 rounded-2xl overflow-hidden shadow-inner border-2 border-red-900">
        <canvas ref={canvasRef} className="w-full h-48 block" />
      </div>
    </div>
  );
});

export default Dice3DPhysicsRoller;