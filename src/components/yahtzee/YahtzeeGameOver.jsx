import GameBackButton from "../GameBackButton";

const UPPER_BONUS_TARGET = 63;
const UPPER_BONUS_VALUE = 35;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getRating(score) {
  if (score >= 300) return { stars: 3, label: "Legendary! 🏆", emoji: "🏆" };
  if (score >= 225) return { stars: 2, label: "Great Game! 🌟", emoji: "🌟" };
  if (score >= 150) return { stars: 1, label: "Nice Job! 👍", emoji: "👍" };
  return { stars: 0, label: "Keep Practicing! 💪", emoji: "💪" };
}

export default function YahtzeeGameOver({
  totalScore, upperSubtotal, lowerSubtotal, upperBonusEarned,
  yahtzeeBonus, winTime, onPlayAgain,
}) {
  const rating = getRating(totalScore);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="text-8xl mb-3">🎲</div>
      <h1 className="text-4xl font-black text-primary mb-1">Game Complete!</h1>
      <p className="text-xl text-muted-foreground mb-4">{rating.label}</p>

      {/* Star rating */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3].map(i => (
          <span key={i} className={`text-3xl ${i <= rating.stars ? "opacity-100" : "opacity-20"}`}>⭐</span>
        ))}
      </div>

      {/* Score breakdown */}
      <div className="bg-card border-2 border-border rounded-2xl p-4 w-full max-w-xs mb-4 text-left space-y-2">
        <div className="flex justify-between">
          <span className="text-foreground font-bold">Upper Section</span>
          <span className="text-foreground font-black">{upperSubtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-sm">Upper Bonus {upperBonusEarned ? "✅" : `(need ${UPPER_BONUS_TARGET})`}</span>
          <span className={`font-black ${upperBonusEarned ? "text-green-400" : "text-muted-foreground"}`}>
            {upperBonusEarned ? `+${UPPER_BONUS_VALUE}` : "0"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground font-bold">Lower Section</span>
          <span className="text-foreground font-black">{lowerSubtotal}</span>
        </div>
        {yahtzeeBonus > 0 && (
          <div className="flex justify-between">
            <span className="text-yellow-400 font-bold">Yahtzee Bonus</span>
            <span className="text-yellow-400 font-black">+{yahtzeeBonus}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between">
          <span className="text-primary font-black text-lg">Total</span>
          <span className="text-primary font-black text-2xl">{totalScore}</span>
        </div>
        {winTime != null && (
          <div className="flex justify-between text-muted-foreground text-sm">
            <span>Time</span>
            <span>⏱ {formatTime(winTime)}</span>
          </div>
        )}
      </div>

      <button
        onClick={onPlayAgain}
        className="bg-primary text-primary-foreground text-2xl font-black px-8 py-5 rounded-2xl shadow-xl mb-4"
      >
        🔄 Play Again
      </button>
      <GameBackButton />
    </div>
  );
}