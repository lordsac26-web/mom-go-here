import BeeFlightTitle from "../BeeFlightTitle";
import GameBackButton from "../GameBackButton";

export default function BuzzWordModeSelect({ onSelectMode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-24">
      <div className="text-8xl mb-4">🐝</div>
      <BeeFlightTitle text="Buzz Word!" size="text-4xl" className="mb-2" />
      <p className="text-xl text-muted-foreground text-center mb-8 max-w-xs">
        Build words using the honeycomb letters. The gold center letter must be in every word!
      </p>

      <p className="text-lg font-bold text-muted-foreground mb-4">Choose Your Mode:</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onSelectMode("timed")}
          className="w-full bg-card border-2 border-border rounded-2xl p-5 text-left shadow-xl active:scale-95 transition-transform hover:border-primary"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏰</span>
            <div>
              <p className="text-xl font-black text-foreground">Timed (3 min)</p>
              <p className="text-sm text-muted-foreground">Race against the clock!</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => onSelectMode("relaxed")}
          className="w-full bg-card border-2 border-border rounded-2xl p-5 text-left shadow-xl active:scale-95 transition-transform hover:border-primary"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">☕</span>
            <div>
              <p className="text-xl font-black text-foreground">Relaxed (No Timer)</p>
              <p className="text-sm text-muted-foreground">Take your time and enjoy</p>
            </div>
          </div>
        </button>
      </div>
      <div className="mt-6">
        <GameBackButton />
      </div>
    </div>
  );
}