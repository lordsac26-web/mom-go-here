export default function UserGameBreakdown({ breakdown = {} }) {
  const games = Object.entries(breakdown);
  if (!games.length) return null;

  return (
    <section className="rounded-2xl border-2 border-border bg-card p-4">
      <h2 className="mb-3 text-xl font-black text-foreground">Your Game Breakdown</h2>
      <div className="divide-y divide-border">
        {games.map(([name, stats]) => {
          const details = typeof stats === "number"
            ? { highScore: stats, gamesPlayed: 1, avgScore: stats }
            : stats;
          return (
            <div key={name} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-black text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{details.gamesPlayed || 0} played · {Number(details.avgScore || 0).toLocaleString()} average</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-muted-foreground">Best</p>
                <p className="text-lg font-black text-primary">{Number(details.highScore || 0).toLocaleString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}