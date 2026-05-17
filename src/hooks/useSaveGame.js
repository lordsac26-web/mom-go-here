import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const AUTO_SAVE_INTERVAL = 60000; // 60 seconds

/**
 * Hook for saving and loading game state to/from the SavedGame entity.
 *
 * @param {string} gameName    - Unique game identifier (e.g. "solitaire")
 * @param {string} displayName - Human-readable name (e.g. "Solitaire")
 * @param {string} emoji       - Emoji for display (e.g. "♠️")
 * @param {object} options     - { autoSave: boolean, getState: () => object, onLoad: (state) => void }
 */
export default function useSaveGame(gameName, displayName, emoji, options = {}) {
  const { autoSave = true, getState, onLoad } = options;
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedGame, setSavedGame] = useState(null);
  const [loadingSave, setLoadingSave] = useState(true);

  // Refs to avoid stale closures inside intervals and callbacks
  const savedGameRef = useRef(null);
  const userEmailRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Keep savedGameRef in sync with state so auto-save always upserts correctly
  useEffect(() => {
    savedGameRef.current = savedGame;
  }, [savedGame]);

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
    userEmailRef.current = user?.email || null;
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

  // Auto-save timer — uses refs so it always has current data
  useEffect(() => {
    if (!autoSave || !getState) return;
    autoSaveTimerRef.current = setInterval(() => {
      _doSave("auto");
    }, AUTO_SAVE_INTERVAL);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [autoSave, getState]);

  // Internal save — reads from refs to avoid stale closure
  async function _doSave(saveType = "manual") {
    if (!getState || !userEmailRef.current) return;
    setSaving(true);

    const state = getState();
    const saveData = {
      user_email: userEmailRef.current,
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

    const existing = savedGameRef.current;
    if (existing?.id) {
      await base44.entities.SavedGame.update(existing.id, saveData);
      const updated = { ...existing, ...saveData };
      setSavedGame(updated);
      savedGameRef.current = updated;
    } else {
      const created = await base44.entities.SavedGame.create(saveData);
      setSavedGame(created);
      savedGameRef.current = created;
    }
    setLastSaved(new Date());
    setSaving(false);
  }

  const saveGame = useCallback((saveType = "manual") => _doSave(saveType), [getState, gameName, displayName, emoji]);

  const loadGame = useCallback(() => {
    if (!savedGameRef.current?.game_state || !onLoad) return false;
    onLoad(savedGameRef.current.game_state);
    return true;
  }, [onLoad]);

  const deleteSave = useCallback(async () => {
    const existing = savedGameRef.current;
    if (!existing?.id) return;
    await base44.entities.SavedGame.delete(existing.id);
    setSavedGame(null);
    savedGameRef.current = null;
    setLastSaved(null);
  }, []);

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