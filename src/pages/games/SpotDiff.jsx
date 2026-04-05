import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// Pre-defined spot the difference scenarios using Unsplash images
const SCENARIOS = [
  {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
    title: "Mountain Landscape",
    differences: [
      { x: 15, y: 20, label: "Missing cloud" },
      { x: 65, y: 15, label: "Different sun" },
      { x: 40, y: 70, label: "Extra tree" },
      { x: 80, y: 55, label: "Changed color" },
      { x: 25, y: 85, label: "Missing rock" },
    ]
  },
  {
    image: "https://images.unsplash.com/photo-1490750967868-88df5691cc5b?w=400&q=80",
    title: "Beautiful Flowers",
    differences: [
      { x: 20, y: 25, label: "Missing petal" },
      { x: 70, y: 20, label: "Different color" },
      { x: 45, y: 60, label: "Extra leaf" },
      { x: 85, y: 70, label: "Missing stem" },
      { x: 30, y: 80, label: "Changed shape" },
    ]
  },
  {
    image: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=400&q=80",
    title: "Peaceful Beach",
    differences: [
      { x: 10, y: 15, label: "Missing bird" },
      { x: 75, y: 25, label: "Extra cloud" },
      { x: 50, y: 50, label: "Different wave" },
      { x: 25, y: 75, label: "Missing shell" },
      { x: 85, y: 80, label: "Changed color" },
    ]
  },
];

export default function SpotDiff() {
  const [scenario] = useState(SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]);
  const [found, setFound] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [won, setWon] = useState(false);
  const [aiImage, setAiImage] = useState(null);
  const [generating, setGenerating] = useState(false);

  const total = scenario.differences.length;

  async function generateAiPair() {
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: "A beautiful peaceful garden with colorful flowers, butterflies, and a small fountain. Soft watercolor style, suitable for elderly users."
      });
      setAiImage(res.url);
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  }

  function handleImageClick(e, imageNum) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if click is near a difference (only on image 2)
    if (imageNum === 2) {
      for (let i = 0; i < scenario.differences.length; i++) {
        const diff = scenario.differences[i];
        if (found.includes(i)) continue;
        const dist = Math.sqrt(Math.pow(xPct - diff.x, 2) + Math.pow(yPct - diff.y, 2));
        if (dist < 12) {
          const newFound = [...found, i];
          setFound(newFound);
          if (newFound.length === total) setWon(true);
          return;
        }
      }
      // Miss click indicator
      setClicks(prev => [...prev.slice(-2), { x: xPct, y: yPct, id: Date.now() }]);
      setTimeout(() => setClicks(prev => prev.filter(c => c.id !== undefined && prev.indexOf(c) > 0)), 1000);
    }
  }

  function reset() {
    setFound([]);
    setClicks([]);
    setWon(false);
  }

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">All Differences Found!</h1>
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

      <p className="text-center text-xl text-foreground font-bold mb-2">{scenario.title}</p>
      <p className="text-center text-muted-foreground text-lg mb-4">Tap on the RIGHT image where you see a difference!</p>

      {/* Found differences list */}
      <div className="flex flex-wrap gap-2 justify-center mb-4 px-2">
        {scenario.differences.map((d, i) => (
          <span key={i} className={`px-3 py-2 rounded-full text-base font-bold border-2 ${found.includes(i) ? "bg-green-700 border-green-500 text-white" : "bg-card border-border text-muted-foreground"}`}>
            {found.includes(i) ? "✅" : "⭕"} {d.label}
          </span>
        ))}
      </div>

      {/* Two images side by side */}
      <div className="flex gap-2 max-w-2xl mx-auto">
        {/* Original */}
        <div className="flex-1">
          <p className="text-center text-lg font-black text-foreground mb-1">Original</p>
          <div className="relative rounded-xl overflow-hidden border-2 border-border cursor-default"
            onClick={(e) => handleImageClick(e, 1)}>
            <img src={scenario.image} alt="Original" className="w-full object-cover" style={{ height: "200px" }} />
            {/* Show found markers on original too */}
            {found.map(i => (
              <div key={i} style={{ left: `${scenario.differences[i].x}%`, top: `${scenario.differences[i].y}%` }}
                className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-green-400 bg-green-400/30 pointer-events-none" />
            ))}
          </div>
        </div>

        {/* Modified - tap to find differences */}
        <div className="flex-1">
          <p className="text-center text-lg font-black text-primary mb-1">👆 Tap Here!</p>
          <div className="relative rounded-xl overflow-hidden border-4 border-primary cursor-crosshair"
            onClick={(e) => handleImageClick(e, 2)}>
            <img src={scenario.image} alt="Modified" className="w-full object-cover"
              style={{ height: "200px", filter: "hue-rotate(8deg) saturate(1.15) brightness(1.05)" }} />
            {/* Simulated differences */}
            {scenario.differences.map((diff, i) => (
              !found.includes(i) ? (
                <div key={i} style={{ left: `${diff.x}%`, top: `${diff.y}%` }}
                  className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 pointer-events-none" />
              ) : (
                <div key={i} style={{ left: `${diff.x}%`, top: `${diff.y}%` }}
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-green-400 bg-green-400/30 pointer-events-none flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
              )
            ))}
            {/* Miss clicks */}
            {clicks.map((c, i) => (
              <div key={c.id} style={{ left: `${c.x}%`, top: `${c.y}%` }}
                className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-red-500 bg-red-500/30 pointer-events-none animate-ping" />
            ))}
          </div>
        </div>
      </div>

      {/* AI Generate button */}
      <div className="mt-6 max-w-sm mx-auto">
        <button onClick={generateAiPair} disabled={generating}
          className="w-full bg-gradient-to-r from-teal-600 to-teal-800 text-white text-xl font-black py-4 rounded-2xl shadow-xl disabled:opacity-50">
          {generating ? "✨ Generating AI Image..." : "🤖 Try an AI-Generated Puzzle"}
        </button>
      </div>
    </div>
  );
}