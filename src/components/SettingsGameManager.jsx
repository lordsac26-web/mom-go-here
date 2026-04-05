import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import GameTileManager, { ALL_GAMES } from "./GameTileManager";

export default function SettingsGameManager() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showManager, setShowManager] = useState(false);
  const [visibleGames, setVisibleGames] = useState(ALL_GAMES);

  useEffect(() => {
    if (!user?.email) return;
    base44.entities.UserProfile.filter({ user_email: user.email }).then(profiles => {
      if (profiles[0]) {
        setProfile(profiles[0]);
        if (profiles[0].favorite_games?.length) {
          setVisibleGames(ALL_GAMES.filter(g => profiles[0].favorite_games.includes(g.path)));
        }
      }
    });
  }, [user]);

  async function handleUpdate(paths) {
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, { favorite_games: paths });
    } else if (user?.email) {
      const p = await base44.entities.UserProfile.create({ user_email: user.email, favorite_games: paths });
      setProfile(p);
    }
    setVisibleGames(ALL_GAMES.filter(g => paths.includes(g.path)));
  }

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
      <h2 className="text-3xl font-black text-primary flex items-center gap-2">
        🎮 My Games
      </h2>
      <p className="text-muted-foreground text-lg">Choose which games appear on your dashboard</p>

      <div className="flex flex-wrap gap-2">
        {visibleGames.map(g => (
          <span key={g.path} className="bg-secondary px-3 py-2 rounded-xl text-lg font-bold">
            {g.emoji} {g.name}
          </span>
        ))}
      </div>

      <button
        onClick={() => setShowManager(true)}
        className="w-full bg-primary text-primary-foreground text-xl font-black py-4 rounded-2xl"
      >
        ⚙️ Manage Games
      </button>

      {showManager && (
        <GameTileManager
          currentGames={visibleGames}
          onUpdate={handleUpdate}
          onClose={() => setShowManager(false)}
        />
      )}
    </div>
  );
}