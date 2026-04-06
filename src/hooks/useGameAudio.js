import { useRef, useCallback } from 'react';
import { useAudioStore } from '@/stores/audioStore';

/**
 * Game audio system with procedural sound effects and music control.
 * Plays distinct sounds for game events (dice roll, tile placement, etc).
 */
export function useGameAudio() {
  const audioContextRef = useRef(null);
  const sfxVolume = useAudioStore((state) => state.sfxVolume);
  const musicVolume = useAudioStore((state) => state.musicVolume);
  const muteAll = useAudioStore((state) => state.muteAll);
  const muteMusic = useAudioStore((state) => state.muteMusic);

  // Initialize audio context on first user interaction
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
        audioContextRef.current = audioContext;
      } catch (e) {
        console.warn('AudioContext not supported:', e);
      }
    }
    return audioContextRef.current;
  };

  // Play synth tone for sound effects
  const playTone = (frequency, duration, type = 'sine', volume = 1) => {
    if (muteAll || sfxVolume === 0) return;
    
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = frequency;
      gain.gain.value = volume * (sfxVolume / 2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Tone playback failed:', e);
    }
  };

  // Dice shake sound (woosh + impact)
  const diceshakeSound = () => {
    if (muteAll || sfxVolume === 0) return;
    // Ascending frequency sweep (cup shaking)
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
      
      gain.gain.value = 0.3 * (sfxVolume / 2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn('Shake sound failed:', e);
    }
  };

  // Dice collision sound (impact + resonance)
  const diceCollideSound = () => {
    if (muteAll || sfxVolume === 0) return;
    
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      // Impact transient
      const impact = ctx.createOscillator();
      const impactGain = ctx.createGain();
      impact.type = 'square';
      impact.frequency.value = 800;
      impactGain.gain.value = 0.2 * (sfxVolume / 2);
      impact.connect(impactGain);
      impactGain.connect(ctx.destination);
      impact.start(ctx.currentTime);
      impactGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      impact.stop(ctx.currentTime + 0.1);

      // Resonance tone
      const resonance = ctx.createOscillator();
      const resGain = ctx.createGain();
      resonance.type = 'sine';
      resonance.frequency.setValueAtTime(300, ctx.currentTime + 0.05);
      resonance.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);
      resGain.gain.value = 0.15 * (sfxVolume / 2);
      resonance.connect(resGain);
      resGain.connect(ctx.destination);
      resonance.start(ctx.currentTime + 0.05);
      resGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      resonance.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('Collision sound failed:', e);
    }
  };

  // Checker flip sound (snap + placement)
  const checkerFlipSound = () => {
    if (muteAll || sfxVolume === 0) return;
    
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      // Flip snap
      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'triangle';
      snap.frequency.value = 600;
      snapGain.gain.value = 0.15 * (sfxVolume / 2);
      snap.connect(snapGain);
      snapGain.connect(ctx.destination);
      snap.start(ctx.currentTime);
      snapGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      snap.stop(ctx.currentTime + 0.15);

      // Placement thud
      playTone(200, 0.2, 'sine', 0.2);
    } catch (e) {
      console.warn('Flip sound failed:', e);
    }
  };

  // Mahjong tile slide/place sound
  const mahjongTileSound = () => {
    if (muteAll || sfxVolume === 0) return;
    
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      // Subtle slide + click
      const slide = ctx.createOscillator();
      const slideGain = ctx.createGain();
      slide.type = 'sine';
      slide.frequency.setValueAtTime(250, ctx.currentTime);
      slide.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.15);
      slideGain.gain.value = 0.12 * (sfxVolume / 2);
      slide.connect(slideGain);
      slideGain.connect(ctx.destination);
      slide.start(ctx.currentTime);
      slideGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      slide.stop(ctx.currentTime + 0.15);

      // Click accent
      playTone(400, 0.08, 'square', 0.1);
    } catch (e) {
      console.warn('Tile sound failed:', e);
    }
  };

  // Memory card flip
  const cardFlipSound = () => {
    if (muteAll || sfxVolume === 0) return;
    playTone(500, 0.1, 'sine', 0.3);
  };

  // Match success
  const matchSound = () => {
    if (muteAll || sfxVolume === 0) return;
    playTone(600, 0.15, 'sine', 0.4);
    setTimeout(() => playTone(800, 0.15, 'sine', 0.4), 100);
  };

  // Game win
  const winSound = () => {
    if (muteAll || sfxVolume === 0) return;
    playTone(400, 0.2, 'sine', 0.5);
    setTimeout(() => playTone(500, 0.2, 'sine', 0.5), 150);
    setTimeout(() => playTone(600, 0.3, 'sine', 0.5), 300);
  };

  // UI click
  const uiClickSound = () => {
    if (muteAll || sfxVolume === 0) return;
    playTone(350, 0.08, 'sine', 0.2);
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