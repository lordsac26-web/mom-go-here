import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useDailyMissions } from "../hooks/useDailyMissions";
import WarmLoader from "../components/WarmLoader";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCw } from "lucide-react";
import SubPageHeader from "../components/SubPageHeader";
import { ALL_GAMES } from "../components/GameTileManager";
import MarqueeBanner from "../components/rankings/MarqueeBanner";
import RankRow from "../components/rankings/RankRow";
import GameFilter from "../components/rankings/GameFilter";
import PlayerRankCard from "../components/rankings/PlayerRankCard";
import GameLeaderboard from "../components/rankings/GameLeaderboard";
import UserGameBreakdown from "../components/rankings/UserGameBreakdown";

const MARQUEE_ITEMS = [
  "🏆 TOP PLAYERS",
  "⭐ HIGH SCORES",
  "🔥 LEADERBOARD",
  "🎮 RANKINGS",
  "💎 HALL OF FAME",
  "🚀 BEST OF THE BEST",
];

// Map game names to emojis from ALL_GAMES
function getGameEmoji(gameName) {
  const game = ALL_GAMES.find(g => g.name === gameName);
  return game?.emoji || "🎮";
}

export default function Rankings() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const { reportMissionProgress } = useDailyMissions();

  useEffect(() => {
    reportMissionProgress("visit_page", "/rankings");
    loadScores();
  }, []);

  async function loadScores() {
    const res = await base44.functions.invoke('getLeaderboardScores', {});
    setData(res.data);
    setLoading(false);
    setRefreshing(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setUpdated(false);
    await base44.functions.invoke("syncLeaderboard", {});
    await loadScores();
    setUpdated(true);
    setTimeout(() => setUpdated(false), 1800);
  }

  // Build game filter chips from server data
  const gamesWithScores = useMemo(() => {
    if (!data?.game_names) return [];
    return data.game_names.map(name => ({
      name,
      emoji: getGameEmoji(name),
    }));
  }, [data]);

  // Which leaderboard data to show
  const activeLeaderboard = useMemo(() => {
    if (!data) return [];
    if (selectedGame && data.leaderboards[selectedGame]) {
      return data.leaderboards[selectedGame];
    }
    return data.overall || [];
  }, [data, selectedGame]);

  if (loading) return <WarmLoader message="Loading rankings..." />;

  const player = data?.player || {};

  return (
    <div className="min-h-screen pb-24">
      <SubPageHeader
        backTo="/games"
        title="Hall of Fame"
        icon={Trophy}
        rightSlot={<div className="flex items-center gap-2">
          {updated && <span role="status" className="text-sm font-black text-green-500">Updated!</span>}
          <button onClick={handleRefresh} disabled={refreshing} className="flex min-h-11 items-center gap-1 rounded-xl bg-secondary px-3 text-sm font-bold text-foreground disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>}
      />

      {/* Marquee Banner */}
      <MarqueeBanner speed={20} className="bg-primary/10 border-y border-primary/30 py-3 mb-5">
        {MARQUEE_ITEMS.map((item, i) => (
          <span key={i} className="text-xl font-black text-primary mx-8 tracking-wide">
            {item}
          </span>
        ))}
      </MarqueeBanner>

      <div className="px-4 space-y-5">
        {/* Player Rank Card */}
        {user && (
          <PlayerRankCard
            rank={player.rank}
            totalPlayers={player.total_players || 0}
            totalScore={player.total_score || 0}
            gamesPlayed={player.games_played || 0}
            bestScore={player.best_score || 0}
            bestGame={player.best_game || ""}
          />
        )}

        <UserGameBreakdown breakdown={player.game_breakdown} />

        {/* Game Filter */}
        {gamesWithScores.length > 1 && (
          <GameFilter
            games={gamesWithScores}
            selected={selectedGame}
            onSelect={setSelectedGame}
          />
        )}

        {/* Selected game or overall leaderboard */}
        {selectedGame ? (
          <div>
            <h2 className="text-xl font-black text-foreground mb-3 flex items-center gap-2">
              <span className="text-2xl">{getGameEmoji(selectedGame)}</span>
              {selectedGame} — Top 10
            </h2>
            {activeLeaderboard.length === 0 ? (
              <EmptyLeaderboard />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedGame}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  {activeLeaderboard.map((s, i) => (
                    <RankRow
                      key={`${s.display_name}-${i}`}
                      rank={s.rank}
                      name={s.display_name}
                      score={s.score}
                      game={s.game_name}
                      isCurrentUser={s.is_current_user}
                      index={i}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        ) : (
          <>
            {/* Overall Top 10 */}
            <div>
              <h2 className="text-xl font-black text-foreground mb-3">🏆 Overall Top 10</h2>
              {activeLeaderboard.length === 0 ? (
                <EmptyLeaderboard />
              ) : (
                <div className="space-y-2">
                  {activeLeaderboard.map((s, i) => (
                    <RankRow
                      key={`${s.display_name}-${i}`}
                      rank={s.rank}
                      name={s.display_name}
                      score={s.score}
                      game={s.game_name}
                      isCurrentUser={s.is_current_user}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Per-Game Leaderboards */}
            {data?.game_names?.length > 0 && (
              <div>
                <h2 className="text-xl font-black text-foreground mb-3">📊 Per-Game Rankings</h2>
                <div className="space-y-4">
                  {data.game_names.map(gameName => (
                    <GameLeaderboard
                      key={gameName}
                      gameName={gameName}
                      emoji={getGameEmoji(gameName)}
                      scores={data.leaderboards[gameName] || []}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyLeaderboard() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
      <span className="text-5xl block mb-3">🎮</span>
      <p className="text-xl font-bold text-muted-foreground">No scores yet!</p>
      <p className="text-muted-foreground">Play some games to get on the leaderboard.</p>
      <Link
        to="/games"
        className="inline-block mt-4 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold"
      >
        Play Now →
      </Link>
    </motion.div>
  );
}