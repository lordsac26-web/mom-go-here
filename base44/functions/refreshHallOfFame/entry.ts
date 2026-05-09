import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
 
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const startTime = Date.now();
 
    // ====================== HELPERS ======================
    async function fetchAll(entityName: string, orderBy: string | null = null) {
      let all: any[] = [];
      let cursor: string | null = null;
      let page = 0;
 
      do {
        const response = await base44.asServiceRole.entities[entityName].list({
          order: orderBy,
          limit: 500,
          ...(cursor ? { cursor } : {}),
        });
 
        const items: any[] = response?.items || (Array.isArray(response) ? response : []);
        if (items.length === 0) break; // FIX (bug 5): stop if page is empty to avoid looping on stale cursor
 
        all = all.concat(items);
 
        // Only advance cursor if we got a full page — avoids infinite loops
        // on APIs that return a cursor even for the last partial page.
        cursor = items.length === 500
          ? (response?.nextCursor || response?.next || response?.cursor || null)
          : null;
 
        page++;
        if (page > 60) break;
      } while (cursor);
 
      console.log(`Fetched ${all.length} records from ${entityName}`);
      return all;
    }
 
    // ====================== LAST REFRESH TIMESTAMP ======================
    // FIX (bug 4): capture "before fetch" time so no score written during
    // this run is accidentally excluded on the next incremental pass.
    const refreshStartTime = new Date().toISOString();
 
    let lastRefresh = "2020-01-01T00:00:00Z";
    try {
      const config = await base44.asServiceRole.entities.SystemConfig.get(
        "last_hall_of_fame_refresh"
      );
      if (config?.value) lastRefresh = config.value;
    } catch {
      console.log("No previous refresh timestamp found, using default.");
    }
 
    console.log(`Last refresh: ${lastRefresh}`);
 
    // ====================== FETCH DATA ======================
    // FIX (bug 1): base44 SDK does not support MongoDB-style $gte operators in
    // filter objects. Fetch all GameScore records and filter by date in JS.
    // At typical user scale (hundreds of records) this is fast and reliable.
    const allScores = await fetchAll('GameScore', '-updated_at');
    const lastRefreshDate = new Date(lastRefresh);
    const newScores = allScores.filter((s) => {
      if (!s?.updated_at) return true; // include records with no timestamp
      return new Date(s.updated_at) >= lastRefreshDate;
    });
 
    const previousHof = await fetchAll('HallOfFame', '-total_score');
    const allProfiles = await fetchAll('UserProfile');
 
    console.log(`New scores since last refresh: ${newScores.length}`);
 
    // Build name map from UserProfile
    const nameMap: Record<string, string> = {};
    allProfiles.forEach((p) => {
      if (p?.user_email) {
        nameMap[p.user_email] =
          (p.display_name || "").trim() ||
          p.user_email.split("@")[0] ||
          "Senior Player";
      }
    });
 
    // ====================== EARLY EXIT ======================
    // FIX (bug 1 follow-on): only exit early if we are genuinely certain there
    // are no new scores. With the JS-side filter this is now trustworthy.
    if (newScores.length === 0 && previousHof.length > 0) {
      console.log("No new scores since last refresh. Skipping full recalc.");
      await updateLastRefreshTime(base44, refreshStartTime);
      return Response.json({
        success: true,
        message: "No changes detected",
        totalPlayers: previousHof.length,
        durationMs: Date.now() - startTime,
      });
    }
 
    // ====================== BUILD PLAYER BEST SCORES ======================
    // Seed from existing Hall of Fame so we don't lose historical bests
    const playerGames: Record<string, Record<string, number>> = {};
 
    previousHof.forEach((entry) => {
      if (entry?.user_email && entry.game_breakdown) {
        playerGames[entry.user_email] = { ...entry.game_breakdown };
      }
    });
 
    // Overlay with newer/better scores from GameScore
    allScores.forEach((s) => {
      // FIX (bug 2): allow score === 0 so users who played but haven't won
      // still appear in the Hall of Fame and have correct games_played counts.
      // Only skip records that are genuinely invalid (missing email or non-numeric).
      if (!s?.user_email || typeof s.score !== "number" || s.score < 0) return;
      if (!s.game_name) return;
 
      if (!playerGames[s.user_email]) playerGames[s.user_email] = {};
 
      const current = playerGames[s.user_email][s.game_name] ?? -1;
      if (s.score > current) {
        playerGames[s.user_email][s.game_name] = s.score;
      }
    });
 
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
    if (top50.length > 0) {
      // FIX (bug 3): use a deterministic id AND key: 'id' so bulkUpsert has
      // one unambiguous key to match on. Mixing a custom id with key:'user_email'
      // risks duplicate row creation on some SDK versions.
      const recordsToUpsert = top50.map((player) => ({
        ...player,
        id: `hof_${player.user_email.replace(/[^a-zA-Z0-9@._-]/g, "_")}`,
      }));
 
      await base44.asServiceRole.entities.HallOfFame.bulkUpsert(
        recordsToUpsert,
        { key: "id" } // FIX (bug 3): match on the deterministic id, not user_email
      );
 
      console.log(`✅ Upserted ${top50.length} Hall of Fame entries`);
    }
 
    // FIX (bug 4): save the timestamp captured BEFORE fetching, not after,
    // so scores written during this run are included next time.
    await updateLastRefreshTime(base44, refreshStartTime);
 
    const duration = Date.now() - startTime;
 
    return Response.json({
      success: true,
      totalPlayers: entries.length,
      updatedPlayers: newScores.length,
      top50Count: top50.length,
      durationMs: duration,
      top10: top50.slice(0, 10).map((p) => ({
        rank: p.rank,
        display_name: p.display_name,
        total_score: p.total_score,
        games_played: p.games_played,
        best_game: p.best_game,
      })),
      last_updated: new Date().toISOString(),
    });
 
  } catch (error: any) {
    console.error("refreshHallOfFame error:", error);
    return Response.json(
      { error: error.message || "Unknown error", stack: error.stack },
      { status: 500 }
    );
  }
});
 
// ====================== HELPER: UPDATE LAST REFRESH TIME ======================
async function updateLastRefreshTime(base44: any, timestamp: string) {
  try {
    const result = await base44.asServiceRole.entities.SystemConfig.updateMany(
      { key: "last_hall_of_fame_refresh" },
      { value: timestamp, updated_at: timestamp }
    );
 
    if (result?.updated === 0) {
      await base44.asServiceRole.entities.SystemConfig.create({
        key: "last_hall_of_fame_refresh",
        value: timestamp,
      });
      console.log("✅ Created last_hall_of_fame_refresh record");
    } else {
      console.log("✅ Updated last_hall_of_fame_refresh timestamp");
    }
  } catch (err) {
    console.error("Failed to update last refresh time:", err);
  }
}
 
