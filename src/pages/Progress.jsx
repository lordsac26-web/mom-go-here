import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import AchievementGrid from "../components/AchievementGrid";
import StreakDashboard from "../components/StreakDashboard";

const GOAL_MINUTES = 15;

function getLastNDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toDateString());
  }
  return dates;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return { day: d.toLocaleDateString("en-US", { weekday: "short" }), num: d.getDate() };
}

export default function Progress() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.DailyProgress.filter({ user_email: user.email }).then(data => {
      setRecords(data);
      setLoading(false);
    });
  }, [user]);

  const today = new Date().toDateString();
  const todayRecord = records.find(r => r.date === today);
  const todayMinutes = todayRecord?.minutes_played || 0;
  const progressPct = Math.min((todayMinutes / GOAL_MINUTES) * 100, 100);
  const goalHit = todayMinutes >= GOAL_MINUTES;

  // Build streak: consecutive days ending today with >= goal
  const last30 = getLastNDates(30);
  const recordMap = {};
  records.forEach(r => { recordMap[r.date] = r.minutes_played || 0; });

  let streak = 0;
  const todayIdx = last30.indexOf(today);
  for (let i = todayIdx; i >= 0; i--) {
    if ((recordMap[last30[i]] || 0) >= GOAL_MINUTES) streak++;
    else break;
  }

  const last14 = getLastNDates(14);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-28">
      <h1 className="text-4xl font-black text-primary text-center mb-1">📊 Daily Progress</h1>
      <p className="text-center text-muted-foreground text-xl mb-6">Keep your brain active every day!</p>

      {/* Today's Progress */}
      <div className="bg-card border-2 border-primary rounded-3xl p-6 mb-6 shadow-2xl max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-black text-foreground">Today's Goal</p>
            <p className="text-muted-foreground text-lg">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-primary">{Math.round(todayMinutes)}</p>
            <p className="text-muted-foreground text-lg">/ {GOAL_MINUTES} min</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-8 overflow-hidden border-2 border-border mb-4">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progressPct}%`,
              background: goalHit
                ? "linear-gradient(90deg, #22c55e, #16a34a)"
                : "linear-gradient(90deg, #f59e0b, #d97706)"
            }}
          />
        </div>

        {goalHit ? (
          <div className="bg-green-800 border-2 border-green-500 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-white">🎉 Amazing! Goal Reached!</p>
            <p className="text-green-300 text-xl mt-1">You played {Math.round(todayMinutes)} minutes today. Wonderful!</p>
          </div>
        ) : (
          <div className="bg-secondary rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {todayMinutes === 0
                ? "🎮 Start playing to begin your progress!"
                : `🔥 ${Math.round(GOAL_MINUTES - todayMinutes)} more minutes to reach your goal!`}
            </p>
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="bg-card border-2 border-border rounded-3xl p-6 mb-6 shadow-xl max-w-lg mx-auto text-center">
        <div className="text-6xl mb-2">{streak > 0 ? "🔥" : "💪"}</div>
        <p className="text-4xl font-black text-primary">{streak} Day{streak !== 1 ? "s" : ""}</p>
        <p className="text-2xl text-foreground font-bold">Current Streak</p>
        <p className="text-muted-foreground text-lg mt-1">Play {GOAL_MINUTES}+ min daily to keep it going!</p>
      </div>

      {/* Calendar - last 14 days */}
      <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-xl max-w-lg mx-auto">
        <h2 className="text-2xl font-black text-foreground text-center mb-4">📅 Last 14 Days</h2>
        <div className="grid grid-cols-7 gap-2">
          {last14.map(dateStr => {
            const mins = recordMap[dateStr] || 0;
            const hit = mins >= GOAL_MINUTES;
            const isToday = dateStr === today;
            const { day, num } = formatDate(dateStr);
            return (
              <div key={dateStr} className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${
                isToday ? "border-primary bg-primary/10" : "border-border"
              }`}>
                <span className="text-xs font-bold text-muted-foreground">{day}</span>
                <span className="text-lg font-black text-foreground">{num}</span>
                <span className="text-2xl">{hit ? "⭐" : mins > 0 ? "🟡" : "⬜"}</span>
                {mins > 0 && <span className="text-xs text-muted-foreground font-bold">{Math.round(mins)}m</span>}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 justify-center mt-4 text-lg">
          <span>⭐ Goal reached</span>
          <span>🟡 Partial</span>
          <span>⬜ No play</span>
        </div>
      </div>

      {/* Engagement Streaks */}
      <div className="mt-6 max-w-lg mx-auto">
        <StreakDashboard />
      </div>

      {/* Achievements */}
      <div className="bg-card border-2 border-border rounded-3xl p-6 mt-6 shadow-xl max-w-lg mx-auto">
        <AchievementGrid />
      </div>
    </div>
  );
}