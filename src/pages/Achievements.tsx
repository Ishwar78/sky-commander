import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { getAchievements, ACHIEVEMENTS, type AchievementDef } from "@/lib/achievements";

const CATEGORY_LABELS: Record<AchievementDef["category"], string> = {
  combat: "COMBAT",
  survival: "SURVIVAL",
  mastery: "MASTERY",
};

const Achievements = () => {
  const [state] = useState(getAchievements);
  const total = ACHIEVEMENTS.length;
  const unlocked = Object.keys(state.unlocked).length;

  const categories: AchievementDef["category"][] = ["combat", "survival", "mastery"];

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">ACHIEVEMENTS</h1>
          <span className="font-display text-xs text-muted-foreground">{unlocked}/{total}</span>
        </div>

        {/* Progress bar */}
        <div className="bg-muted/20 rounded-full h-2 mb-6 neon-border overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlocked / total) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-primary rounded-full"
            style={{ boxShadow: "0 0 10px hsl(var(--neon-cyan) / 0.5)" }}
          />
        </div>

        {categories.map((cat) => {
          const items = ACHIEVEMENTS.filter((a) => a.category === cat);
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4"
            >
              <h2 className="font-display text-sm text-primary tracking-wider mb-3">{CATEGORY_LABELS[cat]}</h2>
              <div className="space-y-2">
                {items.map((a) => {
                  const isUnlocked = !!state.unlocked[a.id];
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                        isUnlocked ? "border-primary/40 bg-primary/5" : "border-border/20 bg-muted/10 opacity-50"
                      }`}
                    >
                      <span className={`text-xl ${isUnlocked ? "" : "grayscale"}`}>{a.icon}</span>
                      <div className="flex-1">
                        <span className="font-display text-xs block">{a.name}</span>
                        <span className="font-body text-[10px] text-muted-foreground">{a.desc}</span>
                      </div>
                      {isUnlocked && (
                        <span className="font-body text-[9px] text-primary">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
