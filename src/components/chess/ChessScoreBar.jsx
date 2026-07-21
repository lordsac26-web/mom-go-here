/**
 * Score bar for chess: shows captured-piece advantage and whose turn it is.
 */
const GLYPHS = {
  1: { q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  2: { q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

// Captured pieces are the opponent's pieces you've taken.
function capturedList(board, ownerPlayer) {
  const start = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const alive = {};
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.player === ownerPlayer && p.type !== "k") alive[p.type] = (alive[p.type] || 0) + 1;
    }
  const captured = [];
  for (const t of ["q", "r", "b", "n", "p"]) {
    const gone = (start[t] || 0) - (alive[t] || 0);
    for (let i = 0; i < gone; i++) captured.push(t);
  }
  return captured;
}

export default function ChessScoreBar({ board, turn, gameOver, difficulty }) {
  // Pieces captured BY player 1 = black pieces missing
  const capturedByYou = capturedList(board, 2);
  const capturedByCpu = capturedList(board, 1);

  const diffLabel = { easy: "🌱 Easy", medium: "🎯 Medium", hard: "🔥 Hard" }[difficulty] || "";

  return (
    <div className="flex items-stretch gap-2 mx-2 mb-3">
      <div className={`flex-1 rounded-2xl p-3 border-2 transition-all ${
        turn === 1 && !gameOver ? "bg-primary/10 border-primary" : "bg-card border-border"
      }`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">You (White)</p>
          {turn === 1 && !gameOver && <span className="text-xs text-primary font-bold">● Turn</span>}
        </div>
        <div className="text-lg leading-none mt-1 min-h-[1.25rem] text-slate-800">
          {capturedByYou.map((t, i) => <span key={i}>{GLYPHS[2][t]}</span>)}
        </div>
      </div>

      <div className={`flex-1 rounded-2xl p-3 border-2 transition-all ${
        turn === 2 && !gameOver ? "bg-muted border-muted-foreground/40" : "bg-card border-border"
      }`}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">CPU {diffLabel && <span className="text-muted-foreground font-normal">· {diffLabel}</span>}</p>
          {turn === 2 && !gameOver && <span className="text-xs text-muted-foreground font-bold">● Turn</span>}
        </div>
        <div className="text-lg leading-none mt-1 min-h-[1.25rem] text-slate-100">
          {capturedByCpu.map((t, i) => <span key={i}>{GLYPHS[1][t]}</span>)}
        </div>
      </div>
    </div>
  );
}