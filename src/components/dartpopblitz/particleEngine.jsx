/**
 * Dart Pop Blitz — Particle Engine
 * Balloon-type-aware particle spawning + unified draw/update.
 */

// ── Confetti palettes per balloon color ──
const CONFETTI_PALETTES = {
  "#ef4444": ["#ef4444", "#f87171", "#fca5a5", "#fbbf24", "#fb923c"], // basic red
  "#3b82f6": ["#3b82f6", "#60a5fa", "#93c5fd", "#a78bfa", "#38bdf8"], // tough blue
  "#a855f7": ["#a855f7", "#c084fc", "#d8b4fe", "#f0abfc", "#818cf8"], // small purple
  "#eab308": ["#eab308", "#facc15", "#fde047", "#fb923c", "#fbbf24"], // gold
  "#1e293b": ["#f97316", "#ef4444", "#fbbf24", "#fb923c", "#fdba74"], // bomb → fiery
  "#22c55e": ["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#34d399"], // green
  "#94a3b8": ["#94a3b8", "#cbd5e1", "#e2e8f0", "#64748b", "#f1f5f9"], // ricochet sparks
  "#f97316": ["#f97316", "#fb923c", "#fdba74", "#ef4444", "#fbbf24"], // mirv
  "#f59e0b": ["#f59e0b", "#fbbf24", "#fde047", "#fb923c", "#f97316"], // speed
  "#6366f1": ["#6366f1", "#818cf8", "#a78bfa", "#c084fc", "#e0e7ff"], // ghost
  "#ec4899": ["#ec4899", "#f472b6", "#fb7185", "#fda4af", "#fbbf24"], // magnet
  "#38bdf8": ["#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe", "#fff"],    // freeze
  "#8b5cf6": ["#8b5cf6", "#a78bfa", "#c084fc", "#ddd6fe", "#6366f1"], // gravity
  "#facc15": ["#facc15", "#fde047", "#fbbf24", "#f97316", "#fff"],    // zipper
};

export function getConfettiColors(baseColor) {
  return CONFETTI_PALETTES[baseColor] || [baseColor, "#fff", "#fbbf24", "#f87171", "#60a5fa"];
}

const PARTICLE_SHAPES = ["circle", "square", "star", "triangle"];

// ── Generic confetti burst (used as fallback) ──
export function spawnParticles(arr, x, y, color, count = 8) {
  const colors = getConfettiColors(color);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 2.5 + Math.random() * 5;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 5,
      shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
  if (count >= 8) {
    arr.push({ x, y, vx: 0, vy: 0, life: 1, color, size: 4, shape: "ring",
      rotation: 0, rotationSpeed: 0, ringGrowth: 1.8 + count * 0.1 });
  }
}

// ── Balloon-type-specific pop effects ──

/** 💣 Bomb: dark smoke puffs + ember shards + fiery ring */
export function spawnBombParticles(arr, x, y) {
  // Smoke puffs — large, grey, slow-rising, quick fade
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.5;
    arr.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5 - Math.random() * 1.5,
      life: 0.9 + Math.random() * 0.4,
      color: `hsl(0,0%,${40 + Math.random() * 35}%)`,
      size: 8 + Math.random() * 10,
      shape: "smoke",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
      growRate: 0.3 + Math.random() * 0.4,
    });
  }
  // Ember shards
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    const emberColors = ["#f97316", "#ef4444", "#fbbf24", "#fb923c", "#dc2626"];
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      color: emberColors[Math.floor(Math.random() * emberColors.length)],
      size: 2 + Math.random() * 3,
      shape: "triangle",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
    });
  }
  // Shockwave ring
  arr.push({ x, y, vx: 0, vy: 0, life: 1, color: "#f97316", size: 4, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 3.5 });
  // Second darker ring
  arr.push({ x, y, vx: 0, vy: 0, life: 0.7, color: "#1e293b", size: 6, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 2.2 });
}

/** ❄️ Frozen/Freeze: icy shards — sharp pointed crystal shapes */
export function spawnIcyShardParticles(arr, x, y) {
  const iceColors = ["#bae6fd", "#7dd3fc", "#38bdf8", "#e0f2fe", "#fff", "#a5f3fc"];
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.3;
    const speed = 2 + Math.random() * 4.5;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 1.5,
      life: 1,
      color: iceColors[Math.floor(Math.random() * iceColors.length)],
      size: 3 + Math.random() * 5,
      shape: "shard", // custom pointy shape
      rotation: angle, // align with travel direction
      rotationSpeed: (Math.random() - 0.5) * 0.15,
    });
  }
  // Frost ring
  arr.push({ x, y, vx: 0, vy: 0, life: 1, color: "#38bdf8", size: 3, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 2.0 });
  // Snowflake sparkles
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    arr.push({
      x: x + Math.cos(angle) * (5 + Math.random() * 12),
      y: y + Math.sin(angle) * (5 + Math.random() * 12),
      vx: Math.cos(angle) * 0.5,
      vy: -0.5 - Math.random(),
      life: 1,
      color: "#e0f2fe",
      size: 2 + Math.random() * 2,
      shape: "star",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: 0.1,
    });
  }
}

/** 👻 Ghost: wispy dissolving spirits */
export function spawnGhostParticles(arr, x, y) {
  const ghostColors = ["#818cf8", "#a78bfa", "#c084fc", "#e0e7ff", "#fff", "#6366f1"];
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3;
    arr.push({
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: Math.cos(angle) * speed * 0.5,
      vy: -(1.5 + Math.random() * 2.5), // drift upward like ghosts do
      life: 1,
      color: ghostColors[Math.floor(Math.random() * ghostColors.length)],
      size: 5 + Math.random() * 8,
      shape: "smoke", // reuse soft smoke draw
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.06,
      growRate: 0.15,
    });
  }
  // Wailing ring
  arr.push({ x, y, vx: 0, vy: 0, life: 0.8, color: "#a78bfa", size: 3, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 2.5 });
}

/** ⭐ Gold: star burst with coin-like glints */
export function spawnGoldParticles(arr, x, y) {
  const goldColors = ["#eab308", "#facc15", "#fde047", "#fbbf24", "#f59e0b", "#fff"];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.3;
    const speed = 3 + Math.random() * 4.5;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      color: goldColors[Math.floor(Math.random() * goldColors.length)],
      size: 3 + Math.random() * 5,
      shape: Math.random() > 0.5 ? "star" : "circle",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
    });
  }
  arr.push({ x, y, vx: 0, vy: 0, life: 1, color: "#fbbf24", size: 4, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 2.2 });
}

/** ⚡ Speed: electric sparks + lightning bolts */
export function spawnSpeedParticles(arr, x, y) {
  const sparkColors = ["#f59e0b", "#fbbf24", "#fde047", "#fff", "#fb923c"];
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.5;
    const speed = 4 + Math.random() * 6;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 0.8 + Math.random() * 0.3,
      color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
      size: 2 + Math.random() * 3,
      shape: "spark", // custom zigzag
      rotation: angle,
      rotationSpeed: 0,
    });
  }
  arr.push({ x, y, vx: 0, vy: 0, life: 1, color: "#f59e0b", size: 4, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 1.8 });
}

/** 🧲 Magnet: pink energy burst with orbiting dots */
export function spawnMagnetParticles(arr, x, y) {
  const colors = ["#ec4899", "#f472b6", "#fb7185", "#fda4af", "#fbbf24"];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10;
    const speed = 2.5 + Math.random() * 4;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
      shape: Math.random() > 0.5 ? "circle" : "square",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
    });
  }
  arr.push({ x, y, vx: 0, vy: 0, life: 1, color: "#ec4899", size: 4, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 2.5 });
  arr.push({ x, y, vx: 0, vy: 0, life: 0.6, color: "#fda4af", size: 8, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 1.6 });
}

/** 🛡️ Tough: chunky debris shards */
export function spawnToughParticles(arr, x, y) {
  const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#1d4ed8", "#bfdbfe"];
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    arr.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 5,
      shape: Math.random() > 0.5 ? "square" : "triangle",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
    });
  }
  arr.push({ x, y, vx: 0, vy: 0, life: 1, color: "#3b82f6", size: 4, shape: "ring",
    rotation: 0, rotationSpeed: 0, ringGrowth: 2.0 });
}

/**
 * Master dispatcher — picks the right effect based on balloon type.
 * Falls back to generic spawnParticles for unknown types.
 */
export function spawnBalloonPopParticles(arr, balloon, isFrozen = false) {
  // Frozen overrides: icy shards regardless of type
  if (isFrozen) {
    spawnIcyShardParticles(arr, balloon.x, balloon.y);
    return;
  }
  switch (balloon.type) {
    case "bomb":   spawnBombParticles(arr, balloon.x, balloon.y); break;
    case "ghost":  spawnGhostParticles(arr, balloon.x, balloon.y); break;
    case "gold":   spawnGoldParticles(arr, balloon.x, balloon.y); break;
    case "speed":  spawnSpeedParticles(arr, balloon.x, balloon.y); break;
    case "magnet": spawnMagnetParticles(arr, balloon.x, balloon.y); break;
    case "tough":  spawnToughParticles(arr, balloon.x, balloon.y); break;
    default:       spawnParticles(arr, balloon.x, balloon.y, balloon.color, 10); break;
  }
}

// Hard cap to prevent mobile frame spikes from bomb chains etc.
const MAX_PARTICLES = 120;

export function capParticles(arr) {
  if (arr.length > MAX_PARTICLES) {
    arr.splice(0, arr.length - MAX_PARTICLES);
  }
}

// ── Physics update (called each frame) ──
export function updateParticles(particles, ts) {
  for (const p of particles) {
    p.x += p.vx * ts;
    p.y += p.vy * ts;
    if (p.shape !== "ring") {
      const gravMult = p.shape === "smoke" ? 0.04 : 0.15;
      p.vy += gravMult * ts;
      p.vx *= p.shape === "smoke" ? 0.985 : 0.99;
    }
    if (p.shape === "smoke" && p.growRate) {
      p.size += p.growRate * ts;
    }
    p.rotation += (p.rotationSpeed || 0) * ts;
    p.life -= p.shape === "smoke" ? 0.018 : 0.025;
    if (p.shape !== "ring" && p.shape !== "smoke") p.size *= 0.975;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

// ── Draw ──
export function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = Math.max(p.life, 0);
  ctx.translate(p.x, p.y);

  if (p.shape === "ring") {
    const radius = p.size + (1 - p.life) * 40 * (p.ringGrowth || 1.5);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(2 * p.life, 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (p.shape === "smoke") {
    // Soft blurred circle for smoke/ghost wisps
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
    grad.addColorStop(0, p.color + "cc");
    grad.addColorStop(1, p.color + "00");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (p.shape === "shard") {
    // Elongated pointed crystal — a thin sharp diamond
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.shadowColor = "#bae6fd";
    ctx.shadowBlur = 4;
    const l = p.size * 2.5, w = p.size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -l);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, l * 0.4);
    ctx.lineTo(-w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  if (p.shape === "spark") {
    // Lightning spark — short jagged line
    ctx.rotate(p.rotation);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p.size * 1.5, -p.size);
    ctx.lineTo(p.size * 3, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.rotate(p.rotation);
  ctx.fillStyle = p.color;

  if (p.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.shape === "square") {
    const half = p.size;
    ctx.fillRect(-half, -half, half * 2, half * 1.2);
  } else if (p.shape === "star") {
    const r = p.size;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const ax = Math.cos(a) * r, ay = Math.sin(a) * r;
      const ia = a + Math.PI / 5;
      const ix = Math.cos(ia) * r * 0.4, iy = Math.sin(ia) * r * 0.4;
      if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.shape === "triangle") {
    const r = p.size;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.866, r * 0.5);
    ctx.lineTo(r * 0.866, r * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}