import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, User } from "lucide-react";
import { login, isAdmin } from "@/lib/auth";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in as admin
  if (isAdmin()) {
    navigate("/admin/sky/dashboard");
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = login(username, password);
    if (result.success) {
      if (isAdmin()) {
        navigate("/admin/sky/dashboard");
      } else {
        setError("Access denied. Admin only.");
      }
    } else {
      setError(result.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background arcade-grid flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card/60 backdrop-blur-md rounded-2xl neon-border p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl text-primary text-glow-cyan tracking-wider">ADMIN</h1>
            <p className="font-body text-xs text-muted-foreground mt-1">Sky Fire Control Panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/30 rounded-lg font-body text-sm text-foreground focus:border-primary/50 focus:outline-none transition-colors"
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            <div>
              <label className="font-body text-xs text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/30 rounded-lg font-body text-sm text-foreground focus:border-primary/50 focus:outline-none transition-colors"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-xs font-body bg-destructive/10 rounded-lg p-2 text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {loading ? "VERIFYING..." : "ACCESS PANEL"}
            </button>
          </form>

          <button
            onClick={() => navigate("/")}
            className="w-full mt-4 text-center font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Game
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
