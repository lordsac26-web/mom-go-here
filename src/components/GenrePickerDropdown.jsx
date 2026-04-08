import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import MUSIC_GENRES from "./MusicGenreData";

export default function GenrePickerDropdown({ musicGenre, onSelect, onClose }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const ps = new PerfectScrollbar(scrollRef.current, {
      wheelPropagation: false,
      suppressScrollX: true,
      swipeEasing: true,
      minScrollbarLength: 30,
    });
    return () => ps.destroy();
  }, []);

  return (
    <div className="w-full p-3">
      <div ref={scrollRef} className="relative max-h-64 overflow-hidden">
        <div className="grid grid-cols-2 gap-1.5">
          {MUSIC_GENRES.map(g => (
            <button
              key={g.key}
              onClick={() => onSelect(g.key)}
              title={g.label}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                musicGenre === g.key
                  ? 'border-primary bg-primary/15 shadow-sm'
                  : 'border-border bg-secondary hover:border-primary/40'
              }`}
            >
              <span className="text-lg flex-shrink-0">{g.emoji}</span>
              <span className="text-xs font-bold text-foreground truncate">{g.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}