/**
 * Confirmation dialog before resetting the checkers game.
 */
import { motion } from "framer-motion";

export default function ResetConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-6" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border-2 border-border rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-5xl mb-3 block">🔄</span>
        <h3 className="text-xl font-black text-foreground mb-2">Start Over?</h3>
        <p className="text-base text-muted-foreground mb-5">
          Your current game will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-secondary text-foreground text-lg font-bold py-3 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-destructive text-destructive-foreground text-lg font-bold py-3 rounded-xl"
          >
            Reset
          </button>
        </div>
      </motion.div>
    </div>
  );
}