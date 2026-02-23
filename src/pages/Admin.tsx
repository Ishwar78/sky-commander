import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Gamepad2, Trophy, BarChart3, Trash2, Crown, TrendingUp, Clock, Medal } from "lucide-react";
import { motion } from "framer-motion";
import { isAdmin, getAnalytics, getUsers, getScores, type User, type ScoreEntry } from "@/lib/auth";

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "users" | "scores" | "winners">("overview");

  useEffect(() => {
    if (!isAdmin()) navigate("/login");
  }, [navigate]);

  const analytics = getAnalytics();
  const users = getUsers().filter((u) => u.role !== "admin");
  const scores = getScores();

  // Compute winner stats per user
  const userStats = users.map((u) => {
    const userScores = scores.filter((s) => s.userId === u.id);
    const bestScore = userScores.length > 0 ? Math.max(...userScores.map((s) => s.score)) : 0;
    const totalGames = userScores.length;
    const avgScore = totalGames > 0 ? Math.round(userScores.reduce((a, s) => a + s.score, 0) / totalGames) : 0;
    const lastPlayed = userScores.length > 0 ? userScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;
    return { ...u, bestScore, totalGames, avgScore, lastPlayed };
  }).sort((a, b) => b.bestScore - a.bestScore);

  const winner = userStats.length > 0 ? userStats[0] : null;
  const topThree = userStats.slice(0, 3);
  const activeToday = scores.filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const deleteUser = (id: string) => {
    const all = getUsers().filter((u) => u.id !== id);
    localStorage.setItem("skyfire-users", JSON.stringify(all));
    window.location.reload();
  };

  const clearScores = () => {
    localStorage.setItem("skyfire-scores", JSON.stringify([]));
    window.location.reload();
  };

  const maxDailyCount = Math.max(1, ...analytics.dailyGames.map((d) => d.count));
  const medalColors = ["text-[hsl(50,100%,55%)]", "text-muted-foreground", "text-[hsl(25,70%,50%)]"];

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">ADMIN PANEL</h1>
          <div className="w-16" />
        </div>

        {/* Winner Banner */}
        {winner && winner.bestScore > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-6 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
            <Crown className="w-8 h-8 text-[hsl(50,100%,55%)] mx-auto mb-2" />
            <p className="font-body text-xs text-muted-foreground tracking-widest mb-1">CURRENT CHAMPION</p>
            <h2 className="font-display text-2xl text-primary text-glow-cyan">{winner.username}</h2>
            <p className="font-display text-lg text-foreground mt-1">{winner.bestScore} pts</p>
            <p className="font-body text-xs text-muted-foreground mt-1">{winner.totalGames} games played • Avg {winner.avgScore}</p>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "text-primary" },
            { label: "Total Games", value: analytics.totalGames, icon: Gamepad2, color: "text-secondary" },
            { label: "Avg Score", value: analytics.avgScore, icon: BarChart3, color: "text-accent" },
            { label: "Top Score", value: analytics.topScore, icon: Trophy, color: "text-destructive" },
            { label: "Today", value: activeToday, icon: Clock, color: "text-primary" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 text-center"
            >
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="font-display text-2xl text-foreground">{s.value}</p>
              <p className="font-body text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Daily chart */}
        <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 mb-6">
          <h3 className="font-display text-xs text-primary tracking-widest mb-3">GAMES (LAST 7 DAYS)</h3>
          <div className="flex items-end gap-2 h-24">
            {analytics.dailyGames.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="font-body text-xs text-muted-foreground">{d.count}</span>
                <div
                  className="w-full bg-primary/80 rounded-t"
                  style={{ height: `${(d.count / maxDailyCount) * 64}px`, minHeight: d.count > 0 ? "4px" : "0px" }}
                />
                <span className="font-body text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["overview", "winners", "users", "scores"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-display text-xs transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-card/40 text-muted-foreground hover:text-foreground neon-border"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
            <h3 className="font-display text-xs text-primary tracking-widest mb-3">RECENT GAMES</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {analytics.recentScores.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                  <div>
                    <span className="font-body text-sm text-foreground">{s.username}</span>
                    <span className="font-body text-xs text-muted-foreground ml-2">{new Date(s.date).toLocaleString()}</span>
                  </div>
                  <span className="font-display text-sm text-primary">{s.score}</span>
                </div>
              ))}
              {analytics.recentScores.length === 0 && <p className="text-muted-foreground text-sm font-body">No games yet</p>}
            </div>
          </div>
        )}

        {tab === "winners" && (
          <div className="space-y-4">
            {/* Top 3 podium */}
            {topThree.length > 0 && (
              <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5">
                <h3 className="font-display text-xs text-primary tracking-widest mb-4">🏆 TOP PLAYERS</h3>
                <div className="space-y-3">
                  {topThree.map((u, i) => (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? "bg-primary/10 neon-border" : "bg-muted/20"}`}
                    >
                      <Medal className={`w-6 h-6 ${medalColors[i]}`} />
                      <div className="flex-1">
                        <p className="font-display text-sm text-foreground">{u.username}</p>
                        <p className="font-body text-xs text-muted-foreground">{u.totalGames} games • Avg {u.avgScore} • Skin: {u.selectedSkin}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg text-primary">{u.bestScore}</p>
                        <p className="font-body text-[10px] text-muted-foreground">BEST</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* All players ranked */}
            <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
              <h3 className="font-display text-xs text-primary tracking-widest mb-3">ALL PLAYERS RANKED ({userStats.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userStats.map((u, i) => (
                  <div key={u.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs text-muted-foreground w-6">#{i + 1}</span>
                      <div>
                        <span className="font-body text-sm text-foreground">{u.username}</span>
                        <span className="font-body text-xs text-muted-foreground ml-2">{u.totalGames} games</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-sm text-primary">{u.bestScore}</span>
                      {u.lastPlayed && (
                        <p className="font-body text-[10px] text-muted-foreground">Last: {new Date(u.lastPlayed).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
                {userStats.length === 0 && <p className="text-muted-foreground text-sm font-body">No players yet</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
            <h3 className="font-display text-xs text-primary tracking-widest mb-3">REGISTERED USERS ({users.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((u) => {
                const us = userStats.find((s) => s.id === u.id);
                return (
                  <div key={u.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                    <div>
                      <span className="font-body text-sm text-foreground">{u.username}</span>
                      <span className="font-body text-xs text-muted-foreground ml-2">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                      <span className="font-body text-xs text-accent ml-2">Skin: {u.selectedSkin}</span>
                      {us && <span className="font-body text-xs text-primary ml-2">Best: {us.bestScore}</span>}
                    </div>
                    <button onClick={() => deleteUser(u.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {users.length === 0 && <p className="text-muted-foreground text-sm font-body">No users yet</p>}
            </div>
          </div>
        )}

        {tab === "scores" && (
          <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display text-xs text-primary tracking-widest">ALL SCORES ({scores.length})</h3>
              {scores.length > 0 && (
                <button onClick={clearScores} className="text-destructive hover:text-destructive/80 text-xs font-body flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scores.slice(0, 50).map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                  <div>
                    <span className="font-body text-sm text-muted-foreground mr-2">#{i + 1}</span>
                    <span className="font-body text-sm text-foreground">{s.username}</span>
                    <span className="font-body text-xs text-muted-foreground ml-2">{new Date(s.date).toLocaleDateString()}</span>
                  </div>
                  <span className="font-display text-sm text-primary">{s.score}</span>
                </div>
              ))}
              {scores.length === 0 && <p className="text-muted-foreground text-sm font-body">No scores yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
