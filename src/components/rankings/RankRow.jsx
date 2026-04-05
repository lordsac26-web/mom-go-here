import { motion } from "framer-motion";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function RankRow({ rank, name, score, game, isCurrentUser, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 200, damping: 20 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-colors ${
        isCurrentUser
          ? "border-primary bg-primary/15 shadow-lg shadow-primary/20"
          : "border-border bg-card"
      }`}
    >
      {/* Rank */}
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-xl font-black flex-shrink-0">
        {MEDAL[rank] || <span className="text-muted-foreground text-base">{rank}</span>}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-foreground truncate">
          {name} {isCurrentUser && <span className="text-primary text-sm">(You)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">{game}</p>
      </div>

      {/* Score */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.06 + 0.15, type: "spring", stiffness: 260 }}
        className="text-lg font-black text-primary flex-shrink-0"
      >
        {score.toLocaleString()}
      </motion.div>
    </motion.div>
  );
}