export default function GameOver({ won, score, totalPopped, totalBalloons, dartsUsed, endless, onPlayAgain, onMenu }) {
  const isEndless = !!endless;

  return (
    <div className="flex flex-col items-center gap-4 py-6 px-4 max-w-md mx-auto text-center">
      <span className="text-7xl">{isEndless ? "🏆" : won ? "🎉" : "😔"}</span>
      <h2 className="text-3xl font-black text-primary">
        {isEndless ? "Great Run!" : won ? "You Popped Them All!" : "Out of Darts!"}
      </h2>

      <div className="bg-card border-2 border-border rounded-2xl p-5 w-full space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground font-bold">Score</span>
          <span className="text-primary font-black text-xl">{score.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground font-bold">Balloons Popped</span>
          <span className="text-foreground font-black">
            {totalPopped}{!isEndless && ` / ${totalBalloons}`}
          </span>
        </div>
        {!isEndless && (
          <div className="flex justify-between">
            <span className="text-muted-foreground font-bold">Darts Used</span>
            <span className="text-foreground font-black">{dartsUsed}</span>
          </div>
        )}
        {!isEndless && won && dartsUsed > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground font-bold">Accuracy</span>
            <span className="text-green-400 font-black">
              {Math.round((totalPopped / dartsUsed) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onPlayAgain}
          className="flex-1 bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl"
        >
          🔄 Play Again
        </button>
        <button
          onClick={onMenu}
          className="flex-1 bg-secondary text-foreground text-xl font-black py-4 rounded-2xl"
        >
          🏠 Menu
        </button>
      </div>
    </div>
  );
}