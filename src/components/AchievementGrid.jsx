import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const ALL_ACHIEVEMENTS = [
  // Getting Started
  { key: "first_win", title: "First Win", emoji: "🏆", desc: "Win your first game" },
  { key: "first_art", title: "First Creation", emoji: "🖼️", desc: "Generate your first AI artwork" },
  { key: "daily_reader", title: "Daily Reader", emoji: "📖", desc: "Read your first daily verse" },
  { key: "profile_complete", title: "All Set Up", emoji: "✅", desc: "Complete your profile in Settings" },

  // Streaks
  { key: "streak_3", title: "3-Day Streak", emoji: "🔥", desc: "Play 3 days in a row" },
  { key: "streak_7", title: "Week Warrior", emoji: "💥", desc: "Play 7 days in a row" },
  { key: "streak_14", title: "Two-Week Titan", emoji: "⚡", desc: "Play 14 days in a row" },
  { key: "streak_30", title: "Monthly Legend", emoji: "🌟", desc: "Play 30 days in a row" },

  // Memory Match
  { key: "memory_master", title: "Memory Master", emoji: "🧠", desc: "Complete Memory Match" },
  { key: "memory_hard", title: "Steel Trap Mind", emoji: "🔒", desc: "Beat Memory Match on Hard" },
  { key: "memory_speed", title: "Quick Recall", emoji: "⏱️", desc: "Beat Easy Memory in under 20 moves" },

  // Sudoku
  { key: "puzzle_pro", title: "Puzzle Pro", emoji: "🧩", desc: "Complete Sudoku" },
  { key: "sudoku_clean", title: "No Mistakes", emoji: "💎", desc: "Complete Sudoku with zero errors" },

  // Word Search
  { key: "word_wizard", title: "Word Wizard", emoji: "📝", desc: "Complete Word Search" },
  { key: "word_speed", title: "Speed Reader", emoji: "📚", desc: "Find all words in under 60 seconds" },

  // Solitaire
  { key: "card_shark", title: "Card Shark", emoji: "🃏", desc: "Win Solitaire" },
  { key: "solitaire_3", title: "Card Collector", emoji: "♠️", desc: "Win Solitaire 3 times" },

  // Yahtzee
  { key: "dice_king", title: "Dice King", emoji: "🎲", desc: "Score 200+ in Yahtzee" },
  { key: "yahtzee_roll", title: "YAHTZEE!", emoji: "🎯", desc: "Roll a Yahtzee (5 of a kind)" },
  { key: "dice_legend", title: "Dice Legend", emoji: "👑", desc: "Score 300+ in Yahtzee" },

  // Checkers
  { key: "checker_champ", title: "Checker Champ", emoji: "⬛", desc: "Win at Checkers" },
  { key: "checker_king", title: "King Me!", emoji: "👑", desc: "Get a King piece in Checkers" },
  { key: "checker_sweep", title: "Clean Sweep", emoji: "🧹", desc: "Win Checkers without losing a piece" },

  // Tic Tac Toe
  { key: "ttt_winner", title: "X Marks the Spot", emoji: "❌", desc: "Win at Tic Tac Toe" },
  { key: "ttt_streak", title: "Unbeatable", emoji: "🛡️", desc: "Win 3 Tic Tac Toe games in a row" },

  // Mahjong
  { key: "mahjong_master", title: "Mahjong Master", emoji: "🀄", desc: "Complete Mahjong" },
  { key: "mahjong_fast", title: "Tile Tornado", emoji: "🌪️", desc: "Complete Mahjong in under 30 moves" },

  // AI Art Studio
  { key: "art_5", title: "Art Enthusiast", emoji: "🎨", desc: "Generate 5 AI artworks" },
  { key: "art_share", title: "Proud Artist", emoji: "📤", desc: "Share an AI artwork" },
  { key: "art_all_styles", title: "Style Explorer", emoji: "🎭", desc: "Try all 8 art styles" },

  // Milestones
  { key: "all_games", title: "Master of All", emoji: "🌟", desc: "Play every game at least once" },
  { key: "games_10", title: "Game Lover", emoji: "💜", desc: "Play 10 total games" },
  { key: "games_50", title: "Dedicated Player", emoji: "🎖️", desc: "Play 50 total games" },
  { key: "games_100", title: "Century Club", emoji: "💯", desc: "Play 100 total games" },
  { key: "time_60", title: "Hour of Fun", emoji: "⏰", desc: "Play for a total of 60 minutes" },
  { key: "time_300", title: "Time Well Spent", emoji: "🕰️", desc: "Play for a total of 5 hours" },
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