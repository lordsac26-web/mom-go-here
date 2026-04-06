import { Volume2, VolumeX, Music } from "lucide-react";
import { useAudioStore } from "../stores/audioStore";
import VolumePopover from "./VolumePopover";

export default function HeaderSoundControls() {
  const muteAll = useAudioStore((s) => s.muteAll);
  const muteMusic = useAudioStore((s) => s.muteMusic);
  const sfxVolume = useAudioStore((s) => s.sfxVolume);
  const musicVolume = useAudioStore((s) => s.musicVolume);
  const toggleMuteAll = useAudioStore((s) => s.toggleMuteAll);
  const toggleMuteMusic = useAudioStore((s) => s.toggleMuteMusic);
  const setSfxVolume = useAudioStore((s) => s.setSfxVolume);
  const setMusicVolume = useAudioStore((s) => s.setMusicVolume);

  return (
    <div className="flex items-center gap-1">
      {/* SFX toggle + volume popover */}
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

      {/* Music toggle + volume popover */}
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