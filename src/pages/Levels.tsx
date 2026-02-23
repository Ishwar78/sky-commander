import { Link } from "react-router-dom";
import { ArrowLeft, Star, Lock, Check } from "lucide-react";
import { motion } from "framer-motion";
import { getXPData, xpForLevel, LEVEL_REWARDS, MAX_LEVEL, type LevelReward } from "@/lib/xp";

const TYPE_COLORS: Record<LevelReward["type"], string> = {
  weapon: "text-destructive",
  skin: "text-primary",
  mode: "text-accent",
  cosmetic: "text-[hsl(var(--neon-pink))]",
  boost: "text-[hsl(var(--neon-yellow))]",
  perk: "text-[hsl(var(--neon-green))]",
};

const Levels = () => {
  const xpData = getXPData();
  const xpNeeded = xpForLevel(xpData.level);
  const progress = xpData.currentXP / xpNeeded;

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">LEVELS</h1>
          <div className="w-16" />
        </div>

        {/* Current level card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-6 h-6 text-accent" />
            <span className="font-display text-3xl text-accent">{xpData.level}</span>
          </div>
          <p className="font-body text-xs text-muted-foreground mb-2">{xpData.totalXP} total XP earned</p>
          <div className="w-full h-3 bg-muted/40 rounded-full overflow-hidden border border-accent/20 mb-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
              style={{ boxShadow: "0 0 8px hsl(var(--accent) / 0.5)" }}
            />
          </div>
          <p className="font-body text-[10px] text-muted-foreground">
            {xpData.level >= MAX_LEVEL ? "MAX LEVEL" : `${xpData.currentXP} / ${xpNeeded} XP to Level ${xpData.level + 1}`}
          </p>
        </motion.div>

        {/* Level list */}
        <div className="space-y-2">
          {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((level) => {
            const unlocked = xpData.level >= level;
            const isCurrent = xpData.level === level;
            const reward = LEVEL_REWARDS.find(r => r.level === level);

            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(level * 0.02, 0.6) }}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  isCurrent
                    ? "border-accent/60 bg-accent/10"
                    : unlocked
                    ? "border-primary/30 bg-card/40"
                    : "border-border/15 bg-muted/5 opacity-60"
                }`}
              >
                {/* Level number */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-sm flex-shrink-0 ${
                  isCurrent
                    ? "bg-accent text-accent-foreground"
                    : unlocked
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/20 text-muted-foreground"
                }`}>
                  {unlocked ? level : <Lock className="w-3.5 h-3.5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-display text-xs ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      LEVEL {level}
                    </span>
                    {isCurrent && (
                      <span className="font-body text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">CURRENT</span>
                    )}
                    {unlocked && !isCurrent && (
                      <Check className="w-3 h-3 text-primary/60" />
                    )}
                  </div>
                  {reward ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm">{reward.icon}</span>
                      <span className={`font-body text-[10px] ${unlocked ? TYPE_COLORS[reward.type] : "text-muted-foreground"}`}>
                        {reward.label}
                      </span>
                      <span className="font-body text-[9px] text-muted-foreground/60">— {reward.description}</span>
                    </div>
                  ) : (
                    <p className="font-body text-[10px] text-muted-foreground/40 mt-0.5">No reward</p>
                  )}
                </div>

                {/* XP needed */}
                {!unlocked && (
                  <span className="font-body text-[9px] text-muted-foreground flex-shrink-0">
                    {xpForLevel(level)} XP
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Levels;
