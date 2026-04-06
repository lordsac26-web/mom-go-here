/**
 * Invisible audio element for nature/ambient sounds.
 * Runs independently from the music radio stream so both can play together.
 * Reads state from audioStore.
 */
import { useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/audioStore";
import { NATURE_SOUNDS } from "./NatureSoundsData";

export default function NatureSoundsPlayer() {
  const muteAll = useAudioStore(s => s.muteAll);
  const muteNature = useAudioStore(s => s.muteNature);
  const natureVolume = useAudioStore(s => s.natureVolume);
  const activeNatureSound = useAudioStore(s => s.activeNatureSound);

  const audioRef = useRef(null);
  const isMuted = muteAll || muteNature || !activeNatureSound;

  const sound = NATURE_SOUNDS.find(s => s.key === activeNatureSound);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (isMuted || !sound) {
      el.pause();
      return;
    }

    el.volume = natureVolume;
    el.loop = true;

    if (el.getAttribute("data-key") !== sound.key) {
      el.src = sound.url;
      el.setAttribute("data-key", sound.key);
    }
    el.play().catch(() => {});
  }, [activeNatureSound, natureVolume, isMuted, sound]);

  // Update volume without restarting
  useEffect(() => {
    const el = audioRef.current;
    if (el && !isMuted) {
      el.volume = natureVolume;
    }
  }, [natureVolume, isMuted]);

  return <audio ref={audioRef} style={{ display: "none" }} />;
}