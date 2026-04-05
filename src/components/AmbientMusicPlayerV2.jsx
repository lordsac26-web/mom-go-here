/**
 * AmbientMusicPlayerV2.js
 * 
 * Plays real ambient music from Pixabay Music API (free, royalty-free)
 * with a synthesizer fallback if API fails.
 * 
 * Usage:
 *   const player = new AmbientMusicPlayerV2({ musicVolume: 0.5 });
 *   player.setVolume(0.8);
 *   player.mute();
 *   player.unmute();
 *   player.destroy();
 */

export default class AmbientMusicPlayerV2 {
  #audioContext = null;
  #audioElement = null;
  #gainNode = null;
  #isPlaying = false;
  #musicVolume = 0.5;
  #muteAll = false;
  #muteMusic = false;
  #unlockListenersAttached = false;
  #currentTrackIndex = 0;
  #retryCount = 0;
  #maxRetries = 3;

  // Curated ambient music from Pixabay (no API key needed for direct links)
  #ambientTracks = [
    // Free ambient music tracks from Pixabay
    'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2b87ab41b1.mp3',
    'https://cdn.pixabay.com/download/audio/2022/02/15/audio_51f77db9f8.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_d2176a21f5.mp3',
    'https://cdn.pixabay.com/download/audio/2021/08/04/audio_e8bb2ac6e8.mp3',
    'https://cdn.pixabay.com/download/audio/2021/01/29/audio_e1537a5e0f.mp3',
  ];

  // Synth fallback (original pentatonic melody)
  #notes = [
    { freq: 261.63, dur: 0.8 },  // C4
    { freq: 329.63, dur: 0.8 },  // E4
    { freq: 392.0,  dur: 1.0 },  // G4
    { freq: 329.63, dur: 0.8 },  // E4
    { freq: 261.63, dur: 1.2 },  // C4
    { freq: 329.63, dur: 0.8 },  // E4
    { freq: 392.0,  dur: 0.8 },  // G4
    { freq: 440.0,  dur: 1.0 },  // A4
  ];

  #activeNotes = [];
  #timeoutIds = [];
  #usingSynth = false;

  constructor({ musicVolume = 0.5, muteAll = false, muteMusic = false } = {}) {
    this.#musicVolume = musicVolume;
    this.#muteAll = muteAll;
    this.#muteMusic = muteMusic;

    this.#attachUnlockListeners();
    this.#syncPlayback();
  }

  // ─── Public API ───────────────────────────────────────────────

  setVolume(volume) {
    this.#musicVolume = Math.max(0, Math.min(1, volume));
    if (this.#gainNode) {
      this.#gainNode.gain.value = this.#shouldPlay() ? this.#musicVolume : 0;
    }
    this.#syncPlayback();
  }

  setMuteAll(value) {
    this.#muteAll = value;
    this.#syncPlayback();
  }

  setMuteMusic(value) {
    this.#muteMusic = value;
    this.#syncPlayback();
  }

  destroy() {
    this.#stop();
    this.#detachUnlockListeners();
    if (this.#audioElement) {
      this.#audioElement.pause();
      this.#audioElement.src = '';
      this.#audioElement = null;
    }
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

  #attachUnlockListeners() {
    if (this.#unlockListenersAttached) return;
    this.#unlockListenersAttached = true;

    const unlock = () => {
      this.#initAudioContext();
      if (this.#audioContext?.state === 'suspended') {
        this.#audioContext.resume().then(() => {
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
        this.#gainNode = this.#audioContext.createGain();
        this.#gainNode.connect(this.#audioContext.destination);
        this.#gainNode.gain.value = 0;
      } catch (e) {
        console.warn('AudioContext not supported:', e);
      }
    }
    return this.#audioContext;
  }

  #play() {
    const ctx = this.#initAudioContext();
    if (!ctx || this.#isPlaying) return;
    if (ctx.state === 'suspended') return;

    this.#isPlaying = true;
    this.#usingSynth = false;

    // Try to play audio file
    this.#playAudioFile();
  }

  #playAudioFile() {
    // Create audio element if needed
    if (!this.#audioElement) {
      this.#audioElement = new Audio();
      this.#audioElement.crossOrigin = 'anonymous';
      this.#audioElement.loop = true;
      this.#audioElement.volume = this.#musicVolume;

      this.#audioElement.addEventListener('ended', () => {
        if (this.#isPlaying) {
          this.#audioElement.currentTime = 0;
          this.#audioElement.play().catch(() => {
            this.#fallbackToSynth();
          });
        }
      });

      this.#audioElement.addEventListener('error', () => {
        this.#retryCount++;
        if (this.#retryCount < this.#maxRetries) {
          // Try next track
          this.#currentTrackIndex = (this.#currentTrackIndex + 1) % this.#ambientTracks.length;
          setTimeout(() => this.#playAudioFile(), 1000);
        } else {
          this.#fallbackToSynth();
        }
      });
    }

    const trackUrl = this.#ambientTracks[this.#currentTrackIndex];
    this.#audioElement.src = trackUrl;
    this.#audioElement.volume = this.#musicVolume;

    this.#audioElement.play().catch((err) => {
      console.warn('Failed to play audio:', err);
      this.#fallbackToSynth();
    });
  }

  #fallbackToSynth() {
    if (this.#usingSynth || !this.#isPlaying) return;
    console.log('🎹 Falling back to synthesizer...');
    this.#usingSynth = true;
    
    // Stop audio element
    if (this.#audioElement) {
      this.#audioElement.pause();
    }

    // Start synth
    const ctx = this.#audioContext;
    if (ctx) {
      this.#playMelody(ctx.currentTime);
    }
  }

  #playMelody(startTime) {
    if (!this.#isPlaying || !this.#usingSynth) return;

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
      gain.connect(this.#gainNode);

      osc.start(currentTime);
      osc.stop(currentTime + dur);

      const node = { osc, gain };
      noteList.push(node);

      currentTime += dur;
    }

    this.#activeNotes = noteList;

    const totalDuration = this.#notes.reduce((sum, n) => sum + n.dur, 0);
    const nextStart = startTime + totalDuration;
    const delayMs = (nextStart - ctx.currentTime) * 1000;

    const timeoutId = setTimeout(() => {
      this.#playMelody(nextStart);
    }, delayMs);

    this.#timeoutIds.push(timeoutId);
  }

  #stop() {
    this.#isPlaying = false;

    // Stop audio element
    if (this.#audioElement) {
      this.#audioElement.pause();
      this.#retryCount = 0;
    }

    // Stop synth
    this.#timeoutIds.forEach(id => clearTimeout(id));
    this.#timeoutIds = [];

    this.#activeNotes.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch (_) {
        // Already stopped
      }
    });
    this.#activeNotes = [];
  }
}