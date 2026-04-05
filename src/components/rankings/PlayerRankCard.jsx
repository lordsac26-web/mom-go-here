import { motion } from "framer-motion";

export default function PlayerRankCard({ rank, totalPlayers, bestScore, bestGame }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180 }}
      className="bg-gradient-to-br from-primary/20 via-card to-primary/10 border-2 border-primary rounded-3xl p-5 shadow-xl"
    >
      <p className="text-sm font-bold text-muted-foreground mb-1">Your Rank</p>
      <div className="flex items-end gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          className="text-5xl font-black text-primary"
        >
          #{rank || "—"}
        </motion.span>
        <span className="text-lg text-muted-foreground mb-1">
          of {totalPlayers} player{totalPlayers !== 1 ? "s" : ""}
        </span>
      </div>
      {bestScore > 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          🎯 Best: <span className="font-bold text-foreground">{bestScore.toLocaleString()}</span> in {bestGame}
        </p>
      )}
    </motion.div>
  );
}