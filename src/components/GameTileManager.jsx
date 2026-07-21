import { useState } from "react";
import { X, Plus } from "lucide-react";

const ALL_GAMES = [
  { name: "Memory Match", emoji: "🧠", path: "/games/memory", color: "from-purple-600 to-purple-800", desc: "Flip 3D tiles to find matching pairs" },
  { name: "Mahjong", emoji: "🀄", path: "/games/mahjong", color: "from-red-600 to-red-800", desc: "Match pairs of 3D Mahjong tiles" },
  { name: "Solitaire", emoji: "♠️", path: "/games/solitaire", color: "from-green-600 to-green-800", desc: "Classic Klondike card solitaire" },
  { name: "Word Search", emoji: "🔤", path: "/games/wordsearch", color: "from-yellow-600 to-yellow-800", desc: "Find hidden words in the grid" },
  { name: "Sudoku", emoji: "🔢", path: "/games/sudoku", color: "from-indigo-600 to-indigo-800", desc: "Fill in the number puzzle" },
  { name: "Checkers", emoji: "⬛", path: "/games/checkers", color: "from-orange-600 to-orange-800", desc: "Classic board game vs computer" },
  { name: "Chess", emoji: "♟️", path: "/games/chess", color: "from-stone-600 to-stone-800", desc: "Play chess vs AI — pick your difficulty" },
  { name: "Yahtzee", emoji: "🎲", path: "/games/yahtzee", color: "from-pink-600 to-pink-800", desc: "Roll dice and score points!" },
  { name: "AI Art Studio", emoji: "🎨", path: "/games/artstudio", color: "from-teal-600 to-teal-800", desc: "Create AI-generated artwork" },
  { name: "Buzz Word!", emoji: "🐝", path: "/games/buzzword", color: "from-amber-600 to-amber-800", desc: "Make words from jumbled letters!" },
  { name: "Lucky Slots", emoji: "🎰", path: "/games/slots", color: "from-yellow-600 to-red-700", desc: "Spin the reels & win big!" },
  { name: "Dart Pop Blitz", emoji: "🎯", path: "/games/dartpop", color: "from-sky-500 to-emerald-700", desc: "Pop balloons with darts & power-ups!" },
  { name: "Coin Pusher", emoji: "🪙", path: "/games/coinpusher", color: "from-sky-600 to-blue-800", desc: "Drop coins & push the pile off the edge!" },
];

export { ALL_GAMES };

export default function GameTileManager({ currentGames, onUpdate, onClose }) {
  const [selected, setSelected] = useState(new Set(currentGames.map(g => g.path)));

  function toggle(path) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function handleSave() {
    const paths = ALL_GAMES.filter(g => selected.has(g.path)).map(g => g.path);
    onUpdate(paths);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="bg-card border-2 border-primary rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-primary">🎮 Manage Games</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted">
            <X size={24} className="text-foreground" />
          </button>
        </div>
        <p className="text-muted-foreground text-lg mb-4">Tap to add or remove games from your list</p>

        <div className="space-y-2 mb-6">
          {ALL_GAMES.map(game => {
            const active = selected.has(game.path);
            return (
              <button
                key={game.path}
                onClick={() => toggle(game.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  active ? "border-primary bg-primary/10" : "border-border bg-secondary opacity-60"
                }`}
              >
                <span className="text-3xl">{game.emoji}</span>
                <span className="text-lg font-bold text-foreground flex-1">{game.name}</span>
                {active ? (
                  <span className="text-green-400 text-xl">✅</span>
                ) : (
                  <Plus size={20} className="text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl"
        >
          💾 Save Changes
        </button>
      </div>
    </div>
  );
}