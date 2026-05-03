/**
 * Persistent audio stream that survives page navigations.
 * Uses a module-level Audio singleton so the stream never interrupts,
 * even if the component remounts during route transitions.
 */
import { useEffect } from "react";
import { useAudioStore } from "@/stores/audioStore";

// Module-level singleton — survives component mount/unmount cycles
let _audio = null;
function getAudio() {
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = "none";
  }
  return _audio;
}

export default function PersistentAudioStream() {
  const musicVolume = useAudioStore(s => s.musicVolume);
  const muteAll = useAudioStore(s => s.muteAll);
  const muteMusic = useAudioStore(s => s.muteMusic);
  const currentStreamUrl = useAudioStore(s => s.currentStreamUrl);
  const isPlayerActive = useAudioStore(s => s.isPlayerActive);

  const isMuted = muteAll || muteMusic;

  useEffect(() => {
    const el = getAudio();

    el.volume = isMuted ? 0 : musicVolume;

    if (isPlayerActive && currentStreamUrl && !isMuted) {
      if (el.src !== currentStreamUrl) {
        el.src = currentStreamUrl;
        el.load();
      }
      // Only call play if actually paused to avoid redundant play() promises
      if (el.paused) {
        el.play().catch(() => {});
      }
    } else if (!isPlayerActive || isMuted) {
      el.pause();
    }
  }, [currentStreamUrl, musicVolume, isMuted, isPlayerActive]);

  // Do NOT pause on unmount — that's the whole point of persistence
  return null;
}