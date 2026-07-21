/**
 * Renders a single chess piece using Unicode glyphs.
 * Player 1 = white (light glyphs), Player 2 = black (dark glyphs).
 */
const GLYPHS = {
  1: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  2: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};

export default function ChessPiece({ player, type, selected, animating }) {
  const glyph = GLYPHS[player][type];
  const isWhite = player === 1;

  return (
    <div
      className={`flex items-center justify-center leading-none select-none transition-transform duration-150 ${
        selected ? "scale-110 -translate-y-0.5" : ""
      } ${animating ? "scale-110" : ""}`}
      style={{
        fontSize: "min(2.6rem, 9vw)",
        color: isWhite ? "#f8fafc" : "#0f172a",
        textShadow: isWhite
          ? "0 1px 1px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.7)"
          : "0 1px 1px rgba(255,255,255,0.35), 0 0 1px rgba(255,255,255,0.4)",
        filter: selected ? "drop-shadow(0 0 6px rgba(251,191,36,0.9))" : "none",
      }}
    >
      {glyph}
    </div>
  );
}