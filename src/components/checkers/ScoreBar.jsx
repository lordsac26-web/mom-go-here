/**
 * Score bar showing piece counts for both players.
 * Dynamically adapts labels & colors based on equipped piece skin.
 */
export default function ScoreBar({ counts, turn, gameOver, pieceSkin }) {
  // Extract representative colors from the skin for the mini-piece preview
  const p1Color = pieceSkin?.p1?.gradient || "radial-gradient(circle, #dc2626, #991b1b)";
  const p2Color = pieceSkin?.p2?.gradient || "radial-gradient(circle, #1f2937, #111827)";

  return (
    <div className="flex items-stretch gap-2 mx-2 mb-3">
      {/* Player */}
      <div className={`flex-1 rounded-2xl p-3 flex items-center gap-3 border-2 transition-all ${
        turn === 1 && !gameOver ? "bg-primary/10 border-primary" : "bg-card border-border"
      }`}>
        <div
          className="w-9 h-9 rounded-full shadow-md flex items-center justify-center shrink-0"
          style={{ background: p1Color }}
        >
          {counts.p1k > 0 && <span className="text-xs">👑</span>}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">You</p>
          <p className="text-xs text-muted-foreground">
            {counts.p1} piece{counts.p1 !== 1 ? "s" : ""}
            {counts.p1k > 0 && ` · ${counts.p1k} king${counts.p1k !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Computer */}
      <div className={`flex-1 rounded-2xl p-3 flex items-center gap-3 border-2 transition-all ${
        turn === 2 && !gameOver ? "bg-muted border-muted-foreground/40" : "bg-card border-border"
      }`}>
        <div
          className="w-9 h-9 rounded-full shadow-md flex items-center justify-center shrink-0"
          style={{ background: p2Color }}
        >
          {counts.p2k > 0 && <span className="text-xs">👑</span>}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Computer</p>
          <p className="text-xs text-muted-foreground">
            {counts.p2} piece{counts.p2 !== 1 ? "s" : ""}
            {counts.p2k > 0 && ` · ${counts.p2k} king${counts.p2k !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
    </div>
  );
}