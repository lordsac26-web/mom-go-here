import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAchievementToastStore } from "@/stores/achievementToastStore";
import useHaptics from "@/hooks/useHaptics";

/**
 * Full-screen celebration overlay for MAJOR achievement unlocks.
 * Uses getState() + subscribe instead of hook selectors to avoid the
 * null-dispatcher crash from the SDK's bundled React chunk.
 */
export default function MajorAchievementModal() {
  const [majorBadge, setMajorBadge] = useState(
    () => useAchievementToastStore.getState().majorBadge
  );

  useEffect(() => {
    const unsub = useAchievementToastStore.subscribe(
      (s) => s.majorBadge,
      (val) => setMajorBadge(val)
    );
    return unsub;
  }, []);

  const clearMajor = () => useAchievementToastStore.getState().clearMajorBadge();
  const haptics = useHaptics();

  // Fire haptic pattern when a new major badge appears
  useEffect(() => {
    if (!majorBadge) return;
    // Triple-pulse celebration pattern
    if (haptics?.vibrate) {
      haptics.vibrate([60, 80, 60, 80, 120]);
    } else if (navigator.vibrate) {
      navigator.vibrate([60, 80, 60, 80, 120]);
    }
  }, [majorBadge, haptics]);

  // Pre-compute sparkle particle positions so they remain stable per render
  const sparkles = useMemo(() => {
    if (!majorBadge) return [];
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      angle: (i / 24) * Math.PI * 2 + Math.random() * 0.4,
      distance: 120 + Math.random() * 140,
      size: 8 + Math.random() * 14,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.2,
      color: ["#fbbf24", "#fcd34d", "#fde68a", "#f59e0b", "#fff"][i % 5],
    }));
  }, [majorBadge?._ts]);

  return (
    <AnimatePresence>
      {majorBadge && (
        <motion.div
          key={majorBadge._ts}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
          onClick={clearMajor}
        >
          {/* Radial sparkle burst */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {sparkles.map((sp) => {
              const tx = Math.cos(sp.angle) * sp.distance;
              const ty = Math.sin(sp.angle) * sp.distance;
              return (
                <motion.div
                  key={sp.id}
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: [0, tx * 0.6, tx],
                    y: [0, ty * 0.6, ty],
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.4],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: sp.duration,
                    delay: sp.delay,
                    ease: "easeOut",
                    repeat: Infinity,
                    repeatDelay: 0.3,
                  }}
                  className="absolute"
                  style={{
                    width: sp.size,
                    height: sp.size,
                    background: sp.color,
                    borderRadius: "50%",
                    boxShadow: `0 0 ${sp.size}px ${sp.color}`,
                  }}
                />
              );
            })}
          </div>

          {/* Pulsing aura */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[340px] h-[340px] rounded-full bg-gradient-radial from-yellow-400/40 via-amber-500/20 to-transparent pointer-events-none"
          />

          {/* Main badge card */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 max-w-sm w-full bg-gradient-to-br from-yellow-500 via-amber-500 to-yellow-600 rounded-3xl shadow-[0_0_60px_rgba(251,191,36,0.6)] border-4 border-yellow-300 p-6 text-center"
          >
            <p className="text-xs font-black text-yellow-900 uppercase tracking-[0.2em] mb-3">
              ⭐ Major Unlock ⭐
            </p>

            {/* Animated emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.4, 1], rotate: [0, 360] }}
              transition={{ duration: 0.9, delay: 0.3, ease: "backOut" }}
              className="text-7xl mb-3 drop-shadow-lg"
            >
              {majorBadge.emoji}
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-black text-gray-900 mb-2 leading-tight"
            >
              {majorBadge.title}
            </motion.h2>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="text-base font-semibold text-yellow-950/80 mb-5"
            >
              {majorBadge.description}
            </motion.p>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={clearMajor}
              className="w-full bg-gray-900 hover:bg-gray-800 text-yellow-300 text-lg font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              Awesome! 🎉
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}