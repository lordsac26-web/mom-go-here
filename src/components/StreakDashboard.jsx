import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { BADGE_DEFINITIONS } from "../hooks/useStreakTracker";
import { Flame, BookOpen, Star } from "lucide-react";

function StatCard({ emoji, label, current, best, color }) {
  return (
    <div className="bg-secondary rounded-2xl p-4 text-center">
      <span className="text-3xl">{emoji}</span>
      <p className="text-2xl font-black text-foreground mt-1">{current}</p>
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">Best: {best}</p>
    </div>
  );
}

export default function StreakDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.EngagementStreak.filter({ user_email: user.email }).then(rows => {
      setData(rows[0] || null);
      setLoading(false);
    });
  }, [user]);

  if (loading) return (
    <div className="bg-card border-2 border-border rounded-3xl p-6 animate-pulse text-center text-muted-foreground">
      Loading engagement streaks...
    </div>
  );

  if (!data) return (
    <div className="bg-card border-2 border-border rounded-3xl p-6 text-center">
      <p className="text-xl text-foreground font-bold mb-2">🔥 Engagement Streaks</p>
      <p className="text-muted-foreground text-lg">Visit the Daily and Memories pages to start building streaks!</p>
    </div>
  );

  const earnedSet = new Set(data.badges || []);
  const earnedBadges = BADGE_DEFINITIONS.filter(b => earnedSet.has(b.key));
  const lockedBadges = BADGE_DEFINITIONS.filter(b => !earnedSet.has(b.key));

  return (
    <div className="space-y-4">
      {/* Streak Stats */}
      <div className="bg-card border-2 border-border rounded-3xl p-5 shadow-xl">
        <h2 className="text-2xl font-black text-foreground text-center mb-4">🔥 Engagement Streaks</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            emoji="⭐"
            label="Daily Reading"
            current={`${data.daily_current_streak || 0} days`}
            best={`${data.daily_best_streak || 0} days`}
          />
          <StatCard
            emoji="📔"
            label="Memories Journal"
            current={`${data.memories_current_streak || 0} days`}
            best={`${data.memories_best_streak || 0} days`}
          />
        </div>
        <p className="text-center text-muted-foreground text-sm mt-3">
          Visit Daily & Memories every day to grow your streaks!
        </p>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="bg-card border-2 border-border rounded-3xl p-5 shadow-xl">
          <h2 className="text-2xl font-black text-foreground text-center mb-3">🏅 Earned Badges</h2>
          <div className="grid grid-cols-2 gap-2">
            {earnedBadges.map(b => (
              <div key={b.key} className="bg-gradient-to-br from-yellow-600/20 to-amber-600/10 border border-yellow-500/40 rounded-xl p-3 text-center">
                <span className="text-3xl">{b.emoji}</span>
                <p className="text-sm font-black text-foreground mt-1">{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div className="bg-card border-2 border-border rounded-3xl p-5 shadow-xl">
          <h2 className="text-2xl font-black text-foreground text-center mb-3">🔒 Badges to Earn</h2>
          <div className="grid grid-cols-2 gap-2">
            {lockedBadges.map(b => (
              <div key={b.key} className="bg-secondary/50 border border-border rounded-xl p-3 text-center opacity-60">
                <span className="text-3xl grayscale">🔒</span>
                <p className="text-sm font-bold text-muted-foreground mt-1">{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}