import { useState, useRef, useEffect, useCallback } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import SpotDiffCanvas from "../../components/games/SpotDiffCanvas";

// Each puzzle has a base image and a list of differences applied via canvas
// Differences are defined as regions with specific modifications
const PUZZLES = [
  {
    title: "Beach Sunset",
    baseImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
    differences: [
      { id: 1, x: 420, y: 30, w: 60, h: 60, type: "fill", color: "#87CEEB", label: "Cloud missing" },
      { id: 2, x: 80, y: 280, w: 50, h: 50, type: "fill", color: "#C2B280", label: "Shell removed" },
      { id: 3, x: 300, y: 180, w: 40, h: 40, type: "fill", color: "#FF6B35", label: "Sun color changed" },
      { id: 4, x: 150, y: 320, w: 55, h: 35, type: "fill", color: "#1E90FF", label: "Wave pattern changed" },
      { id: 5, x: 500, y: 300, w: 45, h: 45, type: "fill", color: "#C2B280", label: "Rock missing" },
    ],
  },
  {
    title: "Mountain Lake",
    baseImage: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&h=400&fit=crop",
    differences: [
      { id: 1, x: 100, y: 50, w: 70, h: 50, type: "fill", color: "#87CEEB", label: "Cloud shape changed" },
      { id: 2, x: 450, y: 200, w: 50, h: 60, type: "fill", color: "#228B22", label: "Tree removed" },
      { id: 3, x: 250, y: 300, w: 60, h: 40, type: "fill", color: "#4169E1", label: "Reflection changed" },
      { id: 4, x: 50, y: 250, w: 45, h: 55, type: "fill", color: "#228B22", label: "Bush added" },
      { id: 5, x: 400, y: 80, w: 55, h: 45, type: "fill", color: "#708090", label: "Mountain peak changed" },
    ],
  },
  {
    title: "City Park",
    baseImage: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=600&h=400&fit=crop",
    differences: [
      { id: 1, x: 120, y: 100, w: 60, h: 70, type: "fill", color: "#228B22", label: "Tree color changed" },
      { id: 2, x: 350, y: 250, w: 50, h: 40, type: "fill", color: "#8B4513", label: "Bench removed" },
      { id: 3, x: 480, y: 150, w: 45, h: 50, type: "fill", color: "#87CEEB", label: "Bird missing" },
      { id: 4, x: 200, y: 320, w: 55, h: 35, type: "fill", color: "#32CD32", label: "Grass patch changed" },
      { id: 5, x: 50, y: 50, w: 50, h: 50, type: "fill", color: "#FFD700", label: "Light changed" },
    ],
  },
  {
    title: "Flower Garden",
    baseImage: "https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=400&fit=crop",
    differences: [
      { id: 1, x: 100, y: 120, w: 55, h: 55, type: "fill", color: "#FF1493", label: "Flower color changed" },
      { id: 2, x: 400, y: 80, w: 60, h: 50, type: "fill", color: "#228B22", label: "Leaf removed" },
      { id: 3, x: 250, y: 250, w: 50, h: 50, type: "fill", color: "#FFD700", label: "Petal missing" },
      { id: 4, x: 50, y: 300, w: 45, h: 40, type: "fill", color: "#8B4513", label: "Stem changed" },
      { id: 5, x: 480, y: 300, w: 50, h: 50, type: "fill", color: "#9370DB", label: "Flower added" },
    ],
  },
];

export default function SpotDiff() {
  useGameTimer();
  const [puzzleIdx, setPuzzleIdx] = useState(() => Math.floor(Math.random() * PUZZLES.length));
  const puzzle = PUZZLES[puzzleIdx];
  const [found, setFound] = useState([]);
  const [won, setWon] = useState(false);
  const [tapped, setTapped] = useState(null); // {x,y} for miss feedback

  const handleFound = useCallback((diffId) => {
    setFound(prev => {
      if (prev.includes(diffId)) return prev;
      const next = [...prev, diffId];
      if (next.length === puzzle.differences.length) {
        setTimeout(() => setWon(true), 600);
      }
      return next;
    });
  }, [puzzle]);

  const handleMiss = useCallback((x, y) => {
    setTapped({ x, y });
    setTimeout(() => setTapped(null), 600);
  }, []);

  function reset() {
    const newIdx = (puzzleIdx + 1) % PUZZLES.length;
    setPuzzleIdx(newIdx);
    setFound([]);
    setWon(false);
    setTapped(null);
  }

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-2">All Differences Found!</h1>
      <p className="text-2xl text-muted-foreground mb-6">Great eye! You spotted them all.</p>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 Next Puzzle
      </button>
      <Link to="/games" className="text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-2 py-4 pb-24">
      <div className="flex items-center justify-between px-2 mb-3">
        <Link to="/games" className="text-primary text-xl font-bold">← Back</Link>
        <div className="text-center">
          <div className="text-2xl font-black text-primary">🔍 Spot the Diff</div>
          <div className="text-muted-foreground text-lg">Found: {found.length} / {puzzle.differences.length}</div>
        </div>
        <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
      </div>

      <p className="text-center text-2xl font-black text-foreground mb-1">{puzzle.title}</p>
      <p className="text-center text-muted-foreground text-lg mb-3">
        Tap on the differences in the bottom image!
      </p>

      <SpotDiffCanvas
        puzzle={puzzle}
        found={found}
        onFound={handleFound}
        onMiss={handleMiss}
        tapped={tapped}
      />

      {/* Legend of differences */}
      <div className="max-w-lg mx-auto mt-4 px-2">
        <div className="grid grid-cols-2 gap-2">
          {puzzle.differences.map(d => (
            <div key={d.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-base font-bold transition-all ${
                found.includes(d.id)
                  ? "bg-green-700 border-green-500 text-white"
                  : "bg-card border-border text-muted-foreground"
              }`}>
              <span>{found.includes(d.id) ? "✅" : "⭕"}</span>
              <span className="truncate">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}