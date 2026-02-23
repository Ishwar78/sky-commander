import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface GameOverModalProps {
  score: number;
  onRestart: () => void;
}

const GameOverModal = ({ score, onRestart }: GameOverModalProps) => {
  const navigate = useNavigate();

  // Save to local leaderboard
  const saveScore = () => {
    const scores = JSON.parse(localStorage.getItem("skyfire-scores") || "[]");
    scores.push({ score, date: new Date().toISOString(), player: "Player" });
    scores.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    localStorage.setItem("skyfire-scores", JSON.stringify(scores.slice(0, 50)));
  };

  // Save on mount
  if (score > 0) saveScore();

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
