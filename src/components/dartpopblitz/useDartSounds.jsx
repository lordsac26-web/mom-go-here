import { useCallback } from "react";
import { useAudioStore } from "@/stores/audioStore";
import { getAudioCtx, getMaster, playRichTone, playNoiseBurst, playMelody } from "@/lib/SoundEngine";

export default function useDartSounds() {
  const muteAll = useAudioStore((s) => s.muteAll);

  const playShoot = useCallback(() => {
    if (muteAll) return;
    // Whoosh: filtered noise sweep
    playNoiseBurst({ duration: 0.18, volume: 0.2, filterType: "bandpass", filterFreq: 2200, filterQ: 0.8 });
    // Twang: pitch-dropping sawtooth + harmonic
    playRichTone({ frequency: 350, freqEnd: 120, duration: 0.14, volume: 0.1, type: "sawtooth", harmonic: 2 });
    // Subtle click transient
    playRichTone({ frequency: 1200, freqEnd: 600, duration: 0.04, volume: 0.08, type: "square" });
  }, [muteAll]);

  const playPop = useCallback(() => {
    if (muteAll) return;
    const pitch = 550 + Math.random() * 450;
    // Bright pop: sine with overtone
    playRichTone({ frequency: pitch, freqEnd: 120, duration: 0.1, volume: 0.25, type: "sine", harmonic: 2.5 });
    // Snap: high-freq noise
    playNoiseBurst({ duration: 0.05, volume: 0.2, filterType: "highpass", filterFreq: 3000, filterQ: 0.5 });
    // Subtle resonance tail
    playRichTone({ frequency: pitch * 0.5, duration: 0.15, volume: 0.06, type: "triangle", delay: 0.03 });
  }, [muteAll]);

  const playExplosion = useCallback(() => {
    if (muteAll) return;
    // Deep boom: low sawtooth sweep
    playRichTone({ frequency: 180, freqEnd: 25, duration: 0.5, volume: 0.3, type: "sawtooth", harmonic: 1.5 });
    // Rumble noise
    playNoiseBurst({ duration: 0.4, volume: 0.3, filterType: "lowpass", filterFreq: 350, filterQ: 0.5 });
    // High shrapnel
    playNoiseBurst({ duration: 0.15, volume: 0.15, filterType: "highpass", filterFreq: 4000, filterQ: 1 });
    // Impact thud
    playRichTone({ frequency: 60, freqEnd: 20, duration: 0.25, volume: 0.2, type: "sine", delay: 0.02 });
  }, [muteAll]);

  const playSniper = useCallback(() => {
    if (muteAll) return;
    // Sharp crack: fast square sweep
    playRichTone({ frequency: 1500, freqEnd: 200, duration: 0.12, volume: 0.18, type: "square" });
    // Supersonic whizz
    playNoiseBurst({ duration: 0.08, volume: 0.12, filterType: "bandpass", filterFreq: 5000, filterQ: 2 });
    // Delayed echo
    playRichTone({ frequency: 800, freqEnd: 350, duration: 0.25, volume: 0.08, type: "sine", delay: 0.06, harmonic: 3 });
    // Sub-bass punch
    playRichTone({ frequency: 100, freqEnd: 40, duration: 0.15, volume: 0.1, type: "sine", delay: 0.01 });
  }, [muteAll]);

  const playMultishot = useCallback(() => {
    if (muteAll) return;
    // Triple whoosh cascade
    [0, 0.04, 0.08].forEach((d, i) => {
      playRichTone({ frequency: 380 + i * 80, freqEnd: 140, duration: 0.12, volume: 0.12, type: "sawtooth", delay: d, harmonic: 2 });
      playNoiseBurst({ duration: 0.08, volume: 0.1, filterType: "bandpass", filterFreq: 2500 + i * 500, filterQ: 1, delay: d });
    });
  }, [muteAll]);

  const playStreakChime = useCallback(() => {
    if (muteAll) return;
    // Sparkly ascending arpeggio with harmonics
    playMelody([523, 659, 784, 1047], {
      spacing: 0.07,
      noteDuration: 0.22,
      volume: 0.14,
      type: "sine",
      harmonic: 3,
    });
    // Shimmer noise accent
    playNoiseBurst({ duration: 0.3, volume: 0.04, filterType: "highpass", filterFreq: 6000, filterQ: 0.3, delay: 0.05 });
  }, [muteAll]);

  const playMiss = useCallback(() => {
    if (muteAll) return;
    // Sad descending tone
    playRichTone({ frequency: 350, freqEnd: 80, duration: 0.25, volume: 0.1, type: "sine", harmonic: 1.5 });
    // Dull thud noise
    playNoiseBurst({ duration: 0.12, volume: 0.08, filterType: "lowpass", filterFreq: 500, filterQ: 0.5 });
  }, [muteAll]);

  const playWin = useCallback(() => {
    if (muteAll) return;
    // Triumphant ascending scale with harmonics
    playMelody([523, 587, 659, 698, 784, 880, 988, 1047], {
      spacing: 0.09,
      noteDuration: 0.35,
      volume: 0.16,
      type: "triangle",
      harmonic: 2,
    });
    // Shimmer overlay
    playNoiseBurst({ duration: 0.6, volume: 0.04, filterType: "highpass", filterFreq: 5000, filterQ: 0.3, delay: 0.15 });
    // Bass foundation
    playRichTone({ frequency: 262, duration: 0.8, volume: 0.08, type: "sine", harmonic: 2 });
  }, [muteAll]);

  return { playShoot, playPop, playExplosion, playSniper, playMultishot, playStreakChime, playMiss, playWin };
}