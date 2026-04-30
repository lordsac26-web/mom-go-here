/**
 * Single board square with dynamic cosmetic board styles and move highlights.
 */
import CheckerPiece from "./CheckerPiece";

export default function BoardSquare({
  dark, piece, selected, isTarget, isJumpTarget, onClick, lastMove,
  boardStyle, pieceSkin,
}) {
  // Dynamic board colors from cosmetic, or classic defaults
  const darkClass = boardStyle?.darkColor || "from-green-900 via-green-800 to-green-900";
  const lightClass = boardStyle?.lightColor || "from-amber-100 via-amber-50 to-amber-100";
  const grainOpacity = boardStyle?.grainOpacity ?? 0.10;

  return (
    <button
      onClick={onClick}
      className={`w-full aspect-square flex items-center justify-center relative transition-all
        ${dark
          ? `bg-gradient-to-br ${darkClass}`
          : `bg-gradient-to-br ${lightClass}`
        }
        ${isTarget && !isJumpTarget ? "ring-[3px] ring-inset ring-yellow-400/80" : ""}
        ${isJumpTarget ? "ring-[3px] ring-inset ring-orange-400" : ""}
      `}
    >
      {/* Wood grain texture on dark squares */}
      {dark && (
        <div
          className="absolute inset-0"
          style={{
            opacity: grainOpacity,
            backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 5px)",
          }}
        />
      )}

      {/* Target dot indicator */}
      {isTarget && !piece && (
        <div className={`w-[30%] aspect-square rounded-full ${
          isJumpTarget 
            ? "bg-orange-400/60 shadow-[0_0_8px_rgba(251,146,60,0.5)]" 
            : "bg-yellow-400/50 shadow-[0_0_8px_rgba(250,204,21,0.3)]"
        }`} />
      )}

      {/* Last move highlight */}
      {lastMove && (
        <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none" />
      )}

      {/* Piece */}
      {piece && (
        <CheckerPiece
          player={piece.player}
          king={piece.king}
          selected={selected}
          skin={pieceSkin}
        />
      )}
    </button>
  );
}