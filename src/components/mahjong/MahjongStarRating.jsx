/**
 * Star rating for Mahjong based on moves vs pair count.
 * ≤ pairs         → 3 stars (perfect!)
 * ≤ pairs × 1.5   → 2 stars (great!)
 * else            → 1 star  (good try!)
 */
export function getStarRating(moves, pairs) {
  if (moves <= pairs) return 3;
  if (moves <= Math.ceil(pairs * 1.5)) return 2;
  return 1;
}

const STAR_LABELS = {
  3: "Perfect Game! 🧠",
  2: "Great Job! 👏",
  1: "Good Try! 💪",
};

export default function MahjongStarRating({ moves, pairs }) {
  const stars = getStarRating(moves, pairs);

  return (
    <div className="text-center mb-4">
      <div className="text-5xl mb-2">
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className={i < stars ? "" : "opacity-20"}>⭐</span>
        ))}
      </div>
      <p className="text-lg font-bold text-primary">{STAR_LABELS[stars]}</p>
    </div>
  );
}