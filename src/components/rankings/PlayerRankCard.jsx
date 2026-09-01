import { motion } from "framer-motion";

const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function PlayerRankCard({ rank, totalPlayers, totalScore, gamesPlayed, bestScore, bestGame }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 180 }} className="rounded-3xl border-2 border-primary bg-gradient-to-br from-primary/20 via-card to-primary/10 p-5 shadow-xl">
      <p className="mb-1 text-sm font-bold text-muted-foreground">Your Rank</p>
      <div className="flex items-end gap-3">
        {MEDALS[rank] && <span className="text-4xl" aria-label={`Rank ${rank}`}>{MEDALS[rank]}</span>}
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.2 }} className="text-5xl font-black text-primary">#{rank || "—"}</motion.span>
        <span className="mb-1 text-lg text-muted-foreground">of {totalPlayers} player{totalPlayers !== 1 ? "s" : ""}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs font-bold text-muted-foreground">Total Score</p><p className="text-xl font-black text-foreground">{totalScore.toLocaleString()}</p></div>
        <div className="rounded-xl bg-secondary/60 p-3"><p className="text-xs font-bold text-muted-foreground">Games Played</p><p className="text-xl font-black text-foreground">{gamesPlayed}</p></div>
      </div>
      {bestScore > 0 && <p className="mt-3 text-base text-muted-foreground">🎯 Best: <span className="font-black text-foreground">{bestScore.toLocaleString()}</span> in {bestGame}</p>}
    </motion.div>
  );
}