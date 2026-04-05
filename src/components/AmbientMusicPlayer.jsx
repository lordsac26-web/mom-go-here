import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/stores/audioStore';

/**
 * Ambient music player with procedurally generated looping background music.
 * Uses Web Audio API to create a simple, relaxing melody.
 */
export default function AmbientMusicPlayer() {
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const activeNotesRef = useRef([]);
  const timeoutIdsRef = useRef([]);
  const isPlayingRef = useRef(false);
  const musicVolumeRef = useRef(0.5);

  const musicVolume = useAudioStore((state) => state.musicVolume);
  const muteAll = useAudioStore((state) => state.muteAll);
  const muteMusic = useAudioStore((state) => state.muteMusic);

  // Keep musicVolume in ref for playMelody closure
  useEffect(() => {
    musicVolumeRef.current = musicVolume;
  }, [musicVolume]);

  // Initialize audio context
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

  // Generate ambient music loop
  const playAmbientMusic = () => {
    const ctx = initAudioContext();
    if (!ctx || isPlayingRef.current) return;

    isPlayingRef.current = true;

    try {
      // Simple looping melody (C major pentatonic)
      const notes = [
        { freq: 261.63, dur: 0.8 }, // C
        { freq: 329.63, dur: 0.8 }, // E
        { freq: 392.0, dur: 1.0 },  // G
        { freq: 329.63, dur: 0.8 }, // E
        { freq: 261.63, dur: 1.2 }, // C
        { freq: 329.63, dur: 0.8 }, // E
        { freq: 392.0, dur: 0.8 },  // G
        { freq: 440.0, dur: 1.0 },  // A
      ];

      const playMelody = (startTime) => {
       let currentTime = startTime;
       const noteList = [];

       notes.forEach(({ freq, dur }) => {
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();

         osc.type = 'sine';
         osc.frequency.value = freq;

         const vol = musicVolumeRef.current;
         gain.gain.setValueAtTime(0, currentTime);
         gain.gain.linearRampToValueAtTime(
           (vol * 0.2) / 2,
           currentTime + 0.05
         );
         gain.gain.linearRampToValueAtTime(
           (vol * 0.15) / 2,
           currentTime + dur - 0.1
         );
         gain.gain.linearRampToValueAtTime(0, currentTime + dur);

         osc.connect(gain);
         gain.connect(ctx.destination);

         osc.start(currentTime);
         osc.stop(currentTime + dur);

         noteList.push({ osc, gain });

         currentTime += dur;
       });

       activeNotesRef.current = noteList;

       // Loop the melody
       const totalDuration = notes.reduce((sum, n) => sum + n.dur, 0);
       if (isPlayingRef.current) {
         const timeoutId = setTimeout(
           () => playMelody(ctx.currentTime),
           totalDuration * 1000
         );
         timeoutIdsRef.current.push(timeoutId);
       }
      };

      playMelody(ctx.currentTime);
    } catch (e) {
      console.warn('Ambient music failed:', e);
      isPlayingRef.current = false;
    }
  };

  // Stop music
  const stopAmbientMusic = () => {
    isPlayingRef.current = false;
    
    // Clear pending timeouts
    timeoutIdsRef.current.forEach(id => clearTimeout(id));
    timeoutIdsRef.current = [];
    
    // Stop all active notes
    activeNotesRef.current.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    activeNotesRef.current = [];
  };



  // Control music playback based on settings
  useEffect(() => {
    const shouldPlay = !muteAll && !muteMusic && musicVolume > 0;

    if (shouldPlay && !isPlayingRef.current) {
      playAmbientMusic();
    } else if (!shouldPlay && isPlayingRef.current) {
      stopAmbientMusic();
    }
  }, [muteAll, muteMusic, musicVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbientMusic();
    };
  }, []);

  return null; // Invisible component
}