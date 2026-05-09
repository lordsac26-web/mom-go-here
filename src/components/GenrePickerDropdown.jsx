import MUSIC_GENRES from "./MusicGenreData";

export default function GenrePickerDropdown({ musicGenre, onSelect }) {
  return (
    <div className="w-full px-3 pb-6 pt-1">
      <div className="max-h-[50vh] overflow-y-auto overscroll-contain -mx-1 px-1">
        <div className="grid grid-cols-2 gap-2">
          {MUSIC_GENRES.map(g => (
            <button
              key={g.key}
              onClick={() => onSelect(g.key)}
              className={`flex items-center gap-2.5 px-3 py-3.5 rounded-xl border text-left transition-all active:scale-[0.97] ${
                musicGenre === g.key
                  ? 'border-primary bg-primary/15 shadow-md ring-1 ring-primary/30'
                  : 'border-border bg-secondary hover:border-primary/40'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{g.emoji}</span>
              <span className={`text-sm font-bold truncate ${musicGenre === g.key ? 'text-primary' : 'text-foreground'}`}>{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}