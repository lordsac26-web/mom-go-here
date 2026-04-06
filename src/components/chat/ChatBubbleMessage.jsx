import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

const bubbleVariants = {
  hidden: (isUser) => ({
    opacity: 0,
    scale: 0.6,
    x: isUser ? 40 : -40,
    y: 20,
    filter: "blur(4px)",
  }),
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    },
  },
  exit: (isUser) => ({
    opacity: 0,
    scale: 0.8,
    x: isUser ? 20 : -20,
    transition: { duration: 0.15 },
  }),
};

const tailVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { delay: 0.1, type: "spring", stiffness: 500, damping: 20 },
  },
};

export default function ChatBubbleMessage({ message, isLatest }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} items-end gap-1.5`}
      custom={isUser}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      layoutId={`msg-${message.id || message.content?.slice(0, 20)}`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <motion.div
          className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-lg shadow-lg flex-shrink-0 mb-0.5"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.05 }}
        >
          🌸
        </motion.div>
      )}

      <div className="relative max-w-[80%]">
        {/* Message Bubble */}
        <motion.div
          className={`relative rounded-2xl px-4 py-2.5 shadow-md ${
            isUser
              ? "bg-gradient-to-br from-primary to-amber-600 text-primary-foreground rounded-br-[4px]"
              : "bg-card border border-border text-foreground rounded-bl-[4px]"
          }`}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {/* Subtle inner glow for AI messages */}
          {!isUser && (
            <motion.div
              className="absolute inset-0 rounded-2xl rounded-bl-[4px] bg-gradient-to-br from-pink-500/5 to-transparent pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          )}

          {isUser ? (
            <p className="text-base leading-relaxed relative z-10">{message.content}</p>
          ) : (
            <ReactMarkdown className="text-base prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 relative z-10 leading-relaxed">
              {message.content}
            </ReactMarkdown>
          )}
        </motion.div>

        {/* Timestamp with fade-in */}
        <motion.span
          className={`block text-[10px] text-muted-foreground mt-0.5 ${isUser ? "text-right pr-1" : "text-left pl-1"}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLatest ? "Just now" : ""}
        </motion.span>
      </div>
    </motion.div>
  );
}