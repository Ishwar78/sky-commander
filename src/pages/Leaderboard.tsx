import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { getScores } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filter = "all" | "weekly" | "monthly";

const Leaderboard = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const allScores = getScores();
  const medals = ["🥇", "🥈", "🥉"];

  const now = Date.now();
  const filteredScores = allScores.filter((s) => {
    const t = new Date(s.date).getTime();
    if (filter === "weekly") return now - t < 7 * 86400000;
    if (filter === "monthly") return now - t < 30 * 86400000;
    return true;
  }).slice(0, 20);

  // Rank players by best score
  const playerBest = new Map<string, { username: string; score: number; date: string; games: number }>();
  filteredScores.forEach((s) => {
    const existing = playerBest.get(s.username);
    if (!existing || s.score > existing.score) {
      playerBest.set(s.username, { username: s.username, score: s.score, date: s.date, games: (existing?.games || 0) + 1 });
    } else {
      existing.games++;
    }
  });
  const rankings = Array.from(playerBest.values()).sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-lg mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider flex items-center gap-2">
            <Trophy className="w-5 h-5" /> LEADERBOARD
          </h1>
          <Link to="/play" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <Gamepad2 className="w-4 h-4" /> Play
          </Link>
        </div>

        <Tabs defaultValue="all" onValueChange={(v) => setFilter(v as Filter)} className="w-full mb-4">
          <TabsList className="w-full bg-card/60 neon-border">
            <TabsTrigger value="weekly" className="flex-1 font-display text-xs data-[state=active]:text-primary">WEEKLY</TabsTrigger>
            <TabsTrigger value="monthly" className="flex-1 font-display text-xs data-[state=active]:text-primary">MONTHLY</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 font-display text-xs data-[state=active]:text-primary">ALL TIME</TabsTrigger>
          </TabsList>
        </Tabs>

        {rankings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-body text-lg">No scores yet!</p>
            <Link to="/play" className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan">
              <Gamepad2 className="w-4 h-4" /> PLAY NOW
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {rankings.map((s, i) => (
              <motion.div
                key={s.username}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg neon-border bg-card/40 backdrop-blur-sm ${i < 3 ? "box-glow-cyan" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg w-8 text-center">
                    {i < 3 ? medals[i] : <span className="text-muted-foreground text-sm">#{i + 1}</span>}
                  </span>
                  <div>
                    <p className="font-body text-foreground">{s.username}</p>
                    <p className="font-body text-xs text-muted-foreground">{s.games} game{s.games > 1 ? "s" : ""}</p>
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
