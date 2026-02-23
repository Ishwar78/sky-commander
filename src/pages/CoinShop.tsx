import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { COIN_PACKAGES, purchaseCoinPackage, getCurrentUser } from "@/lib/auth";
import { getUpgrades } from "@/lib/upgrades";

const CoinShop = () => {
  const user = getCurrentUser();
  const [purchased, setPurchased] = useState<string | null>(null);
  const [coins, setCoins] = useState(getUpgrades().coins);

  const handlePurchase = (pkgId: string) => {
    if (!user) return;
    const result = purchaseCoinPackage(pkgId);
    if (result.success) {
      setPurchased(pkgId);
      setCoins(getUpgrades().coins);
      setTimeout(() => setPurchased(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">COIN SHOP</h1>
          <div className="flex items-center gap-1 text-[hsl(var(--neon-yellow))]">
            <Coins className="w-4 h-4" />
            <span className="font-display text-sm">{coins}</span>
          </div>
        </div>

        {!user && (
          <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-6 text-center mb-6">
            <p className="font-body text-sm text-muted-foreground">Login to purchase coins</p>
            <Link to="/login" className="font-display text-xs text-primary mt-2 inline-block">LOGIN →</Link>
          </div>
        )}

        <div className="space-y-3">
          {COIN_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 flex items-center gap-4 relative overflow-hidden ${
                purchased === pkg.id ? "ring-2 ring-[hsl(var(--neon-yellow))]" : ""
              }`}
            >
              {pkg.badge && (
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-primary-foreground font-display text-[9px] rounded-bl-lg">
                  {pkg.badge}
                </div>
              )}
              <span className="text-3xl">{pkg.icon}</span>
              <div className="flex-1">
                <p className="font-display text-sm text-foreground">{pkg.name}</p>
                <p className="font-body text-xs text-[hsl(var(--neon-yellow))]">{pkg.coins} Coins</p>
              </div>
              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={!user || purchased === pkg.id}
                className="px-4 py-2 bg-primary text-primary-foreground font-display text-xs rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                {purchased === pkg.id ? "✓ DONE" : `$${pkg.price}`}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center font-body text-[10px] text-muted-foreground/50 mt-6">
          Demo mode — no real charges
        </p>
      </div>
    </div>
  );
};

export default CoinShop;
