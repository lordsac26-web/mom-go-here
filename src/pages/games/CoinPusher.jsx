import { useRef, useState, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import usePlayerCoins from "@/hooks/usePlayerCoins";
import useHaptics from "../../hooks/useHaptics";
import { useGameAudio } from "../../hooks/useGameAudio";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import CoinDisplay from "@/components/shop/CoinDisplay";
import CoinPusherCanvas from "../../components/coinpusher/CoinPusherCanvas";
import R3FTest from "../../components/coinpusher/_R3FTest";

export default function CoinPusher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { coins, loading, reload } = usePlayerCoins(user?.email);
  const { tapVibrate, successVibrate } = useHaptics();
  const { uiClickSound, matchSound } = useGameAudio();

  const canvasRef = useRef(null);
  const [tray, setTray] = useState(0);         // coins collected this session, not yet banked
  const [dropping, setDropping] = useState(false);
  const pendingBankRef = useRef(0);            // buffered payout count awaiting server flush
  const flushTimerRef = useRef(null);

  // Batch collected coins to the server so we don't hammer the economy function.
  const scheduleBank = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(async () => {
      flushTimerRef.current = null;
      const count = pendingBankRef.current;
      if (count <= 0) return;
      pendingBankRef.current = 0;
      try {
        await base44.functions.invoke("economy", { action: "pusher", mode: "payout", count });
        await reload();
      } catch {
        // If banking fails, keep the coins visible in the tray for a retry next collect.
        pendingBankRef.current += count;
      }
    }, 1200);
  }, [reload]);

  const handleCollect = useCallback((n) => {
    matchSound();
    successVibrate();
    setTray(t => t + n);
    pendingBankRef.current += n;
    scheduleBank();
  }, [matchSound, successVibrate, scheduleBank]);

  useEffect(() => () => clearTimeout(flushTimerRef.current), []);

  async function handleDrop() {
    if (dropping) return;
    uiClickSound();
    tapVibrate();
    setDropping(true);
    try {
      await base44.functions.invoke("economy", { action: "pusher", mode: "drop" });
      await reload();
      // Slight random x so repeated taps don't stack perfectly.
      canvasRef.current?.dropCoin(0.35 + Math.random() * 0.3);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 402) {
        toast({ title: "Out of coins! 🪙", description: "Win games or spin the daily wheel to get more.", variant: "destructive", duration: 3000 });
      } else {
        toast({ title: "Couldn't drop", variant: "destructive", duration: 2500 });
      }
    } finally {
      setDropping(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-4 pb-28 bg-gradient-to-b from-slate-950 via-sky-950 to-slate-950 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <GameBackButton />
        <div className="text-xl font-black text-white">🪙 Coin Pusher</div>
        <GameInstructions
          title="Coin Pusher"
          emoji="🪙"
          steps={[
            "Tap DROP COIN to drop a coin onto the shelf — each drop costs 1 coin.",
            "The blue pusher slides back and forth, shoving the pile forward.",
            "As coins pile up, they push each other toward the front edge.",
            "Coins that fall off the front edge land in your tray!",
            "Your winnings are added to your balance automatically. 🎉",
          ]}
        />
      </div>

      {/* Balance + tray */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <p className="text-slate-400 text-xs font-bold">Balance</p>
          <CoinDisplay coins={loading ? null : coins} size="lg" />
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-xs font-bold">Collected</p>
          <span className="inline-flex items-center gap-1.5 font-black rounded-full bg-green-500/20 border border-green-400/40 text-green-300 text-xl px-4 py-2">
            🪙 {tray.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Machine */}
      <CoinPusherCanvas ref={canvasRef} onCollect={handleCollect} />

      {/* Drop button */}
      <button
        onClick={handleDrop}
        disabled={dropping || (coins ?? 0) < 1}
        className="mt-4 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-2xl font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-transform border border-white/20 disabled:opacity-50"
      >
        {(coins ?? 0) < 1 ? "Out of Coins" : "⬇️ Drop Coin — 1 🪙"}
      </button>
      <p className="text-center text-slate-500 text-sm mt-2">
        Push coins off the front edge to win them!
      </p>
    </div>
  );
}