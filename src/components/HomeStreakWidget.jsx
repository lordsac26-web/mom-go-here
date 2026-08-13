import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Flame, ChevronRight, ChevronDown } from "lucide-react";
import WidgetErrorState from "./WidgetErrorState";
import useConfetti from "../hooks/useConfetti";

export default function HomeStreakWidget({ userEmail, refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { fireworks } = useConfetti();

  function fetchData() {
    if (!userEmail) return;
    setError(false);
    base44.entities.EngagementStreak.filter({ user_email: userEmail }).then(rows => {
      setData(rows[0] || null);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { fetchData(); }, [userEmail, refreshKey]);

  useEffect(() => {
    if (!data || !userEmail) return;
    const milestones = [3, 7, 30];
    const streaks = [data.daily_current_streak || 0, data.memories_current_streak || 0];
    const milestone = milestones.find(value => streaks.includes(value));
    if (!milestone) return;
    const key = `streak-celebration:${userEmail}:${milestone}:${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "shown");
    fireworks();
  }, [data, userEmail, fireworks]);

  if (error) return <WidgetErrorState message="Couldn't load streaks" emoji="🔥" onRetry={fetchData} />;
  if (loading || !data) return null;

  const dailyStreak = data.daily_current_streak || 0;
  const memStreak = data.memories_current_streak || 0;
  const badgeCount = (data.badges || []).length;

  if (dailyStreak === 0 && memStreak === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-orange-400" />
          <span className="text-base font-bold text-foreground">Streaks</span>
          <span className="text-sm text-muted-foreground">⭐{dailyStreak} · 📔{memStreak} · 🏅{badgeCount}</span>
        </div>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <>
          <div className="border-t border-border flex divide-x divide-border">
            <div className="flex-1 text-center py-3">
              <span className="text-2xl">⭐</span>
              <p className="text-xl font-black text-foreground">{dailyStreak}</p>
              <p className="text-xs text-muted-foreground font-bold">Daily</p>
            </div>
            <div className="flex-1 text-center py-3">
              <span className="text-2xl">📔</span>
              <p className="text-xl font-black text-foreground">{memStreak}</p>
              <p className="text-xs text-muted-foreground font-bold">Memories</p>
            </div>
            <div className="flex-1 text-center py-3">
              <span className="text-2xl">🏅</span>
              <p className="text-xl font-black text-foreground">{badgeCount}</p>
              <p className="text-xs text-muted-foreground font-bold">Badges</p>
            </div>
          </div>
          <div className="border-t border-border px-4 py-2 text-right">
            <Link to="/progress" className="text-primary text-sm font-bold inline-flex items-center gap-1">
              Details <ChevronRight size={14} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}