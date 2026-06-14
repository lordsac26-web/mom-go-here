import { useEffect, useRef } from "react";
import gsap from "gsap";

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

export default function WinDisplay({ wins, totalWin, visible, onSkip }) {
  const containerRef = useRef(null);
  const countRef = useRef(null);
  const tweenRef = useRef(null);
  const coinsRef = useRef(null);
  const bgFlashRef = useRef(null);
  const glowTlRef = useRef(null);

  useEffect(() => {
    if (!visible || totalWin === 0 || !containerRef.current) return;

    const el = containerRef.current;
    const countEl = countRef.current;
    const isMega = totalWin >= 25000;
    const isBig = totalWin >= 5000;
    const isSmall = !isBig;

    // Kill old glow
    if (glowTlRef.current) { glowTlRef.current.kill(); glowTlRef.current = null; }

    // Entry — pop in
    gsap.fromTo(el,
      { scale: 0.3, opacity: 0, rotateZ: isMega ? -12 : -6, y: 20 },
      { scale: 1, opacity: 1, rotateZ: 0, y: 0, duration: isMega ? 0.65 : 0.45, ease: "back.out(2.8)" }
    );

    // Mega: screen shake simulation
    if (isMega) {
      gsap.to(el, {
        x: "random(-5, 5)", y: "random(-3, 3)",
        duration: 0.06, repeat: 22, yoyo: true, delay: 0.65,
        ease: "none",
        onComplete: () => gsap.set(el, { x: 0, y: 0 }),
      });
    }

    // Pulsing glow — skip infinite loop on mobile (causes sustained GPU overdraw)
    const glowColor = isMega
      ? "0 0 60px rgba(255,210,0,0.9), 0 0 120px rgba(255,80,0,0.5)"
      : isBig
      ? "0 0 40px rgba(255,210,0,0.8), 0 0 80px rgba(255,200,0,0.3)"
      : "0 0 22px rgba(34,197,94,0.65)";
    if (!isMobile()) {
      const glowTl = gsap.timeline({ repeat: -1 });
      glowTl.to(el, { boxShadow: glowColor, duration: isMega ? 0.45 : 0.6, ease: "sine.inOut" })
            .to(el, { boxShadow: "0 0 8px rgba(0,0,0,0.3)", duration: isMega ? 0.45 : 0.6, ease: "sine.inOut" });
      glowTlRef.current = glowTl;
    } else {
      gsap.set(el, { boxShadow: glowColor });
    }

    // Background flash
    if (bgFlashRef.current && (isBig || isMega)) {
      gsap.fromTo(bgFlashRef.current,
        { opacity: 0.7 },
        { opacity: 0, duration: 0.6, ease: "power2.out" }
      );
    }

    // Count-up
    const counter = { val: 0 };
    tweenRef.current = gsap.to(counter, {
      val: totalWin,
      duration: isMega ? 2.8 : isBig ? 2.0 : 1.2,
      ease: "power2.out",
      delay: 0.3,
      onUpdate: () => {
        if (countEl) countEl.textContent = `+${Math.round(counter.val).toLocaleString()}`;
      },
    });

    // Floating coins / gems — single pass only on mobile to avoid sustained animation load
    if (coinsRef.current) {
      const coinContainer = coinsRef.current;
      coinContainer.innerHTML = "";
      const mobile = isMobile();
      const coinCount = mobile ? (isMega ? 6 : isBig ? 4 : 2) : (isMega ? 14 : isBig ? 8 : 4);
      const icons = isMega
        ? ["💰", "💎", "👑", "⭐", "🏆", "✨"]
        : isBig ? ["🪙", "💰", "💎", "✨"]
        : ["🪙", "✨"];

      for (let i = 0; i < coinCount; i++) {
        const coin = document.createElement("span");
        coin.textContent = icons[i % icons.length];
        coin.className = "absolute text-2xl pointer-events-none select-none";
        coin.style.left = `${5 + Math.random() * 90}%`;
        coin.style.bottom = "0%";
        coinContainer.appendChild(coin);
        gsap.fromTo(coin,
          { y: 0, opacity: 1, scale: 0.5 + Math.random() * 0.3, rotation: Math.random() * 180 },
          {
            y: -(80 + Math.random() * 100),
            x: (Math.random() - 0.5) * 60,
            opacity: 0,
            scale: 0.8 + Math.random() * 0.4,
            rotation: (Math.random() - 0.5) * 360,
            duration: 0.9 + Math.random() * 0.6,
            delay: 0.1 + i * 0.06,
            ease: "power1.out",
            // No repeat on mobile — one pass is enough
            repeat: mobile ? 0 : (isMega ? 2 : 1),
            repeatDelay: 0.4,
          }
        );
      }
    }

    return () => {
      gsap.killTweensOf([el, counter]);
      if (glowTlRef.current) { glowTlRef.current.kill(); glowTlRef.current = null; }
      tweenRef.current = null;
      if (coinsRef.current) coinsRef.current.innerHTML = "";
    };
  }, [visible, totalWin]);

  function handleSkip() {
    if (tweenRef.current) { tweenRef.current.progress(1); tweenRef.current = null; }
    if (countRef.current) countRef.current.textContent = `+${totalWin.toLocaleString()}`;
    if (glowTlRef.current) { glowTlRef.current.kill(); glowTlRef.current = null; }
    onSkip?.();
  }

  if (!visible || totalWin === 0) return null;

  const isBig = totalWin >= 5000;
  const isMega = totalWin >= 25000;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center">
      {/* Screen flash for big wins */}
      {isBig && (
        <div
          ref={bgFlashRef}
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: isMega
              ? "radial-gradient(ellipse at center, rgba(255,215,0,0.6) 0%, rgba(255,100,0,0.3) 60%, transparent 100%)"
              : "radial-gradient(ellipse at center, rgba(255,215,0,0.4) 0%, transparent 70%)",
            opacity: 0,
          }}
        />
      )}

      {/* Floating coins layer */}
      <div ref={coinsRef} className="absolute inset-0 overflow-hidden pointer-events-none z-40" />

      <div
        ref={containerRef}
        className={`text-center px-8 py-6 rounded-3xl border-4 relative overflow-hidden ${
          isMega
            ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 border-yellow-200"
            : isBig
            ? "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600 border-yellow-300"
            : "bg-gradient-to-br from-green-500 via-emerald-500 to-green-700 border-green-300"
        }`}
        style={{ opacity: 0, minWidth: 180 }}
      >
        {/* Shimmer sweep — desktop only to avoid mobile GPU overdraw */}
        {!isMobile() && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 opacity-40"
              style={{
                background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
                animation: "shimmer 1.4s infinite",
              }}
            />
          </div>
        )}

        {/* Tier label */}
        <div className="relative z-10 mb-1">
          {isMega && <div className="text-3xl font-black text-white tracking-wider" style={{ textShadow: "0 0 20px rgba(255,255,100,0.9), 0 2px 4px rgba(0,0,0,0.4)" }}>🎆 MEGA WIN! 🎆</div>}
          {isBig && !isMega && <div className="text-2xl font-black text-white tracking-wider" style={{ textShadow: "0 0 15px rgba(255,255,100,0.7), 0 2px 4px rgba(0,0,0,0.4)" }}>🌟 BIG WIN! 🌟</div>}
          {!isBig && <div className="text-xl font-black text-white tracking-wider" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>✨ WIN! ✨</div>}
        </div>

        {/* Count-up amount */}
        <div
          ref={countRef}
          className={`font-black text-white relative z-10 tabular-nums ${
            isMega ? "text-5xl sm:text-6xl" : isBig ? "text-4xl sm:text-5xl" : "text-3xl"
          }`}
          style={{ textShadow: "0 3px 8px rgba(0,0,0,0.5), 0 0 30px rgba(255,255,100,0.4)" }}
        >
          +0
        </div>

        {wins.length > 1 && (
          <div className="text-sm text-white/85 mt-2 font-bold relative z-10">
            {wins.length} winning lines!
          </div>
        )}

        {(isBig || isMega) && (
          <button
            onClick={handleSkip}
            className="mt-3 px-5 py-2 bg-black/25 hover:bg-black/35 text-white text-sm font-bold rounded-xl border border-white/40 active:scale-95 transition-all pointer-events-auto relative z-10"
          >
            ⏩ Skip
          </button>
        )}
      </div>


    </div>
  );
}