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

        if (page > 60) break; // safety limit
      } while (cursor);

      console.log(`Fetched ${all.length} records from ${entityName}`);
      return all;
    }

    // ====================== LAST REFRESH TIMESTAMP ======================
    let lastRefresh = "2020-01-01T00:00:00Z";
    try {
      const config = await base44.asServiceRole.entities.SystemConfig.get("last_hall_of_fame_refresh");
      if (config && config.value) {
        lastRefresh = config.value;
      }
    } catch (e) {
      console.log("No previous refresh timestamp found, using default.");
    }

    console.log(`Last refresh: ${lastRefresh}`);

    // ====================== FETCH DATA ======================
    const newScores = await fetchAll('GameScore', '-updated_at', {
      updated_at: { $gte: lastRefresh }
    });

    const previousHof = await fetchAll('HallOfFame', '-total_score');
    const allProfiles = await fetchAll('UserProfile');

    // Build name map
    const nameMap = {};
    allProfiles.forEach((p) => {
      if (p && p.user_email) {
        nameMap[p.user_email] = (p.display_name || "").trim() || 
                               (p.user_email.split("@")[0] || "Senior Player");
      }
    });

    // ====================== BUILD PLAYER BEST SCORES ======================
    const playerGames = {};

    // Load previous bests from Hall of Fame
    previousHof.forEach((entry) => {
      if (entry && entry.user_email && entry.game_breakdown) {
        playerGames[entry.user_email] = { ...entry.game_breakdown };
      }
    });

    // Update with any newer/better scores
    newScores.forEach((s) => {
      if (!s || !s.user_email || typeof s.score !== 'number' || s.score <= 0) return;

      if (!playerGames[s.user_email]) {
        playerGames[s.user_email] = {};
      }

      const current = playerGames[s.user_email][s.game_name] || 0;
      if (s.score > current) {
        playerGames[s.user_email][s.game_name] = s.score;
      }
    });

    // Early exit if no changes
    if (newScores.length === 0 && previousHof.length > 0) {
      console.log("No new scores since last refresh. Skipping full recalc.");
      await updateLastRefreshTime(base44);
      return Response.json({
        success: true,
        message: "No changes detected",
        totalPlayers: previousHof.length,
        durationMs: Date.now() - startTime
      });
    }

    // ====================== BUILD FINAL HALL OF FAME ENTRIES ======================
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
        display_name: nameMap[email] || email.split("@")[0] || "Senior Player",
        total_score: total_score,
        games_played: games_played,
        best_game: best_game,
        best_game_score: best_game_score,
        game_breakdown: games,
        last_updated: new Date().toISOString(),
        rank: 0,
      };
    });

    // Sort by total score and assign ranks
    entries.sort((a, b) => b.total_score - a.total_score);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    const top50 = entries.slice(0, 50);

    // ====================== UPSERT HALL OF FAME ======================
    if (top50.length > 0) {
      const recordsToUpsert = top50.map((player) => ({
        ...player,
        id: `hof_${player.user_email.replace(/[^a-zA-Z0-9@._-]/g, '_')}`,
      }));

      await base44.asServiceRole.entities.HallOfFame.bulkUpsert(recordsToUpsert, {
        key: 'user_email'
      });

      console.log(`✅ Successfully upserted ${top50.length} Hall of Fame entries`);
    }

    // Update last refresh time
    await updateLastRefreshTime(base44);

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
    return Response.json({ 
      error: error.message || "Unknown error",
      stack: error.stack 
    }, { status: 500 });
  }
});

// ====================== HELPER: UPDATE LAST REFRESH TIME ======================
async function updateLastRefreshTime(base44) {
  const now = new Date().toISOString();
  
  try {
    const result = await base44.asServiceRole.entities.SystemConfig.updateMany(
      { key: "last_hall_of_fame_refresh" },
      { 
        value: now,
        updated_at: now 
      }
    );

    if (result && result.updated === 0) {
      // Create if it doesn't exist
      await base44.asServiceRole.entities.SystemConfig.create({
        key: "last_hall_of_fame_refresh",
        value: now,
      });
      console.log("✅ Created new last_hall_of_fame_refresh record");
    } else {
      console.log("✅ Updated last_hall_of_fame_refresh timestamp");
    }
  } catch (err) {
    console.error("Failed to update last refresh time:", err);
    // Non-critical error - don't fail the whole job
  }
}