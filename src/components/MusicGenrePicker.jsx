import { useAudioStore } from "@/stores/audioStore";
import MUSIC_GENRES from "./MusicGenreData";
import useHaptics from "@/hooks/useHaptics";
import { useGameAudio } from "@/hooks/useGameAudio";

export default function MusicGenrePicker() {
  const musicGenre = useAudioStore((state) => state.musicGenre);
  const setMusicGenre = useAudioStore((state) => state.setMusicGenre);
  const muteAll = useAudioStore((state) => state.muteAll);
  const muteMusic = useAudioStore((state) => state.muteMusic);
  const { tapVibrate } = useHaptics();
  const { uiClickSound } = useGameAudio();

  const disabled = muteAll || muteMusic;

  return (
    <div className="space-y-3">
      <label className="text-lg font-bold text-foreground">🎶 Music Genre</label>
      <p className="text-sm text-muted-foreground">Pick a vibe for your background music</p>
      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {MUSIC_GENRES.map((g) => (
          <button
            key={g.key}
            onClick={() => {
              tapVibrate();
              uiClickSound();
              setMusicGenre(g.key);
            }}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-left transition-all ${
              musicGenre === g.key
                ? "border-primary bg-primary/15 shadow-md"
                : "border-border bg-secondary hover:border-primary/40"
            } disabled:opacity-40`}
          >
            <span className="text-2xl flex-shrink-0">{g.emoji}</span>
            <span className="text-sm font-bold text-foreground leading-tight truncate">{g.label}</span>
            {musicGenre === g.key && <span className="ml-auto text-lg flex-shrink-0">✅</span>}
          </button>
        ))}
      </div>
      {disabled && (
        <p className="text-xs text-muted-foreground">Enable music above to change genre.</p>
      )}
    </div>
  );
}