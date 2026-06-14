/**
 * Standardized, mobile-smooth loading spinner used across all game screens.
 *
 * - GPU-composited (transform-only) rotation via Tailwind's animate-spin.
 * - `will-change: transform` keeps it buttery on low-end mobile devices.
 * - Sizes map to a consistent scale so loaders feel uniform everywhere.
 *
 * Usage:
 *   <GameSpinner />                 // default medium
 *   <GameSpinner size="lg" />
 *   <GameSpinner size="sm" className="text-white" />
 */
const SIZES = {
  sm: "w-8 h-8 border-[3px]",
  md: "w-12 h-12 border-4",
  lg: "w-14 h-14 border-4",
};

export default function GameSpinner({ size = "md", className = "" }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${SIZES[size] || SIZES.md} border-primary/25 border-t-primary rounded-full animate-spin ${className}`}
      style={{ willChange: "transform" }}
    />
  );
}