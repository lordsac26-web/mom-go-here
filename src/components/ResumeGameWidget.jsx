import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Trash2, Clock, ChevronRight } from "lucide-react";
import moment from "moment";

// Map game_name → route path
const GAME_ROUTES = {
  solitaire: "/games/solitaire",
  memory: "/games/memory",
  tictactoe: "/games/tictactoe",
  yahtzee: "/games/yahtzee",
  wordsearch: "/games/wordsearch",
  sudoku: "/games/sudoku",
  checkers: "/games/checkers",
  mahjong: "/games/mahjong",
  buzzword: "/games/buzzword",
  slots: "/games/slots",
  artstudio: "/games/artstudio",
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, type: "spring", stiffness: 350, damping: 25 },
  }),
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

function formatTime(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function ResumeGameWidget({ userEmail }) {
  const [saves, setSaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.SavedGame.filter({ user_email: userEmail }, "-updated_date", 5)
      .then((data) => {
        setSaves(data);
        setLoading(false);
      });
  }, [userEmail]);

  async function handleDelete(id) {
    await base44.entities.SavedGame.delete(id);
    setSaves((prev) => prev.filter((s) => s.id !== id));
  }

  if (loading) return null;
  if (saves.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl mb-4 shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Play size={18} className="text-primary" />
          <span className="text-lg font-bold text-foreground">Resume Games</span>
        </div>
        <Link to="/games" className="text-primary text-sm font-bold flex items-center gap-1">
          All Games <ChevronRight size={16} />
        </Link>
      </div>

      {/* Save Slots */}
      <div className="divide-y divide-border">
        <AnimatePresence>
          {saves.map((save, i) => {
            const route = GAME_ROUTES[save.game_name] || "/games";
            return (
              <motion.div
                key={save.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className="flex items-center gap-3 px-4 py-3"
              >
                {/* Game icon */}
                <span className="text-3xl flex-shrink-0">
                  {save.thumbnail_emoji || "🎮"}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground truncate">
                    {save.display_name || save.game_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {save.score > 0 && (
                      <span>Score: {save.score}</span>
                    )}
                    {save.current_level > 0 && (
                      <span>Lv. {save.current_level}</span>
                    )}
                    {save.play_time_seconds > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} /> {formatTime(save.play_time_seconds)}
                      </span>
                    )}
                    <span>{moment(save.updated_date).fromNow()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
                    <Link
                      to={`${route}?resume=1`}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-black flex items-center gap-1"
                    >
                      <Play size={14} /> Play
                    </Link>
                  </motion.div>
                  <motion.button
                    onClick={() => handleDelete(save.id)}
                    className="p-2 rounded-lg bg-secondary hover:bg-destructive/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Trash2 size={14} className="text-muted-foreground" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}