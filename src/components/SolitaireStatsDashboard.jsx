import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Trophy, Target, Clock, Flame } from "lucide-react";

function formatTime(seconds) {
  if (!seconds || seconds === Infinity) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StatBox({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-secondary rounded-xl p-2.5 sm:p-3 flex flex-col items-center gap-0.5 sm:gap-1">
      <Icon size={18} className={color} />
      <span className="text-base sm:text-xl font-black text-foreground">{value}</span>
      <span className="text-[10px] sm:text-xs font-bold text-muted-foreground text-center leading-tight">{label}</span>
      {sub && <span className="text-[9px] sm:text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

export default function SolitaireStatsDashboard({ userEmail }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.SolitaireStats.filter({ user_email: userEmail }).then(rows => {
      setStats(rows[0] || null);
      setLoading(false);
    });
  }, [userEmail]);

  if (loading) return null;
  if (!stats) return null;

  const played = stats.games_played || 0;
  const won = stats.games_won || 0;
  const pct = played > 0 ? Math.round((won / played) * 100) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">♠️</span>
          <span className="text-lg font-bold text-foreground">Solitaire Stats</span>
        </div>
        <Link to="/games/solitaire" className="text-primary text-sm font-bold">
          Play →
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2 p-3">
        <StatBox icon={Target} label="Played" value={played} color="text-blue-400" />
        <StatBox icon={Trophy} label="Won" value={won} sub={`${pct}%`} color="text-yellow-400" />
        <StatBox icon={Clock} label="Best Time" value={formatTime(stats.best_time_seconds)} color="text-green-400" />
        <StatBox icon={Flame} label="Streak" value={stats.current_streak || 0} sub={`Best: ${stats.best_streak || 0}`} color="text-orange-400" />
      </div>
    </div>
  );
}