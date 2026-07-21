import { motion } from "framer-motion";
import GameBackButton from "../GameBackButton";

const LEVELS = [
  { id: "easy", emoji: "🌱", name: "Easy", desc: "Relaxed — the computer makes casual moves", accent: "from-green-500 to-emerald-700" },
  { id: "medium", emoji: "🎯", name: "Medium", desc: "Balanced — thinks a couple of moves ahead", accent: "from-blue-500 to-indigo-700" },
  { id: "hard", emoji: "🔥", name: "Hard", desc: "Challenging — plans several moves ahead", accent: "from-red-500 to-rose-700" },
];

/**
 * Difficulty picker shown before a game starts.
 * title/emoji customize the header; onSelect(levelId) starts the game.
 */
export default function DifficultySelect({ title = "Chess", emoji = "♟️", onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-amber-950 to-slate-950 px-4 py-4 pb-24 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <GameBackButton />
        <div className="text-xl font-black text-white">{emoji} {title}</div>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="text-7xl mb-3"
        >
          {emoji}
        </motion.div>
        <h1 className="text-3xl font-black text-white mb-1 text-center">{title}</h1>
        <p className="text-muted-foreground text-lg mb-8 text-center">Choose your difficulty</p>

        <div className="w-full space-y-4">
          {LEVELS.map((lvl, i) => (
            <motion.button
              key={lvl.id}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => onSelect(lvl.id)}
              className={`w-full bg-gradient-to-r ${lvl.accent} rounded-2xl p-5 shadow-xl flex items-center gap-4 text-left active:scale-95 transition-transform border border-white/20`}
            >
              <span className="text-4xl">{lvl.emoji}</span>
              <div>
                <div className="text-xl font-black text-white">{lvl.name}</div>
                <div className="text-white/80 text-sm font-semibold mt-0.5">{lvl.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}