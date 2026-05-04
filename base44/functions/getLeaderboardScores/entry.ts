import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { type, dart_limit } = body;

    // ── Dart Pop specific leaderboard ──
    if (type === "dartpop") {
      const filter = typeof dart_limit === "number" ? { dart_limit } : {};
      const all = await base44.asServiceRole.entities.DartPopBlitzScore.filter(filter, "-score", 50);

      const bestByUser = {};
      for (const s of all) {
        const email = s.user_email;
        if (!bestByUser[email] || s.score > bestByUser[email].score) {
          bestByUser[email] = s;
        }
      }

      const top10 = Object.values(bestByUser)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(s => ({
          id: s.id,
          display_name: s.user_email?.split("@")[0] || "Player",
          score: s.score,
          balloons_popped: s.balloons_popped,
          dart_limit: s.dart_limit,
          is_current_user: s.user_email === user.email,
        }));

      return Response.json({ scores: top10 });
    }

    // ── Global leaderboard: per-game top 10 + overall ──
    const allScores = await base44.asServiceRole.entities.GameScore.list("-score", 500);

    // Fetch display names from UserProfile
    const profiles = await base44.asServiceRole.entities.UserProfile.list(null, 200);
    const nameMap = {};
    for (const p of profiles) {
      if (p.user_email && p.display_name) {
        nameMap[p.user_email] = p.display_name;
      }
    }

    // Helper: resolve display name
    const getDisplayName = (email) => nameMap[email] || email?.split("@")[0] || "Anonymous";

    // Group by game, deduplicate per user (keep best score per user per game)
    const gameMap = {}; // gameName → Map<userEmail, bestScoreRecord>
    for (const s of allScores) {
      const gn = s.game_name || "Unknown";
      if (!gameMap[gn]) gameMap[gn] = new Map();
      const map = gameMap[gn];
      const existing = map.get(s.user_email);
      if (!existing || s.score > existing.score) {
        map.set(s.user_email, s);
      }
    }

    // Build per-game top 10
    const leaderboards = {};
    const overallBest = new Map(); // email → best score across all games

    for (const [gameName, userMap] of Object.entries(gameMap)) {
      const sorted = Array.from(userMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((s, i) => ({
          rank: i + 1,
          display_name: getDisplayName(s.user_email),
          score: s.score,
          game_name: s.game_name,
          completed: s.completed,
          is_current_user: s.user_email === user.email,
        }));
      leaderboards[gameName] = sorted;

      // Track overall best per user
      for (const [email, s] of userMap.entries()) {
        const existing = overallBest.get(email);
        if (!existing || s.score > existing.score) {
          overallBest.set(email, s);
        }
      }
    }

    // Overall top 10
    const overallTop10 = Array.from(overallBest.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((s, i) => ({
        rank: i + 1,
        display_name: getDisplayName(s.user_email),
        score: s.score,
        game_name: s.game_name,
        completed: s.completed,
        is_current_user: s.user_email === user.email,
      }));

    // Current user's rank + stats
    const overallSorted = Array.from(overallBest.values()).sort((a, b) => b.score - a.score);
    const userIdx = overallSorted.findIndex(s => s.user_email === user.email);
    const userRank = userIdx >= 0 ? userIdx + 1 : null;
    const userBest = userIdx >= 0 ? overallSorted[userIdx] : null;

    return Response.json({
      leaderboards,
      overall: overallTop10,
      game_names: Object.keys(leaderboards).sort(),
      player: {
        rank: userRank,
        total_players: overallBest.size,
        best_score: userBest?.score || 0,
        best_game: userBest?.game_name || "",
        display_name: getDisplayName(user.email),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});