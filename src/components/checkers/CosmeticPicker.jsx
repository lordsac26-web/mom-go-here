import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Check, Palette, X } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  BOARD_STYLES, PIECE_SKINS,
  isCosmeticUnlocked, getUnlockLabel,
} from "./cosmeticDefinitions";
import { getLevelInfo } from "../../hooks/usePlayerXP";

function Spinning3DPiece({ color1, color2, glow }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 0.15, 32]} />
      <meshStandardMaterial color={color1} metalness={0.6} roughness={0.3} />
    </mesh>
  );
}

function PiecePreview3D({ skin }) {
  const color = skin?.p1?.gradient?.includes("#fbbf24") ? "#d97706"
    : skin?.p1?.gradient?.includes("#22d3ee") ? "#06b6d4"
    : skin?.p1?.gradient?.includes("#e0f2fe") ? "#0ea5e9"
    : skin?.p1?.gradient?.includes("#fef08a") ? "#f97316"
    : skin?.p1?.gradient?.includes("#a1a1aa") ? "#52525b"
    : skin?.p1?.gradient?.includes("#fef9c3") ? "#a855f7"
    : "#dc2626";

  return (
    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-900">
      <Canvas camera={{ position: [0, 1, 2], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 3, 1]} intensity={1} />
        <pointLight position={[-1, 2, -1]} intensity={0.5} color="#fbbf24" />
        <Spinning3DPiece color1={color} />
      </Canvas>
    </div>
  );
}

export default function CosmeticPicker({ userEmail, onSelect, onClose }) {
  const [cosmetics, setCosmetics] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [tab, setTab] = useState("boards"); // boards | pieces
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    loadData();
  }, [userEmail]);

  async function loadData() {
    const [cosmeticRecords, xpRecords, achievementRecords, scoreRecords] = await Promise.all([
      base44.entities.CheckerCosmetic.filter({ user_email: userEmail }),
      base44.entities.PlayerXP.filter({ user_email: userEmail }),
      base44.entities.Achievement.filter({ user_email: userEmail }),
      base44.entities.GameScore.filter({ user_email: userEmail, game_name: "Checkers" }),
    ]);

    const cosmeticRecord = cosmeticRecords[0] || {
      unlocked_boards: ["classic"],
      unlocked_pieces: ["classic"],
      active_board: "classic",
      active_pieces: "classic",
    };

    const xp = xpRecords[0]?.total_xp || 0;
    const levelInfo = getLevelInfo(xp);
    const achievements = achievementRecords.map(a => a.achievement_key);
    const checkersWins = scoreRecords.filter(s => s.completed).length;

    const allUnlocked = [
      ...(cosmeticRecord.unlocked_boards || []),
      ...(cosmeticRecord.unlocked_pieces || []),
    ];

    setCosmetics(cosmeticRecord);
    setPlayerData({
      level: levelInfo.level,
      checkersWins,
      achievements,
      unlockedItems: allUnlocked,
    });
    setLoading(false);
  }

  async function selectItem(type, itemId) {
    if (!cosmetics) return;

    const updates = type === "boards"
      ? { active_board: itemId }
      : { active_pieces: itemId };

    // If no record exists yet, create one
    if (!cosmetics.id) {
      const newRecord = await base44.entities.CheckerCosmetic.create({
        user_email: userEmail,
        unlocked_boards: ["classic"],
        unlocked_pieces: ["classic"],
        active_board: type === "boards" ? itemId : "classic",
        active_pieces: type === "pieces" ? itemId : "classic",
      });
      setCosmetics(newRecord);
    } else {
      await base44.entities.CheckerCosmetic.update(cosmetics.id, updates);
      setCosmetics(prev => ({ ...prev, ...updates }));
    }

    onSelect?.();
  }

  if (loading) return null;

  const items = tab === "boards" ? BOARD_STYLES : PIECE_SKINS;
  const activeId = tab === "boards" ? cosmetics?.active_board : cosmetics?.active_pieces;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center px-2" onClick={onClose}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-card rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden border-2 border-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Palette size={20} className="text-primary" />
            <h3 className="text-lg font-black text-foreground">Customize Board</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary">
            <X size={20} className="text-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("boards")}
            className={`flex-1 py-2.5 text-sm font-bold transition-all ${
              tab === "boards" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            🎨 Board Styles
          </button>
          <button
            onClick={() => setTab("pieces")}
            className={`flex-1 py-2.5 text-sm font-bold transition-all ${
              tab === "pieces" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
            }`}
          >
            ♟️ Piece Skins
          </button>
        </div>

        {/* Items Grid */}
        <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: "60vh" }}>
          {items.map(item => {
            const unlocked = isCosmeticUnlocked(item, playerData);
            const isActive = item.id === activeId;
            const isRare = item.rarity === "Legendary";

            return (
              <button
                key={item.id}
                onClick={() => unlocked && selectItem(tab, item.id)}
                disabled={!unlocked}
                className={`w-full text-left rounded-xl p-3 border-2 transition-all flex items-center gap-3 ${
                  isActive
                    ? "bg-primary/10 border-primary"
                    : unlocked
                    ? "bg-secondary/50 border-border hover:border-primary/50"
                    : "bg-secondary/20 border-border opacity-60"
                }`}
              >
                {/* Preview */}
                {tab === "pieces" ? (
                  <PiecePreview3D skin={item} />
                ) : (
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.darkColor} border-2 flex items-center justify-center`}
                    style={{ borderColor: item.borderColor }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground">{item.name}</p>
                    {isRare && <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">LEGENDARY</span>}
                    {isActive && <Check size={14} className="text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {unlocked ? (isActive ? "Equipped" : "Tap to equip") : getUnlockLabel(item)}
                  </p>
                </div>

                {/* Lock icon */}
                {!unlocked && <Lock size={16} className="text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}