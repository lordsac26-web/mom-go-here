import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GameSpinner from "../GameSpinner";

const MESSAGES = [
  "Mixing the colors... 🎨",
  "Sketching the outline... ✏️",
  "Adding beautiful details... ✨",
  "Painting the background... 🖌️",
  "Finishing touches... 💫",
  "Almost ready... 🖼️",
];

export default function GeneratingMessages() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <GameSpinner size="md" />
      <div className="h-7 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-xl font-bold text-foreground"
          >
            {MESSAGES[index]}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="text-sm text-muted-foreground">This usually takes 5-10 seconds</p>
    </div>
  );
}