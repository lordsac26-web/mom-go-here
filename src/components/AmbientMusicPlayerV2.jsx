/**
 * AmbientMusicPlayerV2.js
 *
 * Streams real ambient / relaxation radio stations via the free Radio Browser API.
 * Falls back to a curated list of public internet radio streams.
 * Manages browser audio-unlock, volume, and mute state.
 */

// Curated fallback streams — public internet radio stations with ambient/relaxation music
const FALLBACK_STREAMS = [
  "https://streams.calmradio.com/api/39/128/stream",
  "https://radio.stereoscenic.com/asp-s",
  "https://ice6.somafm.com/dronezone-128-mp3",
  "https://ice6.somafm.com/deepspaceone-128-mp3",
  "https://ice4.somafm.com/spacestation-128-mp3",
  "https://ice2.somafm.com/ambient-128-mp3",
];

export default class AmbientMusicPlayerV2 {
  #audio = null;
  #isPlaying = false;
  #musicVolume = 0.5;
  #muteAll = false;
  #muteMusic = false;
  #unlockListenersAttached = false;
  #streams = [...FALLBACK_STREAMS];
  #currentIndex = 0;
  #retryCount = 0;
  #fetchedStreams = false;

  constructor({ musicVolume = 0.5, muteAll = false, muteMusic = false } = {}) {
    this.#musicVolume = musicVolume;
    this.#muteAll = muteAll;
    this.#muteMusic = muteMusic;
    this.#fetchRadioStreams();
    this.#attachUnlockListeners();
  }

  // ─── Public API ────────────────────────────────────────────

  setVolume(volume) {
    this.#musicVolume = Math.max(0, Math.min(1, volume));
    if (this.#audio) this.#audio.volume = this.#musicVolume;
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
  }

  // ─── Private ───────────────────────────────────────────────

  #shouldPlay() {
    return !this.#muteAll && !this.#muteMusic && this.#musicVolume > 0;
  }

  #syncPlayback() {
    if (this.#shouldPlay() && !this.#isPlaying) {
      this.#play();
    } else if (!this.#shouldPlay() && this.#isPlaying) {
      this.#stop();
    }
    if (this.#audio) {
      this.#audio.volume = this.#shouldPlay() ? this.#musicVolume : 0;
    }
  }

  // Fetch real ambient radio streams from Radio Browser API
  async #fetchRadioStreams() {
    if (this.#fetchedStreams) return;
    this.#fetchedStreams = true;
    try {
      const res = await fetch(
        "https://de1.api.radio-browser.info/json/stations/bytag/ambient?limit=10&order=clickcount&reverse=true&hidebroken=true"
      );
      if (res.ok) {
        const stations = await res.json();
        const urls = stations
          .filter(s => s.url_resolved && s.codec === "MP3")
          .map(s => s.url_resolved);
        if (urls.length > 0) {
          this.#streams = [...urls, ...FALLBACK_STREAMS];
        }
      }
    } catch (_) {
      // Fallback streams are already set
    }
  }

  #attachUnlockListeners() {
    if (this.#unlockListenersAttached) return;
    this.#unlockListenersAttached = true;

    const unlock = () => {
      if (this.#shouldPlay() && !this.#isPlaying) this.#play();
      this.#detachUnlockListeners();
    };

    this._unlockHandler = unlock;
    document.addEventListener("click", unlock, { once: false });
    document.addEventListener("touchstart", unlock, { once: false });
    document.addEventListener("keydown", unlock, { once: false });
  }

  #detachUnlockListeners() {
    if (this._unlockHandler) {
      document.removeEventListener("click", this._unlockHandler);
      document.removeEventListener("touchstart", this._unlockHandler);
      document.removeEventListener("keydown", this._unlockHandler);
      this._unlockHandler = null;
    }
  }

  #play() {
    if (this.#isPlaying) return;
    this.#isPlaying = true;
    this.#tryStream();
  }

  #tryStream() {
    if (!this.#isPlaying) return;

    // Clean up old audio element
    if (this.#audio) {
      this.#audio.pause();
      this.#audio.removeAttribute("src");
      this.#audio.load();
      this.#audio = null;
    }

    const url = this.#streams[this.#currentIndex % this.#streams.length];

    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = this.#musicVolume;
    audio.preload = "none";

    audio.addEventListener("error", () => {
      this.#retryCount++;
      if (this.#retryCount < this.#streams.length + 3) {
        this.#currentIndex = (this.#currentIndex + 1) % this.#streams.length;
        setTimeout(() => this.#tryStream(), 1500);
      }
    });

    // If stream stalls, try next
    audio.addEventListener("stalled", () => {
      setTimeout(() => {
        if (this.#audio === audio && audio.paused && this.#isPlaying) {
          this.#currentIndex = (this.#currentIndex + 1) % this.#streams.length;
          this.#tryStream();
        }
      }, 8000);
    });

    audio.src = url;
    this.#audio = audio;

    audio.play().catch(() => {
      // Auto-play blocked or stream failed — try next
      this.#currentIndex = (this.#currentIndex + 1) % this.#streams.length;
      this.#retryCount++;
      if (this.#retryCount < this.#streams.length + 3) {
        setTimeout(() => this.#tryStream(), 2000);
      }
    });
  }

  #stop() {
    this.#isPlaying = false;
    if (this.#audio) {
      this.#audio.pause();
      this.#audio.removeAttribute("src");
      this.#audio.load();
      this.#audio = null;
    }
  }
}