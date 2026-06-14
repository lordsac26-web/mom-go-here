import { useState, useEffect } from "react";

const SPARKLE_COUNT = 5;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function SparkleEffect({ active, children, className = "", sparkleColor }) {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (!active) {
      setSparkles([]);
      return;
    }
    const newSparkles = Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
      id: i,
      x: randomBetween(-8, 8),
      y: randomBetween(-8, 8),
      size: randomBetween(4, 10),
      delay: randomBetween(0, 0.3),
      duration: randomBetween(0.4, 0.8),
    }));
    setSparkles(newSparkles);
    const timer = setTimeout(() => setSparkles([]), 1000);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <div className={`relative ${className}`}>
      {children}
      {sparkles.map(s => (
        <span
          key={s.id}
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${s.x}px)`,
            top: `calc(50% + ${s.y}px)`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, #fef08a 0%, ${sparkleColor || "#22c55e"} 60%, transparent 100%)`,
            animation: `sparkle-pop ${s.duration}s ease-out ${s.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}