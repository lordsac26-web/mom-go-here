import { useState, useCallback } from "react";
import { useGameAudio } from "./useGameAudio";

/**
 * Lightweight sound hook used by simpler games (TicTacToe, etc.).
 * Now delegates to useGameAudio to avoid duplicate sound logic.
 */
export default function useGameSounds() {
  const [soundOn, setSoundOn] = useState(true);
  const { uiClickSound, matchSound, winSound } = useGameAudio();

  const playTap = useCallback(() => {
    if (!soundOn) return;
    uiClickSound();
  }, [soundOn, uiClickSound]);

  const playSuccess = useCallback(() => {
    if (!soundOn) return;
    matchSound();
  }, [soundOn, matchSound]);

  const playWin2 = useCallback(() => {
    if (!soundOn) return;
    winSound();
  }, [soundOn, winSound]);

  return { soundOn, setSoundOn, playTap, playSuccess, playWin: playWin2 };
}