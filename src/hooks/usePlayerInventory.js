import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Read-only hook for a player's inventory.
 * Purchases/equips happen server-side via the `economy` backend function;
 * PlayerInventory is read-only from the client, so this hook only reads + reloads.
 */
export default function usePlayerInventory(userEmail) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const results = await base44.entities.PlayerInventory.filter({ user_email: userEmail });
      setInventory(results[0] ?? null);
    } catch (e) {
      console.error("usePlayerInventory error:", e);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { load(); }, [load]);

  return { inventory, loading, reload: load };
}