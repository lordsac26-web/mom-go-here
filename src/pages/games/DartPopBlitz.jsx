import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useGameActivity } from "../../hooks/useGameActivity";
import useHaptics from "../../hooks/useHaptics";
import useConfetti from "../../hooks/useConfetti";
import useDartSounds from "../../components/dartpopblitz/useDartSounds";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import DartPopBlitzCanvas from "../../components/dartpopblitz/DartPopBlitzCanvas.jsx";
import GameUI from "../../components/dartpopblitz/GameUI";
import ModeSelect from "../../components/dartpopblitz/ModeSelect";
import GameOver from "../../components/dartpopblitz/GameOver";
import { generateBalloons } from "../../components/dartpopblitz/levelGenerator";

const INSTRUCTIONS = [
  "Choose a dart count: 10 (quick), 50 (standard), or 100 (marathon).",
  "Press & hold on the screen to aim — a power meter will oscillate up and down.",
  "Release to fire! The dart launches at whatever power level the meter is at.",
  "Higher power = faster dart. Time your release for maximum impact!",
  "Pop all the balloons before you run out of darts!",
  "Hit 4 balloons in a row to earn a random power-up.",
  "Tap a power-up to equip it before your next shot.",
  "🔱 Multi-Shot fires 3 darts at once.",
  "💥 MIRV Grenade explodes into cluster darts mid-flight.",
  "🎯 Sniper Dart pierces through balloons AND obstacles!",
  "💣 Bomb balloons explode and pop nearby balloons!",
  "🛡️ Tough balloons need multiple hits to pop.",
  "🧲 When a balloon pops, its row-neighbors slide together — plan your shots!",
  "⚡ Watch out for moving platforms and spinning blades — they destroy your darts!",
];

// FIX (structure): extracted score-save logic into a standalone async function
// so it isn't embedded inside a useEffect or useCallback. This makes it easy
// to call directly, test independently, and add real error handling.
// FIX (bug): errors are now logged instead of silently swallowed.
async function saveGameScore({ userEmail, score, dartLimit, balloonsPopped, won }) {
  if (!userEmail) return;
  const base = { user_email: userEmail, score, level_completed: won };
  try {
    await base44.entities.DartPopBlitzScore.create({
      ...base,
      dart_limit: dartLimit,
      balloons_popped: balloonsPopped,
    });
  } catch (err) {
    console.error("Failed to save DartPopBlitzScore:", err);
  }
  try {
    await base44.entities.GameScore.create({
      ...base,
      game_name: "Dart Pop Blitz",
      completed: won,
    });
  } catch (err) {
    console.error("Failed to save GameScore:", err);
  }
}

export default function DartPopBlitz() {
  const { user } = useAuth();
  const { reportWin, reportLoss } = useGameActivity();
  const haptics = useHaptics();
  const { fireConfetti } = useConfetti();
  const sounds = useDartSounds();

  // Game phases: menu | playing | won | lost
  const [gameState, setGameState] = useState("menu");
  const [preset, setPreset] = useState(null);

  // FIX (structure): only state that truly belongs in the parent lives here.
  // balloons, darts, particles, and obstacles all live inside DartPopBlitzCanvas
  // so that rapid game-loop updates (every dart fired, every particle tick) don't
  // re-render the page shell, GameUI header, or GameInstructions on every frame.
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalPopped, setTotalPopped] = useState(0);
  const [dartsRemaining, setDartsRemaining] = useState(0);
  const [totalBalloons, setTotalBalloons] = useState(0);
  const [activePowerup, setActivePowerup] = useState(null);
  const [powerupInventory, setPowerupInventory] = useState({ multishot: 0, mirv: 0, sniper: 0 });

  // FIX (bug): savedRef guards against double-saves. It is reset inside
  // startGame via a ref so it doesn't depend on render timing.
  const savedRef = useRef(false);

  const initCounterRef = useRef(0);

  const startGame = useCallback((p) => {
    // Tag the preset with a unique id so the canvas can detect a true new game
    initCounterRef.current++;
    setPreset({ ...p, _initId: initCounterRef.current });
    const b = generateBalloons(p);
    setTotalBalloons(b.length);
    setDartsRemaining(p.darts);
    setScore(0);
    setStreak(0);
    setTotalPopped(0);
    setActivePowerup(null);
    setPowerupInventory({ multishot: 0, mirv: 0, sniper: 0 });
    setGameState("playing");
    savedRef.current = false;
  }, []);

  // FIX (bug + structure): replaced useEffect([gameState]) with a direct
  // callback passed to DartPopBlitzCanvas. This eliminates the stale-closure
  // problem entirely: the canvas calls onGameEnd(result) with the final values
  // at the exact moment the game ends, so score/totalPopped/preset are always
  // current. No dependency array to maintain.
  const handleGameEnd = useCallback(async (result) => {
    // result = { won: bool, score: number, totalPopped: number, dartsUsed: number }
    if (savedRef.current) return;
    savedRef.current = true;

    const { won, score: finalScore, totalPopped: finalPopped } = result;

    if (won) {
      haptics.winVibrate();
      fireConfetti();
      sounds.playWin();
      // FIX (bug): reportWin and reportLoss now both receive the game name
      // so loss records are as complete as win records.
      reportWin("Dart Pop Blitz");
    } else {
      haptics.lossVibrate();
      sounds.playMiss();
      reportLoss("Dart Pop Blitz");
    }

    await saveGameScore({
      userEmail: user?.email,
      score: finalScore,
      dartLimit: preset?.darts ?? 0,
      balloonsPopped: finalPopped,
      won,
    });

    setGameState(won ? "won" : "lost");
  }, [
    // FIX (bug): all values read inside the callback are listed as deps so
    // the callback always closes over current values, not stale ones.
    haptics, fireConfetti, sounds, reportWin, reportLoss, user, preset,
  ]);

  if (gameState === "menu") {
    return (
      <div className="min-h-screen px-4 py-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <GameBackButton />
          <GameInstructions title="Dart Pop Blitz" emoji="🎯" steps={INSTRUCTIONS} />
        </div>
        <ModeSelect onSelect={startGame} />
      </div>
    );
  }

  if (gameState === "won" || gameState === "lost") {
    return (
      <div className="min-h-screen px-4 py-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <GameBackButton />
          <GameInstructions title="Dart Pop Blitz" emoji="🎯" steps={INSTRUCTIONS} />
        </div>
        <GameOver
          won={gameState === "won"}
          score={score}
          totalPopped={totalPopped}
          totalBalloons={totalBalloons}
          dartsUsed={preset ? preset.darts - dartsRemaining : 0}
          onPlayAgain={() => startGame(preset)}
          onMenu={() => setGameState("menu")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 py-2 pb-24 flex flex-col items-center gap-2">
      <div className="flex items-center justify-between w-full max-w-[400px]">
        <GameBackButton />
        <GameInstructions title="Dart Pop Blitz" emoji="🎯" steps={INSTRUCTIONS} />
      </div>

      <GameUI
        score={score}
        dartsRemaining={dartsRemaining}
        totalPopped={totalPopped}
        totalBalloons={totalBalloons}
        streak={streak}
        activePowerup={activePowerup}
        setActivePowerup={setActivePowerup}
        powerupInventory={powerupInventory}
        setPowerupInventory={setPowerupInventory}
      />

      {/* FIX (structure): DartPopBlitzCanvas now owns balloons/darts/particles/obstacles
          internally. The parent only receives summary state (score, streak, totalPopped,
          dartsRemaining) via the callbacks below, which fire infrequently — not on every
          animation frame. This prevents the page shell from re-rendering every tick.

          FIX (bug): onGameEnd replaces the old setGameState("won"/"lost") call from inside
          the canvas. The canvas calls it with the final result object so scores are captured
          at the correct moment with no stale-closure risk. */}
      <DartPopBlitzCanvas
        preset={preset}
        gameState={gameState}
        activePowerup={activePowerup}
        setActivePowerup={setActivePowerup}
        powerupInventory={powerupInventory}
        setPowerupInventory={setPowerupInventory}
        onScoreChange={setScore}
        onStreakChange={setStreak}
        onTotalPoppedChange={setTotalPopped}
        onDartsRemainingChange={setDartsRemaining}
        onGameEnd={handleGameEnd}
        sounds={sounds}
      />
    </div>
  );
}