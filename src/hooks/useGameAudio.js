import { useCallback } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { getAudioCtx, getMaster, playRichTone, playNoiseBurst, playMelody } from '@/lib/SoundEngine';

/**
 * Game audio system with rich procedural sound effects.
 * Multi-layered synthesis with harmonics, filtered noise, and proper envelopes.
 */
export function useGameAudio() {
  const sfxVolume = useAudioStore((state) => state.sfxVolume);
  const muteAll = useAudioStore((state) => state.muteAll);

  const vol = muteAll || sfxVolume === 0 ? 0 : sfxVolume / 2;
  const ok = () => vol > 0;

  const initAudioContext = () => getAudioCtx();

  // Dice shake: rattling swoosh with percussive accents
  const diceshakeSound = useCallback(() => {
    if (!ok()) return;
    // Swoosh: filtered noise sweep
    playNoiseBurst({ duration: 0.3, volume: 0.2 * vol, filterType: "bandpass", filterFreq: 1800, filterQ: 0.6 });
    // Rattle accents
    [0, 0.07, 0.15, 0.22].forEach(d => {
      playRichTone({
        frequency: 400 + Math.random() * 200,
        freqEnd: 200,
        duration: 0.06,
        volume: 0.08 * vol,
        type: "square",
        delay: d,
      });
    });
    // Sub-body movement
    playRichTone({ frequency: 200, freqEnd: 600, duration: 0.3, volume: 0.1 * vol, type: "sine" });
  }, [vol]);

  // Dice collision: satisfying wooden impact
  const diceCollideSound = useCallback(() => {
    if (!ok()) return;
    // Sharp impact transient
    playRichTone({ frequency: 900, freqEnd: 300, duration: 0.08, volume: 0.18 * vol, type: "square" });
    // Noise impact
    playNoiseBurst({ duration: 0.06, volume: 0.15 * vol, filterType: "bandpass", filterFreq: 3000, filterQ: 1.5 });
    // Woody resonance
    playRichTone({ frequency: 280, freqEnd: 140, duration: 0.2, volume: 0.12 * vol, type: "sine", delay: 0.02, harmonic: 2.3 });
    // Table thud
    playRichTone({ frequency: 80, freqEnd: 40, duration: 0.15, volume: 0.08 * vol, type: "sine", delay: 0.01 });
  }, [vol]);

  // Checker: plastic piece slide + placement
  const checkerFlipSound = useCallback(() => {
    if (!ok()) return;
    // Slide friction
    playNoiseBurst({ duration: 0.1, volume: 0.08 * vol, filterType: "bandpass", filterFreq: 2500, filterQ: 0.8 });
    // Snap placement
    playRichTone({ frequency: 650, freqEnd: 400, duration: 0.1, volume: 0.12 * vol, type: "triangle", harmonic: 2 });
    // Thud
    playRichTone({ frequency: 180, duration: 0.12, volume: 0.08 * vol, type: "sine", delay: 0.05 });
  }, [vol]);

  // Mahjong tile: ceramic click
  const mahjongTileSound = useCallback(() => {
    if (!ok()) return;
    // High ceramic click
    playRichTone({ frequency: 1200, freqEnd: 800, duration: 0.06, volume: 0.1 * vol, type: "sine", harmonic: 3 });
    // Click noise
    playNoiseBurst({ duration: 0.04, volume: 0.1 * vol, filterType: "highpass", filterFreq: 4000, filterQ: 2 });
    // Stone resonance
    playRichTone({ frequency: 300, freqEnd: 200, duration: 0.15, volume: 0.06 * vol, type: "sine", delay: 0.02 });
  }, [vol]);

  // Memory card flip: paper/card whoosh
  const cardFlipSound = useCallback(() => {
    if (!ok()) return;
    // Flip whoosh
    playNoiseBurst({ duration: 0.08, volume: 0.1 * vol, filterType: "bandpass", filterFreq: 3500, filterQ: 1 });
    // Card snap
    playRichTone({ frequency: 600, freqEnd: 400, duration: 0.08, volume: 0.1 * vol, type: "sine", harmonic: 2.5 });
  }, [vol]);

  // Match success: bright chime pair
  const matchSound = useCallback(() => {
    if (!ok()) return;
    playRichTone({ frequency: 660, duration: 0.15, volume: 0.14 * vol, type: "sine", harmonic: 3 });
    playRichTone({ frequency: 880, duration: 0.18, volume: 0.14 * vol, type: "sine", delay: 0.08, harmonic: 3 });
    playNoiseBurst({ duration: 0.12, volume: 0.03 * vol, filterType: "highpass", filterFreq: 5000, filterQ: 0.5, delay: 0.05 });
  }, [vol]);

  // Win: triumphant fanfare
  const winSound = useCallback(() => {
    if (!ok()) return;
    playMelody([523, 659, 784, 1047], {
      spacing: 0.1,
      noteDuration: 0.3,
      volume: 0.16 * vol,
      type: "triangle",
      harmonic: 2,
    });
    playRichTone({ frequency: 262, duration: 0.8, volume: 0.06 * vol, type: "sine", harmonic: 2 });
    playNoiseBurst({ duration: 0.4, volume: 0.03 * vol, filterType: "highpass", filterFreq: 5000, filterQ: 0.3, delay: 0.15 });
  }, [vol]);

  // UI click: clean and subtle
  const uiClickSound = useCallback(() => {
    if (!ok()) return;
    playRichTone({ frequency: 800, freqEnd: 600, duration: 0.05, volume: 0.08 * vol, type: "sine" });
    playNoiseBurst({ duration: 0.02, volume: 0.04 * vol, filterType: "highpass", filterFreq: 5000, filterQ: 1 });
  }, [vol]);

  return {
    diceshakeSound,
    diceCollideSound,
    checkerFlipSound,
    mahjongTileSound,
    cardFlipSound,
    matchSound,
    winSound,
    uiClickSound,
    initAudioContext,
  };
}