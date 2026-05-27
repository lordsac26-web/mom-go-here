import { motion } from "framer-motion";
import BeeFlightTitle from "../BeeFlightTitle";
import GameBackButton from "../GameBackButton";

export default function BuzzWordModeSelect({ onSelectMode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-yellow-950 to-amber-950 flex flex-col items-center justify-center px-4 pb-24">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="text-8xl mb-2 select-none"
      >
        🐝
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-1"
      >
        <BeeFlightTitle text="Buzz Word!" size="text-5xl" className="font-black text-yellow-300" />
      </motion.div>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-lg text-yellow-400/80 text-center mb-8 max-w-xs"
      >
        Build words from the honeycomb · gold letter must appear in every word
      </motion.p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <motion.button
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 220 }}
          onClick={() => onSelectMode("timed")}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl shadow-xl border-2 border-orange-400 active:scale-95 transition-transform"
        >
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="text-left">
              <div className="text-2xl font-black">⏰ Timed</div>
              <div className="text-sm font-bold opacity-80">3 minutes · race the clock!</div>
            </div>
            <span className="text-4xl">▶</span>
          </div>
        </motion.button>

        <motion.button
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 220 }}
          onClick={() => onSelectMode("relaxed")}
          className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-2xl shadow-xl border-2 border-yellow-400 active:scale-95 transition-transform"
        >
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="text-left">
              <div className="text-2xl font-black">☕ Relaxed</div>
              <div className="text-sm font-bold opacity-80">No timer · take your time</div>
            </div>
            <span className="text-4xl">▶</span>
          </div>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <GameBackButton />
      </motion.div>
    </div>
  );
}