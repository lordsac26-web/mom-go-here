/**
 * Checker piece with optional cosmetic skin support.
 * Falls back to classic style if no skin is provided.
 */
export default function CheckerPiece({ player, king, selected, skin }) {
  const isRed = player === 1;

  // Use skin if provided, otherwise classic defaults
  const pieceStyle = skin
    ? (isRed ? skin.p1 : skin.p2)
    : null;

  const gradient = pieceStyle?.gradient
    || (isRed
      ? "radial-gradient(circle at 35% 35%, #ff6b6b, #dc2626 50%, #991b1b)"
      : "radial-gradient(circle at 35% 35%, #6b7280, #1f2937 50%, #111827)");

  const shadowColor = pieceStyle?.shadow
    || (isRed ? "#7f1d1d" : "#030712");

  const glowEffect = pieceStyle?.glow || "none";

  const ringColor = skin?.ringColor
    || (isRed ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)");

  return (
    <div
      className={`w-[78%] aspect-square rounded-full relative transition-all duration-200 ${
        selected ? "scale-110 z-10" : ""
      }`}
      style={{
        background: gradient,
        boxShadow: selected
          ? `0 0 0 3px #fbbf24, 0 0 16px rgba(251,191,36,0.5), 0 6px 0 ${shadowColor}, 0 8px 12px rgba(0,0,0,0.5)${glowEffect !== "none" ? `, ${glowEffect}` : ""}`
          : `0 4px 0 ${shadowColor}, 0 6px 8px rgba(0,0,0,0.4)${glowEffect !== "none" ? `, ${glowEffect}` : ""}`,
      }}
    >
      {/* Inner ring */}
      <div
        className="absolute inset-[12%] rounded-full"
        style={{ border: `2px solid ${ringColor}` }}
      />
      {/* Highlight */}
      <div
        className="absolute top-[10%] left-[20%] w-[30%] h-[20%] rounded-full"
        style={{
          background: isRed
            ? "radial-gradient(ellipse, rgba(255,255,255,0.4), transparent)"
            : "radial-gradient(ellipse, rgba(255,255,255,0.2), transparent)",
        }}
      />
      {/* King crown */}
      {king && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-yellow-300 drop-shadow-lg" style={{ fontSize: "min(1.4rem, 5vw)" }}>👑</span>
        </div>
      )}
    </div>
  );
}