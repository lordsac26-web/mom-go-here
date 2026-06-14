import { motion } from "framer-motion";

/**
 * Sleek 1–3 star performance rating with a staggered pop-in animation.
 * Filled stars glow gold; empty stars are dim outlines.
 */
export default function StarRating({ stars = 0, size = "md" }) {
  const sizes = {
    sm: "text-3xl",
    md: "text-5xl",
    lg: "text-6xl",
  };
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => {
        const filled = i < stars;
        return (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.18, type: "spring", stiffness: 320, damping: 14 }}
            className={`${sizes[size]} leading-none ${filled ? "drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]" : "opacity-25 grayscale"}`}
          >
            {filled ? "⭐" : "☆"}
          </motion.span>
        );
      })}
    </div>
  );
}