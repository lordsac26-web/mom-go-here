import { useCallback, useRef } from "react";
import { useAudioStore } from "@/stores/audioStore";
import {
  getAudioCtx, getMaster, noiseBuffer,
  playRichTone, playNoiseBurst, playMelody,
  playBoing, playChirp, playSwoosh, playBubblePop, playSparkle, playFanfare,
} from "@/lib/SoundEngine";

/**
 * Slot machine sounds — casual/cartoon style.
 * Bouncy lever pulls, playful reel clicks, cheerful wins.
 */

const PREFS_KEY = "slots_audio_prefs";

function getSlotPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function trackEnabled(trackKey) {
  const prefs = getSlotPrefs();
  if (!prefs?.tracks?.[trackKey]) return true;
  return prefs.tracks[trackKey].enabled;
}

function trackVol(trackKey) {
  const prefs = getSlotPrefs();
  return prefs?.tracks?.[trackKey]?.volume ?? 0.7;
}

export function useSlotSounds() {
  const spinOscRef = useRef(null);

  const ok = () => {
    const s = useAudioStore.getState();
    return !s.muteAll && s.sfxVolume > 0;
  };
  const globalVol = () => {
    const s = useAudioStore.getState();
    return (s.muteAll || s.sfxVolume === 0) ? 0 : s.sfxVolume / 2;
  };

  // ── Lever Pull: cartoon spring + clunk ──
  const leverPull = useCallback(() => {
    if (!ok() || !trackEnabled("uiClicks")) return;
    const v = globalVol() * trackVol("uiClicks");
    playBoing({ pitch: 200, volume: 0.16 * v });
    playSwoosh({ volume: 0.1 * v, duration: 0.12, freqStart: 600, freqEnd: 2000, delay: 0.05 });
    playChirp({ pitch: 500, volume: 0.08 * v, delay: 0.1 });
  }, []);

  // ── Reel Spin Start: whirring cartoon loop ──
  const reelSpinStart = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const dest = getMaster();
    if (!dest) return;
    const v = globalVol() * trackVol("reelSpin");
    const now = ctx.currentTime;

    // Fast ticking oscillator
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(25, now);
    g.gain.setValueAtTime(0.06 * v, now);
    osc.connect(g).connect(dest);
    osc.start(now);

    // Filtered whoosh noise
    const bufLen = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, now);
    filter.Q.value = 1.5;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.04 * v, now);
    noise.connect(filter).connect(ng).connect(dest);
    noise.start(now);

    spinOscRef.current = { osc, g, noise, ng, filter, ctx, dest };
  }, []);

  // ── Reel Spin Stop: bouncy snap ──
  const reelSpinStop = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");

    if (spinOscRef.current) {
      const { osc, g, noise, ng, ctx } = spinOscRef.current;
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.stop(now + 0.2);
      noise.stop(now + 0.2);
      spinOscRef.current = null;
    }

    playBoing({ pitch: 350, volume: 0.12 * v });
    playChirp({ pitch: 700, volume: 0.08 * v, delay: 0.03 });
  }, []);

  // ── Individual Reel Click: cartoon tap per reel ──
  const reelStopClick = useCallback((reelIndex = 0) => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");
    const pitchOffset = reelIndex * 80;
    playChirp({ pitch: 800 + pitchOffset, volume: 0.1 * v });
    playBoing({ pitch: 400 + pitchOffset, volume: 0.05 * v, delay: 0.02 });
  }, []);

  // ── Coin Clink: bubbly coin cascade ──
  const coinClink = useCallback((count = 3) => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    for (let i = 0; i < count; i++) {
      playChirp({ pitch: 2200 + Math.random() * 1500, volume: 0.08 * v, delay: i * 0.05 });
      playBubblePop({ pitch: 1500 + Math.random() * 500, volume: 0.04 * v, delay: i * 0.05 + 0.02 });
    }
  }, []);

  // ── Small Win: playful chime ──
  const smallWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    playMelody([659, 784, 988], { spacing: 0.08, noteDuration: 0.15, volume: 0.14 * v, type: "sine", harmonic: 2 });
    playSparkle({ volume: 0.04 * v, delay: 0.2, count: 4 });
    coinClink(3);
  }, []);

  // ── Medium Win: ascending fanfare + coins ──
  const mediumWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    playMelody([523, 659, 784, 1047], { spacing: 0.1, noteDuration: 0.2, volume: 0.16 * v, type: "triangle", harmonic: 2 });
    playBoing({ pitch: 500, volume: 0.08 * v, delay: 0.35 });
    playSparkle({ volume: 0.05 * v, delay: 0.35, count: 6 });
    coinClink(6);
  }, []);

  // ── Big/Mega Win: full cartoon celebration ──
  const bigWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");

    // Dramatic build
    playNoiseBurst({ duration: 0.15, volume: 0.1 * v, filterType: "lowpass", filterFreq: 800, filterQ: 1 });
    playRichTone({ frequency: 100, freqEnd: 50, duration: 0.3, volume: 0.1 * v, type: "sine" });

    // Bouncy fanfare
    playFanfare({ volume: 0.16 * v, delay: 0.15 });

    // Extended sparkle rain
    playSparkle({ volume: 0.05 * v, delay: 0.6, count: 8 });
    playSparkle({ volume: 0.04 * v, delay: 0.9, count: 6 });

    // Coin rain
    for (let i = 0; i < 12; i++) {
      playChirp({ pitch: 2000 + Math.random() * 2000, volume: 0.03 * v, delay: 0.5 + i * 0.06 });
    }
  }, []);

  // ── Scatter Hit: mystical cartoon shimmer ──
  const scatterSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    playSwoosh({ volume: 0.1 * v, duration: 0.3, freqStart: 800, freqEnd: 5000 });
    playSparkle({ volume: 0.08 * v, delay: 0.1, count: 7 });
    playBoing({ pitch: 1000, volume: 0.06 * v, delay: 0.25 });
  }, []);

  // ── Near Miss: cartoon sad note ──
  const nearMissSound = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");
    playRichTone({ frequency: 400, freqEnd: 200, duration: 0.3, volume: 0.08 * v, type: "triangle" });
  }, []);

  // ── Nudge: quick boop ──
  const nudgeSound = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");
    playChirp({ pitch: 600, volume: 0.1 * v });
  }, []);

  return {
    leverPull,
    reelSpinStart,
    reelSpinStop,
    reelStopClick,
    coinClink,
    smallWinSound,
    mediumWinSound,
    bigWinSound,
    scatterSound,
    nearMissSound,
    nudgeSound,
  };
}