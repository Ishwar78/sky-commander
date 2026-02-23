import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { saveScore } from "@/lib/auth";
import { Flame, Zap, Trophy, Swords } from "lucide-react";

interface GameOverModalProps {
  score: number;
  maxCombo: number;
  maxMultiplier: number;
  wave: number;
  onRestart: () => void;
}

const GameOverModal = ({ score, maxCombo, maxMultiplier, wave, onRestart }: GameOverModalProps) => {
  const navigate = useNavigate();

  if (score > 0) saveScore(score);

  const stats = [
    { icon: Trophy, label: "FINAL SCORE", value: `${score}`, color: "text-primary" },
    { icon: Swords, label: "WAVE", value: `${wave}`, color: "text-secondary" },
    { icon: Flame, label: "MAX COMBO", value: `${maxCombo}x`, color: "text-[hsl(50,100%,55%)]" },
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
        <h2 className="font-display text-4xl text-destructive text-glow-pink mb-6">GAME OVER</h2>

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
            onClick={() => navigate("/leaderboard")}
            className="flex-1 px-5 py-3 border border-primary/40 text-primary font-display text-sm rounded-lg hover:bg-primary/10 transition-colors"
          >
            LEADERBOARD
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal;
