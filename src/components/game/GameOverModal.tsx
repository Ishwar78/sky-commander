import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { saveScore } from "@/lib/auth";
import { addCoins } from "@/lib/upgrades";
import { Flame, Zap, Trophy, Swords, Coins } from "lucide-react";

interface GameOverModalProps {
  score: number;
  maxCombo: number;
  maxMultiplier: number;
  wave: number;
  onRestart: () => void;
}

const GameOverModal = ({ score, maxCombo, maxMultiplier, wave, onRestart }: GameOverModalProps) => {
  const navigate = useNavigate();
  const coinsEarned = Math.max(1, Math.floor(score / 10));

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md rounded-lg z-40"
    >
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
          className="flex items-center justify-center gap-2 mb-4 bg-[hsl(var(--neon-yellow))]/10 rounded-lg py-2 border border-[hsl(var(--neon-yellow))]/30"
        >
          <Coins className="w-5 h-5 text-[hsl(var(--neon-yellow))]" />
          <span className="font-display text-lg text-[hsl(var(--neon-yellow))]">+{coinsEarned}</span>
          <span className="font-body text-xs text-muted-foreground">COINS</span>
        </motion.div>

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
