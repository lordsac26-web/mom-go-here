/**
 * AmbientMusicPlayer.js
 *
 * Ambient music player with procedurally generated looping background music.
 * Uses Web Audio API to create a simple, relaxing melody.
 *
 * Converted from React/JSX to plain JavaScript.
 * Bugs fixed:
 *   1. Autoplay unlock — AudioContext is resumed on first user gesture.
 *   2. Loop timing drift — next start time is passed forward precisely.
 *   3. Oscillator stop safety — oscillators are stopped only while still active.
 *
 * Usage:
 *   const player = new AmbientMusicPlayer({ musicVolume: 0.5 });
 *   player.setVolume(0.8);
 *   player.mute();
 *   player.unmute();
 *   player.destroy();
 */

export default class AmbientMusicPlayer {
  #audioContext = null;
  #activeNotes = [];
  #timeoutIds = [];
  #isPlaying = false;
  #musicVolume = 0.5;
  #muteAll = false;
  #muteMusic = false;
  #unlockListenersAttached = false;

  // C major pentatonic melody
  #notes = [
    { freq: 261.63, dur: 0.8 }, // C4
    { freq: 329.63, dur: 0.8 }, // E4
    { freq: 392.0,  dur: 1.0 }, // G4
    { freq: 329.63, dur: 0.8 }, // E4
    { freq: 261.63, dur: 1.2 }, // C4
    { freq: 329.63, dur: 0.8 }, // E4
    { freq: 392.0,  dur: 0.8 }, // G4
    { freq: 440.0,  dur: 1.0 }, // A4
  ];

  constructor({ musicVolume = 0.5, muteAll = false, muteMusic = false } = {}) {
    this.#musicVolume = musicVolume;
    this.#muteAll = muteAll;
    this.#muteMusic = muteMusic;

    this.#attachUnlockListeners();
    this.#syncPlayback();
  }

  // ─── Public API ───────────────────────────────────────────────

  /** Set volume (0–1). Updates live playback gain on next note. */
  setVolume(volume) {
    this.#musicVolume = Math.max(0, Math.min(1, volume));
    this.#syncPlayback();
  }

  /** Mute/unmute the global mute flag. */
  setMuteAll(value) {
    this.#muteAll = value;
    this.#syncPlayback();
  }

  /** Mute/unmute just the music track. */
  setMuteMusic(value) {
    this.#muteMusic = value;
    this.#syncPlayback();
  }

  /** Stop and clean up all resources. Call when done. */
  destroy() {
    this.#stop();
    this.#detachUnlockListeners();
    if (this.#audioContext) {
      this.#audioContext.close();
      this.#audioContext = null;
    }
  }

  // ─── Private ──────────────────────────────────────────────────

  #shouldPlay() {
    return !this.#muteAll && !this.#muteMusic && this.#musicVolume > 0;
  }

  #syncPlayback() {
    if (this.#shouldPlay() && !this.#isPlaying) {
      this.#play();
    } else if (!this.#shouldPlay() && this.#isPlaying) {
      this.#stop();
    }
  }

  // ── FIX 1: Attach one-time user-gesture listeners to unlock AudioContext ──
  #attachUnlockListeners() {
    if (this.#unlockListenersAttached) return;
    this.#unlockListenersAttached = true;

    const unlock = () => {
      this.#initAudioContext();
      if (this.#audioContext?.state === 'suspended') {
        this.#audioContext.resume().then(() => {
          // Now that context is running, start if we should
          if (this.#shouldPlay() && !this.#isPlaying) {
            this.#play();
          }
        });
      }
      this.#detachUnlockListeners();
    };

    this._unlockHandler = unlock;
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }

  #detachUnlockListeners() {
    if (this._unlockHandler) {
      document.removeEventListener('click', this._unlockHandler);
      document.removeEventListener('keydown', this._unlockHandler);
      document.removeEventListener('touchstart', this._unlockHandler);
      this._unlockHandler = null;
    }
  }

  #initAudioContext() {
    if (!this.#audioContext) {
      try {
        this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported:', e);
      }
    }
    return this.#audioContext;
  }

  #play() {
    const ctx = this.#initAudioContext();
    if (!ctx || this.#isPlaying) return;

    // Can't play if context is still suspended (no user gesture yet)
    if (ctx.state === 'suspended') return;

    this.#isPlaying = true;

    try {
      this.#playMelody(ctx.currentTime);
    } catch (e) {
      console.warn('Ambient music failed:', e);
      this.#isPlaying = false;
    }
  }

  // ── FIX 2: Pass next start time forward to avoid timing drift ──
  #playMelody(startTime) {
    if (!this.#isPlaying) return;

    const ctx = this.#audioContext;
    if (!ctx) return;

    let currentTime = startTime;
    const noteList = [];

    for (const { freq, dur } of this.#notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const vol = this.#musicVolume;
      gain.gain.setValueAtTime(0, currentTime);
      gain.gain.linearRampToValueAtTime((vol * 0.2) / 2, currentTime + 0.05);
      gain.gain.linearRampToValueAtTime((vol * 0.15) / 2, currentTime + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, currentTime + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(currentTime);
      osc.stop(currentTime + dur);

      // ── FIX 3: Remove from active list once the oscillator finishes ──
      osc.onended = () => {
        const idx = noteList.indexOf(node);
        if (idx !== -1) noteList.splice(idx, 1);
      };

      const node = { osc, gain };
      noteList.push(node);

      currentTime += dur;
    }

    this.#activeNotes = noteList;

    // Schedule next iteration using the exact computed next start time
    const totalDuration = this.#notes.reduce((sum, n) => sum + n.dur, 0);
    const nextStart = startTime + totalDuration;
    const delayMs = (nextStart - ctx.currentTime) * 1000;

    const timeoutId = setTimeout(() => {
      this.#playMelody(nextStart); // ✅ precise: no clock re-read
    }, delayMs);

    this.#timeoutIds.push(timeoutId);
  }

  #stop() {
    this.#isPlaying = false;

    // Clear scheduled loops
    this.#timeoutIds.forEach(id => clearTimeout(id));
    this.#timeoutIds = [];

    // Stop all oscillators that are still active
    this.#activeNotes.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch (_) {
        // Already stopped — safe to ignore
      }
    });
    this.#activeNotes = [];
  }
}