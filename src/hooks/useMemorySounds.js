/**
 * useMemorySounds — Web Audio synthesized sounds for Memory Match.
 * No external files needed.
 */
import { useRef, useCallback } from "react";

function getCtx() {
  if (!window._memAudioCtx) {
    window._memAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._memAudioCtx;
}

function resume(ctx) {
  if (ctx.state === "suspended") ctx.resume();
}

export function useMemorySounds() {
  const mutedRef = useRef(false);

  const playFlip = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = getCtx(); resume(ctx);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }, []);

  const playMismatch = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = getCtx(); resume(ctx);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch {}
  }, []);

  const playMatch = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = getCtx(); resume(ctx);
      const notes = [660, 880, 1100];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        const t = ctx.currentTime + i * 0.07;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    } catch {}
  }, []);

  const playWin = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = getCtx(); resume(ctx);
      const melody = [523, 659, 784, 1047, 784, 1047, 1319];
      melody.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "triangle";
        const t = ctx.currentTime + i * 0.11;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch {}
  }, []);

  const playPeek = useCallback(() => {
    if (mutedRef.current) return;
    try {
      const ctx = getCtx(); resume(ctx);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }, []);

  const setMuted = useCallback((val) => { mutedRef.current = val; }, []);

  return { playFlip, playMismatch, playMatch, playWin, playPeek, setMuted };
}