import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "../hooks/usePlayerXP";
import { useDailyMissions } from "../hooks/useDailyMissions";
import { motion, AnimatePresence } from "framer-motion";
import { playRichTone } from "../lib/SoundEngine";
import { useAudioStore } from "../stores/audioStore";
import useConfetti from "../hooks/useConfetti";
import useHaptics from "../hooks/useHaptics";

// Brighter, more game-like prize segments with vivid gradients
const SEGMENTS = [
  { label: "500",     value: 500,  type: "coins", color: "#3b82f6", colorEnd: "#1e40af", emoji: "🪙", glow: "#60a5fa" },
  { label: "25 XP",   value: 25,   type: "xp",    color: "#a855f7", colorEnd: "#6b21a8", emoji: "⭐", glow: "#c084fc" },
  { label: "1,000",   value: 1000, type: "coins", color: "#22c55e", colorEnd: "#15803d", emoji: "🪙", glow: "#4ade80" },
  { label: "50 XP",   value: 50,   type: "xp",    color: "#f97316", colorEnd: "#9a3412", emoji: "✨", glow: "#fb923c" },
  { label: "2,500",   value: 2500, type: "coins", color: "#eab308", colorEnd: "#854d0e", emoji: "💰", glow: "#fde047" },
  { label: "10 XP",   value: 10,   type: "xp",    color: "#ec4899", colorEnd: "#9f1239", emoji: "⭐", glow: "#f472b6" },
  { label: "JACKPOT", value: 5000, type: "coins", color: "#ef4444", colorEnd: "#7f1d1d", emoji: "🔥", glow: "#fca5a5", jackpot: true },
  { label: "100 XP",  value: 100,  type: "xp",    color: "#06b6d4", colorEnd: "#155e75", emoji: "💎", glow: "#67e8f9" },
];

const SEGMENT_COUNT = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
const RIM_LIGHTS = 24; // bulbs around the rim

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Countdown to next midnight (local)
function useNextSpinCountdown(canSpin) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (canSpin) { setText(""); return; }
    function tick() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const ms = tomorrow - now;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setText(`${h}h ${m}m ${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [canSpin]);
  return text;
}

export default function DailyWheel({ userEmail }) {
  const [canSpin, setCanSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lightPhase, setLightPhase] = useState(0);
  const [spinFrame, setSpinFrame] = useState(0);
  const totalRotationRef = useRef(0);
  const tickIntervalRef = useRef(null);
  const { reportMissionProgress } = useDailyMissions();
  const { fireworks, emojiRain, burst } = useConfetti();
  const { tapVibrate, winVibrate, scoreMilestone } = useHaptics();
  const countdown = useNextSpinCountdown(canSpin);

  // Animated chasing rim lights when idle and ready
  useEffect(() => {
    if (!expanded || spinning) return;
    const id = setInterval(() => setLightPhase(p => (p + 1) % RIM_LIGHTS), 120);
    return () => clearInterval(id);
  }, [expanded, spinning]);

  // Rim light frame counter during spin (replaces Date.now() in render)
  useEffect(() => {
    if (!spinning) return;
    const id = setInterval(() => setSpinFrame(p => (p + 1) % 3), 80);
    return () => clearInterval(id);
  }, [spinning]);

  // Tick sound during spin
  function playTick(pitch) {
    if (useAudioStore.getState().muteAll) return;
    const vol = useAudioStore.getState().sfxVolume * 0.12;
    playRichTone({ frequency: pitch, duration: 0.04, volume: vol, type: "triangle" });
  }

  function startTickSound() {
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    const startTime = Date.now();
    const totalDuration = 4000;
    let tickCount = 0;

    function scheduleTick() {
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalDuration) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
        return;
      }
      const progress = elapsed / totalDuration;
      const pitch = tickCount % 2 === 0 ? 1800 : 2200;
      playTick(pitch);
      tickCount++;
      const nextInterval = 40 + progress * progress * 260;
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = setTimeout(scheduleTick, nextInterval);
    }
    scheduleTick();
  }

  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearTimeout(tickIntervalRef.current);
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    checkSpin();
  }, [userEmail]);

  async function checkSpin() {
    const records = await base44.entities.DailyWheelSpin.filter({ user_email: userEmail });
    let rec = records[0] || null;

    if (!rec) {
      rec = await base44.entities.DailyWheelSpin.create({
        user_email: userEmail,
        last_spin_date: "",
        total_coins_won: 0,
        total_xp_won: 0,
        total_spins: 0,
      });
    }

    setRecord(rec);
    const today = getTodayKey();
    setCanSpin(rec.last_spin_date !== today);
    setLoading(false);
  }

  const handleSpin = useCallback(async () => {
    if (!canSpin || spinning || !record) return;
    tapVibrate();
    setSpinning(true);
    setResult(null);

    const winIdx = Math.floor(Math.random() * SEGMENT_COUNT);
    const prize = SEGMENTS[winIdx];

    const segmentCenter = winIdx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const extraSpins = 6 * 360;
    const targetRotation = totalRotationRef.current + extraSpins + (360 - segmentCenter);
    totalRotationRef.current = targetRotation;
    setRotation(targetRotation);
    startTickSound();

    setTimeout(async () => {
      setResult(prize);
      setCanSpin(false);
      setSpinning(false);

      // Celebration based on prize
      if (prize.jackpot) {
        winVibrate();
        fireworks();
        emojiRain(["🔥", "💰", "🎉", "🏆"]);
      } else if (prize.value >= 1000 || prize.value >= 100) {
        scoreMilestone();
        burst();
        emojiRain([prize.emoji, "✨"]);
      } else {
        scoreMilestone();
        burst();
      }

      const today = getTodayKey();
      const updates = {
        last_spin_date: today,
        total_spins: (record.total_spins || 0) + 1,
      };

      if (prize.type === "coins") {
        updates.total_coins_won = (record.total_coins_won || 0) + prize.value;
        // Sync to slots localStorage
        try {
          const current = parseInt(localStorage.getItem("slots_balance") || "0", 10);
          localStorage.setItem("slots_balance", (current + prize.value).toString());
        } catch {}
        // Sync to PlayerCoins (shop currency)
        try {
          const coinRecords = await base44.entities.PlayerCoins.filter({ user_email: userEmail });
          if (coinRecords[0]) {
            await base44.entities.PlayerCoins.update(coinRecords[0].id, {
              balance: (coinRecords[0].balance ?? 0) + prize.value,
              total_earned: (coinRecords[0].total_earned ?? 0) + prize.value,
            });
          } else {
            await base44.entities.PlayerCoins.create({
              user_email: userEmail,
              balance: 500 + prize.value,
              total_earned: 500 + prize.value,
              total_spent: 0,
            });
          }
        } catch {}
      } else if (prize.type === "xp") {
        updates.total_xp_won = (record.total_xp_won || 0) + prize.value;
        try {
          const xpRecords = await base44.entities.PlayerXP.filter({ user_email: userEmail });
          if (xpRecords[0]) {
            const newXP = (xpRecords[0].total_xp || 0) + prize.value;
            const info = getLevelInfo(newXP);
            await base44.entities.PlayerXP.update(xpRecords[0].id, { total_xp: newXP, level: info.level });
          } else {
            const info = getLevelInfo(prize.value);
            await base44.entities.PlayerXP.create({ user_email: userEmail, total_xp: prize.value, level: info.level });
          }
        } catch {}
      }

      await base44.entities.DailyWheelSpin.update(record.id, updates);
      setRecord(prev => ({ ...prev, ...updates }));
      reportMissionProgress("spin_wheel");
    }, 4000);
  }, [canSpin, spinning, record, userEmail, tapVibrate, winVibrate, scoreMilestone, fireworks, burst, emojiRain, reportMissionProgress]);

  if (loading) return null;

  // Top prize for header preview
  const topPrize = SEGMENTS.find(s => s.jackpot);

  return (
    <div className={`relative rounded-2xl shadow-xl mb-4 overflow-hidden border-2 transition-colors ${
      canSpin
        ? "bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 border-yellow-400/60"
        : "bg-card border-border"
    }`}>
      {/* Animated sheen overlay when spin available */}
      {canSpin && !expanded && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Header — always visible */}
      <button
        onClick={() => { tapVibrate(); setExpanded(p => !p); }}
        className="relative w-full flex items-center justify-between px-4 py-3 z-10"
      >
        <div className="flex items-center gap-3">
          <motion.span
            className="text-3xl"
            animate={canSpin ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
          >
            🎡
          </motion.span>
          <div className="text-left">
            <p className={`text-sm font-black leading-tight ${canSpin ? "text-yellow-300" : "text-foreground"}`}>
              Daily Wheel
            </p>
            <p className={`text-xs ${canSpin ? "text-yellow-100/80" : "text-muted-foreground"}`}>
              {canSpin ? `Win up to ${topPrize?.label} Coins!` : `Next spin in ${countdown}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSpin && (
            <motion.span
              className="bg-yellow-400 text-yellow-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              SPIN!
            </motion.span>
          )}
          <span className={`transition-transform ${expanded ? "rotate-180" : ""} ${canSpin ? "text-yellow-300" : "text-muted-foreground"}`}>▼</span>
        </div>
      </button>

      {/* Expandable wheel area */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 relative">
              {/* Sparkle backdrop */}
              {canSpin && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-yellow-300/40"
                      style={{
                        left: `${(i * 33) % 100}%`,
                        top: `${(i * 41) % 100}%`,
                        fontSize: "10px",
                      }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
                    >
                      ✨
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Wheel container */}
              <div className="relative flex items-center justify-center my-4">
                {/* Pointer at top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30">
                  <motion.div
                    animate={spinning ? { rotate: [-8, 8, -8] } : {}}
                    transition={{ duration: 0.1, repeat: spinning ? Infinity : 0 }}
                  >
                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
                    <div className="w-3 h-3 bg-yellow-300 rounded-full mx-auto -mt-1 border border-yellow-600 shadow-md" />
                  </motion.div>
                </div>

                {/* Outer rim with glow + chasing lights */}
                <div className="relative">
                  {/* Glow ring behind wheel */}
                  {canSpin && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        boxShadow: "0 0 60px 10px rgba(234,179,8,0.4), 0 0 30px 5px rgba(234,179,8,0.6)",
                      }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Rim bulbs */}
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {[...Array(RIM_LIGHTS)].map((_, i) => {
                      const angle = (i / RIM_LIGHTS) * 360;
                      const isActive = spinning
                        ? i % 3 === spinFrame
                        : i === lightPhase || i === (lightPhase + 8) % RIM_LIGHTS || i === (lightPhase + 16) % RIM_LIGHTS;
                      return (
                        <div
                          key={i}
                          className="absolute top-1/2 left-1/2"
                          style={{
                            transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-50%)`,
                            height: "calc(100% + 4px)",
                            width: 0,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full transition-colors duration-100"
                            style={{
                              background: isActive ? "#fde047" : "#713f12",
                              boxShadow: isActive ? "0 0 8px 2px rgba(253,224,71,0.9)" : "none",
                              transform: "translateY(-2px)",
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Wheel SVG */}
                  <div
                    className="relative w-60 h-60 sm:w-72 sm:h-72 rounded-full overflow-hidden"
                    style={{
                      boxShadow: "inset 0 0 0 6px #ca8a04, inset 0 0 0 8px #1e1e2e, 0 8px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                        filter: spinning ? "blur(0.4px)" : "none",
                      }}
                    >
                      <defs>
                        {SEGMENTS.map((seg, i) => (
                          <radialGradient key={i} id={`grad-${i}`} cx="50%" cy="50%" r="70%">
                            <stop offset="0%" stopColor={seg.color} />
                            <stop offset="100%" stopColor={seg.colorEnd} />
                          </radialGradient>
                        ))}
                      </defs>
                      {SEGMENTS.map((seg, i) => {
                        const startAngle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                        const endAngle = ((i + 1) * SEGMENT_ANGLE * Math.PI) / 180;
                        const x1 = 100 + 100 * Math.sin(startAngle);
                        const y1 = 100 - 100 * Math.cos(startAngle);
                        const x2 = 100 + 100 * Math.sin(endAngle);
                        const y2 = 100 - 100 * Math.cos(endAngle);
                        const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
                        const midAngle = ((i + 0.5) * SEGMENT_ANGLE * Math.PI) / 180;
                        const textX = 100 + 60 * Math.sin(midAngle);
                        const textY = 100 - 60 * Math.cos(midAngle);
                        const emojiX = 100 + 78 * Math.sin(midAngle);
                        const emojiY = 100 - 78 * Math.cos(midAngle);
                        const textRotation = (i + 0.5) * SEGMENT_ANGLE;

                        return (
                          <g key={i}>
                            <path
                              d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                              fill={`url(#grad-${i})`}
                              stroke="#fde047"
                              strokeWidth="0.8"
                            />
                            {/* Emoji near outer edge */}
                            <text
                              x={emojiX}
                              y={emojiY}
                              fontSize="14"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${textRotation}, ${emojiX}, ${emojiY})`}
                            >
                              {seg.emoji}
                            </text>
                            {/* Label */}
                            <text
                              x={textX}
                              y={textY}
                              fill="white"
                              fontSize={seg.jackpot ? "9" : "10"}
                              fontWeight="900"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)", letterSpacing: "0.5px" }}
                            >
                              {seg.label}
                            </text>
                          </g>
                        );
                      })}
                      {/* Center hub */}
                      <circle cx="100" cy="100" r="20" fill="#1e1e2e" stroke="#fde047" strokeWidth="2.5" />
                      <circle cx="100" cy="100" r="14" fill="url(#hubGrad)" />
                      <defs>
                        <radialGradient id="hubGrad" cx="50%" cy="40%" r="60%">
                          <stop offset="0%" stopColor="#fef3c7" />
                          <stop offset="60%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#854d0e" />
                        </radialGradient>
                      </defs>
                      <text x="100" y="100" fill="#1e1e2e" fontSize="16" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                        🎡
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Spin Button */}
              {canSpin && !result && (
                <motion.button
                  onClick={handleSpin}
                  disabled={spinning}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-full text-xl font-black py-4 rounded-2xl border-2 transition-all overflow-hidden ${
                    spinning
                      ? "bg-secondary border-border text-muted-foreground"
                      : "bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 border-yellow-200 text-yellow-950 shadow-[0_4px_20px_rgba(234,179,8,0.5)]"
                  }`}
                >
                  {!spinning && (
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
                      style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)", animation: "shimmer 1.8s linear infinite" }}
                    />
                  )}
                  <span className="relative">
                    {spinning ? "🎡 Spinning..." : "🎰 SPIN THE WHEEL!"}
                  </span>
                </motion.button>
              )}

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative rounded-2xl p-4 border-2 text-center overflow-hidden ${
                      result.jackpot
                        ? "bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 border-yellow-200"
                        : "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 border-yellow-300"
                    }`}
                  >
                    {/* Animated shine — CSS shimmer, no JS */}
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl"
                      style={{ background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)", animation: "shimmer 2s linear infinite" }}
                    />
                    <motion.span
                      className="block text-5xl relative"
                      animate={{ scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.8, repeat: 2 }}
                    >
                      {result.emoji}
                    </motion.span>
                    <p className="text-xs font-black text-yellow-950 uppercase mt-1 tracking-widest">
                      {result.jackpot ? "🎉 JACKPOT! 🎉" : "You Won!"}
                    </p>
                    <p className="text-3xl font-black text-gray-900 drop-shadow">
                      +{result.type === "coins" ? `${result.value.toLocaleString()} Coins` : `${result.value} XP`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Already spun today */}
              {!canSpin && !result && (
                <div className="text-center py-3 bg-secondary/50 rounded-xl border border-border">
                  <p className="text-sm text-foreground font-bold">✅ You already spun today!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Next spin in <span className="text-primary font-black">{countdown}</span>
                  </p>
                </div>
              )}

              {/* Stats */}
              {(record?.total_spins || 0) > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-secondary/40 rounded-lg py-2 text-center border border-border">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Spins</p>
                    <p className="text-sm font-black text-foreground">🎡 {record.total_spins}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg py-2 text-center border border-border">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Coins</p>
                    <p className="text-sm font-black text-yellow-400">🪙 {(record.total_coins_won || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/40 rounded-lg py-2 text-center border border-border">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">XP</p>
                    <p className="text-sm font-black text-purple-400">⭐ {(record.total_xp_won || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}