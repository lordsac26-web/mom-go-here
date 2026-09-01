import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import WarmLoader from "../components/WarmLoader";
import MagneticCard from "../components/MagneticCard";
import GameTileManager, { ALL_GAMES as MASTER_GAMES } from "../components/GameTileManager";
import { Settings, Trophy } from "lucide-react";
import SolitaireStatsDashboard from "../components/SolitaireStatsDashboard";



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

  if (loadingPrefs) return <WarmLoader message="Loading your games..." />;

  async function handleGameUpdate(paths) {
    if (profileId) {
      await base44.entities.UserProfile.update(profileId, { favorite_games: paths });
      setVisibleGames(MASTER_GAMES.filter(g => paths.includes(g.path)));
    }
  }

  return (
    <div className="min-h-screen px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24">
      <div className="flex items-center justify-between mb-2 px-2">
        <div />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary text-center">🎮 Choose a Game</h1>
        <button
          onClick={() => setShowManager(true)}
          className="bg-secondary text-foreground p-2.5 sm:p-3 rounded-xl"
          aria-label="Manage games"
        >
          <Settings size={22} />
        </button>
      </div>
      <p className="text-center text-muted-foreground text-base sm:text-lg lg:text-xl mb-4">Tap any game to start playing!</p>

      <Link
        to="/rankings"
        className="flex items-center justify-center gap-2 bg-primary/10 border-2 border-primary rounded-2xl px-5 py-3 mx-auto max-w-lg mb-6"
      >
        <Trophy size={22} className="text-primary" />
        <span className="text-lg font-black text-primary">Hall of Fame & Rankings</span>
      </Link>

      <div className="mx-auto max-w-lg">
        <SolitaireStatsDashboard userEmail={user?.email} />
      </div>

      {showManager && (
        <GameTileManager
          currentGames={visibleGames}
          onUpdate={handleGameUpdate}
          onClose={() => setShowManager(false)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto">
        {visibleGames.map((game) => (
          <MagneticCard key={game.path} strength={0.35} rotationStrength={0.18} hoverScale={1.03}>
            <Link
              to={game.path}
              className={`bg-gradient-to-r ${game.color} rounded-2xl p-4 sm:p-5 shadow-xl flex items-center gap-4 sm:gap-5 w-full`}
            >
              <span className="text-4xl sm:text-5xl lg:text-6xl">{game.emoji}</span>
              <div>
                <div className="text-lg sm:text-xl lg:text-2xl font-black text-white">{game.name}</div>
                <div className="text-white/80 text-sm sm:text-base lg:text-lg font-semibold mt-0.5 sm:mt-1">{game.desc}</div>
              </div>
            </Link>
          </MagneticCard>
        ))}
      </div>
    </div>
  );
}