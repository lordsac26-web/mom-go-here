import { motion } from "framer-motion";
import GameBackButton from "../GameBackButton";

const UPPER_BONUS_TARGET = 63;
const UPPER_BONUS_VALUE = 35;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getRating(score) {
  if (score >= 300) return { stars: 3, label: "Legendary!", emoji: "🏆", color: "from-yellow-500 to-amber-600" };
  if (score >= 225) return { stars: 2, label: "Great Game!", emoji: "🌟", color: "from-blue-500 to-indigo-600" };
  if (score >= 150) return { stars: 1, label: "Nice Job!", emoji: "👍", color: "from-emerald-500 to-teal-600" };
  return { stars: 0, label: "Keep Practicing!", emoji: "💪", color: "from-gray-600 to-gray-700" };
}

export default function YahtzeeGameOver({
  totalScore, upperSubtotal, lowerSubtotal, upperBonusEarned,
  yahtzeeBonus, winTime, onPlayAgain,
}) {
  const rating = getRating(totalScore);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-red-950 to-slate-950 flex flex-col items-center justify-center px-4 pb-24 text-center">
      {/* Trophy animation */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="text-8xl mb-2"
      >
        🎲
      </motion.div>

      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-5xl font-black text-white mb-1"
      >
        Game Complete!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-red-300 mb-3"
      >
        {rating.emoji} {rating.label}
      </motion.p>

      {/* Stars */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring" }}
        className="flex gap-2 text-5xl mb-5"
      >
        {[1, 2, 3].map(n => (
          <span key={n} className={n <= rating.stars ? "text-yellow-400" : "text-gray-700"}>★</span>
        ))}
      </motion.div>

      {/* Big score */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className={`bg-gradient-to-r ${rating.color} rounded-2xl px-8 py-4 mb-4 shadow-xl`}
      >
        <div className="text-6xl font-black text-white">{totalScore}</div>
        <div className="text-sm font-bold text-white/80 uppercase tracking-widest">Final Score</div>
      </motion.div>

      {/* Breakdown card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white/10 border border-white/20 rounded-2xl p-4 w-full max-w-xs mb-5 text-left space-y-2"
      >
        <div className="flex justify-between text-white">
          <span className="font-bold">Upper Section</span>
          <span className="font-black">{upperSubtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60 text-sm">Bonus {upperBonusEarned ? "✅" : `(need ${UPPER_BONUS_TARGET})`}</span>
          <span className={`font-black text-sm ${upperBonusEarned ? "text-green-400" : "text-white/40"}`}>
            {upperBonusEarned ? `+${UPPER_BONUS_VALUE}` : "0"}
          </span>
        </div>
        <div className="flex justify-between text-white">
          <span className="font-bold">Lower Section</span>
          <span className="font-black">{lowerSubtotal}</span>
        </div>
        {yahtzeeBonus > 0 && (
          <div className="flex justify-between">
            <span className="text-yellow-400 font-bold">🎲 Yahtzee Bonus</span>
            <span className="text-yellow-400 font-black">+{yahtzeeBonus}</span>
          </div>
        )}
        {winTime != null && (
          <div className="flex justify-between text-white/50 text-sm">
            <span>⏱ Time</span>
            <span>{formatTime(winTime)}</span>
          </div>
        )}
        <div className="border-t border-white/20 pt-2 flex justify-between">
          <span className="text-yellow-400 font-black text-lg">Total</span>
          <span className="text-yellow-400 font-black text-2xl">{totalScore}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-3 w-full max-w-xs"
      >
        <button
          onClick={onPlayAgain}
          className="w-full bg-gradient-to-r from-red-500 to-orange-600 text-white text-2xl font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform border-2 border-red-400"
        >
          🔄 Play Again
        </button>
        <GameBackButton />
      </motion.div>
    </div>
  );
}