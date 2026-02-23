import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { saveScore } from "@/lib/auth";
import { addCoins } from "@/lib/upgrades";
import { Flame, Zap, Trophy, Swords, Coins, Star } from "lucide-react";
import { getXPData, xpForLevel } from "@/lib/xp";
import LevelUpConfetti from "./LevelUpConfetti";

interface GameOverModalProps {
  score: number;
  maxCombo: number;
  maxMultiplier: number;
  wave: number;
  onRestart: () => void;
  xpGained?: { xp: number; levelsGained: number; newRewards: { level: number; label: string; icon: string }[] } | null;
}

const GameOverModal = ({ score, maxCombo, maxMultiplier, wave, onRestart, xpGained }: GameOverModalProps) => {
  const navigate = useNavigate();
  const coinsEarned = Math.max(1, Math.floor(score / 10));
  const xpData = getXPData();

  if (score > 0) {
    saveScore(score);
    addCoins(coinsEarned);
  }

  const stats = [
    { icon: Trophy, label: "FINAL SCORE", value: `${score}`, color: "text-primary" },
    { icon: Swords, label: "WAVE", value: `${wave}`, color: "text-secondary" },
    { icon: Flame, label: "MAX COMBO", value: `${maxCombo}x`, color: "text-[hsl(var(--neon-yellow))]" },
    { icon: Zap, label: "BEST MULTI", value: `${maxMultiplier.toFixed(1)}x`, color: "text-accent" },
  ];

  const xpNeeded = xpForLevel(xpData.level);
  const xpProgress = xpData.currentXP / xpNeeded;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md rounded-lg z-40"
    >
      {/* Confetti celebration on level up */}
      <LevelUpConfetti show={!!xpGained && xpGained.levelsGained > 0} level={xpData.level} />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-center w-full max-w-xs px-4"
      >
        <h2 className="font-display text-4xl text-destructive text-glow-pink mb-4">GAME OVER</h2>

        {/* Coins earned */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, type: "spring" }}
          className="flex items-center justify-center gap-2 mb-2 bg-[hsl(var(--neon-yellow))]/10 rounded-lg py-2 border border-[hsl(var(--neon-yellow))]/30"
        >
          <Coins className="w-5 h-5 text-[hsl(var(--neon-yellow))]" />
          <span className="font-display text-lg text-[hsl(var(--neon-yellow))]">+{coinsEarned}</span>
          <span className="font-body text-xs text-muted-foreground">COINS</span>
        </motion.div>

        {/* XP Bar */}
        {xpGained && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-accent" />
                <span className="font-display text-xs text-accent">LVL {xpData.level}</span>
              </div>
              <span className="font-display text-xs text-accent">+{xpGained.xp} XP</span>
            </div>
            <div className="w-full h-2.5 bg-muted/40 rounded-full overflow-hidden border border-accent/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, xpProgress * 100)}%` }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                style={{ boxShadow: "0 0 8px hsl(var(--accent) / 0.5)" }}
              />
            </div>
            <p className="font-body text-[9px] text-muted-foreground mt-0.5 text-right">
              {xpData.currentXP} / {xpNeeded} XP
            </p>

            {/* Level up notification */}
            {xpGained.levelsGained > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="mt-2 bg-accent/15 border border-accent/40 rounded-lg p-2"
              >
                <p className="font-display text-sm text-accent animate-pulse">
                  🎉 LEVEL UP! → LVL {xpData.level}
                </p>
                {xpGained.newRewards.map((r) => (
                  <p key={r.level} className="font-body text-xs text-foreground mt-1">
                    {r.icon} {r.label} unlocked!
                  </p>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-card/60 rounded-lg neon-border p-3 text-center"
            >
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className={`font-display text-xl ${s.color}`}>{s.value}</p>
              <p className="font-body text-[9px] text-muted-foreground tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 px-5 py-3 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan hover:scale-105 transition-transform"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => navigate("/upgrades")}
            className="flex-1 px-5 py-3 border border-[hsl(var(--neon-yellow))]/40 text-[hsl(var(--neon-yellow))] font-display text-sm rounded-lg hover:bg-[hsl(var(--neon-yellow))]/10 transition-colors"
          >
            UPGRADES
          </button>
        </div>
        <button
          onClick={() => navigate("/leaderboard")}
          className="w-full mt-2 px-5 py-2 border border-primary/30 text-primary font-display text-xs rounded-lg hover:bg-primary/10 transition-colors"
        >
          LEADERBOARD
        </button>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal;
