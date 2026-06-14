import GameSpinner from "./GameSpinner";

/**
 * Senior-friendly loading spinner with a warm message.
 * Usage: <WarmLoader message="Loading your inspiration..." />
 */
export default function WarmLoader({ message = "Just a moment..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <GameSpinner size="lg" />
      <p className="text-xl text-muted-foreground font-bold text-center px-6">{message}</p>
    </div>
  );
}