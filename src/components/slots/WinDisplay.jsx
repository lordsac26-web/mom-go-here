import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function WinDisplay({ wins, totalWin, visible }) {
  const containerRef = useRef(null);
  const countRef = useRef(null);

  useEffect(() => {
    if (!visible || totalWin === 0 || !containerRef.current) return;

    const el = containerRef.current;
    const countEl = countRef.current;

    // Entry animation
    gsap.fromTo(el, {
      scale: 0, opacity: 0, rotateZ: -10,
    }, {
      scale: 1, opacity: 1, rotateZ: 0,
      duration: 0.5, ease: "back.out(2)",
    });

    // Count-up effect for the number
    const counter = { val: 0 };
    gsap.to(counter, {
      val: totalWin,
      duration: 1.2,
      ease: "power2.out",
      delay: 0.3,
      onUpdate: () => {
        if (countEl) countEl.textContent = `+${Math.round(counter.val).toLocaleString()}`;
      },
    });

    // Pulsing glow
    gsap.to(el, {
      boxShadow: totalWin >= 25000
        ? "0 0 60px rgba(255,215,0,0.8), 0 0 120px rgba(255,100,0,0.4)"
        : totalWin >= 5000
        ? "0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,200,0,0.3)"
        : "0 0 20px rgba(34,197,94,0.5)",
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 0.5,
    });

    return () => gsap.killTweensOf([el, counter]);
  }, [visible, totalWin]);

  if (!visible || totalWin === 0) return null;

  const isBigWin = totalWin >= 5000;
  const isMegaWin = totalWin >= 25000;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      <div
        ref={containerRef}
        className={`text-center px-8 py-6 rounded-3xl border-4 ${
          isMegaWin
            ? "bg-gradient-to-br from-yellow-500 via-red-500 to-purple-600 border-yellow-300"
            : isBigWin
            ? "bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-300"
            : "bg-gradient-to-br from-green-600 to-emerald-700 border-green-400"
        }`}
        style={{ opacity: 0 }}
      >
        {isMegaWin && (
          <div className="text-4xl font-black text-white mb-1">🎆 MEGA WIN! 🎆</div>
        )}
        {isBigWin && !isMegaWin && (
          <div className="text-3xl font-black text-white mb-1">🌟 BIG WIN! 🌟</div>
        )}
        {!isBigWin && (
          <div className="text-2xl font-black text-white mb-1">✨ WIN! ✨</div>
        )}
        <div
          ref={countRef}
          className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg"
        >
          +0
        </div>
        {wins.length > 1 && (
          <div className="text-sm text-white/80 mt-2 font-bold">
            {wins.length} winning lines!
          </div>
        )}
      </div>
    </div>
  );
}