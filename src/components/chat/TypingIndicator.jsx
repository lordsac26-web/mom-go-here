import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, scale: 0.6, x: -30, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 22,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    x: -20,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const dotVariants = {
  hidden: { y: 0, opacity: 0.3 },
  visible: {
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export default function TypingIndicator() {
  return (
    <motion.div
      className="flex items-end gap-1.5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {/* Avatar */}
      <motion.div
        className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-lg shadow-lg flex-shrink-0"
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        🌸
      </motion.div>

      {/* Dots bubble */}
      <motion.div
        className="bg-card border border-border rounded-2xl rounded-bl-[4px] px-5 py-3 shadow-md"
      >
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary/60"
              variants={dotVariants}
              style={{ animationDelay: `${i * 0.15}s` }}
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
                scale: [0.9, 1.2, 0.9],
              }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}