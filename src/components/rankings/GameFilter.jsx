import { motion } from "framer-motion";

export default function GameFilter({ games, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar">
      <FilterChip
        label="All Games"
        emoji="🏆"
        active={selected === null}
        onClick={() => onSelect(null)}
      />
      {games.map((g) => (
        <FilterChip
          key={g.name}
          label={g.name}
          emoji={g.emoji}
          active={selected === g.name}
          onClick={() => onSelect(g.name)}
        />
      ))}
    </div>
  );
}

function FilterChip({ label, emoji, active, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full border-2 whitespace-nowrap text-sm font-bold transition-colors flex-shrink-0 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary text-foreground hover:border-primary/40"
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </motion.button>
  );
}