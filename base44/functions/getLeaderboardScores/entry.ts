import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get current user (if logged in)
    let userEmail = null;
    try {
      const user = await base44.auth.me();
      userEmail = user?.email || null;
    } catch {
      // Not authenticated - still allow public read
    }

    const body = await req.json().catch(() => ({}));
    const { type, dart_limit } = body;

    // ── Dart Pop specific leaderboard ──
    if (type === "dartpop") {
      const filter = typeof dart_limit === "number" ? { dart_limit } : {};
      const all = await base44.asServiceRole.entities.DartPopBlitzScore.filter(filter, "-score", 100);

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
        .map((s) => ({
          display_name: s.user_email?.split("@")[0] || "Player",
          score: s.score,
          balloons_popped: s.balloons_popped,
          dart_limit: s.dart_limit,
          is_current_user: s.user_email === userEmail,
        }));

      return Response.json({ scores: top10 });
    }

    // === Main Leaderboard Logic ===
    const hallOfFame = await fetchAll(base44, 'HallOfFame', '-total_score');
    const allScores = await fetchAll(base44, 'GameScore', '-score');
    const profiles = await fetchAll(base44, 'UserProfile');

    // Build name map
    const nameMap = {};
    profiles.forEach((p) => {
      if (p.user_email) {
        nameMap[p.user_email] = p.display_name?.trim() || 
                               p.user_email.split("@")[0] || 
                               "Senior Player";
      }
    });

    const getDisplayName = (email) => nameMap[email] || (email ? email.split("@")[0] : "Player");

    // ── Per-Game Leaderboards ──
    const gameMap = {};

    allScores.forEach((s) => {
      if (!s.game_name || !s.user_email || typeof s.score !== 'number') return;

      if (!gameMap[s.game_name]) gameMap[s.game_name] = new Map();

      const map = gameMap[s.game_name];
      const existing = map.get(s.user_email);

      if (!existing || s.score > existing.score) {
        map.set(s.user_email, { ...s });
      }
    });

    const leaderboards = {};
    const game_names = [];

    Object.keys(gameMap).sort().forEach((gameName) => {
      game_names.push(gameName);

      const top10 = Array.from(gameMap[gameName].values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((s, i) => ({
          rank: i + 1,
          display_name: getDisplayName(s.user_email),
          score: s.score,
          game_name: gameName,
          is_current_user: s.user_email === userEmail,
        }));

      leaderboards[gameName] = top10;
    });

    // ── Overall from HallOfFame ──
    const overall = hallOfFame.slice(0, 50).map((entry, i) => ({
      rank: entry.rank || i + 1,
      display_name: entry.display_name || getDisplayName(entry.user_email),
      total_score: entry.total_score,
      games_played: entry.games_played || 0,
      best_game: entry.best_game,
      best_game_score: entry.best_game_score,
      is_current_user: entry.user_email === userEmail,
    }));

    // Current player
    const playerEntry = hallOfFame.find((e) => e.user_email === userEmail);

    return Response.json({
      leaderboards,
      overall,
      game_names,
      player: {
        rank: playerEntry?.rank || null,
        total_players: hallOfFame.length,
        total_score: playerEntry?.total_score || 0,
        games_played: playerEntry?.games_played || 0,
        best_game: playerEntry?.best_game || "",
        best_game_score: playerEntry?.best_game_score || 0,
        display_name: getDisplayName(userEmail),
      },
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error("getLeaderboardScores error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper function - Fetch all records with pagination
async function fetchAll(base44, entityName, order) {
  let all = [];
  let cursor = null;
  let page = 0;

  do {
    const res = await base44.asServiceRole.entities[entityName].list({
      order: order,
      limit: 500,
      cursor: cursor,
    });

    const items = res?.items || res || [];
    all = all.concat(items);
    
    cursor = res?.nextCursor || res?.next || res?.cursor;
    page++;

    if (page > 40) break;
  } while (cursor);

  return all;
}