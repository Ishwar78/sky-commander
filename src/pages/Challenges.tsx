import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Swords, Calendar, CalendarDays, Coins, Check } from "lucide-react";
import { motion } from "framer-motion";
import { getChallenges, getChallengeById, claimChallengeReward } from "@/lib/challenges";
import { addCoins, getUpgrades } from "@/lib/upgrades";
import { soundEngine } from "@/lib/sound";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Challenges = () => {
  const [state, setState] = useState(getChallenges());
  const [coins, setCoins] = useState(getUpgrades().coins);
  const [claimed, setClaimed] = useState<string | null>(null);

  const handleClaim = (id: string) => {
    const reward = claimChallengeReward(id);
    if (reward > 0) {
      addCoins(reward);
      soundEngine.claimReward();
      setCoins(getUpgrades().coins);
      setClaimed(id);
      setState(getChallenges());
      setTimeout(() => setClaimed(null), 1500);
    }
  };

  const renderChallenges = (section: "daily" | "weekly") => {
    const data = state[section];
    return data.challenges.map((cId, i) => {
      const def = getChallengeById(cId);
      if (!def) return null;
      const prog = data.progress[cId];
      const current = prog?.current || 0;
      const completed = prog?.completed || false;
      const isClaimed = !!prog?.claimedAt;
      const pct = Math.min(100, (current / def.target) * 100);

      return (
        <motion.div
          key={cId}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`bg-card/60 backdrop-blur-md rounded-xl neon-border p-4 ${completed && !isClaimed ? "ring-1 ring-[hsl(var(--neon-yellow))]/50" : ""}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{def.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm text-foreground">{def.name}</h3>
                <div className="flex items-center gap-1 text-[hsl(var(--neon-yellow))]">
                  <Coins className="w-3 h-3" />
                  <span className="font-display text-xs">{def.reward}</span>
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground mt-0.5">{def.description}</p>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${completed ? "bg-[hsl(var(--neon-green))]" : "bg-primary"}`}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-body text-[10px] text-muted-foreground">
                  {current}/{def.target}
                </span>
                {completed && !isClaimed && (
                  <button
                    onClick={() => handleClaim(cId)}
                    className="px-3 py-0.5 bg-[hsl(var(--neon-yellow))] text-background font-display text-[10px] rounded-md hover:scale-105 transition-transform"
                  >
                    {claimed === cId ? "✓ CLAIMED" : "CLAIM"}
                  </button>
                )}
                {isClaimed && (
                  <span className="flex items-center gap-1 text-[hsl(var(--neon-green))] font-body text-[10px]">
                    <Check className="w-3 h-3" /> Claimed
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider flex items-center gap-2">
            <Swords className="w-5 h-5" /> CHALLENGES
          </h1>
          <div className="flex items-center gap-1 text-[hsl(var(--neon-yellow))]">
            <Coins className="w-4 h-4" />
            <span className="font-display text-sm">{coins}</span>
          </div>
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="w-full bg-card/60 neon-border">
            <TabsTrigger value="daily" className="flex-1 font-display text-xs data-[state=active]:text-primary gap-1">
              <Calendar className="w-3.5 h-3.5" /> DAILY
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 font-display text-xs data-[state=active]:text-primary gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> WEEKLY
            </TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="space-y-3 mt-4">
            {renderChallenges("daily")}
          </TabsContent>
          <TabsContent value="weekly" className="space-y-3 mt-4">
            {renderChallenges("weekly")}
          </TabsContent>
        </Tabs>

        <p className="text-center font-body text-[10px] text-muted-foreground/50 mt-6">
          Daily challenges reset every day • Weekly challenges reset every week
        </p>
      </div>
    </div>
  );
};

export default Challenges;
