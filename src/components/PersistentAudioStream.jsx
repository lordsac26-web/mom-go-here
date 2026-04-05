/**
 * Invisible audio element that persists in Layout, reading stream URL
 * and volume from Zustand. The MusicPlayerFull component controls what plays.
 */
import { useEffect, useRef } from "react";
import { useAudioStore } from "@/stores/audioStore";

export default function PersistentAudioStream() {
  const musicVolume = useAudioStore(s => s.musicVolume);
  const muteAll = useAudioStore(s => s.muteAll);
  const muteMusic = useAudioStore(s => s.muteMusic);
  const currentStreamUrl = useAudioStore(s => s.currentStreamUrl);
  const isPlayerActive = useAudioStore(s => s.isPlayerActive);

  const audioRef = useRef(null);
  const isMuted = muteAll || muteMusic;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.volume = isMuted ? 0 : musicVolume;

    if (isPlayerActive && currentStreamUrl && !isMuted) {
      if (el.src !== currentStreamUrl) {
        el.src = currentStreamUrl;
      }
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [currentStreamUrl, musicVolume, isMuted, isPlayerActive]);

  return <audio ref={audioRef} style={{ display: "none" }} />;
}