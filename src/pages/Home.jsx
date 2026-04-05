import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const MOTIVATIONAL_QUOTES = [
  { quote: "Every day is a new beginning. Take a deep breath and start again.", author: "Unknown" },
  { quote: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Keep your face always toward the sunshine, and shadows will fall behind you.", author: "Walt Whitman" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { quote: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", author: "Mother Teresa" },
  { quote: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt" },
  { quote: "Always remember that you are absolutely unique. Just like everyone else.", author: "Margaret Mead" },
  { quote: "Don't go through life, grow through life.", author: "Eric Butterworth" },
  { quote: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
  { quote: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { quote: "You have brains in your head. You have feet in your shoes.", author: "Dr. Seuss" },
  { quote: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
];

const GAMES = [
  { name: "Memory Match", emoji: "🧠", path: "/games/memory", color: "from-purple-600 to-purple-800", desc: "Flip the tiles!" },
  { name: "Mahjong", emoji: "🀄", path: "/games/mahjong", color: "from-red-600 to-red-800", desc: "Match the tiles" },
  { name: "Solitaire", emoji: "♠️", path: "/games/solitaire", color: "from-green-600 to-green-800", desc: "Classic cards" },
  { name: "Tic Tac Toe", emoji: "❌", path: "/games/tictactoe", color: "from-blue-600 to-blue-800", desc: "X's and O's" },
  { name: "Word Search", emoji: "🔤", path: "/games/wordsearch", color: "from-yellow-600 to-yellow-800", desc: "Find the words" },
  { name: "Sudoku", emoji: "🔢", path: "/games/sudoku", color: "from-indigo-600 to-indigo-800", desc: "Number puzzle" },
  { name: "Checkers", emoji: "⬛", path: "/games/checkers", color: "from-orange-600 to-orange-800", desc: "vs Computer" },
  { name: "Yahtzee", emoji: "🎲", path: "/games/yahtzee", color: "from-pink-600 to-pink-800", desc: "Roll the dice!" },
  { name: "Spot the Diff", emoji: "🔍", path: "/games/spotdiff", color: "from-teal-600 to-teal-800", desc: "Find 5 differences" },
];

export default function Home() {
  const { user } = useAuth();
  const [quote, setQuote] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const prof = profiles[0] || null;
      setProfile(prof);

      const today = new Date().toDateString();
      let idx = prof?.last_quote_index ?? 0;
      if (prof?.last_quote_date !== today) {
        idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        if (prof) {
          await base44.entities.UserProfile.update(prof.id, { last_quote_date: today, last_quote_index: idx });
        } else {
          await base44.entities.UserProfile.create({ user_email: user.email, last_quote_date: today, last_quote_index: idx });
        }
      }
      setQuote(MOTIVATIONAL_QUOTES[idx]);
    } catch (e) {
      setQuote(MOTIVATIONAL_QUOTES[0]);
    }
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      {/* Greeting */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black text-primary mb-1">
          {greeting()}, {user?.full_name?.split(" ")[0] || "Friend"}! 👋
        </h1>
        <p className="text-muted-foreground text-xl">What would you like to do today?</p>
      </div>

      {/* Quote of the Day */}
      {quote && (
        <div className="bg-card border-2 border-primary rounded-2xl p-6 mb-8 shadow-xl">
          <div className="text-center mb-3">
            <span className="text-4xl">💛</span>
            <h2 className="text-2xl font-black text-primary mt-1">Quote of the Day</h2>
          </div>
          <p className="text-2xl font-bold text-foreground text-center italic leading-relaxed">
            "{quote.quote}"
          </p>
          <p className="text-right text-muted-foreground text-xl mt-3 font-semibold">— {quote.author}</p>
        </div>
      )}

      {/* Games Grid */}
      <h2 className="text-3xl font-black text-foreground mb-4 text-center">🎮 Play a Game</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {GAMES.map((game) => (
          <Link
            key={game.name}
            to={game.path}
            className={`bg-gradient-to-br ${game.color} rounded-2xl p-5 shadow-xl flex flex-col items-center gap-2 active:scale-95 transition-transform`}
          >
            <span className="text-5xl">{game.emoji}</span>
            <span className="text-xl font-black text-white text-center">{game.name}</span>
            <span className="text-sm text-white/80 font-semibold">{game.desc}</span>
          </Link>
        ))}
      </div>

      {/* Daily Inspiration link */}
      {profile?.religion && profile.religion !== "None" && (
        <Link
          to="/daily"
          className="block bg-card border-2 border-primary rounded-2xl p-5 text-center shadow-xl"
        >
          <span className="text-4xl">📖</span>
          <p className="text-2xl font-black text-primary mt-2">Daily {profile.religion} Verse</p>
          <p className="text-muted-foreground text-lg">Tap to read today's verse</p>
        </Link>
      )}
    </div>
  );
}