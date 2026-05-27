import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useMinigameSounds } from "@/hooks/useMinigameSounds";

/**
 * Full-screen overlay shown when 3+ scatters land.
 * Player picks their bonus type — adds a skill/choice layer.
 * Reveals the options with staggered entrance, glow on hover.
 */

const OPTIONS = [
  {
    id: "boxes",
    emoji: "🎁",
    label: "Pick-A-Box",
    desc: "Open mystery boxes to reveal multipliers — the more scatters, the more picks!",
    glow: "rgba(234,179,8,0.8)",
    border: "border-yellow-500",
    bg: "from-yellow-900/80 to-amber-900/60",
    hoverBg: "hover:from-yellow-800/90 hover:to-amber-800/70",
    textColor: "text-yellow-300",
  },
  {
    id: "plinko",
    emoji: "📍",
    label: "Plinko Drop",
    desc: "Drop balls through the peg board — aim for the highest multiplier slots!",
    glow: "rgba(217,70,239,0.8)",
    border: "border-fuchsia-500",
    bg: "from-fuchsia-900/80 to-purple-900/60",
    hoverBg: "hover:from-fuchsia-800/90 hover:to-purple-800/70",
    textColor: "text-fuchsia-300",
  },
  {
    id: "freeSpins",
    emoji: "🎰",
    label: "Free Spins",
    desc: "Spin for free with an escalating multiplier that grows every 3 spins!",
    glow: "rgba(34,197,94,0.8)",
    border: "border-green-500",
    bg: "from-green-900/80 to-emerald-900/60",
    hoverBg: "hover:from-green-800/90 hover:to-emerald-800/70",
    textColor: "text-green-300",
  },
];

export default function BonusSelectScreen({ scatterCount, onSelect }) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const glowRefs = useRef([]);
  const [selected, setSelected] = useState(null);
  const sounds = useMinigameSounds();

  // Entrance animation
  useEffect(() => {
    sounds.bonusEntrance();

    // Backdrop flash
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4 }
    );

    // Title
    const title = containerRef.current?.querySelector(".bonus-title");
    if (title) {
      gsap.fromTo(title,
        { y: -40, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(2)", delay: 0.3 }
      );
    }

    // Cards stagger in
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      gsap.fromTo(card,
        { y: 60, opacity: 0, scale: 0.85, rotateX: 15 },
        { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.55, ease: "back.out(1.7)", delay: 0.5 + i * 0.15 }
      );
    });

    // Pulse the prompt
    const prompt = containerRef.current?.querySelector(".bonus-prompt");
    if (prompt) {
      gsap.fromTo(prompt, { opacity: 0 }, { opacity: 1, delay: 1.1, duration: 0.4 });
      gsap.to(prompt, { opacity: 0.6, yoyo: true, repeat: -1, duration: 0.9, delay: 1.5 });
    }
  }, []);

  function handleHover(idx) {
    sounds.bonusHover();
    const card = cardRefs.current[idx];
    if (!card) return;
    gsap.to(card, { scale: 1.04, y: -4, duration: 0.2, ease: "power2.out" });

    // Glow pulse
    const opt = OPTIONS[idx];
    gsap.to(glowRefs.current[idx], {
      boxShadow: `0 0 40px ${opt.glow}, 0 0 80px ${opt.glow.replace("0.8", "0.3")}`,
      duration: 0.25,
    });
  }

  function handleLeave(idx) {
    const card = cardRefs.current[idx];
    if (!card) return;
    gsap.to(card, { scale: 1, y: 0, duration: 0.2, ease: "power2.out" });
    gsap.to(glowRefs.current[idx], { boxShadow: "none", duration: 0.25 });
  }

  function handleSelect(id, idx) {
    if (selected) return;
    setSelected(id);
    sounds.boxPick();

    const card = cardRefs.current[idx];
    if (card) {
      gsap.to(card, {
        scale: 1.08, duration: 0.15, yoyo: true, repeat: 1,
        onComplete: () => {
          // Flash the selected card, dim the others
          gsap.to(card, { scale: 1.05, boxShadow: `0 0 60px ${OPTIONS[idx].glow}`, duration: 0.2 });
          cardRefs.current.forEach((c, i) => {
            if (i !== idx && c) gsap.to(c, { opacity: 0.3, scale: 0.95, duration: 0.3 });
          });
          // Slide out after brief pause
          setTimeout(() => {
            gsap.to(containerRef.current, {
              scale: 1.05, opacity: 0, duration: 0.4, ease: "power2.in",
              onComplete: () => onSelect(id),
            });
          }, 500);
        }
      });
    }
  }

  const picks = scatterCount >= 5 ? 3 : scatterCount >= 4 ? 2 : 1;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center px-4"
      style={{ opacity: 0, perspective: "1000px" }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(234,179,8,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Scatter count badge */}
        <div className="flex justify-center mb-3">
          <div className="bg-yellow-500/20 border border-yellow-500/60 rounded-full px-4 py-1.5 text-yellow-300 text-xs font-black uppercase tracking-widest">
            💰 {scatterCount} Scatters — {picks} Pick{picks > 1 ? "s" : ""}
          </div>
        </div>

        {/* Title */}
        <div className="bonus-title text-center mb-5" style={{ opacity: 0 }}>
          <div className="text-5xl mb-2">🎰</div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500">
            BONUS ROUND!
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-bold">Choose your adventure</p>
        </div>

        {/* Option cards */}
        <div className="space-y-3">
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.id}
              ref={el => { cardRefs.current[i] = el; glowRefs.current[i] = el; }}
              onClick={() => handleSelect(opt.id, i)}
              onMouseEnter={() => handleHover(i)}
              onMouseLeave={() => handleLeave(i)}
              onTouchStart={() => handleHover(i)}
              onTouchEnd={() => handleLeave(i)}
              disabled={!!selected}
              className={`w-full rounded-2xl border-2 ${opt.border} bg-gradient-to-r ${opt.bg} ${opt.hoverBg} p-4 flex items-center gap-4 text-left transition-colors active:scale-95`}
              style={{ opacity: 0, transform: "translateY(60px)" }}
            >
              <div className="text-5xl shrink-0 drop-shadow-lg">{opt.emoji}</div>
              <div className="flex-1">
                <div className={`font-black text-lg ${opt.textColor}`}>{opt.label}</div>
                <div className="text-gray-400 text-xs leading-snug mt-0.5">{opt.desc}</div>
              </div>
              <div className={`shrink-0 text-2xl ${opt.textColor}`}>›</div>
            </button>
          ))}
        </div>

        <p className="bonus-prompt text-center text-gray-500 text-xs mt-4 font-bold uppercase tracking-widest" style={{ opacity: 0 }}>
          Tap to choose your bonus
        </p>
      </div>
    </div>
  );
}