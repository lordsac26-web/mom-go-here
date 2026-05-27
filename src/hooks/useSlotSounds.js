import { useCallback, useRef } from "react";
import { useAudioStore } from "@/stores/audioStore";

/**
 * Realistic video slot machine sounds — mechanical reels, hydraulic thud stops,
 * coin hopper payout, proper casino-style win jingles.
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

function getCtx() {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch { return null; }
}

// Module-level spin loop context
let _spinCtx = null;
let _spinNodes = null;

export function useSlotSounds() {
  const ok = () => {
    const s = useAudioStore.getState();
    return !s.muteAll && s.sfxVolume > 0;
  };
  const vol = (track = "reelSpin") => {
    const s = useAudioStore.getState();
    if (s.muteAll || s.sfxVolume === 0) return 0;
    return (s.sfxVolume / 2) * trackVol(track);
  };

  // ── Lever / Spin Button Pull ──
  // Deep mechanical clunk + spring release
  const leverPull = useCallback(() => {
    if (!ok() || !trackEnabled("uiClicks")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("uiClicks");

    // Mechanical clunk — filtered noise burst
    const bufLen = ctx.sampleRate * 0.08;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 300; lp.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(now); src.stop(now + 0.1);

    // Spring "thwack" — descending tone
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    og.gain.setValueAtTime(0.25 * v, now + 0.02);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(og).connect(ctx.destination);
    osc.start(now + 0.02); osc.stop(now + 0.2);

    setTimeout(() => ctx.close(), 300);
  }, []);

  // ── Reel Spin Loop — realistic mechanical ratchet ──
  const reelSpinStart = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;

    // Stop any existing spin
    if (_spinCtx) {
      try { _spinCtx.close(); } catch {}
      _spinCtx = null; _spinNodes = null;
    }

    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("reelSpin");

    // Ratchet/tick layer — mechanical clicking as symbols scroll
    const tickRate = 18; // Hz
    const tickBuf = ctx.createBuffer(1, ctx.sampleRate / tickRate, ctx.sampleRate);
    const td = tickBuf.getChannelData(0);
    for (let i = 0; i < td.length; i++) {
      const t = i / ctx.sampleRate;
      td[i] = Math.exp(-t * 200) * (Math.random() * 2 - 1);
    }
    const tickSrc = ctx.createBufferSource();
    tickSrc.buffer = tickBuf;
    tickSrc.loop = true;
    tickSrc.loopEnd = tickBuf.duration;
    const tickGain = ctx.createGain();
    tickGain.gain.setValueAtTime(0, now);
    tickGain.gain.linearRampToValueAtTime(0.18 * v, now + 0.2);
    const tickHp = ctx.createBiquadFilter();
    tickHp.type = "highpass"; tickHp.frequency.value = 800;
    tickSrc.connect(tickHp).connect(tickGain).connect(ctx.destination);
    tickSrc.start(now);

    // Whoosh — white noise through BPF (air rushing through reel mechanism)
    const bufLen = ctx.sampleRate * 8;
    const noiseBuf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) nd[i] = Math.random() * 2 - 1;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const bpf = ctx.createBiquadFilter();
    bpf.type = "bandpass"; bpf.frequency.value = 1200; bpf.Q.value = 0.8;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.07 * v, now + 0.15);
    noiseSrc.connect(bpf).connect(noiseGain).connect(ctx.destination);
    noiseSrc.start(now);

    // Low mechanical hum
    const humOsc = ctx.createOscillator();
    const humGain = ctx.createGain();
    humOsc.type = "sawtooth";
    humOsc.frequency.setValueAtTime(40, now);
    humGain.gain.setValueAtTime(0, now);
    humGain.gain.linearRampToValueAtTime(0.04 * v, now + 0.2);
    humOsc.connect(humGain).connect(ctx.destination);
    humOsc.start(now);

    _spinCtx = ctx;
    _spinNodes = { tickSrc, tickGain, noiseSrc, noiseGain, humOsc, humGain };
  }, []);

  // ── Reel Spin Stop — hydraulic thud ──
  const reelSpinStop = useCallback(() => {
    if (_spinNodes && _spinCtx) {
      const { tickGain, noiseGain, humGain, tickSrc, noiseSrc, humOsc } = _spinNodes;
      const now = _spinCtx.currentTime;
      tickGain.gain.cancelScheduledValues(now);
      noiseGain.gain.cancelScheduledValues(now);
      humGain.gain.cancelScheduledValues(now);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      humGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      try { tickSrc.stop(now + 0.15); } catch {}
      try { noiseSrc.stop(now + 0.15); } catch {}
      try { humOsc.stop(now + 0.15); } catch {}
      const ctx = _spinCtx;
      setTimeout(() => { try { ctx.close(); } catch {} }, 300);
      _spinCtx = null; _spinNodes = null;
    }
    if (!ok() || !trackEnabled("reelSpin")) return;
  }, []);

  // ── Per-reel stop thud — hydraulic clamp + metallic ping ──
  const reelStopClick = useCallback((reelIndex = 0) => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("reelSpin");
    const pitchMult = [1.0, 1.1, 1.2, 1.35, 1.5][reelIndex] || 1.0;

    // Hydraulic thud — transient noise burst + deep thump
    const bufLen = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.25));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(now); src.stop(now + 0.07);

    // Metallic ring — tuned sine
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 180 * pitchMult;
    og.gain.setValueAtTime(0.18 * v, now + 0.01);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(og).connect(ctx.destination);
    osc.start(now + 0.01); osc.stop(now + 0.28);

    // High click
    const osc2 = ctx.createOscillator();
    const og2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.value = 1200 * pitchMult;
    og2.gain.setValueAtTime(0.08 * v, now);
    og2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc2.connect(og2).connect(ctx.destination);
    osc2.start(now); osc2.stop(now + 0.05);

    setTimeout(() => ctx.close(), 400);
  }, []);

  // ── Coin Hopper Payout — realistic metal coin cascade ──
  const coinClink = useCallback((count = 3) => {
    if (!ok() || !trackEnabled("wins")) return;
    const v = vol("wins");
    for (let i = 0; i < count; i++) {
      const delay = i * 0.055 + Math.random() * 0.02;
      setTimeout(() => {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;
        const pitch = 900 + Math.random() * 600;

        // Short metallic ping
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = pitch;
        g.gain.setValueAtTime(0.12 * v, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        // Ring modulation for metallic shimmer
        const ringOsc = ctx.createOscillator();
        const ringGain = ctx.createGain();
        ringOsc.frequency.value = pitch * 3.7;
        ringGain.gain.value = 0.3;
        ringOsc.connect(ringGain);
        const merger = ctx.createGain();
        osc.connect(merger); ringGain.connect(merger);
        merger.connect(g).connect(ctx.destination);
        osc.start(now); ringOsc.start(now);
        osc.stop(now + 0.2); ringOsc.stop(now + 0.2);
        setTimeout(() => ctx.close(), 350);
      }, delay * 1000);
    }
  }, []);

  // ── Small Win Jingle — 3-note ascending chime ──
  const smallWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("wins");
    const notes = [523, 659, 784]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = now + i * 0.1;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2 * v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.28);
    });
    // Coin clatter
    coinClink(4);
    setTimeout(() => ctx.close(), 700);
  }, [coinClink]);

  // ── Medium Win Fanfare — casino ascending 5-note ──
  const mediumWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("wins");
    const notes = [523, 659, 784, 988, 1047]; // C E G B C
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i < 3 ? "sine" : "triangle";
      osc.frequency.value = freq;
      const t = now + i * 0.09;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22 * v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.35);
    });
    // Harmony chord at end
    [784, 988, 1175].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = now + 0.5;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.12 * v, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + 0.65);
    });
    coinClink(8);
    setTimeout(() => ctx.close(), 1500);
  }, [coinClink]);

  // ── Big/Mega Win — full casino jackpot jingle ──
  const bigWinSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("wins");

    // Build-up drum roll — filtered noise bursts
    for (let i = 0; i < 8; i++) {
      const t = now + i * 0.05;
      const bufLen = Math.floor(ctx.sampleRate * 0.04);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufLen * 0.3));
      const src = ctx.createBufferSource(); src.buffer = buf;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
      const g = ctx.createGain();
      g.gain.setValueAtTime((0.05 + i * 0.015) * v, t);
      src.connect(lp).connect(g).connect(ctx.destination);
      src.start(t); src.stop(t + 0.05);
    }

    // Full casino win jingle — bright ascending melody
    const melody = [523, 659, 784, 1047, 1319, 1047, 784, 659, 523, 659, 784, 1047, 1319, 1568];
    melody.forEach((freq, i) => {
      const t = now + 0.4 + i * 0.08;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = i % 3 === 0 ? "triangle" : "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.2 * v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(g).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.2);
    });

    // Final chord
    [523, 659, 784, 1047].forEach((f) => {
      const t = now + 1.6;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.15 * v, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      o.connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + 1.3);
    });

    // Massive coin rain
    for (let i = 0; i < 20; i++) {
      setTimeout(() => coinClink(1), 300 + i * 80);
    }
    setTimeout(() => ctx.close(), 4000);
  }, [coinClink]);

  // ── Scatter — mystical sparkle sweep ──
  const scatterSound = useCallback(() => {
    if (!ok() || !trackEnabled("wins")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("wins");
    // Rising sweep
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    g.gain.setValueAtTime(0.15 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.65);
    // Sparkle notes
    [800, 1000, 1200, 1500, 1800].forEach((f, i) => {
      const t = now + 0.1 + i * 0.07;
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      og.gain.setValueAtTime(0.1 * v, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(og).connect(ctx.destination);
      o.start(t); o.stop(t + 0.18);
    });
    setTimeout(() => ctx.close(), 1200);
  }, []);

  // ── Near Miss — descending "almost" groan ──
  const nearMissSound = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("reelSpin") * 0.6;
    // Wah-wah descending
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
    g.gain.setValueAtTime(0.08 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    const wah = ctx.createBiquadFilter();
    wah.type = "bandpass"; wah.frequency.setValueAtTime(800, now);
    wah.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    wah.Q.value = 3;
    osc.connect(wah).connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.5);
    setTimeout(() => ctx.close(), 700);
  }, []);

  // ── Nudge ──
  const nudgeSound = useCallback(() => {
    if (!ok() || !trackEnabled("reelSpin")) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol("reelSpin");
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle"; osc.frequency.value = 600;
    g.gain.setValueAtTime(0.12 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.14);
    setTimeout(() => ctx.close(), 250);
  }, []);

  return {
    leverPull, reelSpinStart, reelSpinStop, reelStopClick,
    coinClink, smallWinSound, mediumWinSound, bigWinSound,
    scatterSound, nearMissSound, nudgeSound,
  };
}