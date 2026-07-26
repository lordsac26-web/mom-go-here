import { AnimatePresence, motion } from "framer-motion";

export default function YahtzeeScoreFeedback({ feedback }) {
  return (
    <AnimatePresence mode="wait">
      {feedback && (
        <motion.div
          key={`${feedback.label}-${feedback.score}`}
          initial={{ opacity: 0, y: -18, scale: 0.86 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.9 }}
          className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary/15 px-4 py-3 text-center shadow-lg shadow-primary/10"
        >
          <span className="text-2xl">{feedback.score >= 25 ? "✨" : "🎯"}</span>
          <p className="text-lg font-black text-primary">{feedback.label} <span className="text-foreground">+{feedback.score}</span></p>
          {feedback.bonus > 0 && <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-sm font-black text-yellow-300">+{feedback.bonus} bonus</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}