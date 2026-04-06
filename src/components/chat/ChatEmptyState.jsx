import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const SUGGESTIONS = [
  { emoji: "🎮", text: "Tell me about the games" },
  { emoji: "🌤️", text: "What's the weather today?" },
  { emoji: "💡", text: "Give me some inspiration" },
];

export default function ChatEmptyState({ onSuggestionClick }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-8 px-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated avatar */}
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-amber-400 flex items-center justify-center shadow-2xl mb-4"
        variants={itemVariants}
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(244,114,182,0.3)",
            "0 0 0 16px rgba(244,114,182,0)",
            "0 0 0 0 rgba(244,114,182,0)",
          ],
        }}
        transition={{
          boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <span className="text-4xl">🌸</span>
      </motion.div>

      <motion.h3
        className="text-xl font-black text-foreground mb-1"
        variants={itemVariants}
      >
        Hi there! 👋
      </motion.h3>

      <motion.p
        className="text-muted-foreground text-base text-center mb-5 max-w-[260px]"
        variants={itemVariants}
      >
        I'm your friendly AI helper. Ask me anything or try a suggestion below!
      </motion.p>

      {/* Quick suggestion chips */}
      <motion.div className="flex flex-col gap-2 w-full max-w-[280px]" variants={itemVariants}>
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            onClick={() => onSuggestionClick(s.text)}
            className="flex items-center gap-2.5 bg-card border border-border rounded-2xl px-4 py-3 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors shadow-sm"
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <span className="text-xl">{s.emoji}</span>
            <span className="text-sm font-bold text-foreground">{s.text}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}