import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Full-screen celebration overlay when a player wins the progressive jackpot.
 */
export default function JackpotWinOverlay({ winAmount, onCollect }) {
  const containerRef = useRef(null);
  const amountRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();

    // Dramatic entrance
    tl.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );

    // Title burst
    tl.fromTo(".jackpot-title",
      { scale: 0, rotation: -10 },
      { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1.2, 0.4)" },
      0.2
    );

    // Amount count-up
    if (amountRef.current) {
      const obj = { val: 0 };
      tl.to(obj, {
        val: winAmount,
        duration: 2,
        ease: "power2.out",
        onUpdate: () => {
          if (amountRef.current) {
            amountRef.current.textContent = `+${Math.round(obj.val).toLocaleString()}`;
          }
        },
      }, 0.6);
    }

    // Glow pulses
    tl.to(".jackpot-glow", {
      boxShadow: "0 0 80px rgba(234,179,8,0.8), 0 0 160px rgba(234,179,8,0.4)",
      duration: 0.5,
      yoyo: true,
      repeat: 5,
      ease: "sine.inOut",
    }, 0.8);

    // Collect button
    tl.fromTo(".jackpot-collect",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" },
      2.5
    );

    return () => tl.kill();
  }, [winAmount]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      style={{ opacity: 0, background: "radial-gradient(circle, rgba(234,179,8,0.15) 0%, rgba(0,0,0,0.95) 70%)" }}
    >
      {/* Animated bg particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${1 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            {["💰", "🏆", "💎", "⭐", "🎰", "👑"][i % 6]}
          </div>
        ))}
      </div>

      <div className="jackpot-glow text-center max-w-sm w-full bg-gray-900/90 rounded-3xl p-8 border-4 border-yellow-500 relative">
        {/* Title */}
        <div className="jackpot-title" style={{ transform: "scale(0)" }}>
          <div className="text-6xl mb-2">🏆</div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 leading-tight">
            JACKPOT!
          </h1>
          <p className="text-sm text-yellow-400/80 mt-1 font-bold">You hit the Progressive Jackpot!</p>
        </div>

        {/* Amount */}
        <div className="my-6 py-4 bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-2xl border-2 border-yellow-300">
          <div className="text-xs font-bold text-yellow-900 uppercase tracking-wider mb-1">You Won</div>
          <div
            ref={amountRef}
            className="text-4xl font-black text-gray-900 tabular-nums"
          >
            +0
          </div>
          <div className="text-xs font-bold text-yellow-900 mt-1">Credits</div>
        </div>

        {/* Collect button */}
        <button
          onClick={onCollect}
          className="jackpot-collect w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white text-2xl font-black py-5 rounded-2xl border-2 border-green-300 active:scale-95 transition-transform shadow-lg"
          style={{ opacity: 0 }}
        >
          💰 COLLECT JACKPOT
        </button>
      </div>
    </div>
  );
}