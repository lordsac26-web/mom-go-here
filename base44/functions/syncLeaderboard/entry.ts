import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();
    if (!currentUser) return Response.json({ error: 'Not authenticated' }, { status: 401 });

    const admin = base44.asServiceRole;
    const userEmail = currentUser.email;
    const scores = await admin.entities.GameScore.filter({ user_email: userEmail }, '-created_date', 5000);
    const completedScores = scores.filter((score) => score.completed !== false);
    const totalScore = completedScores.reduce((sum, score) => sum + (score.score || 0), 0);
    const gamesPlayed = completedScores.length;

    let bestGame = '';
    let bestGameScore = 0;
    const gameMap = {};
    for (const score of completedScores) {
      const gameName = score.game_name || 'Unknown';
      const value = score.score || 0;
      if (value > bestGameScore) { bestGameScore = value; bestGame = gameName; }
      if (!gameMap[gameName]) gameMap[gameName] = [];
      gameMap[gameName].push(value);
    }

    const gameBreakdown = {};
    for (const [gameName, values] of Object.entries(gameMap)) {
      gameBreakdown[gameName] = {
        highScore: Math.max(...values),
        gamesPlayed: values.length,
        avgScore: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      };
    }

    const existing = (await admin.entities.HallOfFame.filter({ user_email: userEmail }))[0];
    const profiles = await admin.entities.UserProfile.filter({ user_email: userEmail });
    const displayName = profiles[0]?.display_name || currentUser.full_name || 'Anonymous';
    const entry = {
      display_name: displayName, user_email: userEmail, total_score: totalScore,
      games_played: gamesPlayed, best_game: bestGame, best_game_score: bestGameScore,
      game_breakdown: gameBreakdown, last_updated: new Date().toISOString(),
    };
    const saved = existing
      ? await admin.entities.HallOfFame.update(existing.id, entry)
      : await admin.entities.HallOfFame.create(entry);

    const allEntries = await admin.entities.HallOfFame.list('-total_score', 5000);
    allEntries.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    const rankUpdates = allEntries
      .map((item, index) => ({ id: item.id, rank: index + 1 }))
      .filter((item, index) => allEntries[index].rank !== item.rank);
    if (rankUpdates.length) await admin.entities.HallOfFame.bulkUpdate(rankUpdates);
    const rank = allEntries.findIndex((item) => item.id === saved.id) + 1;

    return Response.json({ success: true, hallOfFame: { id: saved.id, ...entry, rank } });
  } catch (error) {
    return Response.json({ error: 'Sync failed', details: error.message }, { status: 500 });
  }
}