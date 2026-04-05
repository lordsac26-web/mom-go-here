import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Chat bubble position
  chatBubblePosition: { x: 0, y: 0 }, // bottom-right by default
  chatBubbleEnabled: true,

  // Actions
  setChatBubblePosition: (x, y) => set({ chatBubblePosition: { x, y } }),
  toggleChatBubble: () => set((state) => ({ chatBubbleEnabled: !state.chatBubbleEnabled })),
  setChatBubbleEnabled: (enabled) => set({ chatBubbleEnabled: enabled }),
}));