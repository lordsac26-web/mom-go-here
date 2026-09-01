import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ALL_GAMES } from "@/components/GameTileManager";
import HOME_QUOTES from "@/data/homeQuotes";

export default function useHomeDashboard(user) {
  const [state, setState] = useState({ loading: true, profile: null, quote: null, quickGame: ALL_GAMES[0], checks: [false, false, false] });

  const load = useCallback(async () => {
    if (!user?.email) return;
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    const profile = profiles[0] || null;
    if (!profile?.display_name) {
      setState(s => ({ ...s, loading: false, profile }));
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayLabel = new Date().toDateString();
    const [progress, journals, saves] = await Promise.all([
      base44.entities.DailyProgress.filter({ user_email: user.email }),
      base44.entities.JournalEntry.filter({ user_email: user.email, entry_date: today }, "-created_date", 1),
      base44.entities.SavedGame.filter({ user_email: user.email }, "-updated_date", 1),
    ]);

    let quoteIndex = profile.last_quote_index ?? 0;
    if (profile.last_quote_date !== todayLabel) {
      quoteIndex = Math.floor(Math.random() * HOME_QUOTES.length);
      base44.entities.UserProfile.update(profile.id, { last_quote_date: todayLabel, last_quote_index: quoteIndex }).catch(() => {});
    }
    const recentKey = saves[0]?.game_name?.toLowerCase();
    const favoritePath = profile.favorite_games?.[0];
    const quickGame = ALL_GAMES.find(g => recentKey && (g.path.endsWith(`/${recentKey}`) || g.name.toLowerCase() === recentKey))
      || ALL_GAMES.find(g => g.path === favoritePath)
      || ALL_GAMES[0];
    const gameDone = progress.some(item => item.date === todayLabel && (item.minutes_played || 0) > 0);
    const inspirationDone = localStorage.getItem(`home_inspiration_${today}`) === "done";
    setState({ loading: false, profile, quote: HOME_QUOTES[quoteIndex], quickGame, checks: [inspirationDone, gameDone, journals.length > 0] });
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const complete = useCallback((index) => {
    const today = new Date().toISOString().slice(0, 10);
    if (index === 0) localStorage.setItem(`home_inspiration_${today}`, "done");
    setState(s => ({ ...s, checks: s.checks.map((done, i) => i === index ? true : done) }));
  }, []);

  return { ...state, complete };
}