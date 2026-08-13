import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const PHRASES = [
  "Wonderful job! You gave your mind some loving care today.",
  "Beautiful work! Every little bit of play keeps your mind active.",
  "You did it! Take a moment to feel proud of yourself.",
  "Lovely effort! It is always a good day to learn and play.",
];

export default function WarmEncouragementToast() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleComplete = async () => {
      let minutes = 0;
      if (user?.email) {
        try {
          const rows = await base44.entities.DailyProgress.filter({
            user_email: user.email,
            date: new Date().toDateString(),
          });
          minutes = Math.round(rows[0]?.minutes_played || 0);
        } catch {
          minutes = 0;
        }
      }
      const base = PHRASES[Math.floor(Math.random() * PHRASES.length)];
      setMessage(minutes > 0 ? `${base} You played for ${minutes} minute${minutes === 1 ? "" : "s"} today!` : base);
      window.setTimeout(() => setMessage(""), 5000);
    };
    window.addEventListener("game-completed", handleComplete);
    return () => window.removeEventListener("game-completed", handleComplete);
  }, [user?.email]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed left-1/2 top-20 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border-2 border-primary bg-card px-5 py-4 text-center text-lg font-black text-foreground shadow-2xl"
          role="status"
        >
          🌟 {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}