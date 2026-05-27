import { useCallback } from "react";
import { useAudioStore } from "@/stores/audioStore";
import {
  playRichTone, playNoiseBurst, playMelody,
  playBoing, playChirp, playSwoosh, playBubblePop, playSparkle, playFanfare, playSadTrombone,
} from "@/lib/SoundEngine";

/**
 * Dart Pop Blitz sounds — casual/cartoon style.
 * Bouncy pops, rubber-band launches, squelchy explosions.
 */
export default function useDartSounds() {
  const muteAll = useAudioStore((s) => s.muteAll);
  const sfxVol = () => {
    const s = useAudioStore.getState();
    return (s.muteAll || s.sfxVolume === 0) ? 0 : s.sfxVolume / 2;
  };

  // ── Dart launch: rubber-band twang + cartoon swoosh ──
  const playShoot = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    playSwoosh({ volume: 0.18 * v, duration: 0.15, freqStart: 1000, freqEnd: 4000 });
    playBoing({ pitch: 280, volume: 0.08 * v });
    playChirp({ pitch: 600, volume: 0.06 * v, delay: 0.02 });
  }, [muteAll]);

  // ── Balloon pop: bubbly cartoon pop ──
  const playPop = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    const pitch = 600 + Math.random() * 500;
    playBubblePop({ pitch, volume: 0.22 * v });
    playChirp({ pitch: pitch * 1.5, volume: 0.08 * v, delay: 0.03 });
  }, [muteAll]);

  // ── Bomb explosion: cartoon kaboom ──
  const playExplosion = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    // Deep cartoon boom
    playRichTone({ frequency: 120, freqEnd: 25, duration: 0.4, volume: 0.25 * v, type: "sawtooth" });
    playNoiseBurst({ duration: 0.3, volume: 0.2 * v, filterType: "lowpass", filterFreq: 500, filterQ: 0.5 });
    // Bouncy shrapnel pops
    [0.05, 0.1, 0.16, 0.22].forEach(d => {
      playBubblePop({ pitch: 300 + Math.random() * 500, volume: 0.08 * v, delay: d });
    });
    // Cartoon ring-out
    playBoing({ pitch: 150, volume: 0.1 * v, delay: 0.08 });
  }, [muteAll]);

  // ── Sniper: zippy laser pew ──
  const playSniper = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    // Fast descending laser
    playRichTone({ frequency: 2000, freqEnd: 300, duration: 0.15, volume: 0.16 * v, type: "square" });
    playSwoosh({ volume: 0.1 * v, duration: 0.1, freqStart: 3000, freqEnd: 6000 });
    playChirp({ pitch: 1800, volume: 0.08 * v, delay: 0.04 });
    // Sub punch
    playRichTone({ frequency: 100, freqEnd: 40, duration: 0.1, volume: 0.08 * v, type: "sine", delay: 0.02 });
  }, [muteAll]);

  // ── Multi-shot: triple boing burst ──
  const playMultishot = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    [0, 0.04, 0.08].forEach((d, i) => {
      playBoing({ pitch: 350 + i * 100, volume: 0.1 * v, delay: d });
      playSwoosh({ volume: 0.08 * v, duration: 0.08, freqStart: 1500 + i * 500, freqEnd: 4000, delay: d });
    });
  }, [muteAll]);

  // ── Streak chime: sparkly cartoon reward ──
  const playStreakChime = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    playMelody([659, 784, 988, 1175], {
      spacing: 0.07,
      noteDuration: 0.18,
      volume: 0.14 * v,
      type: "sine",
      harmonic: 3,
    });
    playSparkle({ volume: 0.06 * v, delay: 0.15, count: 6 });
    playBoing({ pitch: 800, volume: 0.06 * v, delay: 0.25 });
  }, [muteAll]);

  // ── Miss: sad cartoon bonk ──
  const playMiss = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    playRichTone({ frequency: 300, freqEnd: 100, duration: 0.25, volume: 0.1 * v, type: "triangle", harmonic: 1.5 });
    playNoiseBurst({ duration: 0.08, volume: 0.06 * v, filterType: "lowpass", filterFreq: 400, filterQ: 0.5 });
  }, [muteAll]);

  // ── Ricochet: cartoon boing ping ──
  const playRicochet = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    playBoing({ pitch: 1200 + Math.random() * 600, volume: 0.12 * v });
    playChirp({ pitch: 2500, volume: 0.06 * v, delay: 0.03 });
  }, [muteAll]);

  // ── Zipper launch: electric buzzing zap ──
  const playZipper = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;

    // Buzzing square-wave oscillator (rapidly modulated pitch = "bzzt" effect)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.06);
    osc.frequency.linearRampToValueAtTime(140, now + 0.18);
    osc.frequency.linearRampToValueAtTime(280, now + 0.28);
    oscGain.gain.setValueAtTime(0.18 * v, now);
    oscGain.gain.linearRampToValueAtTime(0, now + 0.32);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);

    // High crackle layer — white noise through bandpass filter
    const bufSize = ctx.sampleRate * 0.25;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass";
    bpf.frequency.setValueAtTime(3200, now);
    bpf.frequency.linearRampToValueAtTime(1800, now + 0.25);
    bpf.Q.value = 2.5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12 * v, now);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.25);
    noise.connect(bpf);
    bpf.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Short rising chirp for the "launch" feel
    playChirp({ pitch: 900, volume: 0.09 * v, delay: 0.01 });
    playChirp({ pitch: 1600, volume: 0.07 * v, delay: 0.06 });

    setTimeout(() => ctx.close(), 500);
  }, [muteAll]);

  // ── Win: full cartoon celebration ──
  const playWin = useCallback(() => {
    if (muteAll) return;
    const v = sfxVol();
    playFanfare({ volume: 0.14 * v });
    playRichTone({ frequency: 262, duration: 0.8, volume: 0.06 * v, type: "sine", harmonic: 2 });
  }, [muteAll]);

  return { playShoot, playPop, playExplosion, playSniper, playMultishot, playStreakChime, playMiss, playWin, playRicochet, playZipper };
}