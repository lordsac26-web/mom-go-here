import { useEffect, useRef } from "react";
import gsap from "gsap";

const BULB_COUNT = 60;
const COLORS = ["#ef4444", "#eab308", "#22c55e", "#3b82f6", "#ec4899", "#f97316"];

export default function CasinoFrame({ children, spinning, winning, winTier = "none" }) {
  const bulbsRef = useRef(null);
  const tlRef = useRef(null);
  const frameRef = useRef(null);

  // Build bulb data
  const perSide = Math.floor(BULB_COUNT / 4);
  const bulbs = Array.from({ length: BULB_COUNT }, (_, i) => ({ id: i, color: COLORS[i % COLORS.length] }));

  // Chase animation
  useEffect(() => {
    if (!bulbsRef.current) return;
    const bulbEls = bulbsRef.current.querySelectorAll(".bulb");
    if (!bulbEls.length) return;

    if (tlRef.current) tlRef.current.kill();
    const tl = gsap.timeline({ repeat: -1 });
    tlRef.current = tl;

    const groupSize = 3;
    const groups = Math.ceil(bulbEls.length / groupSize);
    for (let g = 0; g < groups; g++) {
      const start = g * groupSize;
      const end = Math.min(start + groupSize, bulbEls.length);
      const groupBulbs = Array.from(bulbEls).slice(start, end);
      tl.to(groupBulbs, { opacity: 1, scale: 1.3, duration: 0.08, ease: "power1.out" }, g * 0.07);
      tl.to(groupBulbs, { opacity: 0.2, scale: 1, duration: 0.12, ease: "power1.in" }, g * 0.07 + 0.12);
    }
    return () => tl.kill();
  }, []);

  // Speed / strobe on spin
  useEffect(() => {
    if (!tlRef.current) return;
    tlRef.current.timeScale(spinning ? 3 : 1);
  }, [spinning]);

  // Win celebration — full strobe flash
  useEffect(() => {
    if (!frameRef.current || !bulbsRef.current) return;
    if (winning && winTier !== "none") {
      const bulbEls = bulbsRef.current.querySelectorAll(".bulb");

      if (winTier === "mega") {
        // All bulbs flash gold + frame glow
        gsap.to(Array.from(bulbEls), {
          backgroundColor: "#fde047",
          boxShadow: "0 0 18px #fde047, 0 0 36px rgba(253,224,71,0.6)",
          opacity: 1,
          scale: 1.5,
          duration: 0.12,
          yoyo: true,
          repeat: 14,
          ease: "power1.inOut",
          stagger: { amount: 0.05, from: "random" },
        });
        gsap.to(frameRef.current, {
          boxShadow: "0 0 60px rgba(253,224,71,0.9), 0 0 120px rgba(253,100,0,0.5)",
          duration: 0.3,
          yoyo: true,
          repeat: 8,
          ease: "sine.inOut",
        });
      } else if (winTier === "big") {
        gsap.to(Array.from(bulbEls), {
          backgroundColor: "#fbbf24",
          opacity: 1,
          scale: 1.4,
          duration: 0.15,
          yoyo: true,
          repeat: 8,
          stagger: { amount: 0.08 },
        });
        gsap.to(frameRef.current, {
          boxShadow: "0 0 40px rgba(251,191,36,0.7), 0 0 80px rgba(251,191,36,0.3)",
          duration: 0.35,
          yoyo: true,
          repeat: 5,
          ease: "sine.inOut",
        });
      } else {
        // Small win — quick green pulse
        gsap.to(Array.from(bulbEls), {
          backgroundColor: "#22c55e",
          opacity: 1,
          scale: 1.25,
          duration: 0.2,
          yoyo: true,
          repeat: 4,
          stagger: { amount: 0.1 },
        });
      }
    } else if (!winning) {
      // Reset
      if (frameRef.current) gsap.to(frameRef.current, { boxShadow: "none", duration: 0.5 });
    }
  }, [winning, winTier]);

  return (
    <div ref={frameRef} className="relative" style={{ padding: "12px" }}>
      {/* Bulb ring */}
      <div ref={bulbsRef} className="absolute inset-0 pointer-events-none z-10">
        {/* Top */}
        <div className="absolute top-0 left-0 right-0 flex justify-around" style={{ transform: "translateY(-4px)" }}>
          {bulbs.slice(0, perSide).map(b => (
            <div key={`t-${b.id}`} className="bulb rounded-full transition-colors"
              style={{ width: 9, height: 9, backgroundColor: b.color, boxShadow: `0 0 7px ${b.color}`, opacity: 0.2 }} />
          ))}
        </div>
        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-around" style={{ transform: "translateY(4px)" }}>
          {bulbs.slice(perSide, perSide * 2).map(b => (
            <div key={`b-${b.id}`} className="bulb rounded-full"
              style={{ width: 9, height: 9, backgroundColor: b.color, boxShadow: `0 0 7px ${b.color}`, opacity: 0.2 }} />
          ))}
        </div>
        {/* Left */}
        <div className="absolute top-0 bottom-0 left-0 flex flex-col justify-around" style={{ transform: "translateX(-4px)" }}>
          {bulbs.slice(perSide * 2, perSide * 3).map(b => (
            <div key={`l-${b.id}`} className="bulb rounded-full"
              style={{ width: 9, height: 9, backgroundColor: b.color, boxShadow: `0 0 7px ${b.color}`, opacity: 0.2 }} />
          ))}
        </div>
        {/* Right */}
        <div className="absolute top-0 bottom-0 right-0 flex flex-col justify-around" style={{ transform: "translateX(4px)" }}>
          {bulbs.slice(perSide * 3).map(b => (
            <div key={`r-${b.id}`} className="bulb rounded-full"
              style={{ width: 9, height: 9, backgroundColor: b.color, boxShadow: `0 0 7px ${b.color}`, opacity: 0.2 }} />
          ))}
        </div>
      </div>

      <div className="relative z-0">{children}</div>
    </div>
  );
}