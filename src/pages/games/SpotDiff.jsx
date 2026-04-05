import { useState } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";

// Each scenario has an image + differences defined as colored shapes
// that appear ONLY on the right (modified) image, making them clearly visible
const SCENARIOS = [
  {
    title: "Garden in Bloom",
    image: "https://images.unsplash.com/photo-1490750967868-88df5691cc5b?w=500&q=80",
    differences: [
      { x: 15, y: 20, color: "#ff0000", shape: "circle", size: 28, label: "Red dot" },
      { x: 72, y: 15, color: "#00aaff", shape: "circle", size: 24, label: "Blue spot" },
      { x: 48, y: 55, color: "#ffff00", shape: "square", size: 26, label: "Yellow patch" },
      { x: 82, y: 68, color: "#ff00ff", shape: "circle", size: 22, label: "Pink mark" },
      { x: 28, y: 80, color: "#00ff88", shape: "square", size: 24, label: "Green shape" },
    ]
  },
  {
    title: "Mountain Peaks",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80",
    differences: [
      { x: 10, y: 12, color: "#ff6600", shape: "circle", size: 26, label: "Orange spot" },
      { x: 68, y: 20, color: "#ff0000", shape: "square", size: 24, label: "Red square" },
      { x: 42, y: 48, color: "#00ccff", shape: "circle", size: 28, label: "Blue circle" },
      { x: 85, y: 72, color: "#ffff00", shape: "circle", size: 22, label: "Yellow dot" },
      { x: 22, y: 78, color: "#cc00ff", shape: "square", size: 26, label: "Purple patch" },
    ]
  },
  {
    title: "Peaceful Beach",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
    differences: [
      { x: 18, y: 18, color: "#ff0000", shape: "circle", size: 28, label: "Red dot" },
      { x: 74, y: 12, color: "#00ff00", shape: "square", size: 24, label: "Green box" },
      { x: 50, y: 50, color: "#ff6600", shape: "circle", size: 26, label: "Orange mark" },
      { x: 88, y: 65, color: "#0000ff", shape: "circle", size: 22, label: "Blue spot" },
      { x: 30, y: 82, color: "#ff00aa", shape: "square", size: 24, label: "Pink shape" },
    ]
  },
  {
    title: "Cozy Autumn Path",
    image: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=500&q=80",
    differences: [
      { x: 12, y: 25, color: "#00ccff", shape: "circle", size: 28, label: "Blue circle" },
      { x: 78, y: 18, color: "#ff3300", shape: "square", size: 26, label: "Red square" },
      { x: 44, y: 60, color: "#ffcc00", shape: "circle", size: 24, label: "Yellow spot" },
      { x: 80, y: 75, color: "#00ff88", shape: "circle", size: 22, label: "Green mark" },
      { x: 25, y: 85, color: "#ff0099", shape: "square", size: 26, label: "Pink patch" },
    ]
  },
];

function DiffShape({ diff, found }) {
  const half = diff.size / 2;
  return (
    <div
      style={{
        position: "absolute",
        left: `${diff.x}%`,
        top: `${diff.y}%`,
        transform: "translate(-50%, -50%)",
        width: diff.size,
        height: diff.size,
        backgroundColor: found ? "rgba(34,197,94,0.85)" : diff.color,
        borderRadius: diff.shape === "circle" ? "50%" : "4px",
        border: found ? "3px solid #22c55e" : "3px solid rgba(255,255,255,0.8)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        color: "white",
        fontWeight: "bold",
        transition: "background-color 0.3s",
        pointerEvents: "none",
      }}
    >
      {found ? "✓" : ""}
    </div>
  );
}

export default function SpotDiff() {
  useGameTimer();
  const [scenarioIdx] = useState(Math.floor(Math.random() * SCENARIOS.length));
  const scenario = SCENARIOS[scenarioIdx];
  const [found, setFound] = useState([]);
  const [misses, setMisses] = useState([]);
  const [won, setWon] = useState(false);

  const total = scenario.differences.length;

  function handleRightClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    for (let i = 0; i < scenario.differences.length; i++) {
      if (found.includes(i)) continue;
      const diff = scenario.differences[i];
      const dist = Math.sqrt(Math.pow(xPct - diff.x, 2) + Math.pow(yPct - diff.y, 2));
      if (dist < 10) {
        const newFound = [...found, i];
        setFound(newFound);
        if (newFound.length === total) setWon(true);
        return;
      }
    }
    // Miss
    const missId = Date.now();
    setMisses(prev => [...prev, { x: xPct, y: yPct, id: missId }]);
    setTimeout(() => setMisses(prev => prev.filter(m => m.id !== missId)), 800);
  }

  function reset() {
    setFound([]);
    setMisses([]);
    setWon(false);
  }

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">All Found!</h1>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 Play Again
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
          <div className="text-muted-foreground">Found: {found.length} / {total}</div>
        </div>
        <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
      </div>

      <p className="text-center text-2xl font-black text-foreground mb-1">{scenario.title}</p>
      <p className="text-center text-muted-foreground text-lg mb-3">
        Tap the colored shapes on the <span className="text-primary font-black">RIGHT image</span> to find them!
      </p>

      {/* Found list */}
      <div className="flex flex-wrap gap-2 justify-center mb-4 px-2">
        {scenario.differences.map((d, i) => (
          <span key={i} className={`px-3 py-2 rounded-full text-base font-bold border-2 transition-all ${
            found.includes(i) ? "bg-green-700 border-green-500 text-white" : "bg-card border-border text-muted-foreground"
          }`}>
            {found.includes(i) ? "✅" : "⭕"} {d.label}
          </span>
        ))}
      </div>

      {/* Two images side by side */}
      <div className="flex gap-2 max-w-2xl mx-auto">
        {/* Original - no shapes */}
        <div className="flex-1">
          <p className="text-center text-lg font-black text-foreground mb-1">Original</p>
          <div className="relative rounded-xl overflow-hidden border-2 border-border">
            <img src={scenario.image} alt="Original" className="w-full object-cover" style={{ height: "220px" }} />
          </div>
        </div>

        {/* Modified - with colored shapes */}
        <div className="flex-1">
          <p className="text-center text-lg font-black text-primary mb-1">👆 Find These!</p>
          <div
            className="relative rounded-xl overflow-hidden border-4 border-primary cursor-crosshair"
            onClick={handleRightClick}
          >
            <img src={scenario.image} alt="Modified" className="w-full object-cover" style={{ height: "220px" }} />
            {scenario.differences.map((diff, i) => (
              <DiffShape key={i} diff={diff} found={found.includes(i)} />
            ))}
            {/* Miss indicators */}
            {misses.map(m => (
              <div key={m.id} style={{ left: `${m.x}%`, top: `${m.y}%`, position: "absolute", transform: "translate(-50%,-50%)" }}
                className="w-8 h-8 rounded-full border-4 border-red-500 bg-red-500/30 pointer-events-none animate-ping" />
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-muted-foreground text-base mt-3">
        💡 Tap directly on each colored shape in the right image
      </p>
    </div>
  );
}