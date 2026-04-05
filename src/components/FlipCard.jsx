import { motion, AnimatePresence } from "framer-motion";

/**
 * A reusable 3D flip card powered by framer-motion.
 * Props:
 *  - isFlipped: boolean — whether the card is face-up
 *  - front: ReactNode — the face-up content
 *  - back: ReactNode — the face-down content
 *  - onTap: () => void — click/tap handler
 *  - flipDuration: number — seconds for the flip (default 0.5)
 *  - disabled: boolean — prevents interaction
 *  - matchPulse: boolean — triggers a celebratory pulse on match
 */

const spring = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

export default function FlipCard({
  isFlipped,
  front,
  back,
  onTap,
  flipDuration = 0.5,
  disabled = false,
  matchPulse = false,
}) {
  return (
    <motion.div
      className="cursor-pointer"
      style={{ perspective: 1000, aspectRatio: "1" }}
      onClick={disabled ? undefined : onTap}
      whileTap={disabled ? {} : { scale: 0.92 }}
      animate={matchPulse ? {
        scale: [1, 1.15, 1],
        transition: { duration: 0.4, ease: "easeOut" },
      } : {}}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          position: "relative",
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: flipDuration, ...spring }}
      >
        {/* Back face (card back — shown when NOT flipped) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
          }}
        >
          {back}
        </div>

        {/* Front face (card content — shown when flipped) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {front}
        </div>
      </motion.div>
    </motion.div>
  );
}