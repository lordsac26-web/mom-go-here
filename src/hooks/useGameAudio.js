import { useAudioStore } from '@/stores/audioStore';
import {
  getAudioCtx, playRichTone, playNoiseBurst, playMelody,
  playBoing, playChirp, playSwoosh, playBubblePop, playSparkle, playFanfare,
} from '@/lib/SoundEngine';

/**
 * Game audio — casual/cartoon style.
 * Uses plain functions (no useCallback) to avoid the null-dispatcher crash
 * from the SDK's bundled React chunk.
 */
export function useGameAudio() {
  const ok = () => {
    const s = useAudioStore.getState();
    return !s.muteAll && s.sfxVolume > 0;
  };
  const vol = () => {
    const s = useAudioStore.getState();
    return (s.muteAll || s.sfxVolume === 0) ? 0 : s.sfxVolume / 2;
  };

  const initAudioContext = () => getAudioCtx();

  const diceshakeSound = () => {
    if (!ok()) return;
    const v = vol();
    playSwoosh({ volume: 0.15 * v, duration: 0.25, freqStart: 1200, freqEnd: 3000 });
    [0, 0.06, 0.12, 0.18].forEach(d => {
      playChirp({ pitch: 600 + Math.random() * 400, volume: 0.08 * v, delay: d });
    });
    playBoing({ pitch: 300, volume: 0.06 * v, delay: 0.1 });
  };

  const diceCollideSound = () => {
    if (!ok()) return;
    const v = vol();
    playBoing({ pitch: 250, volume: 0.14 * v });
    playNoiseBurst({ duration: 0.06, volume: 0.12 * v, filterType: "bandpass", filterFreq: 2500, filterQ: 1.5 });
    playRichTone({ frequency: 100, freqEnd: 50, duration: 0.12, volume: 0.08 * v, type: "sine", delay: 0.02 });
  };

  const checkerFlipSound = () => {
    if (!ok()) return;
    const v = vol();
    playSwoosh({ volume: 0.08 * v, duration: 0.1, freqStart: 1500, freqEnd: 3000 });
    playBoing({ pitch: 450, volume: 0.1 * v, delay: 0.06 });
    playChirp({ pitch: 800, volume: 0.06 * v, delay: 0.08 });
  };

  const mahjongTileSound = () => {
    if (!ok()) return;
    const v = vol();
    playChirp({ pitch: 1400, volume: 0.12 * v });
    playBoing({ pitch: 600, volume: 0.06 * v, delay: 0.02 });
    playNoiseBurst({ duration: 0.04, volume: 0.06 * v, filterType: "highpass", filterFreq: 4500, filterQ: 2 });
  };

  const cardFlipSound = () => {
    if (!ok()) return;
    const v = vol();
    playSwoosh({ volume: 0.1 * v, duration: 0.1, freqStart: 2000, freqEnd: 5000 });
    playChirp({ pitch: 900, volume: 0.08 * v, delay: 0.05 });
  };

  const matchSound = () => {
    if (!ok()) return;
    const v = vol();
    playBubblePop({ pitch: 700, volume: 0.12 * v });
    playChirp({ pitch: 1100, volume: 0.1 * v, delay: 0.06 });
    playChirp({ pitch: 1400, volume: 0.1 * v, delay: 0.12 });
    playSparkle({ volume: 0.05 * v, delay: 0.1, count: 4 });
  };

  const winSound = () => {
    if (!ok()) return;
    const v = vol();
    playFanfare({ volume: 0.14 * v });
    playRichTone({ frequency: 262, duration: 0.8, volume: 0.06 * v, type: "sine", harmonic: 2 });
  };

  const uiClickSound = () => {
    if (!ok()) return;
    const v = vol();
    playChirp({ pitch: 1000, volume: 0.1 * v });
  };

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