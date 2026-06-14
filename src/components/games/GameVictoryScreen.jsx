import { motion } from "framer-motion";
import GameBackButton from "../GameBackButton";
import StarRating from "./StarRating";
import CoinRewardBadge from "./CoinRewardBadge";

/**
 * Unified, sleek & modern victory/result screen shared across classic games.
 *
 * Props:
 * - emoji: big hero emoji (default 🎉)
 * - title: headline text
 * - accent: tailwind gradient classes for the bg glow, e.g. "from-blue-500 to-indigo-600"
 * - stars: 0–3 (omit/0 to hide rating)
 * - coins: coin reward amount (omit/0 to hide badge)
 * - stats: array of { label, value, highlight?: boolean }
 * - newBest: show a "New Personal Best" badge
 * - perfectLabel: optional string shown when flawless (e.g. "Perfect — No Errors!")
 * - primaryLabel / onPrimary: main action button
 * - secondaryLabel / onSecondary: optional secondary action
 * - children: optional extra content (e.g. rare drop banner)
 */
export default function GameVictoryScreen({
  emoji = "🎉",
  title,
  accent = "from-blue-500 to-indigo-600",
  stars = 0,
  coins = 0,
  stats = [],
  newBest = false,
  perfectLabel = null,
  primaryLabel = "🔄 Play Again",
  onPrimary,
  secondaryLabel,
  onSecondary,
  children,
}) {
  const cols = stats.length >= 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+5rem)] text-center select-none overflow-hidden bg-slate-950">
      {/* Ambient glow */}
      <div className={`absolute -top-1/4 left-1/2 -translate-x-1/2 w-[140%] h-[60%] bg-gradient-to-br ${accent} opacity-20 blur-3xl rounded-full pointer-events-none`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(2,6,23,0.9))] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 13 }}
          className="text-8xl mb-2 drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]"
        >
          {emoji}
        </motion.div>

        <motion.h1
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={`text-4xl font-black mb-3 bg-gradient-to-r ${accent} bg-clip-text text-transparent`}
        >
          {title}
        </motion.h1>

        {stars > 0 && (
          <div className="mb-3">
            <StarRating stars={stars} />
          </div>
        )}

        {coins > 0 && (
          <div className="mb-4">
            <CoinRewardBadge amount={coins} />
          </div>
        )}

        {newBest && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-3 text-yellow-400 font-black text-sm animate-pulse"
          >
            🏆 New Personal Best!
          </motion.div>
        )}

        {stats.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="w-full bg-white/[0.07] backdrop-blur-md border border-white/15 rounded-2xl px-6 py-5 mb-3 shadow-xl"
          >
            <div className={`grid ${cols} gap-4`}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div className={`text-2xl font-black tabular-nums ${s.highlight ? "text-green-400" : "text-white"}`}>
                    {s.value}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {perfectLabel && (
              <div className="mt-3 text-green-400 font-black text-sm">✨ {perfectLabel}</div>
            )}
          </motion.div>
        )}

        {children}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="space-y-3 w-full mt-2"
        >
          <button
            onClick={onPrimary}
            className={`w-full bg-gradient-to-r ${accent} text-white text-xl font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform border border-white/20`}
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="w-full bg-white/10 border border-white/15 text-white text-lg font-bold py-3 rounded-xl active:scale-95 transition-transform"
            >
              {secondaryLabel}
            </button>
          )}
          <GameBackButton />
        </motion.div>
      </div>
    </div>
  );
}