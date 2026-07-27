import { useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import useHaptics from "@/hooks/useHaptics";
import { useGameAudio } from "@/hooks/useGameAudio";
import useCoinPusherSession from "@/hooks/useCoinPusherSession";
import GameBackButton from "@/components/GameBackButton";
import GameInstructions from "@/components/GameInstructions";
import CoinPusherBoard from "@/components/coinpusher/CoinPusherBoard";
import CoinPusherControls from "@/components/coinpusher/CoinPusherControls";
import CoinPusherHUD from "@/components/coinpusher/CoinPusherHUD";

export default function CoinPusher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tapVibrate, successVibrate } = useHaptics();
  const { uiClickSound, matchSound } = useGameAudio();
  const gameRef = useRef(null);
  const [dropCount, setDropCount] = useState(1);
  const [dropX, setDropX] = useState(0.5);
  const session = useCoinPusherSession({
    userEmail: user?.email,
    gameRef,
    toast,
    onDropFeedback: () => { uiClickSound(); tapVibrate(); },
    onCollectFeedback: () => { matchSound(); successVibrate(); },
  });

  const chooseCount = (count) => {
    setDropCount(count);
    uiClickSound();
    tapVibrate();
  };

  return (
    <div className="h-[100dvh] flex flex-col gap-2 overflow-hidden select-none bg-gradient-to-b from-slate-950 via-sky-950 to-slate-950 px-3 py-2">
      <header className="flex shrink-0 items-center justify-between">
        <GameBackButton />
        <h1 className="text-lg font-black text-white">🪙 Coin Pusher</h1>
        <GameInstructions title="Coin Pusher" emoji="🪙" steps={["Choose a drop position and quantity.", "Tap DROP COIN to stack up to three coins on the rear pusher shelf.", "When the shelf pulls back, your coins drop into the playfield and move toward the front edge.", "Coins that fall into the tray are added to your balance automatically."]} />
      </header>
      <CoinPusherHUD balance={session.coins} loading={session.loading} collected={session.collected} spent={session.spent} />
      <main className="flex min-h-0 flex-1 items-stretch">
        <CoinPusherBoard ref={gameRef} onCollect={session.onCollect} dropX={dropX} />
      </main>
      <CoinPusherControls balance={session.coins} dropping={session.dropping} dropCount={dropCount} dropX={dropX} onCountChange={chooseCount} onPositionChange={setDropX} onDrop={() => session.drop(dropCount, dropX)} />
    </div>
  );
}