import { motion } from "framer-motion";
import { Gift, Coins, Check } from "lucide-react";
import { getDailyBonusInfo } from "@/lib/upgrades";

const DAILY_BONUS_AMOUNTS = [10, 15, 20, 30, 40, 50, 75];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DailyRewardsCalendar = () => {
  const info = getDailyBonusInfo();
  const currentStreak = info.streak;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="relative z-10 w-full max-w-sm mt-8"
    >
      <div className="bg-card/60 backdrop-blur-md rounded-xl neon-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-xs text-[hsl(var(--neon-yellow))] tracking-widest flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5" /> DAILY REWARDS
          </h3>
          <span className="font-body text-[10px] text-muted-foreground">
            Streak: {currentStreak + 1}/7
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {DAILY_BONUS_AMOUNTS.map((amount, i) => {
            const isPast = i < currentStreak;
            const isCurrent = i === currentStreak;
            const isFuture = i > currentStreak;
            const claimed = isPast || (isCurrent && !info.canClaim);

            return (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className={`relative flex flex-col items-center rounded-lg p-1.5 border transition-all ${
                  claimed
                    ? "border-[hsl(var(--neon-green))]/40 bg-[hsl(var(--neon-green))]/10"
                    : isCurrent && info.canClaim
                    ? "border-[hsl(var(--neon-yellow))]/60 bg-[hsl(var(--neon-yellow))]/10 animate-pulse"
                    : "border-border/20 bg-card/30"
                }`}
              >
                <span className="font-body text-[8px] text-muted-foreground">{DAY_LABELS[i]}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center my-0.5 ${
                  claimed
                    ? "bg-[hsl(var(--neon-green))]/30"
                    : isCurrent && info.canClaim
                    ? "bg-[hsl(var(--neon-yellow))]/30"
                    : "bg-muted/30"
                }`}>
                  {claimed ? (
                    <Check className="w-3 h-3 text-[hsl(var(--neon-green))]" />
                  ) : (
                    <Coins className={`w-3 h-3 ${isCurrent && info.canClaim ? "text-[hsl(var(--neon-yellow))]" : "text-muted-foreground/50"}`} />
                  )}
                </div>
                <span className={`font-display text-[9px] ${
                  claimed
                    ? "text-[hsl(var(--neon-green))]"
                    : isCurrent && info.canClaim
                    ? "text-[hsl(var(--neon-yellow))]"
                    : "text-muted-foreground/50"
                }`}>
                  {amount}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentStreak + (info.canClaim ? 0 : 1)) / 7) * 100}%` }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="h-full bg-gradient-to-r from-[hsl(var(--neon-yellow))] to-[hsl(var(--neon-green))] rounded-full"
          />
        </div>
        <p className="font-body text-[9px] text-muted-foreground/60 text-center mt-1.5">
          {info.canClaim ? "Login bonus available! 🎁" : "Come back tomorrow for more rewards"}
        </p>
      </div>
    </motion.div>
  );
};

export default DailyRewardsCalendar;
