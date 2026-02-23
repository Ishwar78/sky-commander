import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Gamepad2, Trophy, BarChart3, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { isAdmin, getAnalytics, getUsers, getScores, type User, type ScoreEntry } from "@/lib/auth";

const Admin = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "users" | "scores">("overview");

  useEffect(() => {
    if (!isAdmin()) navigate("/login");
  }, [navigate]);

  const analytics = getAnalytics();
  const users = getUsers().filter((u) => u.role !== "admin");
  const scores = getScores();

  const deleteUser = (id: string) => {
    const all = getUsers().filter((u) => u.id !== id);
    localStorage.setItem("skyfire-users", JSON.stringify(all));
    window.location.reload();
  };

  const clearScores = () => {
    localStorage.setItem("skyfire-scores", JSON.stringify([]));
    window.location.reload();
  };

  const stats = [
    { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Games", value: analytics.totalGames, icon: Gamepad2, color: "text-secondary" },
    { label: "Avg Score", value: analytics.avgScore, icon: BarChart3, color: "text-accent" },
    { label: "Top Score", value: analytics.topScore, icon: Trophy, color: "text-destructive" },
  ];

  const maxDailyCount = Math.max(1, ...analytics.dailyGames.map((d) => d.count));

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-3xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">ADMIN PANEL</h1>
          <div className="w-16" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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
        <div className="flex gap-2 mb-4">
          {(["overview", "users", "scores"] as const).map((t) => (
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
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

        {tab === "users" && (
          <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
            <h3 className="font-display text-xs text-primary tracking-widest mb-3">REGISTERED USERS ({users.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                  <div>
                    <span className="font-body text-sm text-foreground">{u.username}</span>
                    <span className="font-body text-xs text-muted-foreground ml-2">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                    <span className="font-body text-xs text-accent ml-2">Skin: {u.selectedSkin}</span>
                  </div>
                  <button onClick={() => deleteUser(u.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
