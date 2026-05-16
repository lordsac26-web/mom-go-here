import { useState, useEffect } from "react";
import { Volume2, VolumeX, Music } from "lucide-react";
import { useAudioStore } from "../stores/audioStore";
import VolumePopover from "./VolumePopover";

/**
 * Uses vanilla Zustand subscribe() instead of hook selectors to avoid
 * the duplicate-React / null-dispatcher crash that hits useSyncExternalStore.
 */
export default function HeaderSoundControls() {
  const [state, setState] = useState(() => {
    const s = useAudioStore.getState();
    return {
      muteAll: s.muteAll,
      muteMusic: s.muteMusic,
      sfxVolume: s.sfxVolume,
      musicVolume: s.musicVolume,
    };
  });

  useEffect(() => {
    const unsub = useAudioStore.subscribe((s) =>
      setState({
        muteAll: s.muteAll,
        muteMusic: s.muteMusic,
        sfxVolume: s.sfxVolume,
        musicVolume: s.musicVolume,
      })
    );
    return unsub;
  }, []);

  const { muteAll, muteMusic, sfxVolume, musicVolume } = state;
  const toggleMuteAll = () => useAudioStore.getState().toggleMuteAll();
  const toggleMuteMusic = () => useAudioStore.getState().toggleMuteMusic();
  const setSfxVolume = (v) => useAudioStore.getState().setSfxVolume(v);
  const setMusicVolume = (v) => useAudioStore.getState().setMusicVolume(v);

  return (
    <div className="flex items-center gap-1">
      <VolumePopover
        volume={sfxVolume}
        onVolumeChange={setSfxVolume}
        label="Sound Effects"
        emoji="🔊"
        disabled={muteAll}
      >
        <button
          onClick={toggleMuteAll}
          className={`p-2 rounded-xl transition-colors ${
            muteAll ? "bg-destructive/20 text-destructive" : "bg-primary/15 text-primary"
          }`}
          aria-label={muteAll ? "Unmute sound effects" : "Mute sound effects"}
          title={muteAll ? "Sound effects OFF" : "Sound effects ON"}
        >
          {muteAll ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </VolumePopover>

      <VolumePopover
        volume={musicVolume}
        onVolumeChange={setMusicVolume}
        label="Music"
        emoji="🎵"
        disabled={muteAll || muteMusic}
      >
        <button
          onClick={toggleMuteMusic}
          className={`p-2 rounded-xl transition-colors ${
            muteMusic ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"
          }`}
          aria-label={muteMusic ? "Unmute music" : "Mute music"}
          title={muteMusic ? "Music OFF" : "Music ON"}
        >
          <Music size={20} className={muteMusic ? "opacity-50" : ""} />
        </button>
      </VolumePopover>
    </div>
  );
}