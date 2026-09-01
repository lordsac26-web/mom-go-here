import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Trophy, ChevronRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WidgetErrorState from "./WidgetErrorState";

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

function HallOfFameRow({ entry, index, isCurrentUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 20 }}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
        isCurrentUser
          ? "bg-primary/15 border border-primary/40"
          : index % 2 === 0
          ? "bg-secondary/50"
          : "bg-transparent"
      }`}
    >
      {/* Rank badge */}
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary text-lg font-black flex-shrink-0">
        {MEDAL[entry.rank] || <span className="text-muted-foreground text-sm">{entry.rank}</span>}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">
          {entry.display_name || "Anonymous"}
          {isCurrentUser && <span className="text-primary text-xs ml-1">(You)</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {entry.games_played} game{entry.games_played !== 1 ? "s" : ""} · Best: {entry.best_game}
        </p>
      </div>

      {/* Score */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 + 0.1, type: "spring", stiffness: 300 }}
        className="text-base font-black text-primary flex-shrink-0"
      >
        {(entry.total_score || 0).toLocaleString()}
      </motion.div>
    </motion.div>
  );
}

export default function HallOfFameWidget({ userEmail, refreshKey }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasRefreshedRef = useRef(false);

  async function fetchHallOfFame() {
    setError(false);
    try {
      const data = await base44.entities.HallOfFame.list("-total_score", 10);
      setEntries(data);

      // If no data yet and we haven't tried refreshing, trigger a refresh
      if (data.length === 0 && !hasRefreshedRef.current) {
        hasRefreshedRef.current = true;
        await refreshRankings();
        return;
      }
    } catch (e) {
      console.warn("HallOfFame fetch error:", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function refreshRankings() {
    setRefreshing(true);
    try {
      await base44.functions.invoke("syncLeaderboard", {});
      // Small delay to let entity writes settle
      await new Promise(r => setTimeout(r, 500));
      const data = await base44.entities.HallOfFame.list("-total_score", 10);
      setEntries(data);
    } catch (e) {
      console.warn("HallOfFame refresh error:", e);
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchHallOfFame();
  }, [refreshKey]);

  if (error) return <WidgetErrorState message="Couldn't load Hall of Fame" emoji="🏆" onRetry={fetchHallOfFame} />;

  if (loading) return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-4 shadow">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={20} className="text-primary" />
        <span className="text-base font-bold text-foreground">Hall of Fame</span>
      </div>
      <div className="flex justify-center py-6">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-primary" />
          <span className="text-base font-bold text-foreground">🏆 Hall of Fame</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshRankings}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            title="Refresh rankings"
          >
            <RefreshCw size={14} className={`text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <Link to="/rankings" className="text-primary text-sm font-bold flex items-center gap-0.5">
            All <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Leaderboard */}
      {entries.length === 0 ? (
        <div className="text-center py-8 px-4">
          <span className="text-4xl block mb-2">🎮</span>
          <p className="text-sm font-bold text-muted-foreground">No scores yet!</p>
          <p className="text-xs text-muted-foreground">Play games to earn your spot.</p>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          <AnimatePresence>
            {entries.map((entry, i) => (
              <HallOfFameRow
                key={entry.id || entry.user_email}
                entry={entry}
                index={i}
                isCurrentUser={entry.user_email === userEmail}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}