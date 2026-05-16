import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAchievementToastStore } from "@/stores/achievementToastStore";

/**
 * Renders a floating toast when an achievement is unlocked.
 * Uses getState() instead of hook selector to avoid duplicate-React dispatcher crash.
 */
export default function AchievementUnlockToast({ achievement }) {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const lastTsRef = useRef(null);
  const clearBadge = useAchievementToastStore.getState().clearBadge;

  useEffect(() => {
    if (!achievement || !achievement._ts) return;
    // Only show if this is a genuinely new toast (unique timestamp)
    if (lastTsRef.current === achievement._ts) return;
    lastTsRef.current = achievement._ts;
    setCurrent(achievement);
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      clearBadge();
    }, 4000);
    return () => clearTimeout(timer);
  }, [achievement, clearBadge]);

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-20 left-4 right-4 z-[80] flex justify-center pointer-events-none"
        >
          <div className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-2xl px-5 py-4 shadow-2xl border-2 border-yellow-300 max-w-sm w-full pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{current.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-yellow-900 uppercase tracking-wider">🏅 Achievement Unlocked!</p>
                <p className="text-lg font-black text-gray-900 truncate">{current.title}</p>
                <p className="text-xs text-yellow-900/80">{current.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}