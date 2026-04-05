import { motion } from "framer-motion";

/**
 * Infinite scrolling marquee text banner using framer-motion.
 * Duplicates children to create seamless loop.
 */
export default function MarqueeBanner({ children, speed = 30, className = "" }) {
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div
        className="inline-flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: speed,
            ease: "linear",
          },
        }}
      >
        {/* Render content twice for seamless loop */}
        <span className="inline-flex items-center">{children}</span>
        <span className="inline-flex items-center">{children}</span>
      </motion.div>
    </div>
  );
}