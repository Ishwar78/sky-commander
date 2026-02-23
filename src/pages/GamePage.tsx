import { Link, useSearchParams, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GameCanvas from "@/components/game/GameCanvas";
import { getXPData } from "@/lib/xp";

const GamePage = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "bossrush" ? "bossrush" : "normal";
  const xpData = getXPData();

  // Gate boss rush behind level 4
  if (mode === "bossrush" && xpData.level < 4) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background arcade-grid flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="font-display text-lg text-primary text-glow-cyan tracking-wider">
            {mode === "bossrush" ? "BOSS RUSH" : "SKY FIRE"}
          </h1>
          <div className="w-16" />
        </div>
        <GameCanvas mode={mode} />
      </div>
    </div>
  );
};

export default GamePage;
