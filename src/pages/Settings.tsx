import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Volume2, VolumeX, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { getSettings, saveSettings, resetSettings, getKeyLabel, type GameSettings } from "@/lib/settings";
import { soundEngine } from "@/lib/sound";
import { getLifetimeStats, resetLifetimeStats } from "@/lib/stats";
import { resetXPData, resetPrestigeData } from "@/lib/xp";

const DIFFICULTY_OPTIONS: { value: GameSettings["difficulty"]; label: string; desc: string }[] = [
  { value: "easy", label: "EASY", desc: "Slower enemies, less damage" },
  { value: "normal", label: "NORMAL", desc: "Balanced experience" },
  { value: "hard", label: "HARD", desc: "Faster enemies, more damage" },
  { value: "insane", label: "INSANE", desc: "Maximum chaos" },
];

const KEY_ACTIONS = [
  { key: "up" as const, label: "Move Up" },
  { key: "down" as const, label: "Move Down" },
  { key: "left" as const, label: "Move Left" },
  { key: "right" as const, label: "Move Right" },
  { key: "shoot" as const, label: "Shoot" },
  { key: "pause" as const, label: "Pause" },
];

const Settings = () => {
  const [settings, setSettings] = useState<GameSettings>(getSettings);
  const [bindingKey, setBindingKey] = useState<keyof GameSettings["keyBindings"] | null>(null);

  useEffect(() => {
    saveSettings(settings);
    soundEngine.setVolume(settings.volume / 100);
  }, [settings]);

  useEffect(() => {
    if (!bindingKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      setSettings((prev) => ({
        ...prev,
        keyBindings: { ...prev.keyBindings, [bindingKey]: e.key },
      }));
      setBindingKey(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bindingKey]);

  const handleReset = () => {
    const s = resetSettings();
    setSettings(s);
  };

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">SETTINGS</h1>
          <button onClick={handleReset} className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors text-xs font-body">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Volume */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-sm text-primary tracking-wider">VOLUME</h2>
            {settings.volume === 0 ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
          </div>
          <Slider
            value={[settings.volume]}
            onValueChange={([v]) => setSettings((p) => ({ ...p, volume: v }))}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-muted-foreground text-xs mt-2 font-body text-right">{settings.volume}%</p>
        </motion.div>

        {/* Difficulty */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mb-4">
          <h2 className="font-display text-sm text-primary tracking-wider mb-3">DIFFICULTY</h2>
          <div className="grid grid-cols-2 gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setSettings((p) => ({ ...p, difficulty: d.value }))}
                className={`rounded-lg p-3 text-left transition-all border ${
                  settings.difficulty === d.value
                    ? "border-primary bg-primary/10 box-glow-cyan"
                    : "border-border/30 bg-muted/20 hover:border-primary/40"
                }`}
              >
                <span className="font-display text-xs block">{d.label}</span>
                <span className="font-body text-[10px] text-muted-foreground">{d.desc}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Key Bindings */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5">
          <h2 className="font-display text-sm text-primary tracking-wider mb-3">KEY BINDINGS</h2>
          <p className="text-muted-foreground text-xs font-body mb-3">Click a key to rebind, then press any key</p>
          <div className="space-y-2">
            {KEY_ACTIONS.map((action) => (
              <div key={action.key} className="flex items-center justify-between">
                <span className="font-body text-sm text-muted-foreground">{action.label}</span>
                <button
                  onClick={() => setBindingKey(action.key)}
                  className={`min-w-[60px] px-3 py-1.5 rounded font-display text-xs text-center transition-all ${
                    bindingKey === action.key
                      ? "bg-primary text-primary-foreground animate-pulse"
                      : "bg-muted/40 text-foreground hover:bg-muted/60 border border-border/30"
                  }`}
                >
                  {bindingKey === action.key ? "..." : getKeyLabel(settings.keyBindings[action.key])}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reset Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-5 mt-4">
          <h2 className="font-display text-sm text-primary tracking-wider mb-3">DATA</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-body text-sm text-foreground">Reset Lifetime Stats</p>
              <p className="font-body text-[10px] text-muted-foreground">Clears all kills, combos, and game history</p>
            </div>
            <button
              onClick={() => {
                if (confirm("Reset all lifetime stats, XP & prestige? This cannot be undone.")) {
                  resetLifetimeStats();
                  resetXPData();
                  resetPrestigeData();
                  alert("Stats, XP & prestige reset!");
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30 transition-all font-display text-xs"
            >
              <Trash2 className="w-3 h-3" /> RESET
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
