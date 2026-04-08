import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { type, dart_limit } = body;

    if (type === "dartpop") {
      // Fetch DartPopBlitzScore for leaderboard — strip emails, return display names only
      const filter = typeof dart_limit === "number" ? { dart_limit } : {};
      const all = await base44.asServiceRole.entities.DartPopBlitzScore.filter(filter, "-score", 50);

      // Deduplicate: keep only best score per user
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

    // Default: fetch GameScore for general rankings — strip emails
    const all = await base44.asServiceRole.entities.GameScore.list("-score", 200);

    const sanitized = all.map(s => ({
      id: s.id,
      display_name: s.user_email?.split("@")[0] || "Anonymous",
      game_name: s.game_name,
      score: s.score,
      duration_seconds: s.duration_seconds,
      difficulty: s.difficulty,
      completed: s.completed,
      is_current_user: s.user_email === user.email,
    }));

    return Response.json({ scores: sanitized });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});