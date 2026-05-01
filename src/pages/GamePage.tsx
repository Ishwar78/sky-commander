import { useEffect } from "react";
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

  // Lock page scroll/bounce on mobile while playing (prevents iOS Safari
  // rubber-banding when using the joystick / fire button).
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      // Allow multi-touch pinch only on inputs (none here); block page scroll.
      if (e.touches.length >= 1) e.preventDefault();
    };
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";
    document.body.style.touchAction = "none";

    document.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.body.style.touchAction = prevTouchAction;
      document.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-background arcade-grid flex flex-col items-center justify-center p-4 overflow-hidden overscroll-none"
      style={{ touchAction: "none" }}
    >
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
