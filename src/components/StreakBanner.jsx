import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import { BADGE_DEFINITIONS } from "../hooks/useStreakTracker";

export default function StreakBanner({ streakData, pageType, newBadges }) {
  const [dismissed, setDismissed] = useState(false);

  if (!streakData) return null;

  const streak = pageType === "daily"
    ? streakData.daily_current_streak
    : streakData.memories_current_streak;
  const bestStreak = pageType === "daily"
    ? streakData.daily_best_streak
    : streakData.memories_best_streak;

  const label = pageType === "daily" ? "Daily Reading" : "Memories Journal";

  return (
    <div className="space-y-3 mb-4">
      {/* Streak counter */}
      <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{streak > 0 ? "🔥" : "💫"}</span>
          <div>
            <p className="text-lg font-black text-foreground">
              {streak} Day{streak !== 1 ? "s" : ""} Streak
            </p>
            <p className="text-sm text-muted-foreground">
              {label} · Best: {bestStreak || 0}
            </p>
          </div>
        </div>
        {streak >= 3 && (
          <Flame size={24} className="text-orange-400 animate-pulse" />
        )}
      </div>

      {/* New badge celebration */}
      <AnimatePresence>
        {newBadges.length > 0 && !dismissed && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-r from-yellow-600 to-amber-700 border-2 border-yellow-400 rounded-2xl p-4 shadow-xl relative"
          >
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 text-yellow-200"
            >
              <X size={18} />
            </button>
            <p className="text-xl font-black text-white text-center mb-2">🎉 New Badge Earned!</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {newBadges.map(b => (
                <div key={b.key} className="bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <p className="text-sm font-black text-white">{b.label}</p>
                    <p className="text-xs text-yellow-100">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}