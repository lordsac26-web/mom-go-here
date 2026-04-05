/**
 * Displays found words grouped by length, plus remaining blanks.
 */
export default function WordList({ foundWords, allWords }) {
  // Group all possible words by length
  const grouped = {};
  allWords.forEach(w => {
    const len = w.length;
    if (!grouped[len]) grouped[len] = [];
    grouped[len].push(w);
  });

  const lengths = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-3">
      {lengths.map(len => (
        <div key={len}>
          <div className="text-sm font-black text-muted-foreground mb-1">
            {len}-letter words ({grouped[len].filter(w => foundWords.includes(w)).length}/{grouped[len].length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {grouped[len].map(word => {
              const found = foundWords.includes(word);
              return (
                <div
                  key={word}
                  className={`px-2.5 py-1 rounded-lg text-sm font-bold border transition-all ${
                    found
                      ? "bg-green-600/20 border-green-500 text-green-400"
                      : "bg-secondary/50 border-border text-muted-foreground/40"
                  }`}
                >
                  {found ? word.toUpperCase() : word.split("").map(() => "·").join("")}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}