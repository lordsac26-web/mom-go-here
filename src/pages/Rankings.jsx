import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Trophy } from "lucide-react";
import { ALL_GAMES } from "../components/GameTileManager";
import MarqueeBanner from "../components/rankings/MarqueeBanner";
import RankRow from "../components/rankings/RankRow";
import GameFilter from "../components/rankings/GameFilter";
import PlayerRankCard from "../components/rankings/PlayerRankCard";

const MARQUEE_ITEMS = [
  "🏆 TOP PLAYERS",
  "⭐ HIGH SCORES",
  "🔥 LEADERBOARD",
  "🎮 RANKINGS",
  "💎 HALL OF FAME",
  "🚀 BEST OF THE BEST",
];

export default function Rankings() {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadScores();
  }, []);

  async function loadScores() {
    const all = await base44.entities.GameScore.list("-score", 200);
    setScores(all);
    setLoading(false);
  }

  // Build top scores: group by user+game, keep each player's best per game
  const topScores = useMemo(() => {
    const bestMap = new Map();
    const filtered = selectedGame
      ? scores.filter((s) => s.game_name === selectedGame)
      : scores;

    filtered.forEach((s) => {
      const key = `${s.user_email}__${s.game_name}`;
      const existing = bestMap.get(key);
      if (!existing || s.score > existing.score) {
        bestMap.set(key, s);
      }
    });

    // Now get each player's overall best score (highest across games for "All" view)
    const playerBest = new Map();
    bestMap.forEach((s) => {
      const existing = playerBest.get(s.user_email);
      if (!existing || s.score > existing.score) {
        playerBest.set(s.user_email, s);
      }
    });

    return Array.from(playerBest.values()).sort((a, b) => b.score - a.score);
  }, [scores, selectedGame]);

  const displayList = showAll ? topScores : topScores.slice(0, 10);

  // Current player stats
  const currentPlayerRank = useMemo(() => {
    if (!user?.email) return null;
    const idx = topScores.findIndex((s) => s.user_email === user.email);
    return idx >= 0 ? idx + 1 : null;
  }, [topScores, user]);

  const currentPlayerBest = useMemo(() => {
    if (!user?.email) return { score: 0, game: "" };
    const mine = scores.filter((s) => s.user_email === user.email);
    if (mine.length === 0) return { score: 0, game: "" };
    const best = mine.reduce((a, b) => (a.score > b.score ? a : b));
    return { score: best.score, game: best.game_name };
  }, [scores, user]);

  // Unique players count
  const totalPlayers = useMemo(() => {
    return new Set(scores.map((s) => s.user_email)).size;
  }, [scores]);

  // Available games that have scores
  const gamesWithScores = useMemo(() => {
    const names = new Set(scores.map((s) => s.game_name));
    return ALL_GAMES.filter((g) => names.has(g.name));
  }, [scores]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/games" className="bg-secondary p-2 rounded-xl">
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Trophy size={28} className="text-primary" />
            <h1 className="text-3xl font-black text-primary">Rankings</h1>
          </div>
        </div>
      </div>

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
            rank={currentPlayerRank}
            totalPlayers={totalPlayers}
            bestScore={currentPlayerBest.score}
            bestGame={currentPlayerBest.game}
          />
        )}

        {/* Game Filter */}
        {gamesWithScores.length > 1 && (
          <GameFilter
            games={gamesWithScores}
            selected={selectedGame}
            onSelect={setSelectedGame}
          />
        )}

        {/* Leaderboard */}
        <div>
          <h2 className="text-xl font-black text-foreground mb-3">
            {selectedGame ? `${selectedGame} Leaderboard` : "🏆 Top 10 Overall"}
          </h2>

          {displayList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
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
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedGame || "all"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                {displayList.map((s, i) => (
                  <RankRow
                    key={`${s.user_email}-${s.game_name}`}
                    rank={i + 1}
                    name={s.user_email?.split("@")[0] || "Anonymous"}
                    score={s.score}
                    game={s.game_name}
                    isCurrentUser={s.user_email === user?.email}
                    index={i}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* View All */}
          {!showAll && topScores.length > 10 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAll(true)}
              className="w-full mt-4 bg-secondary border-2 border-border text-foreground text-lg font-bold py-4 rounded-2xl"
            >
              View All ({topScores.length} players) →
            </motion.button>
          )}
          {showAll && topScores.length > 10 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAll(false)}
              className="w-full mt-4 bg-secondary border-2 border-border text-foreground text-lg font-bold py-4 rounded-2xl"
            >
              Show Top 10 Only
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}