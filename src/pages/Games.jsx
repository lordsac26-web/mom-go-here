import { Link } from "react-router-dom";
import MagneticCard from "../components/MagneticCard";

const GAMES = [
  { name: "Memory Match", emoji: "🧠", path: "/games/memory", color: "from-purple-600 to-purple-800", desc: "Flip 3D tiles to find matching pairs" },
  { name: "Mahjong", emoji: "🀄", path: "/games/mahjong", color: "from-red-600 to-red-800", desc: "Match pairs of 3D Mahjong tiles" },
  { name: "Solitaire", emoji: "♠️", path: "/games/solitaire", color: "from-green-600 to-green-800", desc: "Classic Klondike card solitaire" },
  { name: "Tic Tac Toe", emoji: "❌", path: "/games/tictactoe", color: "from-blue-600 to-blue-800", desc: "Play X's and O's against the computer" },
  { name: "Word Search", emoji: "🔤", path: "/games/wordsearch", color: "from-yellow-600 to-yellow-800", desc: "Find hidden words in the grid" },
  { name: "Sudoku", emoji: "🔢", path: "/games/sudoku", color: "from-indigo-600 to-indigo-800", desc: "Fill in the number puzzle" },
  { name: "Checkers", emoji: "⬛", path: "/games/checkers", color: "from-orange-600 to-orange-800", desc: "Classic board game vs computer" },
  { name: "Yahtzee", emoji: "🎲", path: "/games/yahtzee", color: "from-pink-600 to-pink-800", desc: "Roll dice and score points!" },
  { name: "AI Art Studio", emoji: "🎨", path: "/games/artstudio", color: "from-teal-600 to-teal-800", desc: "Create AI-generated artwork" },
  { name: "Buzz Word!", emoji: "🐝", path: "/games/buzzword", color: "from-amber-600 to-amber-800", desc: "Make words from jumbled letters!" },
];

export default function Games() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <h1 className="text-4xl font-black text-primary text-center mb-2">🎮 Choose a Game</h1>
      <p className="text-center text-muted-foreground text-xl mb-8">Tap any game to start playing!</p>
      <div className="grid grid-cols-1 gap-5 max-w-lg mx-auto">
        {GAMES.map((game) => (
          <MagneticCard key={game.name} strength={0.35} rotationStrength={0.18} hoverScale={1.03}>
            <Link
              to={game.path}
              className={`bg-gradient-to-r ${game.color} rounded-2xl p-6 shadow-xl flex items-center gap-5 block`}
            >
              <span className="text-6xl">{game.emoji}</span>
              <div>
                <div className="text-2xl font-black text-white">{game.name}</div>
                <div className="text-white/80 text-lg font-semibold mt-1">{game.desc}</div>
              </div>
            </Link>
          </MagneticCard>
        ))}
      </div>
    </div>
  );
}