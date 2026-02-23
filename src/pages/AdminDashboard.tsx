import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, Gamepad2, Trophy, BarChart3, Trash2, Crown, Clock, Medal,
  ShieldBan, ShieldCheck, Coins, CreditCard, Ban, CheckCircle, Search, Eye
} from "lucide-react";
import {
  isAdmin, getAnalytics, getUsers, getScores, getTransactions,
  banUser, unbanUser, type User, type CoinTransaction
} from "@/lib/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"overview" | "users" | "payments" | "scores" | "winners">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [userDetail, setUserDetail] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!isAdmin()) navigate("/admin/sky/login");
  }, [navigate]);

  const analytics = getAnalytics();
  const users = getUsers().filter((u) => u.role !== "admin");
  const scores = getScores();
  const transactions = getTransactions();

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userStats = users.map((u) => {
    const userScores = scores.filter((s) => s.userId === u.id);
    const userTx = transactions.filter((t) => t.userId === u.id);
    const bestScore = userScores.length > 0 ? Math.max(...userScores.map((s) => s.score)) : 0;
    const totalGames = userScores.length;
    const avgScore = totalGames > 0 ? Math.round(userScores.reduce((a, s) => a + s.score, 0) / totalGames) : 0;
    const lastPlayed = userScores.length > 0 ? userScores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;
    const totalPurchases = userTx.filter((t) => t.type === "purchase").reduce((a, t) => a + t.amount, 0);
    const totalSpent = userTx.filter((t) => t.type === "purchase").length;
    return { ...u, bestScore, totalGames, avgScore, lastPlayed, totalPurchases, totalSpent };
  }).sort((a, b) => b.bestScore - a.bestScore);

  const topThree = userStats.slice(0, 3);
  const winner = topThree[0] || null;
  const activeToday = scores.filter((s) => new Date(s.date).toDateString() === new Date().toDateString()).length;
  const totalRevenue = transactions.filter((t) => t.type === "purchase").length;
  const totalCoinsSold = transactions.filter((t) => t.type === "purchase").reduce((a, t) => a + t.amount, 0);
  const bannedCount = users.filter((u) => u.banned).length;

  const handleBan = () => {
    if (banModal) {
      banUser(banModal.userId, banReason || "Violated rules");
      setBanModal(null);
      setBanReason("");
      forceUpdate((n) => n + 1);
    }
  };

  const handleUnban = (userId: string) => {
    unbanUser(userId);
    forceUpdate((n) => n + 1);
  };

  const deleteUser = (id: string) => {
    const all = getUsers().filter((u) => u.id !== id);
    localStorage.setItem("skyfire-users", JSON.stringify(all));
    forceUpdate((n) => n + 1);
  };

  const clearScores = () => {
    localStorage.setItem("skyfire-scores", JSON.stringify([]));
    forceUpdate((n) => n + 1);
  };

  const maxDailyCount = Math.max(1, ...analytics.dailyGames.map((d) => d.count));
  const medalColors = ["text-[hsl(50,100%,55%)]", "text-muted-foreground", "text-[hsl(25,70%,50%)]"];

  const selectedUserDetail = userDetail ? userStats.find((u) => u.id === userDetail) : null;
  const selectedUserTx = userDetail ? transactions.filter((t) => t.userId === userDetail) : [];
  const selectedUserScores = userDetail ? scores.filter((s) => s.userId === userDetail).slice(0, 20) : [];

  const tabs = [
    { id: "overview" as const, label: "OVERVIEW", icon: BarChart3 },
    { id: "users" as const, label: "USERS", icon: Users },
    { id: "payments" as const, label: "PAYMENTS", icon: CreditCard },
    { id: "winners" as const, label: "WINNERS", icon: Trophy },
    { id: "scores" as const, label: "SCORES", icon: Gamepad2 },
  ];

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-5xl mx-auto pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">ADMIN DASHBOARD</h1>
          <span className="font-body text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 inline mr-1" />Admin
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Users", value: analytics.totalUsers, icon: Users, color: "text-primary" },
            { label: "Banned", value: bannedCount, icon: Ban, color: "text-destructive" },
            { label: "Games", value: analytics.totalGames, icon: Gamepad2, color: "text-secondary" },
            { label: "Top Score", value: analytics.topScore, icon: Trophy, color: "text-accent" },
            { label: "Purchases", value: totalRevenue, icon: CreditCard, color: "text-[hsl(var(--neon-yellow))]" },
            { label: "Coins Sold", value: totalCoinsSold, icon: Coins, color: "text-primary" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-3 text-center"
            >
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className="font-display text-xl text-foreground">{s.value}</p>
              <p className="font-body text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setUserDetail(null); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-display text-xs transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-card/40 text-muted-foreground hover:text-foreground neon-border"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Ban Modal */}
        {banModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl neon-border p-6 w-full max-w-sm mx-4"
            >
              <h3 className="font-display text-sm text-destructive mb-3">BAN USER: {banModal.username}</h3>
              <input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Ban reason..."
                className="w-full px-3 py-2 bg-muted/30 border border-border/30 rounded-lg font-body text-sm text-foreground mb-4 focus:outline-none focus:border-destructive/50"
              />
              <div className="flex gap-2">
                <button onClick={() => setBanModal(null)} className="flex-1 py-2 bg-muted/30 text-muted-foreground font-display text-xs rounded-lg hover:bg-muted/50 transition-colors">
                  CANCEL
                </button>
                <button onClick={handleBan} className="flex-1 py-2 bg-destructive text-destructive-foreground font-display text-xs rounded-lg hover:bg-destructive/80 transition-colors">
                  BAN
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* User Detail Modal */}
        {selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setUserDetail(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-xl neon-border p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-lg text-primary">{selectedUserDetail.username}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    Joined {new Date(selectedUserDetail.createdAt).toLocaleDateString()}
                    {selectedUserDetail.banned && <span className="ml-2 text-destructive">• BANNED</span>}
                  </p>
                </div>
                <button onClick={() => setUserDetail(null)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-muted/20 rounded-lg p-2 text-center">
                  <p className="font-display text-lg text-foreground">{selectedUserDetail.bestScore}</p>
                  <p className="font-body text-[10px] text-muted-foreground">Best Score</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-2 text-center">
                  <p className="font-display text-lg text-foreground">{selectedUserDetail.totalGames}</p>
                  <p className="font-body text-[10px] text-muted-foreground">Games</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-2 text-center">
                  <p className="font-display text-lg text-foreground">{selectedUserDetail.totalPurchases}</p>
                  <p className="font-body text-[10px] text-muted-foreground">Coins Bought</p>
                </div>
              </div>

              {selectedUserScores.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-display text-xs text-primary tracking-wider mb-2">RECENT SCORES</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedUserScores.map((s, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-border/10">
                        <span className="font-body text-muted-foreground">{new Date(s.date).toLocaleString()}</span>
                        <span className="font-display text-foreground">{s.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedUserTx.length > 0 && (
                <div>
                  <h4 className="font-display text-xs text-primary tracking-wider mb-2">TRANSACTIONS</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedUserTx.map((t, i) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-border/10">
                        <span className="font-body text-muted-foreground">
                          {t.type === "purchase" ? "🛒" : t.type === "earned" ? "🎮" : "💸"} {t.packageName || t.type}
                        </span>
                        <span className={`font-display ${t.type === "purchase" ? "text-[hsl(var(--neon-yellow))]" : "text-foreground"}`}>
                          +{t.amount} coins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Winner Banner */}
            {winner && winner.bestScore > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
                <Crown className="w-8 h-8 text-[hsl(50,100%,55%)] mx-auto mb-2" />
                <p className="font-body text-xs text-muted-foreground tracking-widest mb-1">CURRENT CHAMPION</p>
                <h2 className="font-display text-2xl text-primary text-glow-cyan">{winner.username}</h2>
                <p className="font-display text-lg text-foreground mt-1">{winner.bestScore} pts</p>
              </motion.div>
            )}

            {/* Daily Chart */}
            <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
              <h3 className="font-display text-xs text-primary tracking-widest mb-3">GAMES (LAST 7 DAYS)</h3>
              <div className="flex items-end gap-2 h-24">
                {analytics.dailyGames.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="font-body text-xs text-muted-foreground">{d.count}</span>
                    <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(d.count / maxDailyCount) * 64}px`, minHeight: d.count > 0 ? "4px" : "0px" }} />
                    <span className="font-body text-[10px] text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
              <h3 className="font-display text-xs text-primary tracking-widest mb-3">RECENT GAMES</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analytics.recentScores.slice(0, 10).map((s, i) => (
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
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-card/60 border border-border/30 rounded-lg font-body text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
              <h3 className="font-display text-xs text-primary tracking-widest mb-3">
                ALL USERS ({filteredUsers.length})
              </h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredUsers.map((u) => {
                  const us = userStats.find((s) => s.id === u.id);
                  return (
                    <motion.div
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center justify-between py-3 px-3 rounded-lg border transition-colors ${
                        u.banned ? "border-destructive/30 bg-destructive/5" : "border-border/20 hover:bg-muted/10"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-sm text-foreground truncate">{u.username}</span>
                          {u.banned && (
                            <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-[10px] font-display rounded">BANNED</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="font-body text-[10px] text-muted-foreground">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                          {us && <span className="font-body text-[10px] text-primary">Best: {us.bestScore}</span>}
                          {us && <span className="font-body text-[10px] text-muted-foreground">{us.totalGames} games</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button onClick={() => setUserDetail(u.id)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {u.banned ? (
                          <button onClick={() => handleUnban(u.id)} className="p-1.5 text-green-500 hover:text-green-400 transition-colors" title="Unban">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => setBanModal({ userId: u.id, username: u.username })} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Ban">
                            <ShieldBan className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredUsers.length === 0 && <p className="text-muted-foreground text-sm font-body text-center py-4">No users found</p>}
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <div className="space-y-4">
            {/* Payment stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 text-center">
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-[hsl(var(--neon-yellow))]" />
                <p className="font-display text-2xl text-foreground">{totalRevenue}</p>
                <p className="font-body text-[10px] text-muted-foreground">Total Purchases</p>
              </div>
              <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 text-center">
                <Coins className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="font-display text-2xl text-foreground">{totalCoinsSold}</p>
                <p className="font-body text-[10px] text-muted-foreground">Coins Sold</p>
              </div>
              <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 text-center">
                <Users className="w-5 h-5 mx-auto mb-1 text-accent" />
                <p className="font-display text-2xl text-foreground">
                  {new Set(transactions.filter((t) => t.type === "purchase").map((t) => t.userId)).size}
                </p>
                <p className="font-body text-[10px] text-muted-foreground">Paying Users</p>
              </div>
            </div>

            {/* Transaction list */}
            <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
              <h3 className="font-display text-xs text-primary tracking-widest mb-3">RECENT TRANSACTIONS</h3>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {transactions.slice(0, 50).map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-2 border-b border-border/20 last:border-0 rounded hover:bg-muted/5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.type === "purchase" ? "🛒" : t.type === "earned" ? "🎮" : "💸"}</span>
                      <div>
                        <p className="font-body text-sm text-foreground">{t.username}</p>
                        <p className="font-body text-[10px] text-muted-foreground">
                          {t.packageName || t.type} • {new Date(t.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-display text-sm ${t.type === "purchase" ? "text-[hsl(var(--neon-yellow))]" : "text-foreground"}`}>
                      +{t.amount} 🪙
                    </span>
                  </div>
                ))}
                {transactions.length === 0 && <p className="text-muted-foreground text-sm font-body text-center py-4">No transactions yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* WINNERS */}
        {tab === "winners" && (
          <div className="space-y-4">
            {topThree.length > 0 && (
              <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5">
                <h3 className="font-display text-xs text-primary tracking-widest mb-4">🏆 TOP PLAYERS</h3>
                <div className="space-y-3">
                  {topThree.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? "bg-primary/10 neon-border" : "bg-muted/20"}`}>
                      <Medal className={`w-6 h-6 ${medalColors[i]}`} />
                      <div className="flex-1">
                        <p className="font-display text-sm text-foreground">{u.username}</p>
                        <p className="font-body text-xs text-muted-foreground">{u.totalGames} games • Avg {u.avgScore}</p>
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

            <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
              <h3 className="font-display text-xs text-primary tracking-widest mb-3">ALL PLAYERS RANKED</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userStats.map((u, i) => (
                  <div key={u.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-xs text-muted-foreground w-6">#{i + 1}</span>
                      <span className="font-body text-sm text-foreground">{u.username}</span>
                    </div>
                    <span className="font-display text-sm text-primary">{u.bestScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCORES */}
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
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
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

export default AdminDashboard;
