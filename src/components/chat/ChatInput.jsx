import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  function handleSend() {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const hasText = input.trim().length > 0;

  return (
    <motion.div
      className="shrink-0 p-3 border-t border-border bg-card/80 backdrop-blur-lg sm:rounded-b-2xl pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="flex gap-2 items-end">
        <motion.div
          className="flex-1 relative"
          animate={{ scale: hasText ? 1.01 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-secondary border-2 border-border rounded-2xl pl-4 pr-4 py-3 text-base text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {hasText && !disabled ? (
            <motion.button
              key="send"
              onClick={handleSend}
              className="bg-primary text-primary-foreground w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              <Send size={20} />
            </motion.button>
          ) : (
            <motion.div
              key="idle"
              className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Smile size={20} className="text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}