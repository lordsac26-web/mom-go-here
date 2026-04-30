import GameBackButton from "../GameBackButton";
import BeeFlightTitle from "../BeeFlightTitle";

function getRating(foundCount, totalCount) {
  const pct = totalCount > 0 ? foundCount / totalCount : 0;
  if (pct >= 1.0) return { stars: 3, label: "Perfect Buzz! 🐝", emoji: "🐝" };
  if (pct >= 0.75) return { stars: 3, label: "Amazing! So Close!", emoji: "🌟" };
  if (pct >= 0.50) return { stars: 2, label: "Great Effort!", emoji: "👏" };
  if (pct >= 0.25) return { stars: 1, label: "Nice Start!", emoji: "👍" };
  return { stars: 0, label: "Keep Trying!", emoji: "💪" };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BuzzWordGameOver({
  score, foundWords, allWords, isRelaxed, elapsedTime, onNewGame,
}) {
  const allFound = foundWords.length === allWords.length;
  const rating = getRating(foundWords.length, allWords.length);
  const missedWords = allWords.filter(w => !foundWords.includes(w));
  const pct = allWords.length > 0 ? Math.round((foundWords.length / allWords.length) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-3">{allFound ? "🐝" : rating.emoji}</div>
      <h1 className="text-4xl font-black text-primary mb-1">
        {allFound ? <BeeFlightTitle text="Perfect Buzz!" size="text-4xl" /> : rating.label}
      </h1>

      {/* Star rating */}
      <div className="flex gap-1 mb-3">
        {[1, 2, 3].map(i => (
          <span key={i} className={`text-3xl ${i <= rating.stars ? "opacity-100" : "opacity-20"}`}>⭐</span>
        ))}
      </div>

      {/* Score breakdown */}
      <div className="bg-card border-2 border-border rounded-2xl p-4 w-full max-w-xs mb-4 text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-foreground font-bold">Score</span>
          <span className="text-primary font-black text-xl">{score}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground font-bold">Words Found</span>
          <span className="text-foreground font-black">{foundWords.length}/{allWords.length} ({pct}%)</span>
        </div>
        {elapsedTime != null && (
          <div className="flex justify-between text-muted-foreground">
            <span>Time</span>
            <span>⏱ {formatTime(elapsedTime)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Mode</span>
          <span>{isRelaxed ? "☕ Relaxed" : "⏰ Timed"}</span>
        </div>
      </div>

      {/* Missed words */}
      {missedWords.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4 max-w-sm w-full max-h-60 overflow-y-auto">
          <p className="text-base font-bold text-muted-foreground mb-2">Words you missed:</p>
          <div className="flex flex-wrap gap-2">
            {missedWords.map(w => (
              <span key={w} className="px-2.5 py-1 bg-red-900/30 border border-red-700/50 rounded-lg text-base text-red-300 font-bold">
                {w.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNewGame}
        className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4"
      >
        🔄 New Puzzle
      </button>
      <GameBackButton />
    </div>
  );
}