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
import { Slider } from "@/components/ui/slider";

export default function CoinPusher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { coins, loading, reload } = usePlayerCoins(user?.email);
  const { tapVibrate, successVibrate } = useHaptics();
  const { uiClickSound, matchSound } = useGameAudio();

  const canvasRef = useRef(null);
  const [tray, setTray] = useState(0);         // coins collected this session, not yet banked
  const [dropping, setDropping] = useState(false);
  const [dropCount, setDropCount] = useState(1);
  const [dropX, setDropX] = useState(0.5);  // 0..1 horizontal drop position
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
      await base44.functions.invoke("economy", { action: "pusher", mode: "drop", count: dropCount });
      await reload();
      // Stagger the visual drops so each coin gets its own Plinko path.
      for (let i = 0; i < dropCount; i++) {
        setTimeout(() => {
          canvasRef.current?.dropCoin(dropX + (Math.random() - 0.5) * 0.04);
        }, i * 220);
      }
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
    <div className="h-[100dvh] flex flex-col px-3 py-2 gap-2 bg-gradient-to-b from-slate-950 via-sky-950 to-slate-950 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <GameBackButton />
        <div className="text-lg font-black text-white">🪙 Coin Pusher</div>
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
      <div className="flex items-center justify-between shrink-0 px-1">
        <div>
          <p className="text-slate-400 text-[10px] font-bold leading-tight">Balance</p>
          <CoinDisplay coins={loading ? null : coins} size="md" />
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-[10px] font-bold leading-tight">Collected</p>
          <span className="inline-flex items-center gap-1 font-black rounded-full bg-green-500/20 border border-green-400/40 text-green-300 text-base px-3 py-1">
            🪙 {tray.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Machine — fills all remaining vertical space */}
      <div className="flex-1 min-h-0 flex items-stretch">
        <CoinPusherCanvas ref={canvasRef} onCollect={handleCollect} dropX={dropX} />
      </div>

      {/* Drop position slider */}
      <div className="shrink-0 flex items-center gap-3 px-1">
        <span className="text-slate-400 text-xs font-bold">◀</span>
        <Slider
          value={[Math.round(dropX * 100)]}
          onValueChange={([v]) => setDropX(v / 100)}
          min={15}
          max={85}
          step={1}
          disabled={dropping}
          className="flex-1"
        />
        <span className="text-slate-400 text-xs font-bold">▶</span>
      </div>

      {/* Quantity selector + drop button */}
      <div className="shrink-0 flex items-center gap-2">
        <div className="flex gap-1.5 bg-slate-800/60 rounded-2xl p-1.5 border border-slate-700/60">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => { setDropCount(n); uiClickSound(); tapVibrate(); }}
              disabled={dropping}
              className={`w-11 h-11 rounded-xl font-black text-lg transition-all active:scale-90 ${
                dropCount === n
                  ? "bg-sky-500 text-white shadow-lg scale-105"
                  : "bg-transparent text-slate-400"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={handleDrop}
          disabled={dropping || (coins ?? 0) < dropCount}
          className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xl font-black py-3.5 rounded-2xl shadow-xl active:scale-95 transition-transform border border-white/20 disabled:opacity-50"
        >
          {(coins ?? 0) < dropCount
            ? "Out of Coins"
            : `⬇️ Drop ${dropCount > 1 ? `${dropCount} Coins` : "Coin"} — ${dropCount} 🪙`}
        </button>
      </div>
    </div>
  );
}