import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { pickRandomMissions, ALL_COMPLETE_BONUS_XP } from "./missionDefinitions";
import { getLevelInfo } from "../../hooks/usePlayerXP";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Gift, Target } from "lucide-react";

export default function DailyMissionsWidget({ userEmail, refreshKey }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingBonus, setClaimingBonus] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    loadMissions();
  }, [userEmail, refreshKey]);

  async function loadMissions() {
    const today = new Date().toISOString().slice(0, 10);
    const records = await base44.entities.DailyMission.filter({ user_email: userEmail, date: today });

    if (records.length > 0) {
      setRecord(records[0]);
    } else {
      // Generate new daily missions
      const missions = pickRandomMissions(3);
      const newRecord = await base44.entities.DailyMission.create({
        user_email: userEmail,
        date: today,
        missions,
        all_completed: false,
        bonus_claimed: false,
      });
      setRecord(newRecord);
    }
    setLoading(false);
  }

  async function claimAllCompleteBonus() {
    if (!record || record.bonus_claimed || claimingBonus) return;
    setClaimingBonus(true);

    // Award bonus XP
    const xpRecords = await base44.entities.PlayerXP.filter({ user_email: userEmail });
    let xpRecord = xpRecords[0];
    if (xpRecord) {
      const newXP = (xpRecord.total_xp || 0) + ALL_COMPLETE_BONUS_XP;
      const info = getLevelInfo(newXP);
      await base44.entities.PlayerXP.update(xpRecord.id, { total_xp: newXP, level: info.level });
    }

    await base44.entities.DailyMission.update(record.id, { bonus_claimed: true });
    setRecord(prev => ({ ...prev, bonus_claimed: true }));
    setClaimingBonus(false);
  }

  if (loading || !record) return null;

  const missions = record.missions || [];
  const completedCount = missions.filter(m => m.completed).length;
  const allDone = completedCount === missions.length;

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-4 shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-primary" />
          <h3 className="text-base font-black text-foreground">Daily Missions</h3>
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {completedCount}/{missions.length} done
        </span>
      </div>

      {/* Mission Items */}
      <div className="space-y-2">
        {missions.map((mission, idx) => {
          const pct = Math.min((mission.progress / mission.target) * 100, 100);
          return (
            <div
              key={mission.id || idx}
              className={`rounded-xl p-3 border transition-all ${
                mission.completed
                  ? "bg-green-950/30 border-green-500/40"
                  : "bg-secondary/50 border-border"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-2xl">{mission.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-bold ${mission.completed ? "text-green-400 line-through" : "text-foreground"}`}>
                      {mission.title}
                    </p>
                    {mission.completed && <CheckCircle2 size={14} className="text-green-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{mission.description}</p>
                  {/* Progress bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${mission.completed ? "bg-green-500" : "bg-primary"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                      {Math.min(mission.progress, mission.target)}/{mission.target}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary whitespace-nowrap">
                  +{mission.xp_reward} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* All-Complete Bonus */}
      <AnimatePresence>
        {allDone && !record.bonus_claimed && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={claimAllCompleteBonus}
            disabled={claimingBonus}
            className="w-full mt-3 bg-gradient-to-r from-primary via-yellow-400 to-primary text-primary-foreground font-black py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Gift size={18} />
            Claim Bonus: +{ALL_COMPLETE_BONUS_XP} XP
          </motion.button>
        )}
        {record.bonus_claimed && allDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-2">
            <p className="text-xs font-bold text-green-400">✅ All missions complete! Bonus claimed!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}