import { motion } from "framer-motion";

/**
 * Renders text with a staggered bee-flight wave animation.
 * Each character bobs up and down with offset timing, mimicking a bee's zigzag path.
 */
export default function BeeFlightTitle({ text = "Buzz Word!", className = "", size = "text-xl" }) {
  const chars = text.split("");

  return (
    <span className={`inline-flex items-center ${className}`} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className={`${size} font-black text-primary inline-block`}
          animate={{
            y: [0, i % 2 === 0 ? -4 : 4, 0, i % 2 === 0 ? 3 : -3, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
          style={{ display: char === " " ? "inline" : "inline-block", minWidth: char === " " ? "0.3em" : undefined }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}