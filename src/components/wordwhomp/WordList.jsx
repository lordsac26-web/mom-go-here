import { motion } from "framer-motion";

/**
 * Displays found words grouped by length, plus remaining blanks.
 * Newly found words get a brief highlight animation.
 */
export default function WordList({ foundWords, allWords, lastFoundWord }) {
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
              const isJustFound = word === lastFoundWord;
              return (
                <motion.div
                  key={word}
                  animate={isJustFound ? { scale: [1, 1.2, 1], backgroundColor: ["rgba(34,197,94,0.3)", "rgba(34,197,94,0.15)"] } : {}}
                  transition={{ duration: 0.6 }}
                  className={`px-2.5 py-1 rounded-lg text-sm font-bold border transition-all ${
                    found
                      ? "bg-green-600/20 border-green-500 text-green-400"
                      : "bg-secondary/50 border-border text-muted-foreground/40"
                  }`}
                >
                  {found ? word.toUpperCase() : word.split("").map(() => "·").join("")}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}