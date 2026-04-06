import CARD_BACK_DESIGNS from "./cardBackDesigns";

/**
 * Card back design picker for the Settings page.
 * Shows a visual preview of each design as a mini card.
 */
export default function CardBackPicker({ selected, onChange }) {
  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
      <h2 className="text-2xl font-black text-foreground mb-2">🃏 Card Back Design</h2>
      <p className="text-muted-foreground text-lg mb-4">Choose a style for your Solitaire cards</p>
      <div className="grid grid-cols-3 gap-3">
        {CARD_BACK_DESIGNS.map(design => {
          const active = selected === design.key;
          const Pattern = design.pattern;
          return (
            <button
              key={design.key}
              onClick={() => onChange(design.key)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                active ? "border-primary bg-primary/10 shadow-lg" : "border-border bg-secondary"
              }`}
            >
              {/* Mini card preview */}
              <div
                className={`w-14 aspect-[5/7] rounded-lg overflow-hidden border-2 ${design.borderColor} shadow-md relative`}
              >
                <div className={`w-full h-full bg-gradient-to-br ${design.gradient} flex items-center justify-center`}>
                  <div className={`absolute inset-0.5 rounded border ${design.innerBorder}`} />
                  <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 40 40">
                    <Pattern />
                    <rect width="40" height="40" fill={`url(#${design.patternId})`} />
                  </svg>
                  <span className="text-base relative z-10">🂠</span>
                </div>
              </div>
              <span className="text-xs font-bold text-foreground text-center leading-tight">{design.emoji} {design.label}</span>
              {active && <span className="text-sm">✅</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}