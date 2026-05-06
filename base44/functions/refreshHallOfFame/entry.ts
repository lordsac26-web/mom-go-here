import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow any authenticated user to trigger a refresh
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all game scores and user profiles using service role
    const [allScores, allProfiles] = await Promise.all([
      base44.asServiceRole.entities.GameScore.list("-score", 500),
      base44.asServiceRole.entities.UserProfile.list(null, 500),
    ]);

    // Build a display name lookup
    const nameMap = {};
    allProfiles.forEach(p => {
      if (p.user_email) nameMap[p.user_email] = p.display_name || p.user_email.split("@")[0];
    });

    // Group scores: for each player, find their best score PER game
    const playerGames = {}; // { email: { gameName: bestScore } }
    allScores.forEach(s => {
      if (!s.user_email || typeof s.score !== 'number') return;
      if (!playerGames[s.user_email]) playerGames[s.user_email] = {};
      const current = playerGames[s.user_email][s.game_name] || 0;
      if (s.score > current) {
        playerGames[s.user_email][s.game_name] = s.score;
      }
    });

    // Build ranked list: total = sum of best scores across all games
    const entries = Object.entries(playerGames).map(([email, games]) => {
      const breakdown = games;
      const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
      const gamesPlayed = Object.keys(breakdown).length;
      const bestEntry = Object.entries(breakdown).reduce((best, [name, score]) => 
        score > best.score ? { name, score } : best, { name: "", score: 0 });
      
      return {
        user_email: email,
        display_name: nameMap[email] || email.split("@")[0],
        total_score: totalScore,
        games_played: gamesPlayed,
        best_game: bestEntry.name,
        best_game_score: bestEntry.score,
        game_breakdown: breakdown,
        last_updated: new Date().toISOString(),
      };
    });

    // Sort by total score descending, assign ranks
    entries.sort((a, b) => b.total_score - a.total_score);
    entries.forEach((e, i) => { e.rank = i + 1; });

    // Upsert into HallOfFame entity (clear old, write new)
    const existing = await base44.asServiceRole.entities.HallOfFame.list("-total_score", 200);
    
    // Delete old entries
    for (const old of existing) {
      await base44.asServiceRole.entities.HallOfFame.delete(old.id);
    }

    // Create new ranked entries (top 50 only to keep it lean)
    const top50 = entries.slice(0, 50);
    if (top50.length > 0) {
      await base44.asServiceRole.entities.HallOfFame.bulkCreate(top50);
    }

    return Response.json({ 
      success: true, 
      totalPlayers: entries.length,
      top10: top50.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});