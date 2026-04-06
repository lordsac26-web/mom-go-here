import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Casino-style frame with animated chasing light bulbs.
 * Uses GSAP for the chase sequence.
 */
export default function CasinoFrame({ children, spinning }) {
  const bulbsRef = useRef(null);
  const tlRef = useRef(null);

  useEffect(() => {
    if (!bulbsRef.current) return;
    const bulbs = bulbsRef.current.querySelectorAll(".bulb");
    if (!bulbs.length) return;

    if (tlRef.current) tlRef.current.kill();

    const tl = gsap.timeline({ repeat: -1 });
    tlRef.current = tl;

    // Chase pattern: groups of 3 light up in sequence
    const groupSize = 3;
    const groups = Math.ceil(bulbs.length / groupSize);

    for (let g = 0; g < groups; g++) {
      const start = g * groupSize;
      const end = Math.min(start + groupSize, bulbs.length);
      const groupBulbs = Array.from(bulbs).slice(start, end);

      tl.to(groupBulbs, {
        opacity: 1,
        scale: 1.2,
        duration: 0.1,
        ease: "power1.out",
      }, g * 0.08);

      tl.to(groupBulbs, {
        opacity: 0.3,
        scale: 1,
        duration: 0.15,
        ease: "power1.in",
      }, g * 0.08 + 0.15);
    }

    return () => tl.kill();
  }, []);

  // Speed up chase when spinning
  useEffect(() => {
    if (tlRef.current) {
      tlRef.current.timeScale(spinning ? 2.5 : 1);
    }
  }, [spinning]);

  const BULB_COUNT = 52; // around the border
  const colors = ["#ef4444", "#eab308", "#22c55e", "#3b82f6", "#ec4899", "#f97316"];

  // Generate bulb positions around a rectangle
  const bulbs = [];
  const perSide = Math.floor(BULB_COUNT / 4);

  for (let i = 0; i < BULB_COUNT; i++) {
    const color = colors[i % colors.length];
    bulbs.push({ id: i, color });
  }

  return (
    <div className="relative">
      {/* Bulb container */}
      <div ref={bulbsRef} className="absolute inset-0 pointer-events-none z-10">
        {/* Top row */}
        <div className="absolute top-0 left-0 right-0 flex justify-around px-1" style={{ transform: "translateY(-6px)" }}>
          {bulbs.slice(0, perSide).map(b => (
            <div
              key={`t-${b.id}`}
              className="bulb rounded-full"
              style={{
                width: 8, height: 8,
                backgroundColor: b.color,
                boxShadow: `0 0 6px ${b.color}`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
        {/* Bottom row */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-1" style={{ transform: "translateY(6px)" }}>
          {bulbs.slice(perSide, perSide * 2).map(b => (
            <div
              key={`b-${b.id}`}
              className="bulb rounded-full"
              style={{
                width: 8, height: 8,
                backgroundColor: b.color,
                boxShadow: `0 0 6px ${b.color}`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
        {/* Left column */}
        <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-around py-1" style={{ transform: "translateX(-6px)" }}>
          {bulbs.slice(perSide * 2, perSide * 3).map(b => (
            <div
              key={`l-${b.id}`}
              className="bulb rounded-full"
              style={{
                width: 8, height: 8,
                backgroundColor: b.color,
                boxShadow: `0 0 6px ${b.color}`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
        {/* Right column */}
        <div className="absolute top-0 bottom-0 right-0 flex flex-col justify-around py-1" style={{ transform: "translateX(6px)" }}>
          {bulbs.slice(perSide * 3).map(b => (
            <div
              key={`r-${b.id}`}
              className="bulb rounded-full"
              style={{
                width: 8, height: 8,
                backgroundColor: b.color,
                boxShadow: `0 0 6px ${b.color}`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
      </div>

      {/* Inner content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}