import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Get current user (if logged in)
    let userEmail = null;
    try {
      const user = await base44.auth.me();
      userEmail = user?.email || null;
    } catch {
      // Not authenticated — still allow public read
    }

    const body = await req.json().catch(() => ({}));
    const { type, dart_limit } = body;

    // ── Dart Pop specific leaderboard ──
    if (type === 'dartpop') {
      const all = await base44.asServiceRole.entities.DartPopBlitzScore.list('-score', 200);

      const bestByUser = {};
      for (const s of all) {
        if (typeof dart_limit === 'number' && s.dart_limit !== dart_limit) continue;
        const email = s.user_email;
        if (!bestByUser[email] || s.score > bestByUser[email].score) {
          bestByUser[email] = s;
        }
      }

      const top10 = Object.values(bestByUser)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((s) => ({
          display_name: s.user_email?.split('@')[0] || 'Player',
          score: s.score,
          balloons_popped: s.balloons_popped,
          dart_limit: s.dart_limit,
          is_current_user: s.user_email === userEmail,
        }));

      return Response.json({ scores: top10 });
    }

    // ====================== Main Leaderboard Logic ======================
    // HallOfFame has open read RLS — always accessible.
    // We derive EVERYTHING from HallOfFame (which refreshHallOfFame populates).
    // This avoids RLS issues with GameScore/UserProfile in read-only contexts.
    const hallOfFame = await base44.asServiceRole.entities.HallOfFame.list('-total_score', 5000);

    // ── Per-Game Leaderboards from game_breakdown ──
    const gameMap = {};

    hallOfFame.forEach((entry) => {
      if (!entry?.user_email || !entry.game_breakdown) return;

      Object.entries(entry.game_breakdown).forEach(([gameName, details]) => {
        const score = typeof details === 'number' ? details : details?.highScore;
        if (typeof score !== 'number') return;
        const normalizedName = gameName.trim().replace(/\s+/g, ' ');

        if (!gameMap[normalizedName]) gameMap[normalizedName] = [];
        gameMap[normalizedName].push({
          user_email: entry.user_email,
          display_name: entry.display_name || entry.user_email.split('@')[0],
          score,
          game_name: normalizedName,
          is_current_user: entry.user_email === userEmail,
        });
      });
    });

    const leaderboards = {};
    const game_names = [];

    Object.keys(gameMap)
      .sort()
      .forEach((gameName) => {
        game_names.push(gameName);

        const top10 = gameMap[gameName]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map((s, i) => ({
            rank: i + 1,
            display_name: s.display_name,
            score: s.score,
            game_name: gameName,
            is_current_user: s.is_current_user,
          }));

        leaderboards[gameName] = top10;
      });

    // ── Overall from HallOfFame ──
    const overall = hallOfFame.slice(0, 50).map((entry, i) => ({
      rank: entry.rank || i + 1,
      display_name: entry.display_name || entry.user_email?.split('@')[0] || 'Player',
      total_score: entry.total_score,
      score: entry.total_score,
      games_played: entry.games_played || 0,
      best_game: entry.best_game,
      best_game_score: entry.best_game_score,
      is_current_user: entry.user_email === userEmail,
    }));

    // Current player stats
    const playerEntry = hallOfFame.find((e) => e.user_email === userEmail);

    return Response.json({
      leaderboards,
      overall,
      game_names,
      player: {
        rank: playerEntry?.rank || null,
        total_players: hallOfFame.length,
        total_score: playerEntry?.total_score || 0,
        best_score: playerEntry?.best_game_score || 0,
        games_played: playerEntry?.games_played || 0,
        best_game: playerEntry?.best_game || '',
        best_game_score: playerEntry?.best_game_score || 0,
        game_breakdown: playerEntry?.game_breakdown || {},
        display_name: playerEntry?.display_name || (userEmail ? userEmail.split('@')[0] : 'Player'),
      },
      last_updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('getLeaderboardScores error:', error);
    return Response.json({ error: error.message }, { status: 500 });
    }
    }