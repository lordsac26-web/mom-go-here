import FlipCard from "../FlipCard";
import { MEMORY_BACKGROUNDS } from "../MemoryBackgroundPicker";

export default function MemoryTile({ card, onClick, bgStyle }) {
  const isRevealed = card.flipped || card.matched;
  const bg = bgStyle || MEMORY_BACKGROUNDS[0];

  const backContent = (
    <div className={`w-full h-full bg-gradient-to-br ${bg.gradient} rounded-xl border-4 ${bg.border} flex items-center justify-center shadow-lg`}>
      <span className="text-3xl">{bg.emoji}</span>
    </div>
  );

  const frontContent = (
    <div className={`w-full h-full rounded-xl border-4 flex items-center justify-center shadow-lg text-4xl ${
      card.matched
        ? "bg-gradient-to-br from-green-600 to-green-800 border-green-400"
        : "bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-400"
    }`}>
      {card.emoji}
    </div>
  );

  return (
    <FlipCard
      isFlipped={isRevealed}
      front={frontContent}
      back={backContent}
      onTap={() => onClick(card.id)}
      disabled={card.matched || card.flipped}
      matchPulse={card.matched}
      flipDuration={0.45}
    />
  );
}