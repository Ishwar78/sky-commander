import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { saveScore } from "@/lib/auth";

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

const GameOverModal = ({ score, onRestart }: GameOverModalProps) => {
  const navigate = useNavigate();

  // Save via auth system
  if (score > 0) saveScore(score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md rounded-lg"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-center"
      >
        <h2 className="font-display text-4xl text-destructive text-glow-pink mb-2">GAME OVER</h2>
        <p className="text-muted-foreground font-body text-lg mb-1">Final Score</p>
        <p className="font-display text-5xl text-primary text-glow-cyan mb-8">{score}</p>
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan hover:scale-105 transition-transform"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => navigate("/leaderboard")}
            className="px-6 py-3 border border-primary/40 text-primary font-display text-sm rounded-lg hover:bg-primary/10 transition-colors"
          >
            LEADERBOARD
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverModal;
