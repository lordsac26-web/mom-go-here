import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const startTime = Date.now();

    // ====================== HELPERS ======================
    async function fetchAll(entityName, orderBy = null, filter = {}) {
      let all = [];
      let cursor = null;
      let page = 0;

      do {
        const response = await base44.asServiceRole.entities[entityName].list({
          order: orderBy,
          limit: 500,
          cursor: cursor,
          ...filter
        });

        const items = response?.items || response || [];
        all = all.concat(items);
        cursor = response?.nextCursor || response?.next || response?.cursor;
        page++;

        if (page > 60) break;
      } while (cursor);

      console.log(`Fetched ${all.length} records from ${entityName}`);
      return all;
    }

    // Get last refresh timestamp
    let lastRefresh = "2020-01-01T00:00:00Z";
    try {
      const config = await base44.asServiceRole.entities.SystemConfig.get("last_hall_of_fame_refresh");
      if (config?.value) lastRefresh = config.value;
    } catch (e) {}

    console.log(`Last refresh: ${lastRefresh}`);

    // ====================== FETCH DATA ======================

    // 1. Fetch NEW scores only (incremental)
    const newScores = await fetchAll('GameScore', '-updated_at', {
      updated_at: { $gte: lastRefresh }
    });

    // 2. Fetch ALL HallOfFame (previous state)
    const previousHof = await fetchAll('HallOfFame', '-total_score');

    // 3. Fetch ALL User Profiles (needed for names)
    const allProfiles = await fetchAll('UserProfile');

    // Build name map
    const nameMap = {};
    allProfiles.forEach((p) => {
      if (p.user_email) {
        nameMap[p.user_email] = (p.display_name || "").trim() || 
                               p.user_email.split("@")[0] || "Senior Player";
      }
    });

    // ====================== BUILD PLAYER BESTS ======================

    const playerGames = {};

    // First: Load previous bests from HallOfFame
    previousHof.forEach((entry) => {
      if (entry.user_email && entry.game_breakdown) {
        playerGames[entry.user_email] = { ...entry.game_breakdown };
      }
    });

    // Then: Update with any new/better scores
    newScores.forEach((s) => {
      if (!s?.user_email || typeof s.score !== 'number' || s.score <= 0) return;

      if (!playerGames[s.user_email]) playerGames[s.user_email] = {};

      const current = playerGames[s.user_email][s.game_name] || 0;
      if (s.score > current) {
        playerGames[s.user_email][s.game_name] = s.score;
      }
    });

    // If no new scores, we can early exit
    if (newScores.length === 0 && previousHof.length > 0) {
      console.log("No new scores since last refresh. Skipping full recalc.");
      return Response.json({
        success: true,
        message: "No changes detected",
        totalPlayers: previousHof.length,
        durationMs: Date.now() - startTime
      });
    }

    // ====================== BUILD FINAL ENTRIES ======================
    const entries = Object.entries(playerGames).map(([email, games]) => {
      const total_score = Object.values(games).reduce((a, b) => a + b, 0);
      const games_played = Object.keys(games).length;

      let best_game = "";
      let best_game_score = 0;

      Object.entries(games).forEach(([name, score]) => {
        if (score > best_game_score) {
          best_game = name;
          best_game_score = score;
        }
      });

      return {
        user_email: email,
        display_name: nameMap[email] || email.split("@")[0],
        total_score,
        games_played,
        best_game,
        best_game_score,
        game_breakdown: games,
        last_updated: new Date().toISOString(),
        rank: 0,
      };
    });

    // Sort and rank
    entries.sort((a, b) => b.total_score - a.total_score);
    entries.forEach((e, i) => { e.rank = i + 1; });

    const top50 = entries.slice(0, 50);

    // ====================== UPSERT ======================
    if (top50.length > 0) {
      const recordsToUpsert = top50.map(player => ({
        ...player,
        id: `hof_${player.user_email.replace(/[^a-zA-Z0-9@._-]/g, '_')}`,
      }));

      await base44.asServiceRole.entities.HallOfFame.bulkUpsert(recordsToUpsert, {
        key: 'user_email'
      });

      console.log(`✅ Upserted ${top50.length} Hall of Fame entries`);
    }

    // Update last refresh time
    await base44.asServiceRole.entities.SystemConfig.upsert({
      key: "last_hall_of_fame_refresh",
      value: new Date().toISOString()
    });

    const duration = Date.now() - startTime;

    return Response.json({
      success: true,
      totalPlayers: entries.length,
      updatedPlayers: newScores.length,
      top50Count: top50.length,
      durationMs: duration,
      top10: top50.slice(0, 10).map(p => ({
        rank: p.rank,
        display_name: p.display_name,
        total_score: p.total_score,
        games_played: p.games_played,
        best_game: p.best_game,
      })),
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error("refreshHallOfFame error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});