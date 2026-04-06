/**
 * Nature sounds selection UI for the Settings page.
 * Shows a grid of sound choices and a volume slider.
 */
import { useAudioStore } from "@/stores/audioStore";
import { NATURE_SOUNDS } from "./NatureSoundsData";
import VolumeSlider from "./VolumeSlider";
import { TreePine } from "lucide-react";

export default function NatureSoundsPicker() {
  const muteAll = useAudioStore(s => s.muteAll);
  const muteNature = useAudioStore(s => s.muteNature);
  const natureVolume = useAudioStore(s => s.natureVolume);
  const activeNatureSound = useAudioStore(s => s.activeNatureSound);
  const setActiveNatureSound = useAudioStore(s => s.setActiveNatureSound);
  const setNatureVolume = useAudioStore(s => s.setNatureVolume);
  const toggleMuteNature = useAudioStore(s => s.toggleMuteNature);

  const disabled = muteAll;

  function handleSelect(key) {
    if (activeNatureSound === key) {
      // Toggle off
      setActiveNatureSound(null);
    } else {
      setActiveNatureSound(key);
      // Auto-unmute nature when selecting a sound
      if (muteNature) toggleMuteNature();
    }
  }

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
      <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
        <TreePine size={26} className="text-primary" /> Nature Sounds
      </h2>
      <p className="text-muted-foreground text-base">
        Play calming sounds while gaming to boost focus & relaxation
      </p>

      {/* Sound Grid */}
      <div className="grid grid-cols-3 gap-3">
        {NATURE_SOUNDS.map(sound => {
          const active = activeNatureSound === sound.key;
          return (
            <button
              key={sound.key}
              onClick={() => handleSelect(sound.key)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all disabled:opacity-40 ${
                active
                  ? "border-primary bg-primary/15 shadow-lg"
                  : "border-border bg-secondary hover:border-primary/50"
              }`}
            >
              <span className="text-3xl">{sound.emoji}</span>
              <span className="text-sm font-bold text-foreground">{sound.label}</span>
              {active && <span className="text-xs text-primary font-bold">Playing</span>}
            </button>
          );
        })}
      </div>

      {/* Volume */}
      <VolumeSlider
        label="🌿 Nature Volume"
        value={natureVolume}
        onChange={setNatureVolume}
        disabled={disabled}
        muted={muteNature}
        onMuteToggle={toggleMuteNature}
      />

      {activeNatureSound && !disabled && !muteNature && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-primary">
            {NATURE_SOUNDS.find(s => s.key === activeNatureSound)?.emoji}{" "}
            {NATURE_SOUNDS.find(s => s.key === activeNatureSound)?.label} is playing
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Works alongside music — layer both for the perfect atmosphere!
          </p>
        </div>
      )}
    </div>
  );
}