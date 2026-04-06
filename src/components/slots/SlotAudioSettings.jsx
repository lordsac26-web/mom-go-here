import { useState } from "react";
import { X, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const SFX_THEMES = [
  { key: "classic", label: "Classic Casino", emoji: "🎰", desc: "Traditional slot sounds" },
  { key: "retro", label: "Retro Arcade", emoji: "👾", desc: "8-bit style bleeps & bloops" },
  { key: "elegant", label: "Elegant", emoji: "✨", desc: "Soft, refined audio cues" },
  { key: "funky", label: "Funky", emoji: "🎸", desc: "Groovy bass-heavy effects" },
];

const AUDIO_TRACKS = [
  { key: "ambience", label: "Background Ambience", emoji: "🌙", desc: "Casino floor atmosphere" },
  { key: "reelSpin", label: "Reel Spin Sounds", emoji: "🔄", desc: "Spinning & stopping reels" },
  { key: "wins", label: "Win Celebrations", emoji: "🎉", desc: "Fanfares & coin sounds" },
  { key: "uiClicks", label: "Button Clicks", emoji: "👆", desc: "Interface tap sounds" },
];

const STORAGE_KEY = "slots_audio_prefs";

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function defaultPrefs() {
  return {
    theme: "classic",
    tracks: {
      ambience: { enabled: true, volume: 0.5 },
      reelSpin: { enabled: true, volume: 0.7 },
      wins: { enabled: true, volume: 0.8 },
      uiClicks: { enabled: true, volume: 0.6 },
    },
  };
}

export function useSlotAudioPrefs() {
  const [prefs, setPrefs] = useState(() => loadPrefs() || defaultPrefs());

  function updatePrefs(updater) {
    setPrefs(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return { prefs, updatePrefs };
}

export default function SlotAudioSettings({ open, onClose, prefs, updatePrefs }) {
  if (!open) return null;

  const { theme, tracks } = prefs;

  function setTheme(key) {
    updatePrefs(p => ({ ...p, theme: key }));
  }

  function toggleTrack(key) {
    updatePrefs(p => ({
      ...p,
      tracks: { ...p.tracks, [key]: { ...p.tracks[key], enabled: !p.tracks[key].enabled } },
    }));
  }

  function setTrackVolume(key, vol) {
    updatePrefs(p => ({
      ...p,
      tracks: { ...p.tracks, [key]: { ...p.tracks[key], volume: vol } },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-gray-900 border-t-4 sm:border-4 border-yellow-600 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Settings size={22} className="text-yellow-400" />
            <h2 className="text-xl font-black text-yellow-400">Audio Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-800">
            <X size={24} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* SFX Theme */}
          <div>
            <h3 className="text-lg font-black text-purple-400 mb-3">🎵 Sound Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {SFX_THEMES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    theme === t.key
                      ? "bg-purple-900/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                      : "bg-gray-800/50 border-gray-700 hover:border-gray-500"
                  }`}
                >
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="text-sm font-bold text-white mt-1">{t.label}</div>
                  <div className="text-[10px] text-gray-400">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Individual Audio Tracks */}
          <div>
            <h3 className="text-lg font-black text-cyan-400 mb-3">🎚️ Audio Tracks</h3>
            <div className="space-y-3">
              {AUDIO_TRACKS.map(track => {
                const t = tracks[track.key];
                return (
                  <div
                    key={track.key}
                    className={`rounded-2xl border-2 p-3 transition-all ${
                      t.enabled ? "bg-gray-800/50 border-gray-600" : "bg-gray-800/20 border-gray-700 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{track.emoji}</span>
                        <div>
                          <div className="text-sm font-bold text-white">{track.label}</div>
                          <div className="text-[10px] text-gray-400">{track.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTrack(track.key)}
                        className={`w-12 h-7 rounded-full relative transition-all ${
                          t.enabled ? "bg-green-600" : "bg-gray-600"
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                          t.enabled ? "left-6" : "left-1"
                        }`} />
                      </button>
                    </div>
                    {t.enabled && (
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 w-6">🔉</span>
                        <Slider
                          value={[t.volume * 100]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={([v]) => setTrackVolume(track.key, v / 100)}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-400 w-8 text-right">{Math.round(t.volume * 100)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full bg-yellow-500 text-gray-900 text-lg font-black py-3 rounded-2xl"
          >
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}