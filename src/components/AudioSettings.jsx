import { useAudioStore } from '@/stores/audioStore';
import { Volume2 } from 'lucide-react';
import { useGameAudio } from '@/hooks/useGameAudio';
import useHaptics from '@/hooks/useHaptics';
import VolumeSlider from './VolumeSlider';
import MusicGenrePicker from './MusicGenrePicker';

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
      <VolumeSlider
        label="🔊 Sound Effects"
        value={sfxVolume}
        onChange={(newVal) => {
          uiClickSound();
          tapVibrate();
          setSfxVolume(newVal);
        }}
        disabled={muteAll}
      />

      {/* Music Volume + Mute */}
      <VolumeSlider
        label="🎵 Ambient Music"
        value={musicVolume}
        onChange={(newVal) => {
          uiClickSound();
          tapVibrate();
          setMusicVolume(newVal);
        }}
        disabled={muteAll}
        muted={muteMusic}
        onMuteToggle={() => {
          uiClickSound();
          tapVibrate();
          toggleMuteMusic();
        }}
      />

      {/* Music Genre Picker */}
      <MusicGenrePicker />

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