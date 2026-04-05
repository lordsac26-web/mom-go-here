import { useEffect, useRef } from 'react';

export default function useGameAudio() {
  const audioContextRef = useRef(null);
  const soundOnRef = useRef(true);

  useEffect(() => {
    // Initialize audio context on first interaction
    const init = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      document.removeEventListener('click', init);
      document.removeEventListener('touchstart', init);
    };
    document.addEventListener('click', init);
    document.addEventListener('touchstart', init);
    return () => {
      document.removeEventListener('click', init);
      document.removeEventListener('touchstart', init);
    };
  }, []);

  const playTone = (frequency = 440, duration = 100, type = 'sine') => {
    if (!soundOnRef.current || !audioContextRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = type;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Audio API error:', e);
    }
  };

  const playDiceRoll = () => {
    playTone(200, 80, 'square');
    setTimeout(() => playTone(300, 80, 'square'), 80);
    setTimeout(() => playTone(250, 100, 'sine'), 160);
  };

  const playWin = () => {
    playTone(523, 150); // C5
    setTimeout(() => playTone(659, 150), 150); // E5
    setTimeout(() => playTone(784, 200), 300); // G5
  };

  const playError = () => {
    playTone(150, 100);
    setTimeout(() => playTone(100, 150), 100);
  };

  const triggerHaptic = (type = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [40],
        pulse: [20, 30, 20],
        success: [10, 50, 10],
      };
      navigator.vibrate(patterns[type] || [20]);
    }
  };

  return {
    playDiceRoll,
    playWin,
    playError,
    triggerHaptic,
    setSoundOn: (on) => { soundOnRef.current = on; },
    isSoundOn: () => soundOnRef.current,
  };
}