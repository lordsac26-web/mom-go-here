const STARTERS = [
  { emoji: "🐕", text: "A happy golden retriever playing in a sunny garden" },
  { emoji: "🌅", text: "A beautiful sunset over a calm ocean with orange and pink clouds" },
  { emoji: "🏠", text: "A cozy cottage in the woods during winter with snow on the roof" },
  { emoji: "🌸", text: "A bouquet of colorful flowers in a glass vase on a table" },
  { emoji: "🏔️", text: "A peaceful mountain lake surrounded by tall pine trees" },
  { emoji: "🐱", text: "A fluffy cat sleeping on a windowsill in the afternoon sun" },
];

export default function PromptStarters({ onSelect }) {
  return (
    <div className="mt-3 pt-3 border-t border-border">
      <p className="text-base font-bold text-muted-foreground mb-2">💡 Or try one of these ideas:</p>
      <div className="flex flex-wrap gap-2">
        {STARTERS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s.text)}
            className="flex items-center gap-1.5 bg-secondary text-foreground text-sm font-bold px-3 py-2.5 rounded-xl border-2 border-border hover:border-primary active:scale-95 transition-all"
          >
            <span>{s.emoji}</span>
            <span className="max-w-[140px] truncate">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}