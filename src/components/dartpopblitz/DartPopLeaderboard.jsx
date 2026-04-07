import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DART_PRESETS } from "./gameConfig";

const MODE_TABS = DART_PRESETS.map(p => ({ darts: p.darts, label: p.label }));

export default function DartPopLeaderboard() {
  const [tab, setTab] = useState(MODE_TABS[0].darts);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Fetch + subscribe
  useEffect(() => {
    let mounted = true;

    async function fetchScores() {
      setLoading(true);
      const all = await base44.entities.DartPopBlitzScore.filter(
        { dart_limit: tab },
        "-score",
        50
      );

      // Deduplicate: keep only best score per user
      const bestByUser = {};
      for (const s of all) {
        const email = s.user_email;
        if (!bestByUser[email] || s.score > bestByUser[email].score) {
          bestByUser[email] = s;
        }
      }

      const top10 = Object.values(bestByUser)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      if (mounted) {
        setScores(top10);
        setLoading(false);
      }
    }

    fetchScores();

    const unsub = base44.entities.DartPopBlitzScore.subscribe((event) => {
      if (event.data?.dart_limit === tab || event.type === "delete") {
        fetchScores();
      }
    });

    return () => { mounted = false; unsub(); };
  }, [tab]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="w-full bg-card/80 border-2 border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-lg font-black text-primary text-center">🏆 Global Leaderboard</h3>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 px-3 pb-3">
        {MODE_TABS.map(m => (
          <button
            key={m.darts}
            onClick={() => setTab(m.darts)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === m.darts
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Scores list */}
      <div className="px-3 pb-4 space-y-1.5 min-h-[120px]">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : scores.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-6 font-semibold">
            No scores yet — be the first! 🎯
          </p>
        ) : (
          scores.map((s, i) => {
            const isMe = currentUser && s.user_email === currentUser.email;
            const displayName = s.user_email?.split("@")[0] || "Player";
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  isMe
                    ? "bg-primary/15 border border-primary/40"
                    : "bg-secondary/30"
                }`}
              >
                <span className="w-7 text-center text-base">
                  {i < 3 ? medals[i] : <span className="text-muted-foreground text-xs">#{i + 1}</span>}
                </span>
                <span className={`flex-1 truncate ${isMe ? "text-primary" : "text-foreground"}`}>
                  {displayName} {isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                </span>
                <span className="text-primary font-black">
                  {s.score?.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">
                  🎈{s.balloons_popped}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}