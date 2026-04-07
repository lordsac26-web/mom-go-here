import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ACHIEVEMENTS from "./achievementDefinitions";

export default function AchievementsWidget({ userEmail }) {
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Achievement.filter({ user_email: userEmail })
      .then(setEarned)
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (loading) return null;

  const earnedCount = earned.length;
  const totalCount = ACHIEVEMENTS.length;
  const pct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  // Show up to 4 most recent badges
  const recent = [...earned]
    .sort((a, b) => (b.earned_date || "").localeCompare(a.earned_date || ""))
    .slice(0, 4);

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏅</span>
          <span className="text-base font-bold text-foreground">Achievements</span>
          <span className="text-sm text-muted-foreground">{earnedCount}/{totalCount}</span>
        </div>
        <Link to="/achievements" className="text-primary text-sm font-bold flex items-center gap-0.5">
          View All <ChevronRight size={14} />
        </Link>
      </div>

      {/* Mini progress bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-yellow-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Recent badges */}
      {recent.length > 0 && (
        <div className="flex items-center gap-2 px-4 pb-3">
          {recent.map(a => (
            <div
              key={a.achievement_key}
              className="bg-secondary rounded-xl px-2.5 py-1.5 flex items-center gap-1.5"
              title={a.title}
            >
              <span className="text-lg">{a.emoji}</span>
              <span className="text-xs font-bold text-foreground truncate max-w-[80px]">{a.title}</span>
            </div>
          ))}
        </div>
      )}

      {earnedCount === 0 && (
        <p className="text-center text-xs text-muted-foreground pb-3">Play games to unlock badges!</p>
      )}
    </div>
  );
}