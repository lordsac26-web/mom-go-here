import { motion, AnimatePresence } from "framer-motion";
import RankRow from "./RankRow";
import { Link } from "react-router-dom";

export default function GameLeaderboard({ gameName, emoji, scores }) {
  if (!scores || scores.length === 0) return null;

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <h3 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        {gameName}
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {scores.map((s, i) => (
            <RankRow
              key={`${s.display_name}-${i}`}
              rank={s.rank}
              name={s.display_name}
              score={s.score}
              game={s.game_name}
              isCurrentUser={s.is_current_user}
              index={i}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}