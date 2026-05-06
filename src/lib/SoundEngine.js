/**
 * Shared procedural sound engine — cartoon/casual style.
 * Rich, bouncy, multi-layered Web Audio synthesis.
 * Used by all game sound hooks. No external files needed.
 */

let _ctx = null;
let _compressor = null;

export function getAudioCtx() {
  try {
    if (!_ctx || _ctx.state === "closed") {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC();
      _compressor = _ctx.createDynamicsCompressor();
      _compressor.threshold.value = -12;
      _compressor.knee.value = 10;
      _compressor.ratio.value = 8;
      _compressor.connect(_ctx.destination);
    }
    if (_ctx.state === "suspended") _ctx.resume();
  } catch (e) {
    console.warn("AudioContext init failed:", e);
    return null;
  }
  return _ctx;
}

export function getMaster() {
  getAudioCtx();
  return _compressor;
}

/** Create white noise buffer of given duration */
export function noiseBuffer(ctx, duration) {
  const len = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/** Play a layered tone with harmonics */
export function playRichTone(opts) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const dest = getMaster();
  if (!dest) return;
  const t = ctx.currentTime + (opts.delay || 0);
  const dur = opts.duration || 0.15;
  const vol = opts.volume || 0.15;
  const freq = opts.frequency || 440;
  const type = opts.type || "sine";

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + dur);
  g.gain.setValueAtTime(vol, t);
  if (opts.attack) g.gain.linearRampToValueAtTime(vol, t + opts.attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.05);

  if (opts.harmonic) {
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.setValueAtTime(freq * opts.harmonic, t);
    if (opts.freqEnd) o2.frequency.exponentialRampToValueAtTime(opts.freqEnd * opts.harmonic, t + dur);
    g2.gain.setValueAtTime(vol * 0.3, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o2.connect(g2).connect(dest);
    o2.start(t);
    o2.stop(t + dur + 0.05);
  }
}

/** Play filtered noise burst */
export function playNoiseBurst(opts) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const dest = getMaster();
  if (!dest) return;
  const t = ctx.currentTime + (opts.delay || 0);
  const dur = opts.duration || 0.1;
  const vol = opts.volume || 0.2;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType || "bandpass";
  filter.frequency.value = opts.filterFreq || 2000;
  filter.Q.value = opts.filterQ || 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(dest);
  src.start(t);
  src.stop(t + dur + 0.01);
}

/** Play ascending/descending note sequence */
export function playMelody(notes, opts = {}) {
  const spacing = opts.spacing || 0.09;
  const dur = opts.noteDuration || 0.2;
  const vol = opts.volume || 0.15;
  const type = opts.type || "sine";
  const harmonic = opts.harmonic || 0;

  notes.forEach((freq, i) => {
    playRichTone({
      frequency: freq,
      duration: dur,
      volume: vol * (1 - i * 0.03),
      type,
      delay: i * spacing,
      harmonic,
    });
  });
}

// ──────────────────────────────────────────
//  CARTOON / CASUAL SOUND PRIMITIVES
// ──────────────────────────────────────────

/** Bouncy "boing" sound — sine with pitch overshoot and wobble */
export function playBoing(opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const dest = getMaster();
  if (!dest) return;
  const t = ctx.currentTime + (opts.delay || 0);
  const vol = opts.volume || 0.15;
  const pitch = opts.pitch || 500;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  // Overshoot then settle — creates cartoon bounce feel
  osc.frequency.setValueAtTime(pitch * 1.8, t);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, t + 0.06);
  osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.12);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.8, t + 0.2);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.3);

  // Sub-harmonic wobble
  const o2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  o2.type = "triangle";
  o2.frequency.setValueAtTime(pitch * 0.5, t);
  o2.frequency.exponentialRampToValueAtTime(pitch * 0.25, t + 0.2);
  g2.gain.setValueAtTime(vol * 0.4, t);
  g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o2.connect(g2).connect(dest);
  o2.start(t);
  o2.stop(t + 0.25);
}

/** Quick chirpy blip — for UI taps, small rewards */
export function playChirp(opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const dest = getMaster();
  if (!dest) return;
  const t = ctx.currentTime + (opts.delay || 0);
  const vol = opts.volume || 0.12;
  const pitch = opts.pitch || 1200;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch * 0.7, t);
  osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.02);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, t + 0.06);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.1);
}

/** Cartoon swoosh — filtered noise with pitch sweep */
export function playSwoosh(opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const dest = getMaster();
  if (!dest) return;
  const t = ctx.currentTime + (opts.delay || 0);
  const vol = opts.volume || 0.15;
  const dur = opts.duration || 0.15;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, dur);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(opts.freqStart || 800, t);
  filter.frequency.exponentialRampToValueAtTime(opts.freqEnd || 3500, t + dur);
  filter.Q.value = 1.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(dest);
  src.start(t);
  src.stop(t + dur + 0.01);
}

/** Bubbly pop — short pitch-up burst with airy tail */
export function playBubblePop(opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const dest = getMaster();
  if (!dest) return;
  const t = ctx.currentTime + (opts.delay || 0);
  const vol = opts.volume || 0.18;
  const pitch = opts.pitch || (600 + Math.random() * 400);

  // Main pop: fast pitch up
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch * 0.6, t);
  osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, t + 0.04);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.3, t + 0.12);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.15);

  // Airy pop noise
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 0.06);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 4000;
  filter.Q.value = 0.5;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol * 0.6, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  src.connect(filter).connect(ng).connect(dest);
  src.start(t);
  src.stop(t + 0.08);
}

/** Cartoon sparkle — twinkling high-frequency cascade */
export function playSparkle(opts = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const dest = getMaster();
  if (!dest) return;
  const vol = opts.volume || 0.08;
  const count = opts.count || 5;

  for (let i = 0; i < count; i++) {
    const t = ctx.currentTime + (opts.delay || 0) + i * 0.06;
    const freq = 2000 + Math.random() * 3000;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.1);
    g.gain.setValueAtTime(vol * (1 - i * 0.12), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + 0.12);
  }
}

/** Cartoon fanfare — bouncy triumphant melody */
export function playFanfare(opts = {}) {
  const vol = opts.volume || 0.16;
  const type = opts.type || "triangle";
  // C5 → E5 → G5 → C6 with bouncy spacing
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    playBoing({ pitch: freq, volume: vol * (1 - i * 0.02), delay: (opts.delay || 0) + i * 0.12 });
  });
  playSparkle({ volume: vol * 0.4, delay: (opts.delay || 0) + 0.4, count: 6 });
}

/** Sad trombone — descending cartoon failure */
export function playSadTrombone(opts = {}) {
  const vol = opts.volume || 0.12;
  const notes = [392, 370, 349, 262];
  notes.forEach((freq, i) => {
    playRichTone({
      frequency: freq,
      duration: i === 3 ? 0.5 : 0.2,
      volume: vol,
      type: "triangle",
      delay: (opts.delay || 0) + i * 0.22,
      harmonic: 1.5,
    });
  });
}