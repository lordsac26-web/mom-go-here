import { motion, AnimatePresence } from "framer-motion";

/**
 * 3D Flip Card for Solitaire — powered by framer-motion.
 * Shows a rich perspective flip when a card transitions faceUp ↔ faceDown.
 * Includes tap feedback, selection glow, and subtle idle hover.
 */

const RED = new Set(["♥", "♦"]);

const flipSpring = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 0.8,
};

export default function SolitaireCard({ card, selected, onClick, layoutId }) {
  if (!card) return null;

  const faceUp = card.faceUp;
  const red = RED.has(card.suit);

  return (
    <motion.div
      layout
      layoutId={layoutId}
      onClick={onClick}
      className="w-full aspect-[5/7] cursor-pointer select-none"
      style={{ perspective: 800 }}
      whileTap={faceUp ? { scale: 0.93 } : {}}
      animate={selected ? { y: -4, scale: 1.06 } : { y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={flipSpring}
      >
        {/* ═══ BACK FACE (face-down) ═══ */}
        <div
          className="absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Rich card back pattern */}
          <div className="w-full h-full bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 flex items-center justify-center">
            <div className="absolute inset-1 rounded-md border border-blue-400/30" />
            <div className="absolute inset-2 rounded-sm border border-blue-300/15" />
            {/* Diamond pattern overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 40 40">
              <pattern id="cardBack" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M5 0L10 5L5 10L0 5Z" fill="white" />
              </pattern>
              <rect width="40" height="40" fill="url(#cardBack)" />
            </svg>
            <span className="text-xl sm:text-2xl relative z-10">🂠</span>
          </div>
        </div>

        {/* ═══ FRONT FACE (face-up) ═══ */}
        <div
          className={`absolute inset-0 rounded-lg sm:rounded-xl overflow-hidden border-2 shadow-lg flex flex-col items-center justify-center
            ${red ? "bg-white text-red-600 border-gray-300" : "bg-white text-gray-900 border-gray-300"}
            ${selected ? "ring-[3px] ring-yellow-400 shadow-yellow-400/40 shadow-xl" : ""}
          `}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Top-left corner */}
          <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
            <span className="text-[9px] sm:text-xs font-black">{card.val}</span>
            <span className="text-[8px] sm:text-[10px]">{card.suit}</span>
          </div>
          {/* Center */}
          <span className="text-xs sm:text-base font-black leading-none">{card.val}</span>
          <span className="text-sm sm:text-lg leading-none">{card.suit}</span>
          {/* Bottom-right corner (inverted) */}
          <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180">
            <span className="text-[9px] sm:text-xs font-black">{card.val}</span>
            <span className="text-[8px] sm:text-[10px]">{card.suit}</span>
          </div>
        </div>
      </motion.div>

      {/* Selection glow overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute inset-0 rounded-lg sm:rounded-xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 16px 4px rgba(250,204,21,0.5)" }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}