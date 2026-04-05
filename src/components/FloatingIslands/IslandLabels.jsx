import { Link } from "react-router-dom";

/**
 * 2D overlay labels for each floating island — rendered below the 3D canvas
 * so users always have clear, tappable navigation targets.
 */
export default function IslandLabels({ islands }) {
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {islands.map((island) => (
        <Link
          key={island.path}
          to={island.path}
          className="bg-card border-2 border-border hover:border-primary rounded-2xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95 shadow-lg"
        >
          <span className="text-3xl">{island.emoji}</span>
          <span className="text-sm font-black text-foreground text-center leading-tight">{island.label}</span>
        </Link>
      ))}
    </div>
  );
}