/**
 * Senior-friendly loading spinner with a warm message.
 * Usage: <WarmLoader message="Loading your inspiration..." />
 */
export default function WarmLoader({ message = "Just a moment..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xl text-muted-foreground font-bold text-center px-6">{message}</p>
    </div>
  );
}