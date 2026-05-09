import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // === Helper: Fetch ALL records with pagination ===
    const fetchAll = async (entityName: string, orderBy?: string) => {
      let all: any[] = [];
      let cursor: string | null = null;
      let page = 0;
      const MAX_PAGES = 40; // safety

      while (true) {
        const response = await base44.asServiceRole.entities[entityName].list({
          order: orderBy,
          limit: 500,
          cursor: cursor,
        });

        const items = response?.items || response || [];
        all = all.concat(items);

        // Handle different possible pagination formats in Base44
        cursor = response?.nextCursor || response?.next || response?.cursor;
        
        page++;
        if (!cursor || page > MAX_PAGES) break;
      }

      console.log(`✅ Fetched ${all.length} records from ${entityName}`);
      return all;
    };

    // Fetch data
    const [allScores, allProfiles] = await Promise.all([
      fetchAll('GameScore', '-score'),
      fetchAll('UserProfile'),
    ]);

    // Build display name map
    const nameMap: Record<string, string> = {};
    allProfiles.forEach((p: any) => {
      if (p.user_email) {
        nameMap[p.user_email] = (p.display_name || "").trim() || 
                               p.user_email.split("@")[0] || 
                               "Senior Player";
      }
    });

    // Best score per player per game
    const playerGames: Record<string, Record<string, number>> = {};

    allScores.forEach((s: any) => {
      if (!s?.user_email || typeof s.score !== 'number' || s.score <= 0) return;
      if (!playerGames[s.user_email]) playerGames[s.user_email] = {};

      const current = playerGames[s.user_email][s.game_name] ?? 0;
      if (s.score > current) {
        playerGames[s.user_email][s.game_name] = s.score;
      }
    });

    // Build final entries
    const entries = Object.entries(playerGames).map(([email, games]) => {
      const total_score = Object.values(games).reduce((a, b) => a + b, 0);
      const games_played = Object.keys(games).length;

      // Find best game
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
        game_breakdown: games,           // Keep for now, can remove later if too heavy
        last_updated: new Date().toISOString(),
        rank: 0,
      };
    });

    // Sort and assign ranks
    entries.sort((a, b) => b.total_score - a.total_score);
    entries.forEach((e, i) => { e.rank = i + 1; });

    // === Update HallOfFame safely ===
    const existing = await base44.asServiceRole.entities.HallOfFame.list("-total_score", 200);

    // Delete old entries safely
    if (existing.length > 0) {
      console.log(`🗑️ Deleting ${existing.length} old Hall of Fame entries...`);
      for (const old of existing) {
        try {
          await base44.asServiceRole.entities.HallOfFame.delete(old.id);
        } catch (e) {
          console.warn(`Failed to delete old entry ${old.id}:`, e.message);
        }
      }
    }

    // Insert new top 50
    const top50 = entries.slice(0, 50);
    if (top50.length > 0) {
      await base44.asServiceRole.entities.HallOfFame.bulkCreate(top50);
      console.log(`✅ Successfully saved ${top50.length} Hall of Fame entries`);
    }

    return Response.json({
      success: true,
      totalPlayers: entries.length,
      top50Count: top50.length,
      top10: top50.slice(0, 10).map(p => ({
        rank: p.rank,
        display_name: p.display_name,
        total_score: p.total_score,
        games_played: p.games_played,
        best_game: p.best_game,
      })),
      last_updated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ refreshHallOfFame error:", error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});