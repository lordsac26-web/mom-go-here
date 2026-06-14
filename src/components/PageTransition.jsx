import { motion } from "framer-motion";

// Lightweight, GPU-friendly page transition.
// Uses opacity + a tiny translateY (transform only — no layout/reflow) instead
// of a large translateX slide, which caused horizontal-overflow jitter on
// content-heavy pages during mount. Short duration keeps navigation snappy.
const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}