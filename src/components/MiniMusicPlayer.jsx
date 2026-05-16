import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, Loader2, ChevronDown } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import GenrePickerDropdown from "./GenrePickerDropdown";
import MUSIC_GENRES from "./MusicGenreData";
import { useAudioStore } from "@/stores/audioStore";

const DEFAULT_FALLBACKS = [
  "https://ice6.somafm.com/dronezone-128-mp3",
  "https://ice2.somafm.com/ambient-128-mp3",
];

/**
 * Uses vanilla Zustand subscribe() instead of hook selectors to avoid
 * the duplicate-React / null-dispatcher crash.
 */
export default function MiniMusicPlayer() {
  const [audioState, setAudioState] = useState(() => {
    const s = useAudioStore.getState();
    return {
      muteAll: s.muteAll,
      muteMusic: s.muteMusic,
      musicGenre: s.musicGenre,
      currentStationName: s.currentStationName,
      isPlayerActive: s.isPlayerActive,
    };
  });

  useEffect(() => {
    const unsub = useAudioStore.subscribe((s) =>
      setAudioState({
        muteAll: s.muteAll,
        muteMusic: s.muteMusic,
        musicGenre: s.musicGenre,
        currentStationName: s.currentStationName,
        isPlayerActive: s.isPlayerActive,
      })
    );
    return unsub;
  }, []);

  const { muteAll, muteMusic, musicGenre, currentStationName, isPlayerActive } = audioState;
  const setMusicGenre = (g) => useAudioStore.getState().setMusicGenre(g);
  const setCurrentStreamUrl = (url) => useAudioStore.getState().setCurrentStreamUrl(url);
  const setCurrentStationName = (name) => useAudioStore.getState().setCurrentStationName(name);
  const setPlayerActive = (active) => useAudioStore.getState().setPlayerActive(active);

  const [streams, setStreams] = useState([]);
  const [streamIndex, setStreamIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stationNames, setStationNames] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const fetchRef = useRef(null);
  const lastGenreRef = useRef(musicGenre);

  const isMuted = muteAll || muteMusic;
  const genreConfig = MUSIC_GENRES.find(g => g.key === musicGenre) || MUSIC_GENRES[0];

  useEffect(() => {
    if (isMuted) return;
    let cancelled = false;
    if (fetchRef.current) fetchRef.current.abort();
    fetchRef.current = new AbortController();

    const genreActuallyChanged = lastGenreRef.current !== musicGenre;
    lastGenreRef.current = musicGenre;

    if (genreActuallyChanged) {
      setLoading(true);
      setPlayerActive(false);
      setStreamIndex(0);
    } else if (streams.length === 0) {
      setLoading(true);
    }

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
      const url = streams[streamIndex];
      const name = stationNames[streamIndex] || `${genreConfig.label} Radio`;
      const store = useAudioStore.getState();
      if (store.currentStreamUrl !== url) setCurrentStreamUrl(url);
      if (store.currentStationName !== name) setCurrentStationName(name);
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

        <button
          onClick={() => setShowPicker(!showPicker)}
          className="min-w-0 flex-1 text-left flex items-center gap-1 overflow-hidden"
        >
          <div className="min-w-0 overflow-hidden">
            <p className="text-xs font-bold text-foreground truncate leading-tight max-w-[140px] sm:max-w-[200px]">
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

        <button
          onClick={handleSkip}
          disabled={loading || streams.length === 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-transform active:scale-90 flex-shrink-0 p-1"
        >
          <SkipForward size={18} />
        </button>
      </div>

      <Drawer open={showPicker} onOpenChange={setShowPicker}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-primary">🎶 Pick a Genre</DrawerTitle>
          </DrawerHeader>
          <GenrePickerDropdown
            musicGenre={musicGenre}
            onSelect={(key) => { setMusicGenre(key); setShowPicker(false); }}
            onClose={() => setShowPicker(false)}
          />
        </DrawerContent>
      </Drawer>

      <style>{`
        @keyframes miniBarBounce {
          0% { height: 3px; }
          100% { height: 10px; }
        }
      `}</style>
    </div>
  );
}