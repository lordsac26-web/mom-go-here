import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Read-only hook for a player's coin balance.
 * All coin mutations happen server-side via the `economy` backend function;
 * PlayerCoins is read-only from the client, so this hook only reads + reloads.
 */
export default function usePlayerCoins(userEmail) {
  const [coins, setCoins] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const results = await base44.entities.PlayerCoins.filter({ user_email: userEmail });
      if (results[0]) {
        setRecord(results[0]);
        setCoins(results[0].balance ?? 0);
      } else {
        const response = await base44.functions.invoke("economy", { action: "pusher", mode: "balance" });
        setRecord(null);
        setCoins(response.data.balance ?? 0);
      }
    } catch (e) {
      console.error("usePlayerCoins error:", e);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { load(); }, [load]);

  return { coins, record, loading, reload: load };
}