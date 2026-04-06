/**
 * Weekly Zen Points visualization — bar chart of the last 7 days.
 */
export default function ZenWeeklyChart({ records }) {
  // Build last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const record = records.find(r => r.date === dateStr);
    days.push({
      date: dateStr,
      day: dayLabel,
      points: record?.points_earned || 0,
      completed: record?.completed || false,
      emoji: record?.game_emoji || "",
    });
  }

  const totalWeek = days.reduce((sum, d) => sum + d.points, 0);
  const completedDays = days.filter(d => d.completed).length;
  const maxPoints = 10;

  return (
    <div className="bg-card border-2 border-border rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-black text-foreground">🧘 Weekly Zen</h3>
          <p className="text-muted-foreground text-sm">{completedDays}/7 days completed</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-primary">{totalWeek}</p>
          <p className="text-muted-foreground text-sm">pts this week</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-2 h-32 mb-3">
        {days.map(d => {
          const height = d.points > 0 ? Math.max((d.points / maxPoints) * 100, 15) : 8;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              {d.completed && <span className="text-lg">{d.emoji}</span>}
              <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                <div
                  className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ${
                    d.completed
                      ? "bg-gradient-to-t from-primary to-yellow-400"
                      : "bg-secondary"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div className="flex justify-between gap-2">
        {days.map(d => (
          <div key={d.date} className="flex-1 text-center">
            <span className="text-xs font-bold text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}