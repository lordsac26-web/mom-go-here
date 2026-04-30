import { motion } from "framer-motion";

export default function SudokuResetDialog({ onConfirm, onCancel }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-card border-2 border-primary rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
        initial={{ scale: 0.7, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.7, y: 40 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">🔄</div>
        <h2 className="text-2xl font-black text-foreground mb-2">New Puzzle?</h2>
        <p className="text-muted-foreground text-lg mb-6">
          Your current progress will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-secondary text-foreground text-lg font-bold py-3 rounded-2xl"
          >
            Keep Playing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-primary text-primary-foreground text-lg font-black py-3 rounded-2xl"
          >
            🔄 New Puzzle
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}