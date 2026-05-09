import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const startTime = Date.now();

    // ====================== FETCH ALL DATA ======================
    // Use .list() with asServiceRole — .filter({}) returns empty for RLS-protected entities
    const [allScores, previousHof, allUsers, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.GameScore.list('-created_date', 5000),
      base44.asServiceRole.entities.HallOfFame.list('-total_score', 5000),
      base44.asServiceRole.entities.User.list(null, 5000),
      base44.asServiceRole.entities.UserProfile.list('-created_date', 5000),
    ]);

    // Build name map — priority: UserProfile.display_name > User.full_name > email prefix
    const nameMap = {};
    // 1. Seed from built-in User entity (full_name)
    allUsers.forEach((u) => {
      if (u?.email) {
        nameMap[u.email] = (u.full_name || '').trim() || u.email.split('@')[0];
      }
    });
    // 2. Override with UserProfile display_name (the name users set in Settings)
    allProfiles.forEach((p) => {
      if (p?.user_email && (p.display_name || '').trim()) {
        nameMap[p.user_email] = p.display_name.trim();
      }
    });
    // 3. Preserve existing HoF names as last-resort fallback
    previousHof.forEach((entry) => {
      if (entry?.user_email && !nameMap[entry.user_email] && entry.display_name) {
        nameMap[entry.user_email] = entry.display_name;
      }
    });

    // ====================== BUILD PLAYER BEST SCORES ======================
    // Seed from existing Hall of Fame so we don't lose historical bests
    const playerGames = {};

    previousHof.forEach((entry) => {
      if (entry?.user_email && entry.game_breakdown) {
        playerGames[entry.user_email] = { ...entry.game_breakdown };
      }
    });

    // Overlay with newer/better scores from GameScore
    allScores.forEach((s) => {
      if (!s?.user_email || typeof s.score !== 'number' || s.score < 0) return;
      if (!s.game_name) return;

      const gameName = s.game_name.trim().replace(/\s+/g, ' ');
      if (!playerGames[s.user_email]) playerGames[s.user_email] = {};

      const current = playerGames[s.user_email][gameName] ?? -1;
      if (s.score > current) {
        playerGames[s.user_email][gameName] = s.score;
      }
    });

    // ====================== EARLY EXIT ======================
    if (Object.keys(playerGames).length === 0) {
      return Response.json({
        success: true,
        message: 'No player data',
        totalPlayers: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // ====================== BUILD FINAL HALL OF FAME ENTRIES ======================
    const entries = Object.entries(playerGames).map(([email, games]) => {
      const total_score = Object.values(games).reduce((a, b) => a + b, 0);
      const games_played = Object.keys(games).length;

      let best_game = '';
      let best_game_score = 0;

      Object.entries(games).forEach(([name, score]) => {
        if (score > best_game_score) {
          best_game = name;
          best_game_score = score;
        }
      });

      return {
        user_email: email,
        display_name: nameMap[email] || email.split('@')[0] || 'Senior Player',
        total_score,
        games_played,
        best_game,
        best_game_score,
        game_breakdown: games,
        last_updated: new Date().toISOString(),
        rank: 0,
      };
    });

    // Sort by total score and assign ranks
    entries.sort((a, b) => b.total_score - a.total_score);
    entries.forEach((e, i) => { e.rank = i + 1; });

    const top50 = entries.slice(0, 50);

    // ====================== UPSERT HALL OF FAME ======================
    const existingByEmail = {};
    previousHof.forEach((entry) => {
      if (entry?.user_email) existingByEmail[entry.user_email] = entry;
    });

    for (const player of top50) {
      const existing = existingByEmail[player.user_email];
      if (existing) {
        await base44.asServiceRole.entities.HallOfFame.update(existing.id, player);
      } else {
        await base44.asServiceRole.entities.HallOfFame.create(player);
      }
    }

    return Response.json({
      success: true,
      totalPlayers: entries.length,
      top50Count: top50.length,
      durationMs: Date.now() - startTime,
      top10: top50.slice(0, 10).map((p) => ({
        rank: p.rank,
        display_name: p.display_name,
        total_score: p.total_score,
        games_played: p.games_played,
        best_game: p.best_game,
      })),
    });

  } catch (error) {
    console.error('refreshHallOfFame error:', error);
    return Response.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
});