/**
 * Compact toggle for nature sounds in the Layout header.
 * Shows current sound with a quick on/off tap.
 */
import { useState } from "react";
import { useAudioStore } from "@/stores/audioStore";
import { NATURE_SOUNDS } from "./NatureSoundsData";
import { Slider } from "@/components/ui/slider";

export default function NatureSoundsToggle() {
  const muteAll = useAudioStore(s => s.muteAll);
  const muteNature = useAudioStore(s => s.muteNature);
  const activeNatureSound = useAudioStore(s => s.activeNatureSound);
  const setActiveNatureSound = useAudioStore(s => s.setActiveNatureSound);
  const toggleMuteNature = useAudioStore(s => s.toggleMuteNature);
  const natureVolume = useAudioStore(s => s.natureVolume);
  const setNatureVolume = useAudioStore(s => s.setNatureVolume);

  const [showPicker, setShowPicker] = useState(false);

  if (muteAll) return null;

  const current = NATURE_SOUNDS.find(s => s.key === activeNatureSound);
  const isPlaying = current && !muteNature;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all text-sm font-bold ${
          isPlaying
            ? "bg-primary/15 border-primary/40 text-primary"
            : "bg-secondary/80 border-border text-muted-foreground"
        }`}
      >
        <span className="text-lg">{isPlaying ? current.emoji : "🌿"}</span>
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border-2 border-border rounded-2xl p-3 shadow-2xl min-w-[200px]">
            <p className="text-sm font-bold text-foreground mb-2">🌿 Nature Sounds</p>
            <div className="space-y-1">
              {NATURE_SOUNDS.map(sound => (
                <button
                  key={sound.key}
                  onClick={() => {
                    if (activeNatureSound === sound.key) {
                      setActiveNatureSound(null);
                    } else {
                      setActiveNatureSound(sound.key);
                      if (muteNature) toggleMuteNature();
                    }
                    setShowPicker(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                    activeNatureSound === sound.key
                      ? "bg-primary/15 border border-primary/40"
                      : "hover:bg-secondary border border-transparent"
                  }`}
                >
                  <span className="text-xl">{sound.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-foreground">{sound.label}</span>
                    <p className="text-xs text-muted-foreground">{sound.desc}</p>
                  </div>
                  {activeNatureSound === sound.key && (
                    <span className="text-xs text-primary font-bold">✓</span>
                  )}
                </button>
              ))}
              {activeNatureSound && (
                <>
                  {/* Nature volume slider */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground">🔊 Volume</span>
                      <span className="text-xs text-muted-foreground">{Math.round(natureVolume * 100)}%</span>
                    </div>
                    <Slider
                      value={[natureVolume * 100]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(vals) => setNatureVolume(vals[0] / 100)}
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => { setActiveNatureSound(null); setShowPicker(false); }}
                    className="w-full text-center text-sm font-bold text-destructive py-2 rounded-xl hover:bg-destructive/10 mt-2"
                  >
                    Stop Sound
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}