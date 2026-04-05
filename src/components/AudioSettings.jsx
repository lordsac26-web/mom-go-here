import { useAudioStore } from '@/stores/audioStore';
import { Volume2, Volume, VolumeX } from 'lucide-react';
import { useGameAudio } from '@/hooks/useGameAudio';
import useHaptics from '@/hooks/useHaptics';

/**
 * Audio settings panel for volume sliders and mute toggles.
 * Appears in the Settings page.
 */
export default function AudioSettings() {
  const { uiClickSound } = useGameAudio();
  const { tapVibrate } = useHaptics();
  const sfxVolume = useAudioStore((state) => state.sfxVolume);
  const musicVolume = useAudioStore((state) => state.musicVolume);
  const muteAll = useAudioStore((state) => state.muteAll);
  const muteMusic = useAudioStore((state) => state.muteMusic);

  const setSfxVolume = useAudioStore((state) => state.setSfxVolume);
  const setMusicVolume = useAudioStore((state) => state.setMusicVolume);
  const toggleMuteAll = useAudioStore((state) => state.toggleMuteAll);
  const toggleMuteMusic = useAudioStore((state) => state.toggleMuteMusic);

  return (
    <div className="bg-card border-2 border-primary rounded-2xl p-6 space-y-6">
      <h2 className="text-3xl font-black text-primary flex items-center gap-2">
        <Volume2 size={32} /> Sound & Music
      </h2>

      {/* Master Mute Toggle */}
      <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
        <div>
          <p className="text-lg font-bold text-foreground">Mute All Sound</p>
          <p className="text-sm text-muted-foreground">Turn off all audio</p>
        </div>
        <button
          onClick={() => {
            uiClickSound();
            tapVibrate();
            toggleMuteAll();
          }}
          className={`px-6 py-3 rounded-lg font-black text-lg transition-all ${
            muteAll
              ? 'bg-red-600 text-white'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {muteAll ? '🔇 OFF' : '🔊 ON'}
        </button>
      </div>

      {/* Sound Effects Volume */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Volume size={24} /> Sound Effects
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={sfxVolume * 100}
          onChange={(e) => {
            uiClickSound();
            tapVibrate();
            setSfxVolume(e.target.value / 100);
          }}
          disabled={muteAll}
          className={`w-full h-3 rounded-lg appearance-none bg-muted cursor-pointer ${
            muteAll ? 'opacity-50' : ''
          }`}
          style={{
            background: muteAll
              ? 'hsl(var(--muted))'
              : `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                  sfxVolume * 100
                }%, hsl(var(--muted)) ${sfxVolume * 100}%, hsl(var(--muted)) 100%)`,
          }}
        />
        <p className="text-sm text-muted-foreground text-center">
          {Math.round(sfxVolume * 100)}%
        </p>
      </div>

      {/* Music Volume + Mute */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Volume size={24} /> Ambient Music
          </label>
          <button
            onClick={() => {
              uiClickSound();
              tapVibrate();
              toggleMuteMusic();
            }}
            disabled={muteAll}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              muteMusic
                ? 'bg-red-600 text-white'
                : 'bg-primary text-primary-foreground'
            } ${muteAll ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {muteMusic ? '🔇' : '🎵'}
          </button>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={musicVolume * 100}
          onChange={(e) => {
            uiClickSound();
            tapVibrate();
            setMusicVolume(e.target.value / 100);
          }}
          disabled={muteAll || muteMusic}
          className={`w-full h-3 rounded-lg appearance-none bg-muted cursor-pointer ${
            muteAll || muteMusic ? 'opacity-50' : ''
          }`}
          style={{
            background:
              muteAll || muteMusic
                ? 'hsl(var(--muted))'
                : `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                    musicVolume * 100
                  }%, hsl(var(--muted)) ${musicVolume * 100}%, hsl(var(--muted)) 100%)`,
          }}
        />
        <p className="text-sm text-muted-foreground text-center">
          {Math.round(musicVolume * 100)}%
        </p>
      </div>

      {/* Info */}
      <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
        <p>
          🎮 <span className="font-bold">Tip:</span> Enable sound for the best game experience!
          All games include audio cues for actions and feedback.
        </p>
      </div>
    </div>
  );
}