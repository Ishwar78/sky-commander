import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Trophy, Zap, User, LogOut, ShieldCheck, Palette } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { getCurrentUser, logout, isAdmin, getScores } from "@/lib/auth";

const Index = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const topScores = getScores().slice(0, 5);

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background arcade-grid overflow-hidden">
      {/* Auth bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <span className="font-display text-xs text-primary tracking-wider">SKY FIRE</span>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="font-body text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> {user.username}
              </span>
              {isAdmin() && (
                <button onClick={() => navigate("/admin")} className="text-accent hover:text-accent/80 transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="font-body text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Login / Register
            </button>
          )}
        </div>
      </div>

      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-12">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-2xl"
        >
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Zap className="w-12 h-12 text-neon-cyan mx-auto mb-4 drop-shadow-[0_0_15px_hsl(180,100%,50%)]" />
          </motion.div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary text-glow-cyan mb-4 tracking-wider">SKY FIRE</h1>
          <p className="font-body text-lg md:text-xl text-muted-foreground mb-10 max-w-md mx-auto">
            Dodge enemy fire. Destroy invaders. Climb the leaderboard.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/play")}
            className="inline-flex items-center gap-3 px-10 py-4 bg-primary text-primary-foreground font-display text-xl rounded-xl box-glow-cyan hover:shadow-[0_0_40px_hsl(var(--neon-cyan)/0.5)] transition-shadow"
          >
            <Gamepad2 className="w-6 h-6" />
            PLAY NOW
          </motion.button>

          <div className="flex gap-6 mt-8 justify-center flex-wrap">
            <button onClick={() => navigate("/skins")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
              <Palette className="w-4 h-4" /> Ship Skins
            </button>
            <button onClick={() => navigate("/leaderboard")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
              <Trophy className="w-4 h-4" /> Leaderboard
            </button>
          </div>
        </motion.div>

        {topScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="relative z-10 mt-16 w-full max-w-sm"
          >
            <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5">
              <h3 className="font-display text-xs text-primary text-glow-cyan mb-3 tracking-widest">TOP SCORES</h3>
              {topScores.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                  <span className="font-body text-muted-foreground text-sm">
                    <span className="text-neon-yellow font-bold mr-2">#{i + 1}</span>
                    {s.username}
                  </span>
                  <span className="font-display text-sm text-primary">{s.score}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default Index;
