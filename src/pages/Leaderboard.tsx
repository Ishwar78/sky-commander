import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

const Leaderboard = () => {
  const scores = JSON.parse(localStorage.getItem("skyfire-scores") || "[]").slice(0, 10);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            LEADERBOARD
          </h1>
          <Link to="/play" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <Gamepad2 className="w-4 h-4" />
            Play
          </Link>
        </div>

        {scores.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body text-lg">No scores yet!</p>
            <Link
              to="/play"
              className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan"
            >
              <Gamepad2 className="w-4 h-4" />
              PLAY NOW
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {scores.map((s: { score: number; player: string; date: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg neon-border bg-card/40 backdrop-blur-sm ${
                  i < 3 ? "box-glow-cyan" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg w-8 text-center">
                    {i < 3 ? medals[i] : <span className="text-muted-foreground text-sm">#{i + 1}</span>}
                  </span>
                  <div>
                    <p className="font-body text-foreground">{s.player}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      {new Date(s.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="font-display text-xl text-primary text-glow-cyan">{s.score}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
