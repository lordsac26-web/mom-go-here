import { useState, useEffect } from "react";
import { useGameTimer } from "../../hooks/useGameTimer";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

// Prompts for AI to generate original + modified scene pairs
const SCENE_PROMPTS = [
  {
    title: "Garden Tea Party",
    original: "A sunny garden tea party scene with a round table, two teacups, a teapot, three red roses in a vase, a yellow butterfly, a white picket fence, and blue sky. Flat illustrated style, bright colors.",
    modified: "A sunny garden tea party scene with a round table, two teacups, a teapot, two red roses in a vase (one is missing), a purple butterfly (not yellow), a white picket fence, and blue sky. There is also an extra cookie on the table and the teapot lid is open. Flat illustrated style, bright colors.",
    hints: ["One rose is missing", "Butterfly changed color", "Extra cookie appeared", "Teapot lid is open"],
  },
  {
    title: "Cozy Living Room",
    original: "A cozy living room with a red sofa, a lamp with a yellow shade, a bookshelf with 5 books, a round clock on the wall showing 3 o'clock, a potted green plant, and a cat sleeping on the sofa. Flat illustrated style.",
    modified: "A cozy living room with a red sofa, a lamp with a blue shade (not yellow), a bookshelf with 4 books (one missing), a round clock on the wall showing 6 o'clock, a potted green plant with a flower added, and a cat sleeping on the sofa. Flat illustrated style.",
    hints: ["Lamp shade changed color", "A book is missing", "Clock shows different time", "Plant has a flower"],
  },
  {
    title: "Seaside Village",
    original: "A cheerful seaside village with three colorful houses, a red lighthouse, two sailboats on blue water, a yellow sun, seagulls flying, and a wooden dock. Flat illustrated style.",
    modified: "A cheerful seaside village with three colorful houses, a blue lighthouse (not red), one sailboat on blue water (one is missing), a yellow sun, seagulls flying, and a wooden dock with an extra barrel on it. Flat illustrated style.",
    hints: ["Lighthouse changed color", "One sailboat is missing", "Extra barrel on the dock"],
  },
];

export default function SpotDiff() {
  useGameTimer();
  const [sceneIdx] = useState(Math.floor(Math.random() * SCENE_PROMPTS.length));
  const scene = SCENE_PROMPTS[sceneIdx];

  const [originalUrl, setOriginalUrl] = useState(null);
  const [modifiedUrl, setModifiedUrl] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState(null);

  const [found, setFound] = useState([]);
  const [won, setWon] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    generateImages();
  }, []);

  async function generateImages() {
    setGenerating(true);
    setError(null);
    try {
      const [orig, mod] = await Promise.all([
        base44.integrations.Core.GenerateImage({ prompt: scene.original }),
        base44.integrations.Core.GenerateImage({ prompt: scene.modified }),
      ]);
      setOriginalUrl(orig.url);
      setModifiedUrl(mod.url);
    } catch (e) {
      setError("Could not generate images. Please try again.");
    }
    setGenerating(false);
  }

  function toggleHint(i) {
    if (found.includes(i)) return;
    const newFound = [...found, i];
    setFound(newFound);
    if (newFound.length === scene.hints.length) setWon(true);
  }

  function reset() {
    setFound([]);
    setWon(false);
    setShowHints(false);
    setOriginalUrl(null);
    setModifiedUrl(null);
    generateImages();
  }

  if (generating) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-7xl mb-4 animate-bounce">🎨</div>
      <h2 className="text-3xl font-black text-primary mb-3">Creating your puzzle...</h2>
      <p className="text-xl text-muted-foreground mb-6">AI is painting two unique scenes for you!</p>
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-7xl mb-4">😕</div>
      <p className="text-2xl text-foreground mb-6">{error}</p>
      <button onClick={generateImages} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl">
        Try Again
      </button>
      <Link to="/games" className="mt-4 text-primary text-xl font-bold">← Back to Games</Link>
    </div>
  );

  if (won) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-4">🎉</div>
      <h1 className="text-4xl font-black text-primary mb-4">You Found Them All!</h1>
      <button onClick={reset} className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4">
        🔄 New Puzzle
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
          <div className="text-muted-foreground">Found: {found.length} / {scene.hints.length}</div>
        </div>
        <button onClick={reset} className="bg-secondary text-foreground px-4 py-2 rounded-xl font-bold">🔄</button>
      </div>

      <p className="text-center text-2xl font-black text-foreground mb-1">{scene.title}</p>
      <p className="text-center text-muted-foreground text-lg mb-3">
        Study both images — tap each difference you spot in the list below!
      </p>

      {/* Images side by side */}
      <div className="flex gap-2 max-w-2xl mx-auto mb-4">
        <div className="flex-1">
          <p className="text-center text-base font-black text-foreground mb-1">Original</p>
          <img src={originalUrl} alt="Original" className="w-full rounded-xl border-2 border-border object-cover" style={{ height: "200px" }} />
        </div>
        <div className="flex-1">
          <p className="text-center text-base font-black text-primary mb-1">Modified</p>
          <img src={modifiedUrl} alt="Modified" className="w-full rounded-xl border-4 border-primary object-cover" style={{ height: "200px" }} />
        </div>
      </div>

      {/* Tap to mark differences found */}
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-black text-foreground">Differences to find:</h3>
          <button
            onClick={() => setShowHints(!showHints)}
            className="text-primary text-lg font-bold underline"
          >
            {showHints ? "Hide hints" : "Need a hint? 💡"}
          </button>
        </div>
        <div className="space-y-3">
          {scene.hints.map((hint, i) => (
            <button
              key={i}
              onClick={() => toggleHint(i)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all text-xl font-bold ${
                found.includes(i)
                  ? "bg-green-700 border-green-500 text-white"
                  : "bg-card border-border text-foreground hover:border-primary"
              }`}
            >
              <span className="text-2xl">{found.includes(i) ? "✅" : "⭕"}</span>
              <span>{showHints || found.includes(i) ? hint : `Difference #${i + 1}`}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-muted-foreground text-base mt-4">
          Study both images, then tap each difference when you spot it!
        </p>
      </div>
    </div>
  );
}