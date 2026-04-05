import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Loader2, ChevronDown, X } from "lucide-react";
import GenrePickerDropdown from "./GenrePickerDropdown";
import MUSIC_GENRES from "./MusicGenreData";
import { useAudioStore } from "@/stores/audioStore";

const DEFAULT_FALLBACKS = [
  "https://ice6.somafm.com/dronezone-128-mp3",
  "https://ice2.somafm.com/ambient-128-mp3",
];

/**
 * Compact mini player bar shown in the Layout header/footer area
 * when ambient music is enabled.
 */
export default function MiniMusicPlayer() {
  const muteAll = useAudioStore(s => s.muteAll);
  const muteMusic = useAudioStore(s => s.muteMusic);
  const musicGenre = useAudioStore(s => s.musicGenre);
  const setMusicGenre = useAudioStore(s => s.setMusicGenre);
  const setCurrentStreamUrl = useAudioStore(s => s.setCurrentStreamUrl);
  const setCurrentStationName = useAudioStore(s => s.setCurrentStationName);
  const setPlayerActive = useAudioStore(s => s.setPlayerActive);
  const currentStationName = useAudioStore(s => s.currentStationName);
  const isPlayerActive = useAudioStore(s => s.isPlayerActive);

  const [streams, setStreams] = useState([]);
  const [streamIndex, setStreamIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stationNames, setStationNames] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const fetchRef = useRef(null);

  const isMuted = muteAll || muteMusic;
  const genreConfig = MUSIC_GENRES.find(g => g.key === musicGenre) || MUSIC_GENRES[0];

  // Load streams when genre changes
  useEffect(() => {
    if (isMuted) return;
    let cancelled = false;
    if (fetchRef.current) fetchRef.current.abort();
    fetchRef.current = new AbortController();

    setLoading(true);
    setPlayerActive(false);
    setStreamIndex(0);

    const fallbackStreams = [...genreConfig.fallbacks, ...DEFAULT_FALLBACKS];
    const fallbackNames = fallbackStreams.map(() => `${genreConfig.label} Radio`);

    async function load() {
      try {
        const res = await fetch(
          `https://de1.api.radio-browser.info/json/stations/bytag/${encodeURIComponent(genreConfig.tag)}?limit=15&order=clickcount&reverse=true&hidebroken=true`,
          { signal: fetchRef.current.signal }
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
  }, [musicGenre, isMuted]);

  useEffect(() => {
    if (streams.length > 0) {
      setCurrentStreamUrl(streams[streamIndex]);
      setCurrentStationName(stationNames[streamIndex] || `${genreConfig.label} Radio`);
    }
  }, [streamIndex, streams, stationNames]);

  const handlePlay = useCallback(() => {
    if (streams.length === 0) return;
    setPlayerActive(true);
  }, [streams]);

  const handlePause = useCallback(() => {
    setPlayerActive(false);
  }, []);

  const handleSkip = useCallback(() => {
    if (streams.length === 0) return;
    const next = (streamIndex + 1) % streams.length;
    setStreamIndex(next);
    setPlayerActive(true);
  }, [streams, streamIndex]);

  if (isMuted) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-secondary/80 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-border">
        {/* Play/Pause */}
        <button
          onClick={isPlayerActive ? handlePause : handlePlay}
          disabled={loading || streams.length === 0}
          className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40 transition-transform active:scale-90 flex-shrink-0"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlayerActive ? (
            <Pause size={14} />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </button>

        {/* Station info — tappable to open genre picker */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="min-w-0 flex-1 text-left flex items-center gap-1"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate leading-tight">
              {genreConfig.emoji} {currentStationName || `${genreConfig.label} Radio`}
            </p>
            {isPlayerActive && (
              <div className="flex items-center gap-1 mt-0.5">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    style={{
                      height: "6px",
                      animation: `miniBarBounce 0.5s ${i * 0.08}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
                <span className="text-[10px] text-primary font-bold ml-1">LIVE</span>
              </div>
            )}
          </div>
          <ChevronDown size={14} className={`text-muted-foreground flex-shrink-0 transition-transform ${showPicker ? 'rotate-180' : ''}`} />
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          disabled={loading || streams.length === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-transform active:scale-90 flex-shrink-0"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Genre Picker Dropdown */}
      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <GenrePickerDropdown
            musicGenre={musicGenre}
            onSelect={(key) => { setMusicGenre(key); setShowPicker(false); }}
            onClose={() => setShowPicker(false)}
          />
        </>
      )}

      <style>{`
        @keyframes miniBarBounce {
          0% { height: 3px; }
          100% { height: 10px; }
        }
      `}</style>
    </div>
  );
}