import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import MagneticCard from "../components/MagneticCard";
import GameTileManager, { ALL_GAMES as MASTER_GAMES } from "../components/GameTileManager";
import { Settings } from "lucide-react";



export default function Games() {
  const { user } = useAuth();
  const [visibleGames, setVisibleGames] = useState(MASTER_GAMES);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [showManager, setShowManager] = useState(false);
  const [profileId, setProfileId] = useState(null);

  // FIX (bug): load the user's favorite_games preference and filter the list.
  // Previously the onboarding selection was saved but never applied here.
  const loadPrefs = useCallback(async (signal) => {
    if (!user?.email) {
      setLoadingPrefs(false);
      return;
    }
    // FIX (perf + bug): try/catch so a failed fetch falls back to showing all games
    // rather than freezing the spinner or crashing the page.
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (signal?.aborted) return;
      setProfileId(profiles[0]?.id || null);
      const favPaths = profiles[0]?.favorite_games;
      if (Array.isArray(favPaths) && favPaths.length > 0) {
        setVisibleGames(MASTER_GAMES.filter(g => favPaths.includes(g.path)));
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Could not load game preferences:", err);
      // Fall back to showing all games — better than a blank screen
    } finally {
      if (!signal?.aborted) setLoadingPrefs(false);
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    loadPrefs(controller.signal);
    return () => controller.abort();
  }, [loadPrefs]);

  if (loadingPrefs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleGameUpdate(paths) {
    if (profileId) {
      await base44.entities.UserProfile.update(profileId, { favorite_games: paths });
      setVisibleGames(MASTER_GAMES.filter(g => paths.includes(g.path)));
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-2 px-2">
        <div />
        <h1 className="text-4xl font-black text-primary text-center">🎮 Choose a Game</h1>
        <button
          onClick={() => setShowManager(true)}
          className="bg-secondary text-foreground p-3 rounded-xl"
          aria-label="Manage games"
        >
          <Settings size={24} />
        </button>
      </div>
      <p className="text-center text-muted-foreground text-xl mb-8">Tap any game to start playing!</p>

      {showManager && (
        <GameTileManager
          currentGames={visibleGames}
          onUpdate={handleGameUpdate}
          onClose={() => setShowManager(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-5 max-w-lg mx-auto">
        {visibleGames.map((game) => (
          <MagneticCard key={game.path} strength={0.35} rotationStrength={0.18} hoverScale={1.03}>
            {/* FIX (bug): added w-full so the link fills the magnetic card wrapper edge-to-edge */}
            <Link
              to={game.path}
              className={`bg-gradient-to-r ${game.color} rounded-2xl p-6 shadow-xl flex items-center gap-5 w-full`}
            >
              <span className="text-6xl">{game.emoji}</span>
              <div>
                <div className="text-2xl font-black text-white">{game.name}</div>
                <div className="text-white/80 text-lg font-semibold mt-1">{game.desc}</div>
              </div>
            </Link>
          </MagneticCard>
        ))}
      </div>
    </div>
  );
}