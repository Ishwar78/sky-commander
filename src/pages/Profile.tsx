import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Coins, Crosshair, Shield, Flame, Star } from "lucide-react";
import { motion } from "framer-motion";
import { getUpgrades, WEAPONS } from "@/lib/upgrades";
import { getAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { getScores } from "@/lib/auth";

const Profile = () => {
  const upgrades = getUpgrades();
  const achievements = getAchievements();
  const scores = getScores();

  const totalUnlocked = Object.keys(achievements.unlocked).length;
  const totalAchievements = ACHIEVEMENTS.length;
  const highScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
  const gamesPlayed = scores.length;
  const avgScore = gamesPlayed > 0 ? Math.round(scores.reduce((s, e) => s + e.score, 0) / gamesPlayed) : 0;

  const equippedWeapon = WEAPONS.find(w => w.id === upgrades.equippedWeapon);
  const weaponsOwned = upgrades.unlockedWeapons.length;

  const recentAchievements = ACHIEVEMENTS.filter(a => achievements.unlocked[a.id])
    .sort((a, b) => new Date(achievements.unlocked[b.id]).getTime() - new Date(achievements.unlocked[a.id]).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">PROFILE</h1>
          <div className="w-16" />
        </div>

        {/* Stats Overview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4">
          <h2 className="font-display text-sm text-primary tracking-wider mb-4">PILOT STATS</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Star className="w-4 h-4" />, label: "High Score", value: highScore.toLocaleString(), color: "text-[hsl(var(--neon-yellow))]" },
              { icon: <Crosshair className="w-4 h-4" />, label: "Games Played", value: gamesPlayed, color: "text-primary" },
              { icon: <Flame className="w-4 h-4" />, label: "Avg Score", value: avgScore.toLocaleString(), color: "text-accent" },
              { icon: <Coins className="w-4 h-4" />, label: "Total Coins", value: upgrades.totalCoinsEarned.toLocaleString(), color: "text-[hsl(var(--neon-yellow))]" },
              { icon: <Trophy className="w-4 h-4" />, label: "Achievements", value: `${totalUnlocked}/${totalAchievements}`, color: "text-primary" },
              { icon: <Shield className="w-4 h-4" />, label: "Bosses Killed", value: achievements.bossesKilled, color: "text-destructive" },
            ].map((stat) => (
              <div key={stat.label} className="bg-muted/10 rounded-lg border border-border/20 p-3 flex items-center gap-3">
                <div className={stat.color}>{stat.icon}</div>
                <div>
                  <p className="font-body text-[10px] text-muted-foreground">{stat.label}</p>
                  <p className={`font-display text-sm ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Favorite Weapon */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4">
          <h2 className="font-display text-sm text-primary tracking-wider mb-3">ARSENAL</h2>
          <div className="flex items-center gap-4 p-3 bg-muted/10 rounded-lg border border-primary/30">
            <span className="text-2xl">{equippedWeapon?.icon}</span>
            <div>
              <p className="font-display text-xs text-primary">{equippedWeapon?.name} <span className="text-muted-foreground font-body">(equipped)</span></p>
              <p className="font-body text-[10px] text-muted-foreground">{equippedWeapon?.desc}</p>
            </div>
          </div>
          <p className="font-body text-xs text-muted-foreground mt-2">{weaponsOwned}/{WEAPONS.length} weapons unlocked • {upgrades.coins} coins available</p>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5">
          <h2 className="font-display text-sm text-primary tracking-wider mb-3">RECENT ACHIEVEMENTS</h2>
          {recentAchievements.length === 0 ? (
            <p className="font-body text-xs text-muted-foreground text-center py-4">No achievements yet. Play to earn medals!</p>
          ) : (
            <div className="space-y-2">
              {recentAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-2 bg-muted/10 rounded-lg border border-border/20">
                  <span className="text-lg">{a.icon}</span>
                  <div className="flex-1">
                    <p className="font-display text-xs text-[hsl(var(--neon-yellow))]">{a.name}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{a.desc}</p>
                  </div>
                  <span className="font-body text-[9px] text-muted-foreground">
                    {new Date(achievements.unlocked[a.id]).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          {totalUnlocked > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] font-body text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round((totalUnlocked / totalAchievements) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-muted/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(totalUnlocked / totalAchievements) * 100}%` }} />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
