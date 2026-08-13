import affirmations from "@/data/dailyAffirmations.json";

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

export default function DailyAffirmationCard() {
  const affirmation = affirmations[(dayOfYear() - 1) % affirmations.length];
  return (
    <div className="mb-4 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-4 text-center shadow">
      <p className="mb-1 text-sm font-black uppercase tracking-wide text-primary">🌷 Daily Affirmation</p>
      <p className="text-lg font-bold leading-relaxed text-foreground">“{affirmation}”</p>
    </div>
  );
}