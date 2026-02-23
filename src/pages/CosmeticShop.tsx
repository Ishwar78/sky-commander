import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Coins, Check } from "lucide-react";
import { motion } from "framer-motion";
import { COSMETICS, getCosmetics, purchaseCosmetic, equipCosmetic, unequipCosmetic, CosmeticItem } from "@/lib/cosmetics";
import { getUpgrades } from "@/lib/upgrades";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CATEGORY_LABELS: Record<CosmeticItem["category"], { label: string; icon: string }> = {
  explosion: { label: "EXPLOSIONS", icon: "💥" },
  trail: { label: "TRAILS", icon: "✨" },
  bullet: { label: "BULLETS", icon: "🔫" },
};

const CosmeticShop = () => {
  const [cosmetics, setCosmetics] = useState(getCosmetics());
  const [coins, setCoins] = useState(getUpgrades().coins);
  const [justBought, setJustBought] = useState<string | null>(null);

  const refresh = () => {
    setCosmetics(getCosmetics());
    setCoins(getUpgrades().coins);
  };

  const handleBuy = (id: string) => {
    if (purchaseCosmetic(id)) {
      setJustBought(id);
      refresh();
      setTimeout(() => setJustBought(null), 1500);
    }
  };

  const handleEquip = (id: string) => {
    equipCosmetic(id);
    refresh();
  };

  const handleUnequip = (category: CosmeticItem["category"]) => {
    unequipCosmetic(category);
    refresh();
  };

  const renderItems = (category: CosmeticItem["category"]) => {
    const items = COSMETICS.filter((c) => c.category === category);
    return items.map((item, i) => {
      const owned = cosmetics.owned.includes(item.id);
      const equipped = cosmetics.equipped[category] === item.id;
      const canAfford = coins >= item.cost;

      return (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className={`bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 ${equipped ? "ring-1 ring-primary/60" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ background: `linear-gradient(135deg, ${item.color}, ${item.preview})` }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm text-foreground">{item.name}</h3>
              <p className="font-body text-[10px] text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {!owned ? (
                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={!canAfford}
                  className={`px-3 py-1 font-display text-[10px] rounded-lg transition-transform hover:scale-105 flex items-center gap-1 ${
                    justBought === item.id
                      ? "bg-[hsl(var(--neon-green))] text-background"
                      : canAfford
                      ? "bg-[hsl(var(--neon-yellow))] text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {justBought === item.id ? (
                    "✓ BOUGHT"
                  ) : (
                    <>
                      <Coins className="w-3 h-3" />
                      {item.cost}
                    </>
                  )}
                </button>
              ) : equipped ? (
                <button
                  onClick={() => handleUnequip(category)}
                  className="px-3 py-1 bg-primary text-primary-foreground font-display text-[10px] rounded-lg flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> EQUIPPED
                </button>
              ) : (
                <button
                  onClick={() => handleEquip(item.id)}
                  className="px-3 py-1 bg-muted text-foreground font-display text-[10px] rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  EQUIP
                </button>
              )}
            </div>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> COSMETICS
          </h1>
          <div className="flex items-center gap-1 text-[hsl(var(--neon-yellow))]">
            <Coins className="w-4 h-4" />
            <span className="font-display text-sm">{coins}</span>
          </div>
        </div>

        <Tabs defaultValue="explosion" className="w-full">
          <TabsList className="w-full bg-card/60 neon-border">
            {(["explosion", "trail", "bullet"] as const).map((cat) => (
              <TabsTrigger key={cat} value={cat} className="flex-1 font-display text-[10px] data-[state=active]:text-primary gap-1">
                {CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}
              </TabsTrigger>
            ))}
          </TabsList>
          {(["explosion", "trail", "bullet"] as const).map((cat) => (
            <TabsContent key={cat} value={cat} className="space-y-3 mt-4">
              {renderItems(cat)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default CosmeticShop;
