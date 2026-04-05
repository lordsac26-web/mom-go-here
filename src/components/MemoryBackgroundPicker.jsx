const MEMORY_BACKGROUNDS = [
  { key: "classic", label: "Classic Purple", emoji: "🟣", gradient: "from-purple-700 to-purple-900", border: "border-purple-500" },
  { key: "ocean", label: "Ocean Blue", emoji: "🌊", gradient: "from-blue-700 to-cyan-900", border: "border-blue-500" },
  { key: "forest", label: "Forest Green", emoji: "🌲", gradient: "from-green-700 to-emerald-900", border: "border-green-500" },
  { key: "sunset", label: "Sunset Orange", emoji: "🌅", gradient: "from-orange-600 to-red-900", border: "border-orange-500" },
  { key: "galaxy", label: "Galaxy Night", emoji: "🌌", gradient: "from-indigo-800 to-slate-900", border: "border-indigo-500" },
  { key: "rose", label: "Rose Garden", emoji: "🌹", gradient: "from-pink-600 to-rose-900", border: "border-pink-500" },
  { key: "gold", label: "Royal Gold", emoji: "👑", gradient: "from-yellow-600 to-amber-900", border: "border-yellow-500" },
  { key: "midnight", label: "Midnight", emoji: "🌙", gradient: "from-gray-800 to-gray-950", border: "border-gray-500" },
];

export { MEMORY_BACKGROUNDS };

export default function MemoryBackgroundPicker({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-black text-foreground text-center">🎨 Choose Card Back Style</h3>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
        {MEMORY_BACKGROUNDS.map(bg => (
          <button
            key={bg.key}
            onClick={() => onSelect(bg.key)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
              selected === bg.key ? "border-primary ring-2 ring-primary scale-105" : "border-border"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bg.gradient} ${bg.border} border-2`} />
            <span className="text-xs font-bold text-foreground text-center leading-tight">{bg.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}