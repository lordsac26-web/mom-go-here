import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { Lock, ChevronRight, Zap, TrendingUp } from "lucide-react";
import { MACHINES, isMachineUnlocked, getUnlockProgress, loadGlobalStats } from "./machineDefinitions";

const VOLATILITY_LABELS = {
  low: { label: "Low", color: "text-green-400", bg: "bg-green-900/40" },
  medium: { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-900/40" },
  high: { label: "High", color: "text-orange-400", bg: "bg-orange-900/40" },
  extreme: { label: "Extreme", color: "text-red-400", bg: "bg-red-900/40" },
};

const BONUS_LABELS = {
  boxes: "🎁 Mystery Boxes",
  plinko: "📍 Plinko Drop",
  freeSpins: "🎰 Free Spins",
};

export default function MachineSelectScreen({ onSelect }) {
  const [globalStats] = useState(loadGlobalStats);
  const [selectedPreview, setSelectedPreview] = useState(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(cards,
      { y: 40, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.3)" }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-purple-900/20 to-gray-900 px-4 py-4 border-b border-purple-500/30">
        <div className="flex items-center justify-between">
          <Link to="/games" className="text-purple-400 text-lg font-bold">← Back</Link>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400">
            🎰 SLOT PARLOR
          </h1>
          <div className="text-xs text-gray-400 font-bold text-right">
            <div>{globalStats.totalSpins} spins</div>
            <div>{globalStats.totalWins} wins</div>
          </div>
        </div>
      </div>

      {/* Machine Cards */}
      <div className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {MACHINES.map((machine, idx) => {
          const unlocked = isMachineUnlocked(machine, globalStats);
          const progress = getUnlockProgress(machine, globalStats);
          const vol = VOLATILITY_LABELS[machine.volatility];

          return (
            <div
              key={machine.id}
              ref={el => cardsRef.current[idx] = el}
              className="opacity-0"
            >
              <button
                onClick={() => {
                  if (unlocked) {
                    onSelect(machine.id);
                  } else {
                    setSelectedPreview(selectedPreview === machine.id ? null : machine.id);
                  }
                }}
                className={`w-full text-left rounded-2xl border-2 overflow-hidden transition-all active:scale-[0.98] ${
                  unlocked
                    ? `bg-gradient-to-br ${machine.bgGradient} ${machine.borderColor} shadow-lg`
                    : "bg-gray-900/80 border-gray-700 opacity-70"
                }`}
              >
                {/* Main card content */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Machine icon */}
                    <div className={`text-5xl ${!unlocked && "grayscale opacity-50"}`}>
                      {machine.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-black ${unlocked ? "text-white" : "text-gray-400"}`}>
                          {machine.name}
                        </h3>
                        {!unlocked && <Lock size={16} className="text-gray-500" />}
                      </div>
                      <p className={`text-sm font-bold ${unlocked ? "text-gray-300" : "text-gray-500"}`}>
                        {machine.subtitle}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${vol.bg} ${vol.color}`}>
                          <Zap size={10} className="inline mr-0.5" />{vol.label} Vol
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300">
                          {BONUS_LABELS[machine.bonusType]}
                        </span>
                        {machine.betLevels && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300">
                            💰 {machine.betLevels[0].toLocaleString()}–{machine.betLevels[machine.betLevels.length - 1].toLocaleString()}
                          </span>
                        )}
                        {machine.hasRandomPlinko && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300">
                            📍 Random Plinko
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Play arrow or lock */}
                    {unlocked ? (
                      <ChevronRight size={28} className="text-white/60 mt-2" />
                    ) : (
                      <div className="mt-2">
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center">
                          <Lock size={18} className="text-gray-500" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Symbol preview */}
                  {unlocked && (
                    <div className="flex items-center gap-1 mt-3 overflow-x-auto">
                      {machine.symbols.slice(0, 6).map(s => (
                        <span key={s.id} className="text-xl flex-shrink-0">{s.emoji}</span>
                      ))}
                      <span className="text-xl flex-shrink-0">{machine.wild.emoji}</span>
                      <span className="text-xl flex-shrink-0">{machine.scatter.emoji}</span>
                    </div>
                  )}

                  {/* Unlock progress */}
                  {!unlocked && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400 font-bold">{machine.unlockLabel}</span>
                        <span className="text-yellow-400 font-black">{Math.round(progress * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded preview for locked machines */}
              <AnimatePresence>
                {selectedPreview === machine.id && !unlocked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gray-800/60 rounded-b-2xl px-4 py-3 border-x-2 border-b-2 border-gray-700 -mt-2">
                      <p className="text-sm text-gray-300">{machine.description}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-400">Preview:</span>
                        {machine.symbols.slice(0, 5).map(s => (
                          <span key={s.id} className="text-lg grayscale opacity-60">{s.emoji}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Play Money notice + Bottom hint */}
      <div className="text-center px-6 py-4 space-y-2">
        <div className="bg-green-900/30 border border-green-600/40 rounded-2xl px-4 py-3 max-w-md mx-auto">
          <p className="text-sm text-green-300 font-bold">🎲 All coins are Play Money — no real money involved!</p>
          <p className="text-xs text-green-400/70 mt-1">Your coin jar gets refilled automatically so you can always keep playing.</p>
        </div>
        <p className="text-xs text-gray-500">
          <TrendingUp size={12} className="inline mr-1" />
          Keep playing to unlock new machines with bigger prizes!
        </p>
      </div>
    </div>
  );
}