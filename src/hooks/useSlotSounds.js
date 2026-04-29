import { useCallback, useRef } from "react";
import { useAudioStore } from "@/stores/audioStore";
import { getAudioCtx, getMaster, playRichTone, playNoiseBurst, playMelody } from "@/lib/SoundEngine";

/**
 * Slot-machine-specific procedural sound effects.
 * Respects both the global audio store AND the per-track slot audio prefs.
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
  if (!prefs?.tracks?.[trackKey]) return true; // default on
  return prefs.tracks[trackKey].enabled;
}

function trackVol(trackKey) {
  const prefs = getSlotPrefs();
  const tv = prefs?.tracks?.[trackKey]?.volume ?? 0.7;
  return tv;
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

  // ── Lever Pull: mechanical clunk + spring release ──
  const leverPull = useCallback(() => {
    if (!ok() || !trackEnabled("uiClicks")) return;
    const v = globalVol() * trackVol("uiClicks");
    // Mechanical clunk
    playRichTone({ frequency: 180, freqEnd: 80, duration: 0.12, volume: 0.2 * v, type: "square" });
    playNoiseBurst({ duration: 0.08, volume: 0.15 * v, filterType: "bandpass", filterFreq: 800, filterQ: 2 });
    // Spring twang
    playRichTone({ frequency: 400, freqEnd: 1200, duration: 0.15, volume: 0.1 * v, type: "sine", delay: 0.08, harmonic: 3 });
  }, []);

  // ── Reel Spin Start: whirring mechanical loop ──
  const reelSpinStart = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const dest = getMaster();
    if (!dest) return;

    const v = globalVol() * trackVol("reelSpin");
    // Create a continuous clicking/whirring sound
    const now = ctx.currentTime;

    // Fast ticking oscillator
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(25, now); // fast pulse = mechanical ticking
    g.gain.setValueAtTime(0.06 * v, now);
    osc.connect(g).connect(dest);
    osc.start(now);

    // Filtered noise for whoosh
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

  // ── Reel Spin Stop: decelerating tick + hard clunk ──
  const reelSpinStop = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");

    // Kill the continuous spin sound
    if (spinOscRef.current) {
      const { osc, g, noise, ng, ctx } = spinOscRef.current;
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.stop(now + 0.2);
      noise.stop(now + 0.2);
      spinOscRef.current = null;
    }

    // Satisfying mechanical stop click
    playRichTone({ frequency: 600, freqEnd: 200, duration: 0.06, volume: 0.18 * v, type: "square" });
    playNoiseBurst({ duration: 0.04, volume: 0.12 * v, filterType: "bandpass", filterFreq: 2000, filterQ: 2 });
    // Resonant thud
    playRichTone({ frequency: 120, freqEnd: 60, duration: 0.12, volume: 0.1 * v, type: "sine", delay: 0.02 });
  }, []);

  // ── Individual Reel Click (for each reel stopping) ──
  const reelStopClick = useCallback((reelIndex = 0) => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");
    const pitchOffset = reelIndex * 40; // slightly different pitch per reel
    playRichTone({ frequency: 500 + pitchOffset, freqEnd: 250, duration: 0.05, volume: 0.14 * v, type: "square" });
    playNoiseBurst({ duration: 0.03, volume: 0.08 * v, filterType: "highpass", filterFreq: 3000, filterQ: 1.5 });
  }, []);

  // ── Coin Clink: metallic coin cascade ──
  const coinClink = useCallback((count = 3) => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    for (let i = 0; i < count; i++) {
      const pitch = 2000 + Math.random() * 1500;
      playRichTone({
        frequency: pitch,
        freqEnd: pitch * 0.6,
        duration: 0.08,
        volume: 0.1 * v,
        type: "sine",
        delay: i * 0.06,
        harmonic: 3.5,
      });
      playNoiseBurst({
        duration: 0.03,
        volume: 0.04 * v,
        filterType: "highpass",
        filterFreq: 6000,
        filterQ: 1,
        delay: i * 0.06,
      });
    }
  }, []);

  // ── Small Win: short cheerful jingle + coins ──
  const smallWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    playMelody([659, 784, 880], { spacing: 0.08, noteDuration: 0.15, volume: 0.14 * v, type: "triangle", harmonic: 2 });
    // Coin shower
    for (let i = 0; i < 4; i++) {
      playRichTone({
        frequency: 2500 + Math.random() * 1000,
        freqEnd: 1500,
        duration: 0.06,
        volume: 0.06 * v,
        type: "sine",
        delay: 0.2 + i * 0.05,
        harmonic: 3,
      });
    }
  }, []);

  // ── Medium Win: ascending fanfare + coins ──
  const mediumWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    playMelody([523, 659, 784, 1047], { spacing: 0.1, noteDuration: 0.2, volume: 0.16 * v, type: "triangle", harmonic: 2 });
    // Sub bass punch
    playRichTone({ frequency: 80, duration: 0.4, volume: 0.08 * v, type: "sine" });
    // Coin cascade
    for (let i = 0; i < 8; i++) {
      playRichTone({
        frequency: 2200 + Math.random() * 1200,
        freqEnd: 1200,
        duration: 0.07,
        volume: 0.05 * v,
        type: "sine",
        delay: 0.35 + i * 0.04,
        harmonic: 4,
      });
    }
  }, []);

  // ── Big/Mega Win: full orchestral hit + extended coin rain ──
  const bigWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");

    // Dramatic build-up hit
    playNoiseBurst({ duration: 0.15, volume: 0.12 * v, filterType: "lowpass", filterFreq: 800, filterQ: 1 });
    playRichTone({ frequency: 100, freqEnd: 50, duration: 0.3, volume: 0.12 * v, type: "sine" });

    // Triumphant ascending fanfare
    playMelody([392, 523, 659, 784, 1047, 1319], {
      spacing: 0.1,
      noteDuration: 0.25,
      volume: 0.18 * v,
      type: "triangle",
      harmonic: 2,
    });

    // Sparkle overtones
    [0.6, 0.7, 0.8, 0.9, 1.0].forEach(d => {
      playRichTone({
        frequency: 3000 + Math.random() * 2000,
        freqEnd: 2000,
        duration: 0.1,
        volume: 0.04 * v,
        type: "sine",
        delay: d,
        harmonic: 5,
      });
    });

    // Extended coin rain
    for (let i = 0; i < 15; i++) {
      playRichTone({
        frequency: 2000 + Math.random() * 1500,
        freqEnd: 1000,
        duration: 0.08,
        volume: 0.04 * v,
        type: "sine",
        delay: 0.5 + i * 0.06,
        harmonic: 3.5,
      });
    }
  }, []);

  // ── Scatter Hit: mystical shimmer ──
  const scatterSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = globalVol() * trackVol("wins");
    // Shimmer sweep up
    playRichTone({ frequency: 800, freqEnd: 3000, duration: 0.4, volume: 0.1 * v, type: "sine", harmonic: 2.5 });
    playRichTone({ frequency: 1200, freqEnd: 4000, duration: 0.35, volume: 0.06 * v, type: "sine", delay: 0.05, harmonic: 3 });
    playNoiseBurst({ duration: 0.3, volume: 0.05 * v, filterType: "highpass", filterFreq: 5000, filterQ: 0.5, delay: 0.1 });
    // Chime
    playRichTone({ frequency: 1568, duration: 0.3, volume: 0.08 * v, type: "sine", delay: 0.25, harmonic: 4 });
  }, []);

  // ── Near Miss: descending disappointment ──
  const nearMissSound = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");
    playRichTone({ frequency: 400, freqEnd: 200, duration: 0.3, volume: 0.08 * v, type: "triangle" });
  }, []);

  // ── Nudge: short tap ──
  const nudgeSound = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const v = globalVol() * trackVol("reelSpin");
    playRichTone({ frequency: 300, freqEnd: 500, duration: 0.06, volume: 0.1 * v, type: "triangle" });
    playNoiseBurst({ duration: 0.03, volume: 0.06 * v, filterType: "bandpass", filterFreq: 1500, filterQ: 1.5 });
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