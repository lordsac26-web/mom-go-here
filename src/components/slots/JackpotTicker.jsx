import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/**
 * Animated progressive jackpot display with GSAP counting ticker.
 */
export default function JackpotTicker({ amount, spinning }) {
  const displayRef = useRef(null);
  const valueRef = useRef(null);
  const prevAmountRef = useRef(amount);
  const [displayAmount, setDisplayAmount] = useState(amount);

  // Animate count-up when amount changes
  useEffect(() => {
    const prev = prevAmountRef.current;
    prevAmountRef.current = amount;
    if (prev === amount || !valueRef.current) return;

    const obj = { val: prev };
    gsap.to(obj, {
      val: amount,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => setDisplayAmount(Math.round(obj.val)),
    });
  }, [amount]);

  // Pulsing glow when spinning
  useEffect(() => {
    if (!displayRef.current) return;
    if (spinning) {
      gsap.to(displayRef.current, {
        boxShadow: "0 0 20px rgba(234,179,8,0.5), 0 0 40px rgba(234,179,8,0.2)",
        duration: 0.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    } else {
      gsap.to(displayRef.current, {
        boxShadow: "0 0 10px rgba(234,179,8,0.15)",
        duration: 0.3,
      });
    }
    return () => gsap.killTweensOf(displayRef.current);
  }, [spinning]);

  // Idle shimmer
  useEffect(() => {
    if (!displayRef.current) return;
    const shimmer = gsap.to(displayRef.current, {
      backgroundPosition: "200% 0",
      duration: 3,
      repeat: -1,
      ease: "none",
    });
    return () => shimmer.kill();
  }, []);

  return (
    <div
      ref={displayRef}
      className="bg-gradient-to-r from-yellow-900/60 via-amber-800/80 to-yellow-900/60 border-2 border-yellow-500/60 rounded-2xl px-4 py-2 text-center shadow-lg"
      style={{
        backgroundSize: "200% 100%",
      }}
    >
      <div className="text-[9px] uppercase tracking-[0.2em] text-yellow-400/70 font-bold">
        🏆 Progressive Jackpot
      </div>
      <div
        ref={valueRef}
        className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 tabular-nums leading-tight"
      >
        💰 {displayAmount.toLocaleString()}
      </div>
    </div>
  );
}