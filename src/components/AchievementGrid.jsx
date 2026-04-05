import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const ALL_ACHIEVEMENTS = [
  { key: "first_win", title: "First Win", emoji: "🏆", desc: "Win your first game" },
  { key: "streak_3", title: "3-Day Streak", emoji: "🔥", desc: "Play 3 days in a row" },
  { key: "streak_7", title: "7-Day Streak", emoji: "💥", desc: "Play 7 days in a row" },
  { key: "streak_10", title: "10-Day Streak", emoji: "⚡", desc: "Play 10 days in a row" },
  { key: "memory_master", title: "Memory Master", emoji: "🧠", desc: "Complete Memory Match" },
  { key: "puzzle_pro", title: "Puzzle Pro", emoji: "🧩", desc: "Complete Sudoku" },
  { key: "word_wizard", title: "Word Wizard", emoji: "📝", desc: "Complete Word Search" },
  { key: "card_shark", title: "Card Shark", emoji: "🃏", desc: "Win Solitaire" },
  { key: "dice_king", title: "Dice King", emoji: "🎲", desc: "Score 200+ in Yahtzee" },
  { key: "checker_champ", title: "Checker Champ", emoji: "👑", desc: "Win at Checkers" },
  { key: "mahjong_master", title: "Mahjong Master", emoji: "🀄", desc: "Complete Mahjong" },
  { key: "all_games", title: "Master of All", emoji: "🌟", desc: "Play every game at least once" },
];

export default function AchievementGrid() {
  const { user } = useAuth();
  const [earned, setEarned] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.Achievement.filter({ user_email: user.email }).then(data => {
      setEarned(data.map(a => a.achievement_key));
      setLoading(false);
    });
  }, [user]);

  if (loading) return (
    <div className="flex justify-center py-6">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-black text-foreground">🏅 Achievements</h2>
        <span className="text-lg text-muted-foreground font-bold">{earned.length} / {ALL_ACHIEVEMENTS.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {ALL_ACHIEVEMENTS.map(a => {
          const isEarned = earned.includes(a.key);
          return (
            <div key={a.key}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 text-center transition-all ${
                isEarned
                  ? "bg-primary/15 border-primary shadow-lg"
                  : "bg-card border-border opacity-50"
              }`}>
              <span className={`text-4xl ${isEarned ? "" : "grayscale"}`}>{a.emoji}</span>
              <span className="text-sm font-black text-foreground leading-tight">{a.title}</span>
              <span className="text-xs text-muted-foreground leading-tight">{a.desc}</span>
              {isEarned && <span className="text-xs text-primary font-bold">✅ Earned</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}