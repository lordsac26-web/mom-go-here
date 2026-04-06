import { create } from 'zustand';

export const useAudioStore = create((set) => ({
  // Settings
  sfxVolume: 0.7,
  musicVolume: 0.5,
  muteAll: true,
  muteMusic: true,
  musicGenre: 'ambient',
  currentStreamUrl: '',
  currentStationName: '',
  isPlayerActive: false,
  
  // Derived: Is SFX enabled?
  isSfxEnabled: () => {
    const state = useAudioStore.getState();
    return !state.muteAll;
  },
  
  // Derived: Is music enabled?
  isMusicEnabled: () => {
    const state = useAudioStore.getState();
    return !state.muteAll && !state.muteMusic;
  },
}));