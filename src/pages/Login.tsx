import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Zap } from "lucide-react";
import { login, register } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = isRegister ? register(username, password) : login(username, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-background arcade-grid flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Zap className="w-10 h-10 text-primary mx-auto mb-3 drop-shadow-[0_0_15px_hsl(var(--neon-cyan)/0.8)]" />
          <h1 className="font-display text-3xl text-primary text-glow-cyan">SKY FIRE</h1>
          <p className="text-muted-foreground font-body text-sm mt-2">
            {isRegister ? "Create your pilot account" : "Welcome back, pilot"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-6 space-y-4">
          <div>
            <label className="font-body text-xs text-muted-foreground uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-input rounded-lg border border-border text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="font-body text-xs text-muted-foreground uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-input rounded-lg border border-border text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter password"
              required
            />
          </div>

          {error && <p className="text-destructive text-sm font-body">{error}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan hover:scale-[1.02] transition-transform"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isRegister ? "REGISTER" : "LOGIN"}
          </button>

          <p className="text-center text-muted-foreground text-sm font-body">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-primary hover:underline">
              {isRegister ? "Login" : "Register"}
            </button>
          </p>
        </form>

        <div className="text-center mt-4">
          <Link to="/" className="text-muted-foreground hover:text-primary text-sm font-body transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
