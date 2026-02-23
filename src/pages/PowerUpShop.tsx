import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Coins, Shield, Crosshair, Heart, Gauge } from "lucide-react";
import { motion } from "framer-motion";
import { getUpgrades, saveUpgrades } from "@/lib/upgrades";
import { soundEngine } from "@/lib/sound";

export interface PowerUpBoost {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  effect: string;
}

export const POWER_UP_BOOSTS: PowerUpBoost[] = [
  { id: "boost_shield", name: "Shield Start", description: "Start the game with an active shield", icon: "🛡️", cost: 30, effect: "shield_start" },
  { id: "boost_rapid", name: "Rapid Fire", description: "Start with 10s of rapid fire", icon: "⚡", cost: 25, effect: "rapid_start" },
  { id: "boost_health", name: "Extra HP", description: "Start with +50 bonus HP", icon: "💚", cost: 35, effect: "health_boost" },
  { id: "boost_double", name: "Double Score", description: "2x score for the first 60 seconds", icon: "✨", cost: 50, effect: "double_score" },
  { id: "boost_magnet", name: "Power Magnet", description: "Power-ups drop 2x more often", icon: "🧲", cost: 40, effect: "magnet" },
  { id: "boost_armor", name: "Armor Plating", description: "Take 50% less damage for 30 seconds", icon: "🔩", cost: 45, effect: "armor" },
  { id: "boost_speed", name: "Speed Boost", description: "Ship moves 50% faster for 30 seconds", icon: "🚀", cost: 35, effect: "speed_boost" },
  { id: "boost_doublebullet", name: "Double Bullet", description: "Fire double bullets for 30 seconds", icon: "💥", cost: 40, effect: "double_bullet" },
];

const BOOSTS_KEY = "skyfire-active-boosts";

export const getActiveBoosts = (): string[] => {
  return JSON.parse(localStorage.getItem(BOOSTS_KEY) || "[]");
};

export const clearActiveBoosts = () => {
  localStorage.setItem(BOOSTS_KEY, "[]");
};

export const purchaseBoost = (boostId: string): boolean => {
  const boost = POWER_UP_BOOSTS.find(b => b.id === boostId);
  if (!boost) return false;
  const u = getUpgrades();
  if (u.coins < boost.cost) return false;
  u.coins -= boost.cost;
  saveUpgrades(u);
  const active = getActiveBoosts();
  if (!active.includes(boostId)) {
    active.push(boostId);
    localStorage.setItem(BOOSTS_KEY, JSON.stringify(active));
  }
  return true;
};

const ICON_MAP: Record<string, React.ReactNode> = {
  boost_shield: <Shield className="w-5 h-5" />,
  boost_rapid: <Zap className="w-5 h-5" />,
  boost_health: <Heart className="w-5 h-5" />,
  boost_double: <Crosshair className="w-5 h-5" />,
  boost_magnet: <Gauge className="w-5 h-5" />,
  boost_armor: <Shield className="w-5 h-5" />,
};

const PowerUpShop = () => {
  const navigate = useNavigate();
  const [coins, setCoins] = useState(getUpgrades().coins);
  const [activeBoosts, setActiveBoosts] = useState<string[]>(getActiveBoosts());
  const [justBought, setJustBought] = useState<string | null>(null);

  const handleBuy = (id: string) => {
    if (purchaseBoost(id)) {
      soundEngine.purchase();
      setJustBought(id);
      setCoins(getUpgrades().coins);
      setActiveBoosts(getActiveBoosts());
      setTimeout(() => setJustBought(null), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider flex items-center gap-2">
            <Zap className="w-5 h-5" /> POWER-UPS
          </h1>
          <div className="flex items-center gap-1 text-[hsl(var(--neon-yellow))]">
            <Coins className="w-4 h-4" />
            <span className="font-display text-sm">{coins}</span>
          </div>
        </div>

        <p className="font-body text-xs text-muted-foreground text-center mb-4">
          Buy boosts before your next game. They activate when you start playing!
        </p>

        {activeBoosts.length > 0 && (
          <div className="bg-[hsl(var(--neon-green))]/10 border border-[hsl(var(--neon-green))]/30 rounded-xl p-3 mb-4">
            <p className="font-display text-[10px] text-[hsl(var(--neon-green))] mb-1">ACTIVE BOOSTS</p>
            <div className="flex flex-wrap gap-2">
              {activeBoosts.map(id => {
                const b = POWER_UP_BOOSTS.find(x => x.id === id);
                return b ? (
                  <span key={id} className="font-body text-xs text-foreground bg-card/60 px-2 py-0.5 rounded-md">
                    {b.icon} {b.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {POWER_UP_BOOSTS.map((boost, i) => {
            const isActive = activeBoosts.includes(boost.id);
            const canAfford = coins >= boost.cost;

            return (
              <motion.div
                key={boost.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 ${isActive ? "ring-1 ring-[hsl(var(--neon-green))]/50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                    {boost.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm text-foreground">{boost.name}</h3>
                    <p className="font-body text-[10px] text-muted-foreground">{boost.description}</p>
                  </div>
                  <div>
                    {isActive ? (
                      <span className="px-3 py-1 bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] font-display text-[10px] rounded-lg">
                        ✓ READY
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(boost.id)}
                        disabled={!canAfford}
                        className={`px-3 py-1 font-display text-[10px] rounded-lg transition-transform hover:scale-105 flex items-center gap-1 ${
                          justBought === boost.id
                            ? "bg-[hsl(var(--neon-green))] text-background"
                            : canAfford
                            ? "bg-[hsl(var(--neon-yellow))] text-background"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {justBought === boost.id ? "✓ BOUGHT" : (
                          <>
                            <Coins className="w-3 h-3" />
                            {boost.cost}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/play")}
          className="w-full mt-6 py-3 bg-primary text-primary-foreground font-display text-lg rounded-xl box-glow-cyan hover:shadow-[0_0_40px_hsl(var(--neon-cyan)/0.5)] transition-shadow flex items-center justify-center gap-2"
        >
          🎮 START GAME
        </motion.button>
      </div>
    </div>
  );
};

export default PowerUpShop;
