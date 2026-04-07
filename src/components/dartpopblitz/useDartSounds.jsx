import { useRef, useCallback } from "react";
import { useAudioStore } from "@/stores/audioStore";

function getCtx(ref) {
  if (!ref.current || ref.current.state === "closed") {
    ref.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ref.current.state === "suspended") ref.current.resume();
  return ref.current;
}

export default function useDartSounds() {
  const ctxRef = useRef(null);
  const muteAll = useAudioStore((s) => s.muteAll);

  const playShoot = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    // Whoosh + thunk
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.3;
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 2000; bp.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    noise.connect(bp).connect(g).connect(ctx.destination);
    noise.start(t); noise.stop(t + 0.15);
    // Twang
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
    og.gain.setValueAtTime(0.12, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(og).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.12);
  }, [muteAll]);

  const playPop = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    // Pop burst
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.12);
    // Noise crack
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
    n.buffer = buf;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.2, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    n.connect(ng).connect(ctx.destination);
    n.start(t); n.stop(t + 0.06);
  }, [muteAll]);

  const playExplosion = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    // Big boom
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.4);
    // Noise rumble
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    n.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 400;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.3, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    n.connect(lp).connect(ng).connect(ctx.destination);
    n.start(t); n.stop(t + 0.3);
  }, [muteAll]);

  const playSniper = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    // Crack
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.2);
    // Echo
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(800, t + 0.05);
    o2.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    g2.gain.setValueAtTime(0.1, t + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o2.connect(g2).connect(ctx.destination);
    o2.start(t + 0.05); o2.stop(t + 0.3);
  }, [muteAll]);

  const playMultishot = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    [0, 0.04, 0.08].forEach((delay) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400 + delay * 2000, t + delay);
      osc.frequency.exponentialRampToValueAtTime(150, t + delay + 0.1);
      g.gain.setValueAtTime(0.15, t + delay);
      g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.1);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + delay); osc.stop(t + delay + 0.1);
    });
  }, [muteAll]);

  const playStreakChime = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      g.gain.setValueAtTime(0.15, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.2);
    });
  }, [muteAll]);

  const playMiss = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.2);
  }, [muteAll]);

  const playWin = useCallback(() => {
    if (muteAll) return;
    const ctx = getCtx(ctxRef);
    const t = ctx.currentTime;
    [523, 587, 659, 698, 784, 880, 988, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      g.gain.setValueAtTime(0.2, t + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.35);
      osc.connect(g).connect(ctx.destination);
      osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.35);
    });
  }, [muteAll]);

  return { playShoot, playPop, playExplosion, playSniper, playMultishot, playStreakChime, playMiss, playWin };
}