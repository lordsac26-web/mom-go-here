import { motion, AnimatePresence } from "framer-motion";

export default function WinDisplay({ wins, totalWin, visible }) {
  if (!visible || totalWin === 0) return null;

  const isBigWin = totalWin >= 5000;
  const isMegaWin = totalWin >= 25000;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
        >
          <div className={`text-center px-8 py-6 rounded-3xl shadow-2xl border-4 ${
            isMegaWin
              ? "bg-gradient-to-br from-yellow-500 via-red-500 to-purple-600 border-yellow-300"
              : isBigWin
              ? "bg-gradient-to-br from-yellow-500 to-amber-600 border-yellow-300"
              : "bg-gradient-to-br from-green-600 to-emerald-700 border-green-400"
          }`}>
            {isMegaWin && (
              <motion.div
                animate={{ rotate: [0, 5, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-4xl font-black text-white mb-1"
              >
                🎆 MEGA WIN! 🎆
              </motion.div>
            )}
            {isBigWin && !isMegaWin && (
              <div className="text-3xl font-black text-white mb-1">🌟 BIG WIN! 🌟</div>
            )}
            {!isBigWin && (
              <div className="text-2xl font-black text-white mb-1">✨ WIN! ✨</div>
            )}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg"
            >
              +{totalWin.toLocaleString()}
            </motion.div>
            {wins.length > 1 && (
              <div className="text-sm text-white/80 mt-2 font-bold">
                {wins.length} winning lines!
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}