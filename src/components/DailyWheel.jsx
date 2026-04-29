import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { getLevelInfo } from "../hooks/usePlayerXP";
import { motion, AnimatePresence } from "framer-motion";

const SEGMENTS = [
  { label: "500", value: 500, type: "coins", color: "#3b82f6", emoji: "🪙" },
  { label: "25 XP", value: 25, type: "xp", color: "#8b5cf6", emoji: "⭐" },
  { label: "1,000", value: 1000, type: "coins", color: "#22c55e", emoji: "🪙" },
  { label: "50 XP", value: 50, type: "xp", color: "#f97316", emoji: "⭐" },
  { label: "2,500", value: 2500, type: "coins", color: "#eab308", emoji: "💰" },
  { label: "10 XP", value: 10, type: "xp", color: "#ec4899", emoji: "⭐" },
  { label: "5,000", value: 5000, type: "coins", color: "#ef4444", emoji: "🔥" },
  { label: "100 XP", value: 100, type: "xp", color: "#06b6d4", emoji: "💎" },
];

const SEGMENT_COUNT = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailyWheel({ userEmail }) {
  const [canSpin, setCanSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const totalRotationRef = useRef(0);

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
    setSpinning(true);
    setResult(null);

    // Pick random segment
    const winIdx = Math.floor(Math.random() * SEGMENT_COUNT);
    const prize = SEGMENTS[winIdx];

    // Calculate rotation: land in the middle of the winning segment
    // Pointer is at top (0°). Segment 0 starts at 0° going clockwise.
    // To land segment winIdx under the pointer, rotate so that segment's center aligns with top.
    const segmentCenter = winIdx * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const extraSpins = 5 * 360; // 5 full rotations
    const targetRotation = totalRotationRef.current + extraSpins + (360 - segmentCenter);
    totalRotationRef.current = targetRotation;
    setRotation(targetRotation);

    // Wait for spin to finish (4s)
    setTimeout(async () => {
      setResult(prize);
      setCanSpin(false);
      setSpinning(false);

      const today = getTodayKey();
      const updates = {
        last_spin_date: today,
        total_spins: (record.total_spins || 0) + 1,
      };

      if (prize.type === "coins") {
        updates.total_coins_won = (record.total_coins_won || 0) + prize.value;
        // Add to slots balance
        try {
          const current = parseInt(localStorage.getItem("slots_balance") || "0", 10);
          localStorage.setItem("slots_balance", (current + prize.value).toString());
        } catch {}
      } else if (prize.type === "xp") {
        updates.total_xp_won = (record.total_xp_won || 0) + prize.value;
        // Award XP to PlayerXP entity
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
    }, 4000);
  }, [canSpin, spinning, record, userEmail]);

  if (loading) return null;

  return (
    <div className="bg-card border border-border rounded-2xl shadow mb-4 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎡</span>
          <div className="text-left">
            <p className="text-sm font-black text-foreground leading-tight">Daily Wheel</p>
            <p className="text-xs text-muted-foreground">
              {canSpin ? "Free spin available!" : "Come back tomorrow!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canSpin && (
            <span className="bg-green-500/20 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-500/40 animate-pulse">
              READY
            </span>
          )}
          <span className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
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
            <div className="px-4 pb-4">
              {/* Wheel */}
              <div className="relative flex items-center justify-center my-3">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
                </div>

                {/* Wheel SVG */}
                <div
                  className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] overflow-hidden"
                  style={{ perspective: "600px" }}
                >
                  <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                    }}
                  >
                    {SEGMENTS.map((seg, i) => {
                      const startAngle = (i * SEGMENT_ANGLE * Math.PI) / 180;
                      const endAngle = ((i + 1) * SEGMENT_ANGLE * Math.PI) / 180;
                      const x1 = 100 + 100 * Math.sin(startAngle);
                      const y1 = 100 - 100 * Math.cos(startAngle);
                      const x2 = 100 + 100 * Math.sin(endAngle);
                      const y2 = 100 - 100 * Math.cos(endAngle);
                      const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
                      const midAngle = ((i + 0.5) * SEGMENT_ANGLE * Math.PI) / 180;
                      const textX = 100 + 62 * Math.sin(midAngle);
                      const textY = 100 - 62 * Math.cos(midAngle);
                      const textRotation = (i + 0.5) * SEGMENT_ANGLE;

                      return (
                        <g key={i}>
                          <path
                            d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                            fill={seg.color}
                            stroke="#1e1e2e"
                            strokeWidth="1"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fill="white"
                            fontSize="9"
                            fontWeight="900"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                          >
                            {seg.emoji} {seg.label}
                          </text>
                        </g>
                      );
                    })}
                    {/* Center circle */}
                    <circle cx="100" cy="100" r="16" fill="#1e1e2e" stroke="#eab308" strokeWidth="2" />
                    <text x="100" y="100" fill="#eab308" fontSize="14" fontWeight="900" textAnchor="middle" dominantBaseline="middle">
                      🎡
                    </text>
                  </svg>
                </div>
              </div>

              {/* Spin Button */}
              {canSpin && !result && (
                <button
                  onClick={handleSpin}
                  disabled={spinning}
                  className={`w-full text-lg font-black py-3.5 rounded-2xl border-2 transition-all active:scale-95 ${
                    spinning
                      ? "bg-secondary border-border text-muted-foreground"
                      : "bg-primary border-yellow-300 text-primary-foreground animate-pulse"
                  }`}
                >
                  {spinning ? "🎡 Spinning..." : "🎡 Spin the Wheel!"}
                </button>
              )}

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-2xl p-4 border-2 border-yellow-300 text-center"
                  >
                    <span className="text-3xl">{result.emoji}</span>
                    <p className="text-xs font-bold text-yellow-900/80 uppercase mt-1">You won!</p>
                    <p className="text-2xl font-black text-gray-900">
                      +{result.type === "coins" ? `${result.value.toLocaleString()} Coins` : `${result.value} XP`}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Already spun today */}
              {!canSpin && !result && (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground font-bold">✅ You already spun today!</p>
                  <p className="text-xs text-muted-foreground">Come back tomorrow for another free spin.</p>
                </div>
              )}

              {/* Stats */}
              {(record?.total_spins || 0) > 0 && (
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>🎡 {record.total_spins} spins</span>
                  <span>🪙 {(record.total_coins_won || 0).toLocaleString()}</span>
                  <span>⭐ {(record.total_xp_won || 0).toLocaleString()} XP</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}