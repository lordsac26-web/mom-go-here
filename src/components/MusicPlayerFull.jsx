import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Radio, Loader2 } from "lucide-react";
import MUSIC_GENRES from "./MusicGenreData";
import { useAudioStore } from "@/stores/audioStore";
import VolumeSlider from "./VolumeSlider";

const DEFAULT_FALLBACKS = [
  "https://ice6.somafm.com/dronezone-128-mp3",
  "https://ice2.somafm.com/ambient-128-mp3",
];

export default function MusicPlayerFull() {
  const musicVolume = useAudioStore(s => s.musicVolume);
  const setMusicVolume = useAudioStore(s => s.setMusicVolume);
  const muteAll = useAudioStore(s => s.muteAll);
  const muteMusic = useAudioStore(s => s.muteMusic);
  const musicGenre = useAudioStore(s => s.musicGenre);
  const setCurrentStreamUrl = useAudioStore(s => s.setCurrentStreamUrl);
  const setCurrentStationName = useAudioStore(s => s.setCurrentStationName);
  const setPlayerActive = useAudioStore(s => s.setPlayerActive);
  const currentStationName = useAudioStore(s => s.currentStationName);
  const isPlayerActive = useAudioStore(s => s.isPlayerActive);

  const [streams, setStreams] = useState([]);
  const [streamIndex, setStreamIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stationNames, setStationNames] = useState([]);
  const fetchControllerRef = useRef(null);

  const isMuted = muteAll || muteMusic;
  const genreConfig = MUSIC_GENRES.find(g => g.key === musicGenre) || MUSIC_GENRES[0];

  // Load streams when genre changes
  useEffect(() => {
    let cancelled = false;
    if (fetchControllerRef.current) fetchControllerRef.current.abort();
    fetchControllerRef.current = new AbortController();

    setLoading(true);
    setPlayerActive(false);
    setStreamIndex(0);

    const fallbackStreams = [...genreConfig.fallbacks, ...DEFAULT_FALLBACKS];
    const fallbackNames = fallbackStreams.map(() => `${genreConfig.label} Radio`);

    async function load() {
      try {
        const res = await fetch(
          `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(genreConfig.tag)}?limit=15&order=clickcount&reverse=true&hidebroken=true`,
          { signal: fetchControllerRef.current.signal }
        );
        if (res.ok && !cancelled) {
          const stations = await res.json();
          const valid = stations.filter(s => s.url_resolved && (s.codec === "MP3" || s.codec === "AAC"));
          if (valid.length > 0) {
            const urls = valid.map(s => s.url_resolved);
            const names = valid.map(s => s.name || `${genreConfig.label} Radio`);
            setStreams([...urls, ...fallbackStreams]);
            setStationNames([...names, ...fallbackNames]);
            setCurrentStreamUrl(urls[0]);
            setCurrentStationName(names[0]);
            setLoading(false);
            return;
          }
        }
      } catch (_) { /* fallback */ }

      if (!cancelled) {
        setStreams(fallbackStreams);
        setStationNames(fallbackNames);
        setCurrentStreamUrl(fallbackStreams[0]);
        setCurrentStationName(fallbackNames[0]);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [musicGenre]);

  // Update current URL/name when index changes
  useEffect(() => {
    if (streams.length > 0) {
      setCurrentStreamUrl(streams[streamIndex]);
      setCurrentStationName(stationNames[streamIndex] || `${genreConfig.label} Radio`);
    }
  }, [streamIndex, streams, stationNames]);

  const handlePlay = useCallback(() => {
    if (isMuted || streams.length === 0) return;
    setPlayerActive(true);
  }, [isMuted, streams]);

  const handlePause = useCallback(() => {
    setPlayerActive(false);
  }, []);

  const handleSkip = useCallback(() => {
    if (streams.length === 0) return;
    const nextIdx = (streamIndex + 1) % streams.length;
    setStreamIndex(nextIdx);
    setPlayerActive(true);
  }, [streams, streamIndex]);

  // Stop playback when muted
  useEffect(() => {
    if (isMuted) setPlayerActive(false);
  }, [isMuted]);

  return (
    <div className="bg-card border-2 border-primary rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2">
        <Radio size={28} className="text-primary" />
        <h2 className="text-2xl font-black text-primary">Music Player</h2>
      </div>

      {/* Now playing */}
      <div className="bg-secondary rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{genreConfig.emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black text-foreground truncate">
              {currentStationName || `${genreConfig.label} Radio`}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              Genre: {genreConfig.label}
            </p>
          </div>
          {loading && <Loader2 size={20} className="text-primary animate-spin" />}
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={isPlayerActive ? handlePause : handlePlay}
            disabled={isMuted || loading || streams.length === 0}
            className="bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg disabled:opacity-40 transition-transform active:scale-90"
          >
            {isPlayerActive ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <button
            onClick={handleSkip}
            disabled={isMuted || loading || streams.length === 0}
            className="bg-secondary text-foreground w-12 h-12 rounded-full flex items-center justify-center border-2 border-border disabled:opacity-40 transition-transform active:scale-90"
          >
            <SkipForward size={22} />
          </button>
        </div>

        {/* Visualizer bars */}
        {isPlayerActive && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="w-1.5 bg-primary rounded-full"
                style={{
                  height: "12px",
                  animation: `barBounce 0.6s ${i * 0.1}s ease-in-out infinite alternate`,
                }}
              />
            ))}
            <span className="text-xs text-primary font-bold ml-2">LIVE</span>
          </div>
        )}
      </div>

      {/* Volume control */}
      <VolumeSlider
        label="🎵 Music Volume"
        value={musicVolume}
        onChange={setMusicVolume}
        disabled={muteAll}
        muted={muteMusic}
        onMuteToggle={useAudioStore.getState().toggleMuteMusic}
      />

      {isMuted && (
        <p className="text-xs text-center text-muted-foreground">
          Enable music to start playback
        </p>
      )}

      {/* Inject bar bounce animation */}
      <style>{`
        @keyframes barBounce {
          0% { height: 6px; }
          100% { height: 20px; }
        }
      `}</style>
    </div>
  );
}