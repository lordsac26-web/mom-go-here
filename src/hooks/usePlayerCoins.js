import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook to read and manage a player's coin balance.
 * Automatically creates a record for new users.
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
        // Create initial record with starter coins
        const created = await base44.entities.PlayerCoins.create({
          user_email: userEmail,
          balance: 500,
          total_earned: 500,
          total_spent: 0,
        });
        setRecord(created);
        setCoins(500);
      }
    } catch (e) {
      console.error("usePlayerCoins error:", e);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { load(); }, [load]);

  /**
   * Spend coins. Returns true if successful, false if insufficient funds.
   */
  const spend = useCallback(async (amount) => {
    if (!record) return false;
    const current = record.balance ?? 0;
    if (current < amount) return false;
    const newBalance = current - amount;
    const newSpent = (record.total_spent ?? 0) + amount;
    await base44.entities.PlayerCoins.update(record.id, {
      balance: newBalance,
      total_spent: newSpent,
    });
    setRecord(r => ({ ...r, balance: newBalance, total_spent: newSpent }));
    setCoins(newBalance);
    return true;
  }, [record]);

  /**
   * Add coins to balance.
   */
  const earn = useCallback(async (amount) => {
    if (!record) return;
    const newBalance = (record.balance ?? 0) + amount;
    const newEarned = (record.total_earned ?? 0) + amount;
    await base44.entities.PlayerCoins.update(record.id, {
      balance: newBalance,
      total_earned: newEarned,
    });
    setRecord(r => ({ ...r, balance: newBalance, total_earned: newEarned }));
    setCoins(newBalance);
  }, [record]);

  return { coins, loading, spend, earn, reload: load };
}