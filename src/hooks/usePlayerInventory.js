import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

export default function usePlayerInventory(userEmail) {
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const results = await base44.entities.PlayerInventory.filter({ user_email: userEmail });
      if (results[0]) {
        setInventory(results[0]);
      } else {
        const created = await base44.entities.PlayerInventory.create({
          user_email: userEmail,
          owned_balloon_skins: ["default"],
          owned_wheel_themes: ["default"],
          dart_powerups: {},
          active_balloon_skin: "default",
          active_wheel_theme: "default",
        });
        setInventory(created);
      }
    } catch (e) {
      console.error("usePlayerInventory error:", e);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch) => {
    if (!inventory) return;
    const updated = { ...inventory, ...patch };
    await base44.entities.PlayerInventory.update(inventory.id, patch);
    setInventory(updated);
  }, [inventory]);

  return { inventory, loading, update, reload: load };
}