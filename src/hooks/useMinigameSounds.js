import { useCallback } from "react";
import { useAudioStore } from "@/stores/audioStore";

/**
 * Shared Web Audio API sounds for all slot bonus mini-games.
 * Matches the casino quality of useSlotSounds.
 */

function getCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
}

export function useMinigameSounds() {
  const ok = () => {
    const s = useAudioStore.getState();
    return !s.muteAll && s.sfxVolume > 0;
  };
  const vol = () => {
    const s = useAudioStore.getState();
    if (s.muteAll || s.sfxVolume === 0) return 0;
    return s.sfxVolume / 2;
  };

  // ── Bonus entrance — dramatic rising sweep + chime cascade ──
  const bonusEntrance = useCallback(() => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();

    // Rising sweep
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.7);
    g.gain.setValueAtTime(0.12 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1200;
    osc.connect(lp).connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.8);

    // Chime cascade
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const t = now + 0.3 + i * 0.09;
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.18 * v, t + 0.02);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(og).connect(ctx.destination);
      o.start(t); o.stop(t + 0.4);
    });

    setTimeout(() => ctx.close(), 2000);
  }, []);

  // ── Box pick — satisfying "click" + reveal whoosh ──
  const boxPick = useCallback(() => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();

    // Mechanical click
    const bufLen = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.2));
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(now); src.stop(now + 0.06);

    // Reveal whoosh
    const osc = ctx.createOscillator();
    const og = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
    og.gain.setValueAtTime(0.1 * v, now + 0.04);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(og).connect(ctx.destination);
    osc.start(now + 0.04); osc.stop(now + 0.32);

    setTimeout(() => ctx.close(), 500);
  }, []);

  // ── Box reveal — pitched chime based on multiplier tier ──
  const boxReveal = useCallback((multiplier = 2) => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();

    // Base pitch scales with multiplier (higher mult = higher, brighter sound)
    const basePitch = Math.min(400 + multiplier * 35, 1200);
    const isJackpot = multiplier >= 25;

    if (isJackpot) {
      // Big fanfare for jackpot tiers
      const melody = [523, 659, 784, 1047, 1319, 784, 1047, 1319, 1568];
      melody.forEach((f, i) => {
        const t = now + i * 0.07;
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.value = f;
        og.gain.setValueAtTime(0, t);
        og.gain.linearRampToValueAtTime(0.2 * v, t + 0.02);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(og).connect(ctx.destination);
        o.start(t); o.stop(t + 0.25);
      });
    } else {
      // Simple ascending tones for regular multipliers
      const notes = multiplier >= 10
        ? [basePitch, basePitch * 1.25, basePitch * 1.5]
        : [basePitch, basePitch * 1.25];
      notes.forEach((f, i) => {
        const t = now + i * 0.08;
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = "sine"; o.frequency.value = f;
        og.gain.setValueAtTime(0, t);
        og.gain.linearRampToValueAtTime(0.18 * v, t + 0.02);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.connect(og).connect(ctx.destination);
        o.start(t); o.stop(t + 0.3);
      });
    }

    // Coin clatter proportional to size
    const clinkCount = multiplier >= 25 ? 12 : multiplier >= 10 ? 6 : 3;
    for (let i = 0; i < clinkCount; i++) {
      const delay = i * 0.06 + Math.random() * 0.02;
      setTimeout(() => {
        const c = getCtx(); if (!c) return;
        const cn = c.currentTime;
        const pitch = 900 + Math.random() * 600;
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = "triangle"; o.frequency.value = pitch;
        og.gain.setValueAtTime(0.1 * v, cn);
        og.gain.exponentialRampToValueAtTime(0.001, cn + 0.15);
        o.connect(og).connect(c.destination);
        o.start(cn); o.stop(cn + 0.18);
        setTimeout(() => c.close(), 300);
      }, delay * 1000);
    }

    setTimeout(() => ctx.close(), 2000);
  }, []);

  // ── Plinko ball drop — whoosh + whirr ──
  const plinkoDrop = useCallback(() => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    g.gain.setValueAtTime(0.12 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.5);
    setTimeout(() => ctx.close(), 700);
  }, []);

  // ── Plinko peg hit — short tick ──
  const plinkoTick = useCallback(() => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();
    const pitch = 800 + Math.random() * 400;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle"; osc.frequency.value = pitch;
    g.gain.setValueAtTime(0.07 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.07);
    setTimeout(() => ctx.close(), 200);
  }, []);

  // ── Plinko land — thud + slot flash jingle ──
  const plinkoLand = useCallback((multiplier = 1) => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();

    // Thud
    const bufLen = Math.floor(ctx.sampleRate * 0.1);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
    const src = ctx.createBufferSource(); src.buffer = buf;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 300;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(now); src.stop(now + 0.13);

    // Win jingle based on mult
    const isHigh = multiplier >= 10;
    const notes = isHigh ? [523, 659, 784, 1047] : [523, 659];
    notes.forEach((f, i) => {
      const t = now + 0.05 + i * 0.09;
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.18 * v, t + 0.02);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(og).connect(ctx.destination);
      o.start(t); o.stop(t + 0.28);
    });

    setTimeout(() => ctx.close(), 1000);
  }, []);

  // ── Collect / bonus complete — triumphant fanfare ──
  const collectBonus = useCallback(() => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();

    const melody = [523, 784, 1047, 1319, 1047, 784, 1047, 1319, 1568, 2093];
    melody.forEach((f, i) => {
      const t = now + i * 0.075;
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = i % 3 === 0 ? "triangle" : "sine"; o.frequency.value = f;
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.2 * v, t + 0.02);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.connect(og).connect(ctx.destination);
      o.start(t); o.stop(t + 0.2);
    });

    // Final chord
    [523, 659, 784, 1047].forEach(f => {
      const t = now + 0.85;
      const o = ctx.createOscillator(); const og = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.12 * v, t + 0.05);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.connect(og).connect(ctx.destination); o.start(t); o.stop(t + 1);
    });

    // Coin rain
    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        const c = getCtx(); if (!c) return;
        const cn = c.currentTime;
        const pitch = 900 + Math.random() * 700;
        const o = c.createOscillator(); const og = c.createGain();
        o.type = "triangle"; o.frequency.value = pitch;
        og.gain.setValueAtTime(0.09 * v, cn);
        og.gain.exponentialRampToValueAtTime(0.001, cn + 0.14);
        o.connect(og).connect(c.destination);
        o.start(cn); o.stop(cn + 0.16);
        setTimeout(() => c.close(), 300);
      }, 100 + i * 70);
    }

    setTimeout(() => ctx.close(), 3000);
  }, []);

  // ── Bonus type select — hover chime ──
  const bonusHover = useCallback(() => {
    if (!ok()) return;
    const ctx = getCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const v = vol();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = 880;
    g.gain.setValueAtTime(0.08 * v, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.12);
    setTimeout(() => ctx.close(), 250);
  }, []);

  return {
    bonusEntrance, boxPick, boxReveal,
    plinkoDrop, plinkoTick, plinkoLand,
    collectBonus, bonusHover,
  };
}