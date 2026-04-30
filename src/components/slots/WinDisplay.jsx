import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Win overlay with tiered celebrations, coin shower, and a SKIP button for big wins.
 */
export default function WinDisplay({ wins, totalWin, visible, onSkip }) {
  const containerRef = useRef(null);
  const countRef = useRef(null);
  const tweenRef = useRef(null);
  const coinsRef = useRef(null);

  useEffect(() => {
    if (!visible || totalWin === 0 || !containerRef.current) return;

    const el = containerRef.current;
    const countEl = countRef.current;

    // Entry animation — different per tier
    const isMega = totalWin >= 25000;
    const isBig = totalWin >= 5000;

    gsap.fromTo(el, {
      scale: 0, opacity: 0, rotateZ: isMega ? -15 : -8,
    }, {
      scale: 1, opacity: 1, rotateZ: 0,
      duration: isMega ? 0.7 : 0.5, ease: "back.out(2.5)",
    });

    // Shake for mega
    if (isMega) {
      gsap.to(el, {
        x: "random(-4, 4)", y: "random(-2, 2)",
        duration: 0.05, repeat: 20, yoyo: true, delay: 0.7,
        onComplete: () => gsap.set(el, { x: 0, y: 0 }),
      });
    }

    // Count-up effect
    const counter = { val: 0 };
    tweenRef.current = gsap.to(counter, {
      val: totalWin,
      duration: isMega ? 2.5 : isBig ? 1.8 : 1.2,
      ease: "power2.out",
      delay: 0.3,
      onUpdate: () => {
        if (countEl) countEl.textContent = `+${Math.round(counter.val).toLocaleString()}`;
      },
    });

    // Pulsing glow — more dramatic tiers
    gsap.to(el, {
      boxShadow: isMega
        ? "0 0 80px rgba(255,215,0,0.9), 0 0 160px rgba(255,100,0,0.5)"
        : isBig
        ? "0 0 50px rgba(255,215,0,0.7), 0 0 100px rgba(255,200,0,0.35)"
        : "0 0 25px rgba(34,197,94,0.6)",
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 0.4,
    });

    // Animate floating coin emojis
    if (coinsRef.current) {
      const coinCount = isMega ? 12 : isBig ? 8 : 4;
      const coinContainer = coinsRef.current;
      coinContainer.innerHTML = "";
      for (let i = 0; i < coinCount; i++) {
        const coin = document.createElement("span");
        coin.textContent = isMega ? ["💰", "💎", "👑", "⭐"][i % 4] : isBig ? ["🪙", "💰", "✨"][i % 3] : "🪙";
        coin.className = "absolute text-xl pointer-events-none";
        coin.style.left = `${10 + Math.random() * 80}%`;
        coin.style.top = "50%";
        coinContainer.appendChild(coin);

        gsap.fromTo(coin, {
          y: 0, opacity: 1, scale: 0.5, rotation: Math.random() * 360,
        }, {
          y: -(80 + Math.random() * 100),
          x: (Math.random() - 0.5) * 60,
          opacity: 0,
          scale: 1 + Math.random() * 0.5,
          rotation: Math.random() * 720 - 360,
          duration: 1.2 + Math.random() * 0.8,
          delay: 0.2 + i * 0.08,
          ease: "power1.out",
          repeat: isMega ? 2 : 1,
          repeatDelay: 0.5,
        });
      }
    }

    return () => {
      gsap.killTweensOf([el, counter]);
      tweenRef.current = null;
      if (coinsRef.current) coinsRef.current.innerHTML = "";
    };
  }, [visible, totalWin]);

  function handleSkip() {
    if (tweenRef.current) {
      tweenRef.current.progress(1);
      tweenRef.current = null;
    }
    if (countRef.current) {
      countRef.current.textContent = `+${totalWin.toLocaleString()}`;
    }
    onSkip?.();
  }

  if (!visible || totalWin === 0) return null;

  const isBigWin = totalWin >= 5000;
  const isMegaWin = totalWin >= 25000;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      {/* Floating coins layer */}
      <div ref={coinsRef} className="absolute inset-0 overflow-hidden pointer-events-none z-40" />

      <div
        ref={containerRef}
        className={`text-center px-8 py-6 rounded-3xl border-4 relative ${
          isMegaWin
            ? "bg-gradient-to-br from-yellow-500 via-red-500 to-purple-600 border-yellow-300"
            : isBigWin
            ? "bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-300"
            : "bg-gradient-to-br from-green-600 to-emerald-700 border-green-400"
        }`}
        style={{ opacity: 0 }}
      >
        {/* Shimmer overlay */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 45%, transparent 50%)",
              animation: "shimmer 1.5s infinite",
            }}
          />
        </div>

        {isMegaWin && (
          <div className="text-3xl sm:text-4xl font-black text-white mb-1 relative z-10">🎆 MEGA WIN! 🎆</div>
        )}
        {isBigWin && !isMegaWin && (
          <div className="text-2xl sm:text-3xl font-black text-white mb-1 relative z-10">🌟 BIG WIN! 🌟</div>
        )}
        {!isBigWin && (
          <div className="text-xl sm:text-2xl font-black text-white mb-1 relative z-10">✨ WIN! ✨</div>
        )}
        <div
          ref={countRef}
          className={`font-black text-white drop-shadow-lg relative z-10 ${
            isMegaWin ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
          }`}
        >
          +0
        </div>
        {wins.length > 1 && (
          <div className="text-sm text-white/80 mt-2 font-bold relative z-10">
            {wins.length} winning lines!
          </div>
        )}
        {(isBigWin || isMegaWin) && (
          <button
            onClick={handleSkip}
            className="mt-3 px-5 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 active:scale-95 transition-all pointer-events-auto relative z-10"
          >
            ⏩ Skip
          </button>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}