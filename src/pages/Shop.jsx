import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import usePlayerCoins from "@/hooks/usePlayerCoins";
import usePlayerInventory from "@/hooks/usePlayerInventory";
import CoinDisplay from "@/components/shop/CoinDisplay";
import BalloonSkinsTab from "@/components/shop/BalloonSkinsTab";
import WheelThemesTab from "@/components/shop/WheelThemesTab";
import DartPowerupsTab from "@/components/shop/DartPowerupsTab";
import SubPageHeader from "@/components/SubPageHeader";

const TABS = [
  { id: "balloons", label: "Balloons", emoji: "🎈" },
  { id: "wheel",    label: "Wheel",    emoji: "🎡" },
  { id: "powerups", label: "Power-Ups", emoji: "⚡" },
];

export default function Shop() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { coins, loading: coinsLoading, reload: reloadCoins } = usePlayerCoins(user?.email);
  const { inventory, loading: invLoading, reload: reloadInventory } = usePlayerInventory(user?.email);
  const [activeTab, setActiveTab] = useState("balloons");

  const loading = coinsLoading || invLoading;

  async function handleBuy(item, category) {
    if (item.free) return;
    try {
      await base44.functions.invoke("economy", { action: "purchase", category, itemId: item.id });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 402) {
        toast({ title: "Not enough coins! 🪙", description: `You need ${item.price} coins.`, variant: "destructive", duration: 3000 });
      } else {
        toast({ title: "Purchase failed", description: err?.response?.data?.error || "Please try again.", variant: "destructive", duration: 3000 });
      }
      return;
    }

    await Promise.all([reloadCoins(), reloadInventory()]);

    if (category === "powerup") {
      toast({ title: `${item.emoji} ${item.label} added!`, duration: 3000 });
    } else {
      toast({ title: `${item.emoji} ${item.label} unlocked!`, description: "Equipped.", duration: 3000 });
    }
  }

  async function handleEquip(category, id) {
    try {
      await base44.functions.invoke("economy", { action: "equip", category, itemId: id });
    } catch {
      toast({ title: "Couldn't equip", variant: "destructive", duration: 3000 });
      return;
    }
    await reloadInventory();
    toast({ title: category === "balloon" ? "Balloon skin equipped!" : "Wheel theme equipped!", duration: 3000 });
  }

  return (
    <div className="min-h-screen pb-28">
      <SubPageHeader title="Shop" emoji="🛒" />

      {/* Coin Balance */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-bold">Your Balance</p>
          <CoinDisplay coins={coins} size="lg" />
        </div>
        <div className="text-right">
          <p className="text-muted-foreground text-xs">Earn coins by playing games,</p>
          <p className="text-muted-foreground text-xs">spinning the daily wheel & completing missions!</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 bg-secondary rounded-2xl p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 rounded-xl font-black text-xs transition-all
                ${activeTab === tab.id ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === "balloons" && (
              <BalloonSkinsTab
                inventory={inventory}
                coins={coins}
                onBuy={item => handleBuy(item, "balloon")}
                onEquip={handleEquip}
              />
            )}
            {activeTab === "wheel" && (
              <WheelThemesTab
                inventory={inventory}
                coins={coins}
                onBuy={item => handleBuy(item, "wheel")}
                onEquip={handleEquip}
              />
            )}
            {activeTab === "powerups" && (
              <DartPowerupsTab
                inventory={inventory}
                coins={coins}
                onBuy={item => handleBuy(item, "powerup")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}