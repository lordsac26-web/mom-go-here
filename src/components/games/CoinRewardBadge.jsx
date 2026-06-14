import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Animated coin reward badge for win screens.
 * Counts up the coin value and bursts a few floating coins for a rewarding feel.
 */
export default function CoinRewardBadge({ amount = 0, delay = 0.6 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (amount <= 0) return;
    let raf;
    const start = performance.now();
    const dur = 900;
    const startDelay = delay * 1000;
    function tick(now) {
      const t = Math.max(0, now - start - startDelay);
      const p = Math.min(t / dur, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * amount));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [amount, delay]);

  if (amount <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 16 }}
      className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 border-2 border-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.5)]"
    >
      {/* floating coin burst */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute text-xl pointer-events-none"
          style={{ left: `${20 + i * 28}%`, top: "10%" }}
          initial={{ y: 0, opacity: 0, scale: 0.5 }}
          animate={{ y: [-8, -34], opacity: [0, 1, 0], scale: [0.5, 1.1, 0.8] }}
          transition={{ delay: delay + 0.2 + i * 0.12, duration: 1, ease: "easeOut" }}
        >
          🪙
        </motion.span>
      ))}
      <span className="text-2xl">🪙</span>
      <span className="text-2xl font-black text-amber-950 tabular-nums">+{display}</span>
    </motion.div>
  );
}