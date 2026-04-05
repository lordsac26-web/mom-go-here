import { useAudioStore } from '@/stores/audioStore';
import { Volume2, VolumeX, Music, Volume1 } from 'lucide-react';
import { useGameAudio } from '@/hooks/useGameAudio';
import useHaptics from '@/hooks/useHaptics';
import MUSIC_GENRES from './MusicGenreData';

/**
 * Compact, all-in-one audio settings panel.
 * Master toggle, SFX slider, ambient toggle + genre picker.
 */
export default function CompactAudioSettings() {
  const { uiClickSound } = useGameAudio();
  const { tapVibrate } = useHaptics();

  const sfxVolume = useAudioStore(s => s.sfxVolume);
  const musicVolume = useAudioStore(s => s.musicVolume);
  const muteAll = useAudioStore(s => s.muteAll);
  const muteMusic = useAudioStore(s => s.muteMusic);
  const musicGenre = useAudioStore(s => s.musicGenre);

  const setSfxVolume = useAudioStore(s => s.setSfxVolume);
  const setMusicVolume = useAudioStore(s => s.setMusicVolume);
  const toggleMuteAll = useAudioStore(s => s.toggleMuteAll);
  const toggleMuteMusic = useAudioStore(s => s.toggleMuteMusic);
  const setMusicGenre = useAudioStore(s => s.setMusicGenre);

  const isMusicEnabled = !muteAll && !muteMusic;

  function tap(fn) {
    return () => { uiClickSound(); tapVibrate(); fn(); };
  }

  return (
    <div className="space-y-4">
      {/* Master Sound Toggle */}
      <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          {muteAll ? <VolumeX size={22} className="text-red-400" /> : <Volume2 size={22} className="text-green-400" />}
          <span className="text-lg font-bold text-foreground">All Sound</span>
        </div>
        <button
          onClick={tap(toggleMuteAll)}
          className={`px-5 py-2 rounded-lg font-black text-base transition-all ${
            muteAll ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
        >
          {muteAll ? '🔇 OFF' : '🔊 ON'}
        </button>
      </div>

      {!muteAll && (
        <>
          {/* SFX Volume — compact inline */}
          <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
            <span className="text-lg">🔊</span>
            <span className="text-base font-bold text-foreground whitespace-nowrap">Effects</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxVolume * 100}
              onChange={(e) => setSfxVolume(e.target.value / 100)}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-primary"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${sfxVolume * 100}%, hsl(var(--muted)) ${sfxVolume * 100}%, hsl(var(--muted)) 100%)`,
              }}
            />
            <span className="text-sm font-bold text-muted-foreground w-10 text-right">{Math.round(sfxVolume * 100)}%</span>
          </div>

          {/* Ambient Music Toggle + Volume */}
          <div className="bg-secondary rounded-xl px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music size={22} className={isMusicEnabled ? "text-primary" : "text-muted-foreground"} />
                <span className="text-base font-bold text-foreground">Ambient Music</span>
              </div>
              <button
                onClick={tap(toggleMuteMusic)}
                className={`px-5 py-2 rounded-lg font-black text-base transition-all ${
                  muteMusic ? 'bg-red-600 text-white' : 'bg-primary text-primary-foreground'
                }`}
              >
                {muteMusic ? '🔇 OFF' : '🎵 ON'}
              </button>
            </div>

            {isMusicEnabled && (
              <>
                {/* Music volume inline */}
                <div className="flex items-center gap-3">
                  <Volume1 size={18} className="text-muted-foreground" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={musicVolume * 100}
                    onChange={(e) => setMusicVolume(e.target.value / 100)}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${musicVolume * 100}%, hsl(var(--muted)) ${musicVolume * 100}%, hsl(var(--muted)) 100%)`,
                    }}
                  />
                  <span className="text-sm font-bold text-muted-foreground w-10 text-right">{Math.round(musicVolume * 100)}%</span>
                </div>

                {/* Genre picker — compact horizontal scroll */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {MUSIC_GENRES.slice(0, 12).map(g => (
                    <button
                      key={g.key}
                      onClick={() => { tapVibrate(); uiClickSound(); setMusicGenre(g.key); }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all ${
                        musicGenre === g.key
                          ? 'border-primary bg-primary/15'
                          : 'border-border bg-card hover:border-primary/40'
                      }`}
                    >
                      <span className="text-lg">{g.emoji}</span>
                      <span className="text-xs font-bold text-foreground whitespace-nowrap">{g.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  🎧 Music player appears in the header when playing
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}