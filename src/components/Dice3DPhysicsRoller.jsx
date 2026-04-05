import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";

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
  ctx.fillStyle = "#000000";
  (PIP_POSITIONS[number] || []).forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  });
  return new THREE.CanvasTexture(canvas);
}

// Standard die: opposite faces sum to 7
// BoxGeometry face order: +x, -x, +y, -y, +z, -z
const FACE_MAP = [2, 5, 1, 6, 3, 4];

function getTopFace(body) {
  const up = new CANNON.Vec3(0, 1, 0);
  const axes = [
    new CANNON.Vec3(1, 0, 0),
    new CANNON.Vec3(-1, 0, 0),
    new CANNON.Vec3(0, 1, 0),
    new CANNON.Vec3(0, -1, 0),
    new CANNON.Vec3(0, 0, 1),
    new CANNON.Vec3(0, 0, -1),
  ];
  let bestDot = -2;
  let bestIdx = 0;
  axes.forEach((axis, i) => {
    const worldAxis = body.quaternion.vmult(axis);
    const dot = worldAxis.dot(up);
    if (dot > bestDot) {
      bestDot = dot;
      bestIdx = i;
    }
  });
  return FACE_MAP[bestIdx];
}

const REST_X = [-2.2, -1, 0.2, 1.4, 2.6];
const REST_Y = -1.4;

const Dice3DPhysicsRoller = forwardRef(function Dice3DPhysicsRoller({ onRollComplete, held = [] }, ref) {
  const canvasRef = useRef(null);
  const sceneDataRef = useRef(null);
  const rollingRef = useRef(false);
  const rollTimerRef = useRef(0);
  const onRollCompleteRef = useRef(onRollComplete);
  const heldRef = useRef(held);

  useEffect(() => { onRollCompleteRef.current = onRollComplete; }, [onRollComplete]);
  useEffect(() => { heldRef.current = held; }, [held]);

  // Expose roll() to parent via ref
  useImperativeHandle(ref, () => ({
    roll: () => doRoll(),
  }));

  const doRoll = useCallback(() => {
    if (rollingRef.current || !sceneDataRef.current) return;
    const { diceBodies } = sceneDataRef.current;
    const currentHeld = heldRef.current;

    // Check if any dice are free to roll
    const freeCount = currentHeld.filter(h => !h).length;
    if (freeCount === 0) return;

    rollingRef.current = true;
    rollTimerRef.current = 0;

    diceBodies.forEach((body, i) => {
      if (currentHeld[i]) {
        // Keep held dice still
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        return;
      }
      body.wakeUp();
      body.position.set(
        REST_X[i] + (Math.random() - 0.5) * 0.5,
        2 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      );
      body.velocity.set(
        (Math.random() - 0.5) * 5,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 5
      );
      body.angularVelocity.set(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25
      );
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // THREE.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 6, 7);
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

    // CANNON
    const world = new CANNON.World();
    world.gravity.set(0, -30, 0);
    world.defaultContactMaterial.friction = 0.4;
    world.defaultContactMaterial.restitution = 0.25;

    // Ground
    const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    groundBody.position.y = -2;
    world.addBody(groundBody);

    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshStandardMaterial({ color: 0x1a1a2e })
    );
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Walls
    [
      { pos: [4.5, 0, 0], axis: [0, 0, 1], angle: -Math.PI / 2 },
      { pos: [-4.5, 0, 0], axis: [0, 0, 1], angle: Math.PI / 2 },
      { pos: [0, 0, 3], axis: [1, 0, 0], angle: Math.PI / 2 },
      { pos: [0, 0, -3], axis: [1, 0, 0], angle: -Math.PI / 2 },
    ].forEach(({ pos, axis, angle }) => {
      const wb = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
      wb.position.set(...pos);
      wb.quaternion.setFromAxisAngle(new CANNON.Vec3(...axis), angle);
      world.addBody(wb);
    });

    // Create 5 dice resting on the ground
    const diceMeshes = [];
    const diceBodies = [];

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
      scene.add(mesh);
      diceMeshes.push(mesh);

      const body = new CANNON.Body({
        mass: 1,
        shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
        linearDamping: 0.3,
        angularDamping: 0.4,
      });
      body.position.set(REST_X[i], REST_Y, 0);
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
      world.addBody(body);
      diceBodies.push(body);
    }

    sceneDataRef.current = { scene, camera, renderer, world, diceMeshes, diceBodies };

    // Animation loop
    let animId;
    const STEP = 1 / 60;
    const SETTLE_THRESHOLD = 0.08;
    const ROLL_MIN_TIME = 0.8;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      world.step(STEP);

      diceMeshes.forEach((mesh, i) => {
        mesh.position.copy(diceBodies[i].position);
        mesh.quaternion.copy(diceBodies[i].quaternion);
      });

      if (rollingRef.current) {
        rollTimerRef.current += STEP;

        if (rollTimerRef.current > ROLL_MIN_TIME) {
          const allSettled = diceBodies.every((b, i) => {
            if (heldRef.current[i]) return true;
            return b.velocity.length() < SETTLE_THRESHOLD && b.angularVelocity.length() < SETTLE_THRESHOLD;
          });

          if (allSettled || rollTimerRef.current > 3.0) {
            diceBodies.forEach((b) => {
              b.velocity.set(0, 0, 0);
              b.angularVelocity.set(0, 0, 0);
            });

            const results = diceBodies.map((body) => getTopFace(body));
            rollingRef.current = false;
            rollTimerRef.current = 0;
            onRollCompleteRef.current?.(results);
          }
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