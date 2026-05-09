import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
 
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
 
    // Get current user (if logged in)
    let userEmail: string | null = null;
    try {
      const user = await base44.auth.me();
      userEmail = user?.email || null;
    } catch {
      // Not authenticated — still allow public read
    }
 
    const body = await req.json().catch(() => ({}));
    const { type, dart_limit } = body;
 
    // ── Dart Pop specific leaderboard ──
    if (type === "dartpop") {
      const filter = typeof dart_limit === "number" ? { dart_limit } : {};
      const all = await base44.asServiceRole.entities.DartPopBlitzScore.filter(
        filter, "-score", 100
      );
 
      const bestByUser: Record<string, any> = {};
      for (const s of all) {
        const email = s.user_email;
        if (!bestByUser[email] || s.score > bestByUser[email].score) {
          bestByUser[email] = s;
        }
      }
 
      // FIX (bug 6): look up display_name from UserProfile instead of using
      // raw email prefix, so the user's chosen name appears on the DartPop board.
      // Fetch profiles only when we have players to look up.
      const dartEmails = Object.keys(bestByUser);
      const dartNameMap: Record<string, string> = {};
 
      if (dartEmails.length > 0) {
        try {
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({});
          profiles.forEach((p: any) => {
            if (p?.user_email) {
              dartNameMap[p.user_email] =
                (p.display_name || "").trim() ||
                p.user_email.split("@")[0] ||
                "Senior Player";
            }
          });
        } catch {
          // Non-critical — fall back to email prefix below
        }
      }
 
      const top10 = Object.values(bestByUser)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10)
        .map((s: any) => ({
          // FIX (bug 6): use nameMap with email-prefix fallback
          display_name:
            dartNameMap[s.user_email] ||
            s.user_email?.split("@")[0] ||
            "Player",
          score: s.score,
          balloons_popped: s.balloons_popped,
          dart_limit: s.dart_limit,
          is_current_user: s.user_email === userEmail,
        }));
 
      return Response.json({ scores: top10 });
    }
 
    // ====================== Main Leaderboard Logic ======================
    const hallOfFame = await fetchAll(base44, "HallOfFame", "-total_score");
    const allScores  = await fetchAll(base44, "GameScore",  "-score");
    const profiles   = await fetchAll(base44, "UserProfile");
 
    // Build name map from UserProfile
    const nameMap: Record<string, string> = {};
    profiles.forEach((p: any) => {
      if (p?.user_email) {
        nameMap[p.user_email] =
          (p.display_name || "").trim() ||
          p.user_email.split("@")[0] ||
          "Senior Player";
      }
    });
 
    const getDisplayName = (email: string | null) =>
      (email && nameMap[email]) ||
      (email ? email.split("@")[0] : "Player");
 
    // ── Per-Game Leaderboards ──
    const gameMap: Record<string, Map<string, any>> = {};
 
    allScores.forEach((s: any) => {
      if (!s?.game_name || !s?.user_email || typeof s.score !== "number") return;
 
      // FIX (bug 7): normalise game name to a consistent casing/spacing so
      // "Dart Pop Blitz" and "dart-pop-blitz" don't appear as separate entries.
      // Trim whitespace and collapse internal spaces to single spaces.
      const gameName = s.game_name.trim().replace(/\s+/g, " ");
 
      if (!gameMap[gameName]) gameMap[gameName] = new Map();
 
      const map = gameMap[gameName];
      const existing = map.get(s.user_email);
      if (!existing || s.score > existing.score) {
        map.set(s.user_email, { ...s, game_name: gameName });
      }
    });
 
    const leaderboards: Record<string, any[]> = {};
    const game_names: string[] = [];
 
    Object.keys(gameMap)
      .sort()
      .forEach((gameName) => {
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
    const overall = hallOfFame.slice(0, 50).map((entry: any, i: number) => ({
      rank: entry.rank || i + 1,
      display_name: entry.display_name || getDisplayName(entry.user_email),
      total_score: entry.total_score,
      games_played: entry.games_played || 0,
      best_game: entry.best_game,
      best_game_score: entry.best_game_score,
      is_current_user: entry.user_email === userEmail,
    }));
 
    // Current player stats
    const playerEntry = hallOfFame.find((e: any) => e.user_email === userEmail);
 
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
      last_updated: new Date().toISOString(),
    });
 
  } catch (error: any) {
    console.error("getLeaderboardScores error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
 
// ── Helper: fetch all records with safe pagination ──────────────────────────
async function fetchAll(
  base44: any,
  entityName: string,
  order?: string
): Promise<any[]> {
  let all: any[] = [];
  let cursor: string | null = null;
  let page = 0;
 
  do {
    const res = await base44.asServiceRole.entities[entityName].list({
      order,
      limit: 500,
      ...(cursor ? { cursor } : {}),
    });
 
    const items: any[] = res?.items || (Array.isArray(res) ? res : []);
 
    // FIX (bug 5): stop immediately on empty page to avoid looping on a
    // stale cursor value returned by the SDK for the final partial page.
    if (items.length === 0) break;
 
    all = all.concat(items);
 
    // Only follow the cursor if we got a full page
    cursor = items.length === 500
      ? (res?.nextCursor || res?.next || res?.cursor || null)
      : null;
 
    page++;
    if (page > 40) break;
  } while (cursor);
 
  return all;
}
