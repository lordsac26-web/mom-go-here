import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const AUTO_SAVE_INTERVAL = 60000; // 60 seconds

/**
 * Hook for saving and loading game state to/from the SavedGame entity.
 * 
 * @param {string} gameName - Unique game identifier (e.g. "solitaire")
 * @param {string} displayName - Human-readable name (e.g. "Solitaire")
 * @param {string} emoji - Emoji for display (e.g. "♠️")
 * @param {object} options - { autoSave: boolean, getState: () => object, onLoad: (state) => void }
 */
export default function useSaveGame(gameName, displayName, emoji, options = {}) {
  const { autoSave = true, getState, onLoad } = options;
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedGame, setSavedGame] = useState(null);
  const [loadingSave, setLoadingSave] = useState(true);
  const userRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Load existing save on mount
  useEffect(() => {
    loadExistingSave();
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [gameName]);

  async function loadExistingSave() {
    setLoadingSave(true);
    const user = await base44.auth.me();
    userRef.current = user;
    if (!user?.email) { setLoadingSave(false); return; }

    const saves = await base44.entities.SavedGame.filter(
      { user_email: user.email, game_name: gameName },
      "-updated_date",
      1
    );
    if (saves.length > 0) {
      setSavedGame(saves[0]);
    }
    setLoadingSave(false);
  }

  // Auto-save timer
  useEffect(() => {
    if (!autoSave || !getState) return;
    autoSaveTimerRef.current = setInterval(() => {
      saveGame("auto");
    }, AUTO_SAVE_INTERVAL);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [autoSave, getState, gameName]);

  const saveGame = useCallback(async (saveType = "manual") => {
    if (!getState || !userRef.current?.email) return;
    setSaving(true);

    const state = getState();
    const saveData = {
      user_email: userRef.current.email,
      game_name: gameName,
      display_name: displayName,
      save_type: saveType,
      game_state: state.gameState || state,
      progress: state.progress || {},
      inventory: state.inventory || [],
      current_level: state.currentLevel ?? state.currentRound ?? 1,
      score: state.score ?? 0,
      play_time_seconds: state.playTimeSeconds ?? 0,
      thumbnail_emoji: emoji,
    };

    // Upsert: update existing or create new
    if (savedGame?.id) {
      await base44.entities.SavedGame.update(savedGame.id, saveData);
      setSavedGame({ ...savedGame, ...saveData });
    } else {
      const created = await base44.entities.SavedGame.create(saveData);
      setSavedGame(created);
    }
    setLastSaved(new Date());
    setSaving(false);
  }, [getState, gameName, displayName, emoji, savedGame]);

  const loadGame = useCallback(() => {
    if (!savedGame?.game_state || !onLoad) return false;
    onLoad(savedGame.game_state);
    return true;
  }, [savedGame, onLoad]);

  const deleteSave = useCallback(async () => {
    if (!savedGame?.id) return;
    await base44.entities.SavedGame.delete(savedGame.id);
    setSavedGame(null);
    setLastSaved(null);
  }, [savedGame]);

  return {
    saving,
    lastSaved,
    savedGame,
    loadingSave,
    hasSave: !!savedGame,
    saveGame,
    loadGame,
    deleteSave,
  };
}