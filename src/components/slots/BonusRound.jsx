import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { X, HelpCircle } from "lucide-react";

const BOX_COUNT = 9;

const MULTIPLIERS = [
  { value: 2, label: "2x", color: "from-blue-500 to-blue-700", emoji: "💎" },
  { value: 3, label: "3x", color: "from-green-500 to-green-700", emoji: "🍀" },
  { value: 5, label: "5x", color: "from-purple-500 to-purple-700", emoji: "⭐" },
  { value: 8, label: "8x", color: "from-orange-500 to-orange-700", emoji: "🔥" },
  { value: 10, label: "10x", color: "from-yellow-500 to-yellow-700", emoji: "👑" },
  { value: 15, label: "15x", color: "from-pink-500 to-pink-700", emoji: "💰" },
  { value: 20, label: "20x", color: "from-red-500 to-red-700", emoji: "🎆" },
  { value: 25, label: "25x", color: "from-cyan-500 to-cyan-700", emoji: "💎" },
  { value: 50, label: "50x", color: "from-amber-400 to-amber-700", emoji: "🏆" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BonusRound({ baseWin, scatterCount, onComplete }) {
  const [boxes] = useState(() => shuffleArray(MULTIPLIERS));
  const [revealed, setRevealed] = useState({});
  const [picks, setPicks] = useState(0);
  const [totalMultiplier, setTotalMultiplier] = useState(0);
  const [finished, setFinished] = useState(false);
  const containerRef = useRef(null);
  const resultRef = useRef(null);

  const maxPicks = scatterCount >= 5 ? 3 : scatterCount >= 4 ? 2 : 1;

  // Entrance animation
  useEffect(() => {
    if (!containerRef.current) return;
    const boxes = containerRef.current.querySelectorAll(".bonus-box");
    gsap.fromTo(containerRef.current, { scale: 0.8, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)",
    });
    gsap.fromTo(boxes, { scale: 0, rotation: -15 }, {
      scale: 1, rotation: 0, duration: 0.4, stagger: 0.05, ease: "back.out(2)", delay: 0.3,
    });
  }, []);

  function handlePick(idx) {
    if (revealed[idx] || finished) return;
    const box = boxes[idx];

    setRevealed(prev => ({ ...prev, [idx]: true }));
    setTotalMultiplier(prev => prev + box.value);
    const newPicks = picks + 1;
    setPicks(newPicks);

    // Animate the reveal
    const el = containerRef.current?.querySelector(`[data-box="${idx}"]`);
    if (el) {
      gsap.to(el, {
        rotateY: 180, duration: 0.5, ease: "power2.inOut",
        onComplete: () => {
          // Glow effect
          gsap.to(el, {
            boxShadow: `0 0 30px rgba(234,179,8,0.6)`,
            duration: 0.3, yoyo: true, repeat: 2, ease: "sine.inOut",
          });
        },
      });
    }

    if (newPicks >= maxPicks) {
      setTimeout(() => {
        setFinished(true);
        // Reveal all remaining
        const allRevealed = {};
        for (let i = 0; i < BOX_COUNT; i++) allRevealed[i] = true;
        setRevealed(allRevealed);

        // Animate result
        if (resultRef.current) {
          gsap.fromTo(resultRef.current, { scale: 0, opacity: 0 }, {
            scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.4)", delay: 0.5,
          });
        }
      }, 800);
    }
  }

  const finalMultiplier = totalMultiplier || 1;
  // Bonus win = multiplied total. The base win was already credited during the normal spin,
  // so we pass only the EXTRA winnings back to the parent: (multiplied - base)
  const totalBonusValue = Math.round(baseWin * finalMultiplier);
  const extraWinnings = totalBonusValue - baseWin;

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center px-4 overflow-y-auto py-6">
      <div ref={containerRef} className="w-full max-w-sm" style={{ opacity: 0 }}>
        {/* Rules Banner */}
        <div className="bg-gray-800/90 border border-yellow-600/60 rounded-2xl px-4 py-3 mb-4 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={16} className="text-yellow-400 shrink-0" />
            <span className="font-black text-yellow-400 uppercase tracking-wider text-xs">How Bonus Works</span>
          </div>
          <ol className="space-y-1 text-gray-300 leading-snug text-xs list-decimal list-inside">
            <li>You earned <strong className="text-cyan-300">{maxPicks} pick{maxPicks > 1 ? "s" : ""}</strong> from landing <strong className="text-yellow-300">{scatterCount} scatter{scatterCount > 1 ? "s" : ""} 💰</strong></li>
            <li>Tap a gift box to reveal a <strong className="text-yellow-300">multiplier</strong> (2x–50x)</li>
            <li>All multipliers are <strong className="text-green-300">added together</strong>, then applied to your <strong className="text-cyan-300">{baseWin.toLocaleString()}</strong> base win</li>
            <li>Collect your bonus and return to spinning!</li>
          </ol>
        </div>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-4xl mb-1">🎁</div>
          <h2 className="text-2xl font-black text-yellow-400">BONUS ROUND!</h2>
          <p className="text-sm text-gray-300 mt-1">
            Pick {maxPicks} box{maxPicks > 1 ? "es" : ""} to reveal your multiplier!
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs font-bold">
            <span className="text-cyan-400">Base Win: {baseWin.toLocaleString()}</span>
            <span className="text-yellow-400">Picks: {picks}/{maxPicks}</span>
          </div>
        </div>

        {/* Box Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {boxes.map((box, idx) => {
            const isRevealed = revealed[idx];
            return (
              <button
                key={idx}
                data-box={idx}
                onClick={() => handlePick(idx)}
                disabled={isRevealed || finished}
                className="bonus-box aspect-square rounded-2xl border-2 font-black text-lg transition-all relative overflow-hidden"
                style={{
                  perspective: "600px",
                  transformStyle: "preserve-3d",
                  borderColor: isRevealed ? "#eab308" : "#4b5563",
                  background: isRevealed
                    ? `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`
                    : "linear-gradient(135deg, #374151, #1f2937)",
                }}
              >
                {isRevealed ? (
                  <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br ${box.color} rounded-xl`}>
                    <span className="text-3xl">{box.emoji}</span>
                    <span className="text-white text-xl font-black">{box.label}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-4xl">🎁</span>
                    <span className="text-gray-400 text-xs mt-1">Tap!</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Multiplier bar */}
        {totalMultiplier > 0 && !finished && (
          <div className="text-center bg-gray-800 rounded-2xl py-3 px-4 border-2 border-yellow-600 mb-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Current Multiplier</div>
            <div className="text-3xl font-black text-yellow-400">{totalMultiplier}x</div>
          </div>
        )}

        {/* Final Result */}
        {finished && (
          <div ref={resultRef} style={{ opacity: 0 }}>
            <div className="text-center bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-2xl py-4 px-4 border-2 border-yellow-300 mb-3">
              <div className="text-sm font-bold text-yellow-900 uppercase">Total Multiplier</div>
              <div className="text-4xl font-black text-gray-900">{finalMultiplier}x</div>
              <div className="text-xs font-bold text-yellow-900/80 mt-1">
                {baseWin.toLocaleString()} × {finalMultiplier} = {totalBonusValue.toLocaleString()}
              </div>
              <div className="text-lg font-black text-gray-900 mt-1">
                🎉 Bonus: +{extraWinnings.toLocaleString()}
              </div>
              <div className="text-[10px] text-yellow-900/60 mt-0.5">
                (Base win of {baseWin.toLocaleString()} already credited)
              </div>
            </div>
            <button
              onClick={() => onComplete(extraWinnings)}
              className="w-full bg-green-600 text-white text-xl font-black py-4 rounded-2xl border-2 border-green-400 active:scale-95 transition-transform"
            >
              💰 Collect +{extraWinnings.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}