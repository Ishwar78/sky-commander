import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Check, Coins } from "lucide-react";
import { motion } from "framer-motion";
import {
  getUpgrades, purchaseUpgrade, purchaseWeapon, equipWeapon, getUpgradeCost,
  WEAPONS, UPGRADES, type WeaponType, type PlayerUpgrades,
} from "@/lib/upgrades";

const Upgrades = () => {
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>(getUpgrades);

  const refresh = () => setUpgrades(getUpgrades());

  const handleBuyUpgrade = (id: string) => {
    if (purchaseUpgrade(id)) refresh();
  };

  const handleBuyWeapon = (id: WeaponType) => {
    if (purchaseWeapon(id)) refresh();
  };

  const handleEquip = (id: WeaponType) => {
    equipWeapon(id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">UPGRADES</h1>
          <div className="flex items-center gap-1.5 bg-card/60 rounded-lg px-3 py-1.5 neon-border">
            <Coins className="w-4 h-4 text-[hsl(var(--neon-yellow))]" />
            <span className="font-display text-sm text-[hsl(var(--neon-yellow))]">{upgrades.coins}</span>
          </div>
        </div>

        {/* Weapons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4">
          <h2 className="font-display text-sm text-primary tracking-wider mb-3">WEAPONS</h2>
          <p className="text-muted-foreground text-xs font-body mb-3">Switch weapons during gameplay with 1, 2, 3 keys</p>
          <div className="space-y-2">
            {WEAPONS.map((w) => {
              const owned = upgrades.unlockedWeapons.includes(w.id);
              const equipped = upgrades.equippedWeapon === w.id;
              return (
                <div
                  key={w.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    equipped ? "border-primary bg-primary/10 box-glow-cyan" : owned ? "border-border/30 bg-muted/20" : "border-border/20 bg-muted/10 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{w.icon}</span>
                    <div>
                      <span className="font-display text-xs block">{w.name}</span>
                      <span className="font-body text-[10px] text-muted-foreground">{w.desc}</span>
                    </div>
                  </div>
                  {equipped ? (
                    <span className="font-display text-[10px] text-primary flex items-center gap-1"><Check className="w-3 h-3" /> EQUIPPED</span>
                  ) : owned ? (
                    <button onClick={() => handleEquip(w.id)} className="px-3 py-1 bg-primary/20 text-primary font-display text-[10px] rounded hover:bg-primary/30 transition-colors">
                      EQUIP
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyWeapon(w.id)}
                      disabled={upgrades.coins < w.cost}
                      className="px-3 py-1 bg-[hsl(var(--neon-yellow))]/20 text-[hsl(var(--neon-yellow))] font-display text-[10px] rounded hover:bg-[hsl(var(--neon-yellow))]/30 transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" /> {w.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Stat Upgrades */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5">
          <h2 className="font-display text-sm text-primary tracking-wider mb-3">STAT UPGRADES</h2>
          <div className="space-y-3">
            {UPGRADES.map((up) => {
              const level = upgrades.levels[up.id] || 0;
              const maxed = level >= up.maxLevel;
              const cost = maxed ? 0 : getUpgradeCost(up, level);
              const canAfford = upgrades.coins >= cost;
              return (
                <div key={up.id} className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-muted/10">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{up.icon}</span>
                    <div>
                      <span className="font-display text-xs block">{up.name}</span>
                      <span className="font-body text-[10px] text-muted-foreground">{up.desc}</span>
                      {/* Level bar */}
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: up.maxLevel }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-4 h-1.5 rounded-full ${
                              i < level ? "bg-primary" : "bg-muted/40"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {maxed ? (
                    <span className="font-display text-[10px] text-secondary">MAX</span>
                  ) : (
                    <button
                      onClick={() => handleBuyUpgrade(up.id)}
                      disabled={!canAfford}
                      className="px-3 py-1 bg-[hsl(var(--neon-yellow))]/20 text-[hsl(var(--neon-yellow))] font-display text-[10px] rounded hover:bg-[hsl(var(--neon-yellow))]/30 transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      <Coins className="w-3 h-3" /> {cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Upgrades;
