import { motion } from "framer-motion";

const PIPS = { 1: [[50, 50]], 2: [[25, 25], [75, 75]], 3: [[25, 25], [50, 50], [75, 75]], 4: [[25, 25], [75, 25], [25, 75], [75, 75]], 5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]], 6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]] };

export default function YahtzeeDie({ value, held, rolling, onClick }) {
  return (
    <motion.button
      aria-label={`Die showing ${value}${held ? ", held" : ""}`}
      aria-pressed={held}
      onClick={onClick}
      animate={rolling ? { rotate: [0, -12, 12, 0], y: [0, -8, 0] } : { scale: held ? 1.08 : 1, y: held ? -4 : 0 }}
      transition={rolling ? { repeat: Infinity, duration: 0.24 } : { type: "spring", stiffness: 380, damping: 20 }}
      className={`relative h-16 w-16 rounded-2xl border-4 shadow-lg ${held ? "border-primary bg-primary/20 shadow-primary/50" : "border-amber-200/60 bg-gradient-to-br from-white to-gray-100"}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect x="2" y="2" width="96" height="96" rx="16" fill={held ? "hsl(43, 96%, 56%)" : "#fafaf8"} stroke={held ? "hsl(43, 96%, 40%)" : "#d4d4c8"} strokeWidth="3" />
        {(PIPS[value] || PIPS[1]).map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="11" fill={held ? "#1a1a1a" : "#222"} />)}
      </svg>
      {held && <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs shadow">🔒</span>}
    </motion.button>
  );
}