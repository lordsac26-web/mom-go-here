import { motion } from "framer-motion";
import GameBackButton from "../GameBackButton";
import BeeFlightTitle from "../BeeFlightTitle";
import CoinRewardBadge from "../games/CoinRewardBadge";

function getRating(foundCount, totalCount) {
  const pct = totalCount > 0 ? foundCount / totalCount : 0;
  if (pct >= 1.0) return { stars: 3, label: "Perfect Buzz! 🐝", emoji: "🐝" };
  if (pct >= 0.75) return { stars: 3, label: "Amazing!", emoji: "🌟" };
  if (pct >= 0.50) return { stars: 2, label: "Great Effort!", emoji: "👏" };
  if (pct >= 0.25) return { stars: 1, label: "Nice Start!", emoji: "👍" };
  return { stars: 0, label: "Keep Trying!", emoji: "💪" };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BuzzWordGameOver({
  score, foundWords, allWords, isRelaxed, elapsedTime, coinsWon = 0, onNewGame,
}) {
  const allFound = foundWords.length === allWords.length;
  const rating = getRating(foundWords.length, allWords.length);
  const missedWords = allWords.filter(w => !foundWords.includes(w));
  const pct = allWords.length > 0 ? Math.round((foundWords.length / allWords.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-yellow-950 to-amber-950 flex flex-col items-center justify-center px-4 pb-24 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="text-8xl mb-3"
      >
        {allFound ? "🐝" : rating.emoji}
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-3"
      >
        {allFound
          ? <BeeFlightTitle text="Perfect Buzz!" size="text-4xl" className="font-black text-yellow-300" />
          : <h1 className="text-4xl font-black text-yellow-300">{rating.label}</h1>
        }
      </motion.div>

      {/* Stars */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.35, type: "spring" }}
        className="flex gap-2 text-4xl mb-4"
      >
        {[1, 2, 3].map(n => (
          <span key={n} className={n <= rating.stars ? "text-yellow-400" : "text-gray-700"}>★</span>
        ))}
      </motion.div>

      {coinsWon > 0 && (
        <div className="mb-4">
          <CoinRewardBadge amount={coinsWon} />
        </div>
      )}

      {/* Stats card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="bg-black/30 border border-yellow-500/30 rounded-2xl px-8 py-5 mb-4 w-full max-w-xs"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-black text-yellow-300">{score}</div>
            <div className="text-xs text-yellow-400/60 uppercase tracking-wide">Score</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{pct}%</div>
            <div className="text-xs text-yellow-400/60 uppercase tracking-wide">Found</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{foundWords.length}/{allWords.length}</div>
            <div className="text-xs text-yellow-400/60 uppercase tracking-wide">Words</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{elapsedTime != null ? formatTime(elapsedTime) : "—"}</div>
            <div className="text-xs text-yellow-400/60 uppercase tracking-wide">{isRelaxed ? "☕ Relaxed" : "⏰ Timed"}</div>
          </div>
        </div>
      </motion.div>

      {/* Missed words */}
      {missedWords.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="bg-black/20 border border-white/10 rounded-2xl p-4 mb-4 max-w-sm w-full max-h-44 overflow-y-auto"
        >
          <p className="text-sm font-bold text-yellow-400/70 mb-2">Words you missed:</p>
          <div className="flex flex-wrap gap-2">
            {missedWords.map(w => (
              <span key={w} className="px-2.5 py-1 bg-red-900/40 border border-red-700/50 rounded-lg text-sm text-red-300 font-bold">
                {w.toUpperCase()}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="space-y-3 w-full max-w-xs"
      >
        <button
          onClick={onNewGame}
          className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black text-2xl font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform border-2 border-yellow-400"
        >
          🔄 New Puzzle
        </button>
        <GameBackButton />
      </motion.div>
    </div>
  );
}