import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Check, Coins } from "lucide-react";
import { motion } from "framer-motion";
import {
  getUpgrades, purchaseUpgrade, purchaseWeapon, equipWeapon, getUpgradeCost,
  WEAPONS, UPGRADES, type WeaponType, type PlayerUpgrades,
  getDailyBonusInfo, claimDailyBonus,
} from "@/lib/upgrades";
import { checkShopAchievements } from "@/lib/achievements";

const WEAPON_COLORS: Record<WeaponType, string> = {
  laser: "#00ffcc", spread: "#ff66ff", homing: "#ffaa00",
};

// Mini canvas that animates the weapon's fire pattern
const WeaponPreview = ({ weaponId }: { weaponId: WeaponType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width, h = canvas.height;
    frameRef.current++;
    const f = frameRef.current;

    ctx.fillStyle = "rgba(8, 12, 20, 0.3)";
    ctx.fillRect(0, 0, w, h);

    const color = WEAPON_COLORS[weaponId];
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    // Ship
    const sx = w / 2, sy = h - 14;
    ctx.beginPath();
    ctx.moveTo(sx, sy - 8);
    ctx.lineTo(sx + 6, sy);
    ctx.lineTo(sx - 6, sy);
    ctx.closePath();
    ctx.fill();

    // Bullets based on weapon type
    if (weaponId === "laser") {
      const by = ((h - 20) - (f * 3) % (h + 10));
      ctx.fillRect(sx - 1.5, by, 3, 8);
    } else if (weaponId === "spread") {
      for (let i = -1; i <= 1; i++) {
        const progress = (f * 3) % (h + 10);
        const by = (h - 20) - progress;
        const bx = sx + i * progress * 0.15;
        ctx.fillRect(bx - 1.5, by, 3, 6);
      }
    } else if (weaponId === "homing") {
      const progress = (f * 2.5) % 80;
      const t = progress / 80;
      // Curving path toward a target
      const tx = w / 2 + 20, ty = 12;
      const bx = sx + (tx - sx) * t + Math.sin(t * Math.PI) * 15;
      const by = sy - 8 + (ty - (sy - 8)) * t;
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
      // Target dot
      ctx.fillStyle = "#ff3366";
      ctx.shadowColor = "#ff3366";
      ctx.beginPath();
      ctx.arc(tx, ty, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    animRef.current = requestAnimationFrame(draw);
  }, [weaponId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={60}
      height={50}
      className="rounded border border-border/30"
      style={{ imageRendering: "pixelated" }}
    />
  );
};

const Upgrades = () => {
  const [upgrades, setUpgrades] = useState<PlayerUpgrades>(getUpgrades);
  const [bonusClaimed, setBonusClaimed] = useState<{ amount: number; streak: number } | null>(null);

  const refresh = () => setUpgrades(getUpgrades());
  const dailyInfo = getDailyBonusInfo();

  const handleClaimBonus = () => {
    const result = claimDailyBonus();
    if (result.claimed) {
      setBonusClaimed({ amount: result.amount, streak: result.streak });
      refresh();
    }
  };

  const handleBuyUpgrade = (id: string) => {
    if (purchaseUpgrade(id)) {
      refresh();
      const updated = getUpgrades();
      const def = UPGRADES.find(u => u.id === id);
      if (def && (updated.levels[id] || 0) >= def.maxLevel) checkShopAchievements("max_upgrade");
      if (updated.totalCoinsEarned >= 1000) checkShopAchievements("coins_1000");
    }
  };

  const handleBuyWeapon = (id: WeaponType) => {
    if (purchaseWeapon(id)) {
      refresh();
      checkShopAchievements("buy_weapon");
    }
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

        {/* Daily Login Bonus */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4">
          <h2 className="font-display text-sm text-[hsl(var(--neon-yellow))] tracking-wider mb-3">🎁 DAILY BONUS</h2>
          {bonusClaimed ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-2">
              <p className="font-display text-2xl text-[hsl(var(--neon-yellow))]">+{bonusClaimed.amount} 🪙</p>
              <p className="font-body text-xs text-muted-foreground mt-1">Day {bonusClaimed.streak + 1} streak bonus claimed!</p>
            </motion.div>
          ) : (
            <>
              <div className="flex gap-1.5 mb-3">
                {dailyInfo.allAmounts.map((amt, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-md py-1.5 text-center border transition-all ${
                      i < dailyInfo.streak ? "bg-primary/20 border-primary/40" :
                      i === dailyInfo.streak && dailyInfo.canClaim ? "bg-[hsl(var(--neon-yellow))]/20 border-[hsl(var(--neon-yellow))]/60 animate-pulse" :
                      "bg-muted/10 border-border/20"
                    }`}
                  >
                    <span className="font-body text-[9px] text-muted-foreground block">D{i + 1}</span>
                    <span className={`font-display text-[10px] ${i === dailyInfo.streak && dailyInfo.canClaim ? "text-[hsl(var(--neon-yellow))]" : "text-muted-foreground"}`}>{amt}</span>
                  </div>
                ))}
              </div>
              {dailyInfo.canClaim ? (
                <button
                  onClick={handleClaimBonus}
                  className="w-full py-2 bg-[hsl(var(--neon-yellow))]/20 text-[hsl(var(--neon-yellow))] font-display text-sm rounded-lg border border-[hsl(var(--neon-yellow))]/40 hover:bg-[hsl(var(--neon-yellow))]/30 transition-colors"
                >
                  CLAIM {dailyInfo.amount} COINS
                </button>
              ) : (
                <p className="text-center font-body text-xs text-muted-foreground">Come back tomorrow for your next bonus!</p>
              )}
            </>
          )}
        </motion.div>

        {/* Weapons */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4">
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
                    <WeaponPreview weaponId={w.id} />
                    <div>
                      <span className="font-display text-xs block">{w.icon} {w.name}</span>
                      <span className="font-body text-[10px] text-muted-foreground">{w.desc}</span>
                      <div className="flex gap-3 mt-0.5">
                        <span className="font-body text-[9px] text-primary">DMG: {w.damage}</span>
                        <span className="font-body text-[9px] text-accent">RATE: {Math.round(1000 / w.fireRate * 10) / 10}/s</span>
                      </div>
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
