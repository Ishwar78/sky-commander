import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, Swords, Flame, Shield } from "lucide-react";

const STEPS = [
  {
    title: "CONTROLS",
    icon: "🎮",
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">W</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">A</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">S</kbd>
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">D</kbd>
          </div>
          <span className="text-muted-foreground text-xs font-body">or Arrow Keys to move</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-4 py-1 bg-muted rounded text-xs font-display">SPACE</kbd>
          <span className="text-muted-foreground text-xs font-body">Hold to fire</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">P</kbd>
          <span className="text-muted-foreground text-xs font-body">Pause & switch weapons</span>
        </div>
        <p className="text-muted-foreground/60 text-[10px] font-body mt-2">📱 Mobile: Use virtual joystick & fire button</p>
      </div>
    ),
  },
  {
    title: "WEAPONS",
    icon: "🔫",
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">1</kbd>
          <span className="text-xs font-display text-[hsl(160,100%,50%)]">LASER</span>
          <span className="text-muted-foreground text-[10px] font-body">— Fast, precise shots</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">2</kbd>
          <span className="text-xs font-display text-[hsl(300,100%,70%)]">SPREAD</span>
          <span className="text-muted-foreground text-[10px] font-body">— 3-way shot, area control</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-display">3</kbd>
          <span className="text-xs font-display text-[hsl(38,100%,50%)]">HOMING</span>
          <span className="text-muted-foreground text-[10px] font-body">— Auto-targets enemies</span>
        </div>
        <p className="text-muted-foreground/60 text-[10px] font-body mt-1">Unlock weapons in the Upgrades shop!</p>
      </div>
    ),
  },
  {
    title: "ENEMIES",
    icon: "👾",
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "#ff3366" }} />
          <span className="text-xs font-body text-foreground">Normal</span>
          <span className="text-muted-foreground text-[10px] font-body">— Standard fighters</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "#ffaa00" }} />
          <span className="text-xs font-body text-foreground">Fast</span>
          <span className="text-muted-foreground text-[10px] font-body">— Quick but fragile</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "#6644ff" }} />
          <span className="text-xs font-body text-foreground">Tank</span>
          <span className="text-muted-foreground text-[10px] font-body">— Tough, lots of HP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "#00aaff" }} />
          <span className="text-xs font-body text-foreground">Shield</span>
          <span className="text-muted-foreground text-[10px] font-body">— Blocks frontal attacks!</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ background: "#88ffbb" }} />
          <span className="text-xs font-body text-foreground">Stealth</span>
          <span className="text-muted-foreground text-[10px] font-body">— Fades in & out</span>
        </div>
      </div>
    ),
  },
  {
    title: "COMBOS & POWER-UPS",
    icon: "🔥",
    content: (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-display text-[hsl(var(--neon-yellow))]">COMBO SYSTEM</p>
          <p className="text-muted-foreground text-[10px] font-body">Chain kills to build combos → higher score multiplier!</p>
          <p className="text-muted-foreground text-[10px] font-body">Taking damage resets your combo.</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <span>🛡️</span><span className="text-[10px] font-body text-foreground">Shield</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚡</span><span className="text-[10px] font-body text-foreground">Rapid Fire</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔥</span><span className="text-[10px] font-body text-foreground">Multi Shot</span>
          </div>
          <div className="flex items-center gap-1">
            <span>💚</span><span className="text-[10px] font-body text-foreground">Health</span>
          </div>
        </div>
        <p className="text-muted-foreground/60 text-[10px] font-body">Boss every 10 waves — good luck!</p>
      </div>
    ),
  },
];

const TUTORIAL_KEY = "skyfire_tutorial_seen";

export const hasTutorialBeenSeen = () => localStorage.getItem(TUTORIAL_KEY) === "true";
export const markTutorialSeen = () => localStorage.setItem(TUTORIAL_KEY, "true");

interface TutorialProps {
  onComplete: () => void;
}

const Tutorial = ({ onComplete }: TutorialProps) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      markTutorialSeen();
      onComplete();
    }
  };

  const handleSkip = () => {
    markTutorialSeen();
    onComplete();
  };

  const current = STEPS[step];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md rounded-lg z-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-[320px] px-4"
        >
          <div className="text-center mb-4">
            <span className="text-3xl">{current.icon}</span>
            <h2 className="font-display text-xl text-primary text-glow-cyan mt-2 tracking-wider">{current.title}</h2>
          </div>

          <div className="bg-card/60 backdrop-blur-sm rounded-xl border border-border/30 p-4 mb-6">
            {current.content}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? "bg-primary w-6" : i < step ? "bg-primary/50" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleSkip}
              className="px-4 py-2 font-body text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan hover:scale-105 transition-transform"
            >
              {step < STEPS.length - 1 ? "NEXT" : "LET'S GO!"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Tutorial;
