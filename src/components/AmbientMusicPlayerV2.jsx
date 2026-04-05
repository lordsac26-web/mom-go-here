/**
 * AmbientMusicPlayerV2.js
 * 
 * Plays ambient background music using procedural Web Audio API synthesis.
 * Creates layered, evolving ambient soundscapes with pads, chimes, and drones.
 * No external files needed — pure generative audio.
 */

export default class AmbientMusicPlayerV2 {
  #audioContext = null;
  #masterGain = null;
  #isPlaying = false;
  #musicVolume = 0.5;
  #muteAll = false;
  #muteMusic = false;
  #unlockListenersAttached = false;

  // Active sound layers
  #layers = [];
  #timeoutIds = [];
  #intervalIds = [];

  // Pentatonic scale frequencies for pleasant ambient sounds
  #scaleFreqs = [
    130.81, 146.83, 164.81, 196.00, 220.00, // C3-A3
    261.63, 293.66, 329.63, 392.00, 440.00, // C4-A4
    523.25, 587.33, 659.26, 783.99, 880.00, // C5-A5
  ];

  // Deep drone frequencies
  #droneFreqs = [65.41, 73.42, 82.41, 98.00]; // C2, D2, E2, G2

  constructor({ musicVolume = 0.5, muteAll = false, muteMusic = false } = {}) {
    this.#musicVolume = musicVolume;
    this.#muteAll = muteAll;
    this.#muteMusic = muteMusic;
    this.#attachUnlockListeners();
  }

  // ─── Public API ───────────────────────────────────────────────

  setVolume(volume) {
    this.#musicVolume = Math.max(0, Math.min(1, volume));
    this.#updateGain();
    this.#syncPlayback();
  }

  setMuteAll(value) {
    this.#muteAll = value;
    this.#updateGain();
    this.#syncPlayback();
  }

  setMuteMusic(value) {
    this.#muteMusic = value;
    this.#updateGain();
    this.#syncPlayback();
  }

  destroy() {
    this.#stop();
    this.#detachUnlockListeners();
    if (this.#audioContext && this.#audioContext.state !== 'closed') {
      this.#audioContext.close().catch(() => {});
    }
    this.#audioContext = null;
  }

  // ─── Private ──────────────────────────────────────────────────

  #shouldPlay() {
    return !this.#muteAll && !this.#muteMusic && this.#musicVolume > 0;
  }

  #updateGain() {
    if (this.#masterGain) {
      const target = this.#shouldPlay() ? this.#musicVolume * 0.25 : 0;
      try {
        this.#masterGain.gain.linearRampToValueAtTime(
          target,
          this.#audioContext.currentTime + 0.3
        );
      } catch (_) {
        this.#masterGain.gain.value = target;
      }
    }
  }

  #syncPlayback() {
    if (this.#shouldPlay() && !this.#isPlaying) {
      this.#play();
    } else if (!this.#shouldPlay() && this.#isPlaying) {
      this.#stop();
    }
  }

  #attachUnlockListeners() {
    if (this.#unlockListenersAttached) return;
    this.#unlockListenersAttached = true;

    const unlock = () => {
      this.#initAudio();
      if (this.#audioContext?.state === 'suspended') {
        this.#audioContext.resume().then(() => {
          if (this.#shouldPlay() && !this.#isPlaying) this.#play();
        });
      } else if (this.#shouldPlay() && !this.#isPlaying) {
        this.#play();
      }
      this.#detachUnlockListeners();
    };

    this._unlockHandler = unlock;
    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('touchstart', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });
  }

  #detachUnlockListeners() {
    if (this._unlockHandler) {
      document.removeEventListener('click', this._unlockHandler);
      document.removeEventListener('touchstart', this._unlockHandler);
      document.removeEventListener('keydown', this._unlockHandler);
      this._unlockHandler = null;
    }
  }

  #initAudio() {
    if (this.#audioContext) return;
    try {
      this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.#masterGain = this.#audioContext.createGain();
      this.#masterGain.gain.value = 0;
      this.#masterGain.connect(this.#audioContext.destination);
    } catch (e) {
      console.warn('AudioContext not available:', e);
    }
  }

  #play() {
    this.#initAudio();
    const ctx = this.#audioContext;
    if (!ctx || ctx.state === 'suspended') return;
    if (this.#isPlaying) return;

    this.#isPlaying = true;
    this.#updateGain();

    // Layer 1: Deep evolving drone
    this.#startDrone();

    // Layer 2: Slow pad chords
    this.#startPads();

    // Layer 3: Random chime sparkles
    this.#startChimes();

    // Layer 4: Subtle noise wash
    this.#startNoiseWash();
  }

  // ── DRONE: Low continuous tone that slowly shifts pitch ──
  #startDrone() {
    const ctx = this.#audioContext;
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    const baseFreq = this.#droneFreqs[Math.floor(Math.random() * this.#droneFreqs.length)];
    osc1.frequency.value = baseFreq;
    osc2.frequency.value = baseFreq * 1.002; // Slight detune for warmth

    gain.gain.value = 0.35;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.#masterGain);

    osc1.start();
    osc2.start();

    this.#layers.push({ osc: osc1, gain }, { osc: osc2, gain });

    // Slowly evolve the drone pitch
    const droneInterval = setInterval(() => {
      if (!this.#isPlaying) return;
      const newFreq = this.#droneFreqs[Math.floor(Math.random() * this.#droneFreqs.length)];
      const now = ctx.currentTime;
      osc1.frequency.linearRampToValueAtTime(newFreq, now + 8);
      osc2.frequency.linearRampToValueAtTime(newFreq * 1.002, now + 8);
    }, 10000);

    this.#intervalIds.push(droneInterval);
  }

  // ── PADS: Slow chord swells ──
  #startPads() {
    const ctx = this.#audioContext;
    if (!ctx) return;

    const playPadChord = () => {
      if (!this.#isPlaying) return;

      // Pick 2-3 notes from the lower pentatonic range
      const noteCount = 2 + Math.floor(Math.random() * 2);
      const chordFreqs = [];
      for (let i = 0; i < noteCount; i++) {
        const idx = Math.floor(Math.random() * 10); // Lower range
        chordFreqs.push(this.#scaleFreqs[idx]);
      }

      const duration = 6 + Math.random() * 6; // 6-12 seconds

      chordFreqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 800 + Math.random() * 400;
        filter.Q.value = 0.5;

        const now = ctx.currentTime;
        const attackTime = 1.5 + Math.random();
        const releaseTime = 2 + Math.random();

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + attackTime);
        gain.gain.setValueAtTime(0.15, now + duration - releaseTime);
        gain.gain.linearRampToValueAtTime(0, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.#masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    // Play a pad chord immediately, then every 8-15 seconds
    playPadChord();
    const padInterval = setInterval(() => {
      playPadChord();
    }, 8000 + Math.random() * 7000);

    this.#intervalIds.push(padInterval);
  }

  // ── CHIMES: Random sparkle notes ──
  #startChimes() {
    const ctx = this.#audioContext;
    if (!ctx) return;

    const playChime = () => {
      if (!this.#isPlaying) return;

      const freq = this.#scaleFreqs[5 + Math.floor(Math.random() * 10)]; // Higher range
      const duration = 1.5 + Math.random() * 2;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.06, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.#masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    };

    // Random chimes every 2-6 seconds
    const chimeInterval = setInterval(() => {
      if (Math.random() > 0.4) playChime(); // 60% chance each tick
    }, 2000 + Math.random() * 4000);

    this.#intervalIds.push(chimeInterval);
  }

  // ── NOISE WASH: Subtle filtered noise for atmosphere ──
  #startNoiseWash() {
    const ctx = this.#audioContext;
    if (!ctx) return;

    // Create noise buffer
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 0.3;

    const gain = ctx.createGain();
    gain.gain.value = 0.04; // Very quiet

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.#masterGain);

    noise.start();

    this.#layers.push({ osc: noise, gain });

    // Slowly modulate filter frequency
    const noiseInterval = setInterval(() => {
      if (!this.#isPlaying) return;
      const newFreq = 200 + Math.random() * 600;
      filter.frequency.linearRampToValueAtTime(newFreq, ctx.currentTime + 5);
    }, 7000);

    this.#intervalIds.push(noiseInterval);
  }

  #stop() {
    this.#isPlaying = false;

    // Clear all intervals and timeouts
    this.#intervalIds.forEach(id => clearInterval(id));
    this.#intervalIds = [];
    this.#timeoutIds.forEach(id => clearTimeout(id));
    this.#timeoutIds = [];

    // Stop all active oscillators/sources
    this.#layers.forEach(({ osc }) => {
      try { osc.stop(); } catch (_) {}
    });
    this.#layers = [];

    // Fade master gain to 0
    if (this.#masterGain) {
      try {
        this.#masterGain.gain.linearRampToValueAtTime(0, this.#audioContext.currentTime + 0.2);
      } catch (_) {
        this.#masterGain.gain.value = 0;
      }
    }
  }
}