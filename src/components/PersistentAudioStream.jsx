/**
 * Persistent audio stream that survives page navigations.
 * Uses a module-level Audio singleton and subscribes to the Zustand store
 * directly — no React hooks at all — to avoid dispatcher issues during
 * Suspense / lazy-load initialization.
 *
 * This component renders null; all logic lives outside React.
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

// Apply current store state to the audio element (pure function, no React)
function applyAudioState(state) {
  const el = getAudio();
  const { musicVolume, muteAll, muteMusic, currentStreamUrl, isPlayerActive } = state;
  const isMuted = muteAll || muteMusic;

  el.volume = isMuted ? 0 : musicVolume;

  if (isPlayerActive && currentStreamUrl && !isMuted) {
    if (el.src !== currentStreamUrl) {
      el.src = currentStreamUrl;
      el.load();
    }
    if (el.paused) {
      el.play().catch(() => {});
    }
  } else {
    el.pause();
  }
}

// Self-initialize: subscribe to store at module load time
// This runs once when the module is first imported, before any React render
let _storeUnsub = null;
function initAudioSync() {
  if (_storeUnsub) return; // already initialized
  // Apply initial state
  applyAudioState(useAudioStore.getState());
  // Subscribe to future changes
  _storeUnsub = useAudioStore.subscribe((state) => applyAudioState(state));
}

export default function PersistentAudioStream() {
  // Initialize on first mount (safe inside useEffect — hooks are allowed here)
  useEffect(() => {
    initAudioSync();
    // No cleanup — audio should persist across navigations
  }, []);

  return null;
}