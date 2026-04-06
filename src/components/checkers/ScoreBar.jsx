/**
 * Score bar showing piece counts for both players.
 */
export default function ScoreBar({ counts, turn, gameOver }) {
  return (
    <div className="flex items-stretch gap-2 mx-2 mb-3">
      {/* Player */}
      <div className={`flex-1 rounded-2xl p-3 flex items-center gap-3 border-2 transition-all ${
        turn === 1 && !gameOver ? "bg-red-950/50 border-red-500" : "bg-card border-border"
      }`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-md flex items-center justify-center">
          {counts.p1k > 0 && <span className="text-xs">👑</span>}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">You (Red)</p>
          <p className="text-xs text-muted-foreground">
            {counts.p1} piece{counts.p1 !== 1 ? "s" : ""} 
            {counts.p1k > 0 && ` · ${counts.p1k} king${counts.p1k !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Computer */}
      <div className={`flex-1 rounded-2xl p-3 flex items-center gap-3 border-2 transition-all ${
        turn === 2 && !gameOver ? "bg-gray-950/50 border-gray-500" : "bg-card border-border"
      }`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-800 shadow-md flex items-center justify-center">
          {counts.p2k > 0 && <span className="text-xs">👑</span>}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">CPU (Black)</p>
          <p className="text-xs text-muted-foreground">
            {counts.p2} piece{counts.p2 !== 1 ? "s" : ""} 
            {counts.p2k > 0 && ` · ${counts.p2k} king${counts.p2k !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
    </div>
  );
}