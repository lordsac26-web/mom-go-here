import { useState, useCallback } from "react";
import { playRichTone, playNoiseBurst, playMelody } from "@/lib/SoundEngine";

export default function useGameSounds() {
  const [soundOn, setSoundOn] = useState(true);

  const playTap = useCallback(() => {
    if (!soundOn) return;
    // Crisp click with subtle overtone
    playRichTone({ frequency: 900, freqEnd: 650, duration: 0.07, volume: 0.12, type: "sine", harmonic: 3 });
    playNoiseBurst({ duration: 0.03, volume: 0.06, filterType: "highpass", filterFreq: 4000, filterQ: 1 });
  }, [soundOn]);

  const playSuccess = useCallback(() => {
    if (!soundOn) return;
    // Bright ascending arpeggio
    playMelody([523, 659, 784, 1047], {
      spacing: 0.08,
      noteDuration: 0.2,
      volume: 0.15,
      type: "sine",
      harmonic: 3,
    });
    playNoiseBurst({ duration: 0.2, volume: 0.03, filterType: "highpass", filterFreq: 5000, filterQ: 0.3, delay: 0.05 });
  }, [soundOn]);

  const playWin = useCallback(() => {
    if (!soundOn) return;
    // Full triumphant fanfare
    playMelody([523, 587, 659, 698, 784, 880, 988, 1047], {
      spacing: 0.09,
      noteDuration: 0.35,
      volume: 0.16,
      type: "triangle",
      harmonic: 2,
    });
    playRichTone({ frequency: 262, duration: 0.8, volume: 0.08, type: "sine", harmonic: 2 });
    playNoiseBurst({ duration: 0.5, volume: 0.03, filterType: "highpass", filterFreq: 5000, filterQ: 0.3, delay: 0.2 });
  }, [soundOn]);

  return { soundOn, setSoundOn, playTap, playSuccess, playWin };
}