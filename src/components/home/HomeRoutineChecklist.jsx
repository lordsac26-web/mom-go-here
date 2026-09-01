const ITEMS = [
  { emoji: "💛", label: "Inspiration" },
  { emoji: "🎮", label: "Game" },
  { emoji: "✍️", label: "Reflection" },
];

export default function HomeRoutineChecklist({ checks }) {
  const complete = checks.filter(Boolean).length;
  return (
    <section className="rounded-3xl border-2 border-border bg-card p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-foreground">Your Gentle Routine</h2>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-black text-foreground">{complete} of 3</span>
      </div>
      <div className="space-y-3">
        {ITEMS.map((item, index) => (
          <div key={item.label} className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-secondary/60 px-4">
            <span className="text-2xl">{item.emoji}</span>
            <span className="flex-1 text-lg font-bold text-foreground">{item.label}</span>
            <span className="text-xl" aria-label={checks[index] ? "Complete" : "Not complete"}>{checks[index] ? "✅" : "○"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}