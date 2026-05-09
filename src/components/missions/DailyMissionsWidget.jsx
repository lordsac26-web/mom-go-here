import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { pickRandomMissions, ALL_COMPLETE_BONUS_XP } from "./missionDefinitions";
import { getLevelInfo } from "../../hooks/usePlayerXP";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Gift, Target, ChevronRight, ChevronDown } from "lucide-react";

// Map mission types/games to routes so tapping a mission navigates to the right place
const MISSION_ROUTES = {
  "Memory Game": "/games/memory",
  "TicTacToe": "/games/tictactoe",
  "Yahtzee": "/games/yahtzee",
  "Word Search": "/games/wordsearch",
  "Sudoku": "/games/sudoku",
  "Checkers": "/games/checkers",
  "Mahjong": "/games/mahjong",
  "Solitaire": "/games/solitaire",
  "BuzzWord": "/games/buzzword",
  "Lucky Slots": "/games/slots",
  "Dart Pop Blitz": "/games/dartpop",
  "AI Art Studio": "/games/artstudio",
};

function getMissionRoute(mission) {
  // Game-specific missions
  if (mission.game && MISSION_ROUTES[mission.game]) return MISSION_ROUTES[mission.game];
  // Page-visit missions
  if (mission.type === "visit_page" && mission.page) return mission.page;
  // Generic play/win missions → go to games list
  if (["play_any", "win_any", "variety"].includes(mission.type)) return "/games";
  // Spin wheel, daily login → stay on home (already there)
  if (mission.type === "spin_wheel" || mission.type === "daily_login") return null;
  // Daily challenge
  if (mission.type === "daily_challenge") return "/daily-challenge";
  // Journal
  if (mission.type === "journal") return "/memories";
  // Gallery
  if (mission.type === "gallery_post" || mission.type === "gallery_like") return "/gallery";
  // Streak, checkers-specific → games
  if (mission.type === "streak" || mission.type === "checkers_king" || mission.type === "checkers_capture") return "/games/checkers";
  return "/games";
}

export default function DailyMissionsWidget({ userEmail, refreshKey }) {
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const recordIdRef = useRef(null);

  useEffect(() => {
    if (!userEmail) return;
    loadMissions();
  }, [userEmail, refreshKey]);

  // Subscribe to real-time updates on DailyMission entity
  useEffect(() => {
    const unsub = base44.entities.DailyMission.subscribe((event) => {
      // Only update if it's our record
      if (event.data && recordIdRef.current && event.id === recordIdRef.current) {
        setRecord(event.data);
      }
    });
    return unsub;
  }, []);

  async function loadMissions() {
    const today = new Date().toISOString().slice(0, 10);
    const records = await base44.entities.DailyMission.filter({ user_email: userEmail, date: today });

    let rec;
    if (records.length > 0) {
      rec = records[0];
    } else {
      const missions = pickRandomMissions(3);
      rec = await base44.entities.DailyMission.create({
        user_email: userEmail,
        date: today,
        missions,
        all_completed: false,
        bonus_claimed: false,
      });
    }
    recordIdRef.current = rec.id;
    setRecord(rec);
    setLoading(false);
  }

  function handleMissionTap(mission) {
    if (mission.completed) return;
    const route = getMissionRoute(mission);
    if (route) navigate(route);
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

  const [expanded, setExpanded] = useState(false);

  if (loading || !record) return null;

  const missions = record.missions || [];
  const completedCount = missions.filter(m => m.completed).length;
  const allDone = completedCount === missions.length;
  const bonusClaimed = record.bonus_claimed;

  // Auto-collapse when all missions done AND bonus claimed
  const isCollapsed = allDone && bonusClaimed && !expanded;

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-3 mb-4 shadow">
      {/* Header — always visible, tappable when collapsed */}
      <button
        onClick={() => { if (allDone && bonusClaimed) setExpanded(!expanded); }}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Target size={20} className="text-primary" />
          <h3 className="text-base font-black text-foreground">Daily Missions</h3>
        </div>
        <div className="flex items-center gap-2">
          {allDone && bonusClaimed && (
            <span className="text-xs font-bold text-green-400">✅ All done!</span>
          )}
          {!allDone && (
            <span className="text-xs font-bold text-muted-foreground">
              {completedCount}/{missions.length} done
            </span>
          )}
          {allDone && bonusClaimed && (
            <ChevronDown size={16} className={`text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {/* Collapsible body */}
      {!isCollapsed && (
        <>
          {/* Mission Items */}
          <div className="space-y-2 mt-3">
            {missions.map((mission, idx) => {
              const pct = Math.min((mission.progress / mission.target) * 100, 100);
              const route = getMissionRoute(mission);
              const isTappable = !mission.completed && route;
              return (
                <button
                  key={mission.id || idx}
                  onClick={() => handleMissionTap(mission)}
                  disabled={!isTappable}
                  className={`w-full text-left rounded-xl p-3 border transition-all active:scale-[0.98] ${
                    mission.completed
                      ? "bg-green-950/30 border-green-500/40"
                      : "bg-secondary/50 border-border hover:border-primary/40"
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
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-primary whitespace-nowrap">
                        +{mission.xp_reward} XP
                      </span>
                      {isTappable && (
                        <ChevronRight size={14} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* All-Complete Bonus */}
          <AnimatePresence>
            {allDone && !bonusClaimed && (
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
            {bonusClaimed && allDone && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-2">
                <p className="text-xs font-bold text-green-400">✅ All missions complete! Bonus claimed!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}