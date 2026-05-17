import { useState, useEffect } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { Volume2 } from 'lucide-react';
import { useGameAudio } from '@/hooks/useGameAudio';
import useHaptics from '@/hooks/useHaptics';
import VolumeSlider from './VolumeSlider';

/**
 * Audio settings panel for volume sliders and mute toggles.
 * Uses getState() + subscribe to avoid the null-dispatcher crash from
 * the SDK's bundled React chunk conflicting with Zustand's hook selector.
 */
export default function AudioSettings() {
  const { uiClickSound } = useGameAudio();
  const { tapVibrate } = useHaptics();

  const [sfxVolume, setSfxVolumeState] = useState(() => useAudioStore.getState().sfxVolume);
  const [musicVolume, setMusicVolumeState] = useState(() => useAudioStore.getState().musicVolume);
  const [muteAll, setMuteAll] = useState(() => useAudioStore.getState().muteAll);
  const [muteMusic, setMuteMusic] = useState(() => useAudioStore.getState().muteMusic);

  useEffect(() => {
    const unsub = useAudioStore.subscribe((s) => {
      setSfxVolumeState(s.sfxVolume);
      setMusicVolumeState(s.musicVolume);
      setMuteAll(s.muteAll);
      setMuteMusic(s.muteMusic);
    });
    // Sync initial state in case store already differs
    const s = useAudioStore.getState();
    setSfxVolumeState(s.sfxVolume);
    setMusicVolumeState(s.musicVolume);
    setMuteAll(s.muteAll);
    setMuteMusic(s.muteMusic);
    return unsub;
  }, []);

  const setSfxVolume = (v) => useAudioStore.getState().setSfxVolume(v);
  const setMusicVolume = (v) => useAudioStore.getState().setMusicVolume(v);
  const toggleMuteAll = () => useAudioStore.getState().toggleMuteAll();
  const toggleMuteMusic = () => useAudioStore.getState().toggleMuteMusic();

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