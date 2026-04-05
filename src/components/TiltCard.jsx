import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import VanillaTilt from "vanilla-tilt";

/**
 * 3D Tilt Card with glare + parallax inner layers.
 * Uses vanilla-tilt.js for smooth perspective tilt on hover/touch.
 */
export default function TiltCard({ to, emoji, label, description, gradient, glareColor, iconBg }) {
  const tiltRef = useRef(null);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;

    VanillaTilt.init(el, {
      max: 18,
      speed: 400,
      glare: true,
      "max-glare": 0.35,
      perspective: 800,
      scale: 1.04,
      gyroscope: true,
      gyroscopeMinAngleX: -20,
      gyroscopeMaxAngleX: 20,
      gyroscopeMinAngleY: -20,
      gyroscopeMaxAngleY: 20,
    });

    return () => el.vanillaTilt?.destroy();
  }, []);

  return (
    <Link to={to} className="block">
      <div
        ref={tiltRef}
        className={`relative overflow-hidden rounded-3xl ${gradient} p-5 shadow-2xl border border-white/10`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Background decorative circles — parallax layer (deep) */}
        <div
          className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-20"
          style={{
            transform: "translateZ(20px)",
            background: glareColor || "rgba(255,255,255,0.15)",
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-15"
          style={{
            transform: "translateZ(10px)",
            background: glareColor || "rgba(255,255,255,0.1)",
            filter: "blur(12px)",
          }}
        />

        {/* Icon — parallax layer (mid) */}
        <div
          className="relative z-10 flex items-center gap-4"
          style={{ transform: "translateZ(40px)" }}
        >
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-2xl ${iconBg || "bg-white/20"} shadow-lg backdrop-blur-sm`}
            style={{ transform: "translateZ(20px)" }}
          >
            <span className="text-4xl">{emoji}</span>
          </div>
          <div style={{ transform: "translateZ(30px)" }}>
            <h3 className="text-2xl font-black text-white drop-shadow-lg">{label}</h3>
            {description && (
              <p className="text-sm text-white/75 font-semibold mt-0.5 leading-tight">{description}</p>
            )}
          </div>
        </div>

        {/* Bottom accent bar — parallax layer (front) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
          style={{
            transform: "translateZ(50px)",
            background: `linear-gradient(90deg, transparent, ${glareColor || "rgba(255,255,255,0.6)"}, transparent)`,
          }}
        />
      </div>
    </Link>
  );
}