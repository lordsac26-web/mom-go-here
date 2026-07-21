/**
 * A single chess board square with move highlights, check glow, and last-move tint.
 */
import ChessPiece from "./ChessPiece";

export default function ChessSquare({
  dark, piece, selected, isTarget, isCapture, isLastMove, isCheck, onClick, animating,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full aspect-square flex items-center justify-center relative transition-all
        ${dark
          ? "bg-gradient-to-br from-amber-800 via-amber-700 to-amber-800"
          : "bg-gradient-to-br from-amber-100 via-amber-50 to-amber-100"}
        ${selected ? "ring-[3px] ring-inset ring-yellow-400" : ""}
        ${isCheck ? "ring-[3px] ring-inset ring-red-500" : ""}
      `}
    >
      {/* Last move tint */}
      {isLastMove && <div className="absolute inset-0 bg-yellow-400/20 pointer-events-none" />}

      {/* Check red glow */}
      {isCheck && <div className="absolute inset-0 bg-red-500/25 pointer-events-none animate-pulse" />}

      {/* Move target indicator */}
      {isTarget && !piece && (
        <div className="w-[28%] aspect-square rounded-full bg-yellow-500/50 shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
      )}
      {isTarget && isCapture && piece && (
        <div className="absolute inset-[6%] rounded-md ring-[3px] ring-orange-400/80 pointer-events-none" />
      )}

      {piece && (
        <ChessPiece player={piece.player} type={piece.type} selected={selected} animating={animating} />
      )}
    </button>
  );
}