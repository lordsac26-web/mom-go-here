import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import usePlayerCoins from "@/hooks/usePlayerCoins";

export default function useCoinPusherSession({ userEmail, gameRef, toast, onDropFeedback, onCollectFeedback }) {
  const { coins, loading, reload } = usePlayerCoins(userEmail);
  const [collected, setCollected] = useState(0);
  const [spent, setSpent] = useState(0);
  const [dropping, setDropping] = useState(false);
  const pendingBankRef = useRef(0);
  const flushTimerRef = useRef(null);
  const dropTimersRef = useRef([]);

  const flushBank = useCallback(async () => {
    flushTimerRef.current = null;
    const count = pendingBankRef.current;
    if (!count) return;
    pendingBankRef.current = 0;
    try {
      await base44.functions.invoke("economy", { action: "pusher", mode: "payout", count });
      await reload();
    } catch {
      pendingBankRef.current += count;
    }
  }, [reload]);

  const onCollect = useCallback((count) => {
    onCollectFeedback();
    setCollected((value) => value + count);
    pendingBankRef.current += count;
    if (!flushTimerRef.current) flushTimerRef.current = setTimeout(flushBank, 1200);
  }, [flushBank, onCollectFeedback]);

  const drop = useCallback(async (count, x) => {
    if (dropping) return;
    onDropFeedback();
    setDropping(true);
    try {
      await base44.functions.invoke("economy", { action: "pusher", mode: "drop", count });
      await reload();
      setSpent((value) => value + count);
      dropTimersRef.current = Array.from({ length: count }, (_, index) => setTimeout(() => {
        gameRef.current?.dropCoin(x + (Math.random() - 0.5) * 0.04);
      }, index * 220));
    } catch (error) {
      toast({ title: error?.response?.status === 402 ? "Out of coins! 🪙" : "Couldn't drop", description: error?.response?.status === 402 ? "Win games or spin the daily wheel to get more." : undefined, variant: "destructive", duration: 3000 });
    } finally {
      setDropping(false);
    }
  }, [dropping, gameRef, onDropFeedback, reload, toast]);

  useEffect(() => () => {
    clearTimeout(flushTimerRef.current);
    dropTimersRef.current.forEach(clearTimeout);
  }, []);

  return { coins, loading, collected, spent, dropping, onCollect, drop };
}