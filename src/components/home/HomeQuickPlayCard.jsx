import { Link } from "react-router-dom";
import { Play } from "lucide-react";

export default function HomeQuickPlayCard({ game }) {
  return (
    <section className="rounded-3xl border-2 border-border bg-card p-5 shadow-lg">
      <p className="text-lg font-black text-primary">🎮 Continue Playing</p>
      <div className="mt-3 flex items-center gap-4">
        <span className="text-5xl" aria-hidden="true">{game.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-black text-foreground">{game.name}</h2>
          <p className="text-base text-muted-foreground">{game.desc}</p>
        </div>
        <Link to={game.path} className="flex min-h-[52px] min-w-[52px] items-center justify-center rounded-2xl bg-primary text-primary-foreground" aria-label={`Play ${game.name}`}><Play size={26} fill="currentColor" /></Link>
      </div>
    </section>
  );
}