import { motion } from "framer-motion";
import GameVictoryScreen from "../games/GameVictoryScreen";

const UPPER_BONUS_TARGET = 63;
const UPPER_BONUS_VALUE = 35;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getRating(score) {
  if (score >= 300) return { stars: 3, label: "Legendary!", emoji: "🏆", accent: "from-yellow-500 to-amber-600" };
  if (score >= 225) return { stars: 2, label: "Great Game!", emoji: "🌟", accent: "from-blue-500 to-indigo-600" };
  if (score >= 150) return { stars: 1, label: "Nice Job!", emoji: "👍", accent: "from-emerald-500 to-teal-600" };
  return { stars: 0, label: "Keep Practicing!", emoji: "💪", accent: "from-gray-600 to-gray-700" };
}

export default function YahtzeeGameOver({
  totalScore, upperSubtotal, lowerSubtotal, upperBonusEarned,
  yahtzeeBonus, winTime, onPlayAgain, coinsWon = 0,
}) {
  const rating = getRating(totalScore);

  const stats = [
    { label: "Upper", value: upperSubtotal },
    { label: "Lower", value: lowerSubtotal },
    { label: "Score", value: totalScore, highlight: true },
  ];

  return (
    <GameVictoryScreen
      emoji={rating.emoji}
      title="Game Complete!"
      accent={rating.accent}
      stars={rating.stars}
      coins={coinsWon}
      stats={stats}
      primaryLabel="🔄 Play Again"
      onPrimary={onPlayAgain}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white/[0.07] border border-white/15 rounded-2xl px-5 py-3 w-full mb-3 text-left space-y-1.5"
      >
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Upper Bonus {upperBonusEarned ? "✅" : `(need ${UPPER_BONUS_TARGET})`}</span>
          <span className={`font-black ${upperBonusEarned ? "text-green-400" : "text-white/40"}`}>
            {upperBonusEarned ? `+${UPPER_BONUS_VALUE}` : "0"}
          </span>
        </div>
        {yahtzeeBonus > 0 && (
          <div className="flex justify-between text-sm">
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
      </motion.div>
    </GameVictoryScreen>
  );
}