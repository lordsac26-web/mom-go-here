import { useState } from "react";
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
  const { coins, loading: coinsLoading, spend } = usePlayerCoins(user?.email);
  const { inventory, loading: invLoading, update } = usePlayerInventory(user?.email);
  const [activeTab, setActiveTab] = useState("balloons");

  const loading = coinsLoading || invLoading;

  async function handleBuy(item, category) {
    if (item.free) return;
    const ok = await spend(item.price);
    if (!ok) {
      toast({ title: "Not enough coins! 🪙", description: `You need ${item.price} coins.`, variant: "destructive", duration: 3000 });
      return;
    }

    if (category === "balloon") {
      const updated = [...(inventory?.owned_balloon_skins ?? ["default"]), item.id];
      await update({ owned_balloon_skins: updated, active_balloon_skin: item.id });
      toast({ title: `${item.emoji} ${item.label} unlocked!`, description: "Balloon skin equipped.", duration: 3000 });
    } else if (category === "wheel") {
      const updated = [...(inventory?.owned_wheel_themes ?? ["default"]), item.id];
      await update({ owned_wheel_themes: updated, active_wheel_theme: item.id });
      toast({ title: `${item.emoji} ${item.label} unlocked!`, description: "Wheel theme equipped.", duration: 3000 });
    } else if (category === "powerup") {
      const current = inventory?.dart_powerups ?? {};
      const newQty = (current[item.id] ?? 0) + 1;
      await update({ dart_powerups: { ...current, [item.id]: newQty } });
      toast({ title: `${item.emoji} ${item.label} added!`, description: `You now have ×${newQty}.`, duration: 3000 });
    }
  }

  async function handleEquip(category, id) {
    if (category === "balloon") {
      await update({ active_balloon_skin: id });
      toast({ title: "Balloon skin equipped!", duration: 3000 });
    } else if (category === "wheel") {
      await update({ active_wheel_theme: id });
      toast({ title: "Wheel theme equipped!", duration: 3000 });
    }
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