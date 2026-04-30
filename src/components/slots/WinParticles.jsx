import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Lightweight canvas-based particle burst for slot wins.
 * Spawns particles from winning cell positions, then fades out.
 */

const PARTICLE_COLORS = [
  "#fbbf24", "#f59e0b", "#facc15", "#fde68a",
  "#22c55e", "#4ade80", "#ef4444", "#f97316",
  "#a855f7", "#3b82f6", "#14b8a6", "#fff",
];

export default function WinParticles({ active, intensity = "small", containerRef }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = (containerRef?.current || canvas.parentElement).getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const count = intensity === "mega" ? 80 : intensity === "big" ? 50 : 25;
    const particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.6,
        y: canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        size: Math.random() * 4 + 2,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        life: 1,
        decay: 0.01 + Math.random() * 0.02,
        shape: Math.random() > 0.5 ? "circle" : "star",
      });
    }

    function drawStar(cx, cy, r) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    }

    let running = true;
    function animate() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.98;
        p.life -= p.decay;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        if (p.shape === "star") {
          drawStar(p.x, p.y, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      if (alive) {
        animRef.current = requestAnimationFrame(animate);
      }
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, intensity]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}