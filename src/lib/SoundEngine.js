/**
 * Shared procedural sound engine — rich, multi-layered Web Audio synthesis.
 * Used by all game sound hooks. No external files needed.
 */

let _ctx = null;
let _compressor = null;

export function getAudioCtx() {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Master compressor to prevent clipping
    _compressor = _ctx.createDynamicsCompressor();
    _compressor.threshold.value = -12;
    _compressor.knee.value = 10;
    _compressor.ratio.value = 8;
    _compressor.connect(_ctx.destination);
  }
  if (_ctx.state === "suspended") _ctx.resume();
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
  const dest = getMaster();
  const t = ctx.currentTime + (opts.delay || 0);
  const dur = opts.duration || 0.15;
  const vol = opts.volume || 0.15;
  const freq = opts.frequency || 440;
  const type = opts.type || "sine";

  // Fundamental
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

  // Optional harmonic overtone
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
  const dest = getMaster();
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
      volume: vol * (1 - i * 0.03), // gentle falloff
      type,
      delay: i * spacing,
      harmonic,
    });
  });
}