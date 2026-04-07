import { create } from 'zustand';

export const useAudioStore = create((set) => ({
  // Settings — sound ON by default at 75%
  sfxVolume: 0.75,
  musicVolume: 0.5,
  muteAll: false,
  muteMusic: true,
  musicGenre: 'ambient',
  currentStreamUrl: '',
  currentStationName: '',
  isPlayerActive: false,

  // Actions
  setSfxVolume: (v) => set({ sfxVolume: v }),
  setMusicVolume: (v) => set({ musicVolume: v }),
  toggleMuteAll: () => set((s) => ({ muteAll: !s.muteAll })),
  toggleMuteMusic: () => set((s) => ({ muteMusic: !s.muteMusic })),
  setMusicGenre: (g) => set({ musicGenre: g }),
  setCurrentStreamUrl: (url) => set({ currentStreamUrl: url }),
  setCurrentStationName: (name) => set({ currentStationName: name }),
  setPlayerActive: (active) => set({ isPlayerActive: active }),

  // Derived helpers
  isSfxEnabled: () => !useAudioStore.getState().muteAll,
  isMusicEnabled: () => {
    const s = useAudioStore.getState();
    return !s.muteAll && !s.muteMusic;
  },
}));