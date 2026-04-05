import { motion } from "framer-motion";

/**
 * Hexagonal honeycomb letter display for Word Whomp.
 * Letters are arranged in a honeycomb cluster.
 */

function HexButton({ letter, index, onTap, isUsed, isCenter }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.08 }}
      onClick={() => onTap(letter, index)}
      disabled={isUsed}
      className={`relative w-16 h-[72px] sm:w-20 sm:h-[88px] select-none focus:outline-none
        ${isUsed ? "opacity-30 pointer-events-none" : ""}
      `}
    >
      {/* Hex shape via CSS clip-path */}
      <div
        className={`absolute inset-0 transition-all duration-150 ${
          isCenter
            ? "bg-gradient-to-br from-yellow-400 to-amber-500"
            : "bg-gradient-to-br from-amber-200 to-amber-300"
        }`}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
        }}
      />
      {/* Inner hex face */}
      <div
        className={`absolute inset-[3px] flex items-center justify-center ${
          isCenter
            ? "bg-gradient-to-br from-yellow-300 to-amber-400"
            : "bg-gradient-to-br from-amber-50 to-amber-100"
        }`}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        <span className={`text-2xl sm:text-3xl font-black select-none ${
          isCenter ? "text-amber-900" : "text-amber-800"
        }`}>
          {letter}
        </span>
      </div>
    </motion.button>
  );
}

export default function LetterHoneycomb({ letters, usedIndices, onLetterTap, centerIndex = 3 }) {
  // Arrange 7 letters in honeycomb: top row (2), middle row (3), bottom row (2)
  const rows = [
    letters.slice(0, 2),
    letters.slice(2, 5),
    letters.slice(5, 7),
  ];
  const indexOffsets = [0, 2, 5];

  return (
    <div className="flex flex-col items-center gap-0">
      {rows.map((row, ri) => (
        <div
          key={ri}
          className="flex items-center justify-center"
          style={{ marginTop: ri > 0 ? "-10px" : "0" }}
        >
          {row.map((letter, ci) => {
            const globalIndex = indexOffsets[ri] + ci;
            const isCenter = globalIndex === centerIndex; // center hex
            return (
              <HexButton
                key={globalIndex}
                letter={letter}
                index={globalIndex}
                onTap={onLetterTap}
                isUsed={usedIndices.includes(globalIndex)}
                isCenter={isCenter}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}