import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { MACHINES } from "./machineDefinitions";

/**
 * Low-balance warning banner that appears when funds are running thin.
 * Suggests cheaper machines the player has unlocked.
 */
export default function LowBalanceWarning({ visible, balance, currentMachineId, onSwitchMachine }) {
  if (!visible) return null;

  // Find cheaper unlocked machines (sorted by min bet ascending)
  const cheaper = MACHINES.filter(m =>
    m.id !== currentMachineId &&
    !m.unlockRequirement && // always-unlocked
    (m.betLevels?.[0] || 100) < (MACHINES.find(x => x.id === currentMachineId)?.betLevels?.[0] || 100)
  );

  // Also suggest the classic machine if current is not classic
  const suggestions = currentMachineId !== "classic"
    ? [MACHINES.find(m => m.id === "classic")]
    : [];

  // Deduplicate
  const allSuggestions = [...new Map([...cheaper, ...suggestions].filter(Boolean).map(m => [m.id, m])).values()];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="mx-3 mt-2 bg-gradient-to-r from-red-900/80 to-orange-900/80 border border-red-500/50 rounded-2xl px-4 py-3 shadow-lg"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={20} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-red-300">
                ⚠️ Low Balance Warning!
              </p>
              <p className="text-xs text-red-200/80 mt-0.5">
                Your balance ({balance.toLocaleString()}) is getting low. Consider smaller bets to extend your play time.
              </p>
              {allSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {allSuggestions.map(m => (
                    <button
                      key={m.id}
                      onClick={() => onSwitchMachine(m.id)}
                      className="flex items-center gap-1 bg-gray-800/80 text-yellow-300 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-yellow-600/40 active:scale-95 transition-transform"
                    >
                      <span>{m.emoji}</span>
                      <span>{m.name}</span>
                      <span className="text-gray-400 ml-1">
                        ({m.betLevels?.[0]?.toLocaleString()}+)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}