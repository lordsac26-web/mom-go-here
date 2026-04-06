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

  // Nature sounds
  activeNatureSound: null,
  natureVolume: 0.5,
  muteNature: false,

  // Actions
  setSfxVolume: (vol) => set({ sfxVolume: Math.max(0, Math.min(1, vol)) }),
  setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(1, vol)) }),
  toggleMuteAll: () => set((state) => ({ muteAll: !state.muteAll })),
  toggleMuteMusic: () => set((state) => ({ muteMusic: !state.muteMusic })),
  setMusicGenre: (genre) => set({ musicGenre: genre }),
  setCurrentStreamUrl: (url) => set({ currentStreamUrl: url }),
  setCurrentStationName: (name) => set({ currentStationName: name }),
  setPlayerActive: (val) => set({ isPlayerActive: val }),

  // Nature sound actions
  setActiveNatureSound: (key) => set({ activeNatureSound: key }),
  setNatureVolume: (vol) => set({ natureVolume: Math.max(0, Math.min(1, vol)) }),
  toggleMuteNature: () => set((state) => ({ muteNature: !state.muteNature })),
  
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