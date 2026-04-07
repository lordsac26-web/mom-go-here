import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo, LEVEL_TABLE } from "../hooks/usePlayerXP";
import { motion } from "framer-motion";

export default function LevelProgressBar({ userEmail }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.PlayerXP.filter({ user_email: userEmail })
      .then(rows => {
        const record = rows[0];
        const totalXP = record?.total_xp || 0;
        setInfo(getLevelInfo(totalXP));
      })
      .catch(() => {
        setInfo(getLevelInfo(0));
      })
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (loading || !info) return null;

  const pct = Math.round(info.progress * 100);

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-4 shadow">
      {/* Top row: emoji + level title + XP count */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info.emoji}</span>
          <div>
            <p className="text-sm font-black text-foreground leading-tight">
              Level {info.level} — {info.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {info.totalXP.toLocaleString()} XP total
            </p>
          </div>
        </div>
        {info.next && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Next level</p>
            <p className="text-sm font-bold text-primary">
              {info.next.emoji} {info.next.title}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-4 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-yellow-400 to-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>

      {/* XP label under bar */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground font-bold">
          {info.xpIntoLevel.toLocaleString()} / {info.xpForNextLevel > 0 ? info.xpForNextLevel.toLocaleString() : "MAX"} XP
        </span>
        <span className="text-xs text-muted-foreground font-bold">{pct}%</span>
      </div>

      {/* Max level badge */}
      {!info.next && (
        <p className="text-center text-xs font-black text-primary mt-1">
          🎊 MAX LEVEL REACHED! 🎊
        </p>
      )}
    </div>
  );
}