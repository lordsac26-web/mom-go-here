import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { useGameActivity } from "../../hooks/useGameActivity";
import useHaptics from "../../hooks/useHaptics";
import useConfetti from "../../hooks/useConfetti";
import useDartSounds from "../../components/dartpopblitz/useDartSounds";
import GameBackButton from "../../components/GameBackButton";
import GameInstructions from "../../components/GameInstructions";
import DartPopBlitzCanvas from "../../components/dartpopblitz/DartPopBlitzCanvas";
import GameUI from "../../components/dartpopblitz/GameUI";
import ModeSelect from "../../components/dartpopblitz/ModeSelect";
import GameOver from "../../components/dartpopblitz/GameOver";
import { generateBalloons } from "../../components/dartpopblitz/levelGenerator";
import { generateObstacles } from "../../components/dartpopblitz/obstacleGenerator";

const INSTRUCTIONS = [
  "Choose a dart count: 10 (quick), 50 (standard), or 100 (marathon).",
  "Tap or drag on the screen to aim, then release to shoot a dart.",
  "Pop all the balloons before you run out of darts!",
  "Hit 4 balloons in a row to earn a random power-up.",
  "Tap a power-up to equip it before your next shot.",
  "🔱 Multi-Shot fires 3 darts at once.",
  "💥 MIRV Grenade explodes into cluster darts mid-flight.",
  "🎯 Sniper Dart pierces through balloons AND obstacles!",
  "💣 Bomb balloons explode and pop nearby balloons!",
  "🛡️ Tough balloons need multiple hits to pop.",
  "⚡ Watch out for moving platforms, spinning blades, and pendulums — they destroy your darts!",
];

export default function DartPopBlitz() {
  const { user } = useAuth();
  const { reportWin, reportLoss } = useGameActivity();
  const haptics = useHaptics();
  const { fireConfetti } = useConfetti();
  const sounds = useDartSounds();

  // Game phases: menu, playing, won, lost
  const [gameState, setGameState] = useState("menu");
  const [preset, setPreset] = useState(null);

  // Core game state
  const [balloons, setBalloons] = useState([]);
  const [darts, setDarts] = useState([]);
  const [particles, setParticles] = useState([]);
  const [dartsRemaining, setDartsRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalPopped, setTotalPopped] = useState(0);
  const [activePowerup, setActivePowerup] = useState(null);
  const [powerupInventory, setPowerupInventory] = useState({ multishot: 0, mirv: 0, sniper: 0 });
  const [totalBalloons, setTotalBalloons] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const savedRef = useRef(false);

  const startGame = useCallback((p) => {
    setPreset(p);
    const b = generateBalloons(p);
    setBalloons(b);
    setTotalBalloons(b.length);
    setDarts([]);
    setParticles([]);
    setDartsRemaining(p.darts);
    setScore(0);
    setStreak(0);
    setTotalPopped(0);
    setActivePowerup(null);
    setPowerupInventory({ multishot: 0, mirv: 0, sniper: 0 });
    setObstacles(generateObstacles(p.obstacles || []));
    setGameState("playing");
    savedRef.current = false;
  }, []);

  // Handle game over
  useEffect(() => {
    if ((gameState === "won" || gameState === "lost") && !savedRef.current) {
      savedRef.current = true;
      const won = gameState === "won";

      if (won) {
        haptics.winVibrate();
        fireConfetti();
        sounds.playWin();
        reportWin("Dart Pop Blitz");
      } else {
        haptics.lossVibrate();
        sounds.playMiss();
        reportLoss();
      }

      // Save score
      if (user?.email) {
        base44.entities.DartPopBlitzScore.create({
          user_email: user.email,
          score,
          dart_limit: preset?.darts || 0,
          balloons_popped: totalPopped,
          level_completed: won,
        }).catch(() => {});

        // Also save to GameScore for leaderboard
        base44.entities.GameScore.create({
          user_email: user.email,
          game_name: "Dart Pop Blitz",
          score,
          completed: won,
        }).catch(() => {});
      }
    }
  }, [gameState]);

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

      <DartPopBlitzCanvas
        balloons={balloons} setBalloons={setBalloons}
        darts={darts} setDarts={setDarts}
        particles={particles} setParticles={setParticles}
        dartsRemaining={dartsRemaining} setDartsRemaining={setDartsRemaining}
        score={score} setScore={setScore}
        streak={streak} setStreak={setStreak}
        activePowerup={activePowerup} setActivePowerup={setActivePowerup}
        powerupInventory={powerupInventory} setPowerupInventory={setPowerupInventory}
        gameState={gameState} setGameState={setGameState}
        totalPopped={totalPopped} setTotalPopped={setTotalPopped}
        obstacles={obstacles} setObstacles={setObstacles}
        sounds={sounds}
      />
    </div>
  );
}