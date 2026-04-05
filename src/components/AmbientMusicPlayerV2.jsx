/**
 * AmbientMusicPlayerV2.js
 *
 * Streams real radio stations via the free Radio Browser API by genre tag.
 * Falls back to curated public internet radio streams per genre.
 * Manages browser audio-unlock, volume, and mute state.
 */

import MUSIC_GENRES from "./MusicGenreData";

// Default fallbacks if genre not found
const DEFAULT_FALLBACKS = [
  "https://ice6.somafm.com/dronezone-128-mp3",
  "https://ice2.somafm.com/ambient-128-mp3",
  "https://radio.stereoscenic.com/asp-s",
];

export default class AmbientMusicPlayerV2 {
  #audio = null;
  #isPlaying = false;
  #musicVolume = 0.5;
  #muteAll = false;
  #muteMusic = false;
  #unlockListenersAttached = false;
  #streams = [];
  #currentIndex = 0;
  #retryCount = 0;
  #genre = "ambient";
  #fetchController = null;

  constructor({ musicVolume = 0.5, muteAll = false, muteMusic = false, genre = "ambient" } = {}) {
    this.#musicVolume = musicVolume;
    this.#muteAll = muteAll;
    this.#muteMusic = muteMusic;
    this.#genre = genre;
    this.#loadGenreStreams(genre);
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

  setGenre(genre) {
    if (genre === this.#genre) return;
    this.#genre = genre;
    this.#stop();
    this.#loadGenreStreams(genre);
  }

  destroy() {
    this.#stop();
    this.#detachUnlockListeners();
    if (this.#fetchController) this.#fetchController.abort();
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

  #getGenreConfig(genre) {
    return MUSIC_GENRES.find(g => g.key === genre) || MUSIC_GENRES[0];
  }

  async #loadGenreStreams(genre) {
    const config = this.#getGenreConfig(genre);
    this.#streams = [...config.fallbacks, ...DEFAULT_FALLBACKS];
    this.#currentIndex = 0;
    this.#retryCount = 0;

    // Try to fetch live streams from Radio Browser API
    if (this.#fetchController) this.#fetchController.abort();
    this.#fetchController = new AbortController();

    try {
      const res = await fetch(
        `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(config.tag)}?limit=12&order=clickcount&reverse=true&hidebroken=true`,
        { signal: this.#fetchController.signal }
      );
      if (res.ok) {
        const stations = await res.json();
        const urls = stations
          .filter(s => s.url_resolved && (s.codec === "MP3" || s.codec === "AAC"))
          .map(s => s.url_resolved);
        if (urls.length > 0) {
          this.#streams = [...urls, ...config.fallbacks, ...DEFAULT_FALLBACKS];
        }
      }
    } catch (_) {
      // Fallback streams are already set
    }

    // If we should be playing, restart with new streams
    if (this.#shouldPlay()) {
      this.#play();
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