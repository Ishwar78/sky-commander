import { useRef, useEffect, useCallback, useState } from "react";
import GameOverModal from "./GameOverModal";
import TouchControls from "./TouchControls";
import { soundEngine } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";

interface Player { x: number; y: number; width: number; height: number; speed: number; }
interface Bullet { x: number; y: number; width: number; height: number; speed: number; }
interface Enemy { x: number; y: number; width: number; height: number; speed: number; health: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface Star { x: number; y: number; speed: number; size: number; brightness: number; }
interface PowerUp {
  x: number; y: number; width: number; height: number; speed: number;
  type: "shield" | "rapid" | "multi" | "health";
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 700;

const POWERUP_COLORS: Record<string, string> = {
  shield: "#00ccff",
  rapid: "#ffcc00",
  multi: "#ff66ff",
  health: "#00ff66",
};

const POWERUP_LABELS: Record<string, string> = {
  shield: "🛡️",
  rapid: "⚡",
  multi: "🔥",
  health: "💚",
};

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameStateRef = useRef({
    player: { x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT - 80, width: 40, height: 50, speed: 5 } as Player,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    stars: [] as Star[],
    powerUps: [] as PowerUp[],
    score: 0,
    health: 100,
    shield: 0, // shield timer frames
    rapidFire: 0,
    multiShot: 0,
    gameOver: false,
    paused: false,
    keys: {} as Record<string, boolean>,
    touchMove: { dx: 0, dy: 0 },
    touchFiring: false,
    lastEnemySpawn: 0,
    spawnInterval: 1500,
    difficulty: 1,
    frameCount: 0,
    lastShot: 0,
    shotInterval: 150,
  });
  const animFrameRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  // Responsive canvas scaling
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        const scale = Math.min(1, containerW / CANVAS_WIDTH);
        setCanvasScale(scale);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const initStars = useCallback(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({ x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT, speed: 0.5 + Math.random() * 2, size: Math.random() * 2, brightness: 0.3 + Math.random() * 0.7 });
    }
    gameStateRef.current.stars = stars;
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const gs = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      gs.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 30 + Math.random() * 20, maxLife: 50, color, size: 1 + Math.random() * 3 });
    }
  };

  const spawnPowerUp = (x: number, y: number) => {
    if (Math.random() > 0.2) return; // 20% chance
    const types: PowerUp["type"][] = ["shield", "rapid", "multi", "health"];
    const type = types[Math.floor(Math.random() * types.length)];
    gameStateRef.current.powerUps.push({ x, y, width: 20, height: 20, speed: 2, type });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player, shielded: boolean) => {
    ctx.save();
    ctx.fillStyle = "#00ffcc";
    ctx.shadowColor = "#00ffcc";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y);
    ctx.lineTo(p.x + p.width, p.y + p.height);
    ctx.lineTo(p.x + p.width / 2, p.y + p.height - 10);
    ctx.lineTo(p.x, p.y + p.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#00cc99";
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y + 15);
    ctx.lineTo(p.x - 10, p.y + p.height - 5);
    ctx.lineTo(p.x + 5, p.y + p.height - 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y + 15);
    ctx.lineTo(p.x + p.width + 10, p.y + p.height - 5);
    ctx.lineTo(p.x + p.width - 5, p.y + p.height - 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#00ff66";
    ctx.shadowColor = "#00ff66";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(p.x + p.width / 2, p.y + p.height + 3, 5, 8 + Math.random() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shield bubble
    if (shielded) {
      ctx.strokeStyle = "rgba(0, 200, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#00ccff";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    ctx.save();
    ctx.fillStyle = "#ff3366";
    ctx.shadowColor = "#ff3366";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(e.x + e.width / 2, e.y + e.height);
    ctx.lineTo(e.x + e.width, e.y);
    ctx.lineTo(e.x + e.width / 2, e.y + 10);
    ctx.lineTo(e.x, e.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffcc00";
    ctx.shadowColor = "#ffcc00";
    ctx.shadowBlur = 5;
    ctx.fillRect(e.x + e.width / 2 - 6, e.y + e.height / 2, 3, 3);
    ctx.fillRect(e.x + e.width / 2 + 3, e.y + e.height / 2, 3, 3);
    ctx.restore();
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gs = gameStateRef.current;

    if (gs.gameOver || gs.paused) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    gs.frameCount++;

    // Decrease power-up timers
    if (gs.shield > 0) gs.shield--;
    if (gs.rapidFire > 0) gs.rapidFire--;
    if (gs.multiShot > 0) gs.multiShot--;

    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    gs.stars.forEach((s) => {
      s.y += s.speed;
      if (s.y > CANVAS_HEIGHT) { s.y = 0; s.x = Math.random() * CANVAS_WIDTH; }
      ctx.fillStyle = `rgba(180, 230, 255, ${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Grid
    ctx.strokeStyle = "rgba(0, 255, 200, 0.03)";
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke(); }

    // Player movement (keyboard + touch)
    const p = gs.player;
    const spd = p.speed;
    if (gs.keys["ArrowLeft"] || gs.keys["a"]) p.x -= spd;
    if (gs.keys["ArrowRight"] || gs.keys["d"]) p.x += spd;
    if (gs.keys["ArrowUp"] || gs.keys["w"]) p.y -= spd;
    if (gs.keys["ArrowDown"] || gs.keys["s"]) p.y += spd;
    // Touch
    p.x += gs.touchMove.dx * spd;
    p.y += gs.touchMove.dy * spd;
    p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
    p.y = Math.max(0, Math.min(CANVAS_HEIGHT - p.height, p.y));

    // Shooting
    const now = Date.now();
    const interval = gs.rapidFire > 0 ? 80 : gs.shotInterval;
    const firing = gs.keys[" "] || gs.touchFiring;
    if (firing && now - gs.lastShot > interval) {
      if (gs.multiShot > 0) {
        // 3-bullet spread
        gs.bullets.push({ x: p.x + p.width / 2 - 2, y: p.y, width: 4, height: 12, speed: 8 });
        gs.bullets.push({ x: p.x + p.width / 2 - 12, y: p.y + 5, width: 4, height: 12, speed: 8 });
        gs.bullets.push({ x: p.x + p.width / 2 + 8, y: p.y + 5, width: 4, height: 12, speed: 8 });
      } else {
        gs.bullets.push({ x: p.x + p.width / 2 - 2, y: p.y, width: 4, height: 12, speed: 8 });
      }
      gs.lastShot = now;
      soundEngine.shoot();
    }

    // Bullets
    gs.bullets = gs.bullets.filter((b) => {
      b.y -= b.speed;
      ctx.save();
      ctx.fillStyle = gs.multiShot > 0 ? "#ff66ff" : gs.rapidFire > 0 ? "#ffcc00" : "#00ffcc";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.restore();
      return b.y > -b.height;
    });

    // Enemy spawn
    if (now - gs.lastEnemySpawn > gs.spawnInterval) {
      const w = 30 + Math.random() * 15;
      gs.enemies.push({ x: Math.random() * (CANVAS_WIDTH - w), y: -40, width: w, height: 35, speed: 1.5 + gs.difficulty * 0.3 + Math.random(), health: 1 });
      gs.lastEnemySpawn = now;
    }

    // Difficulty
    if (gs.frameCount % 1200 === 0) {
      gs.difficulty += 0.5;
      gs.spawnInterval = Math.max(400, gs.spawnInterval - 100);
    }

    // Enemies
    gs.enemies = gs.enemies.filter((e) => {
      e.y += e.speed;
      drawEnemy(ctx, e);

      for (let i = gs.bullets.length - 1; i >= 0; i--) {
        const b = gs.bullets[i];
        if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          gs.bullets.splice(i, 1);
          e.health--;
          if (e.health <= 0) {
            gs.score += 10;
            setScore(gs.score);
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#ff3366", 12);
            soundEngine.explosion();
            spawnPowerUp(e.x + e.width / 2, e.y + e.height / 2);
            return false;
          }
        }
      }

      // Player collision
      if (p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) {
        if (gs.shield > 0) {
          // Shield absorbs hit
          gs.shield = 0;
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#00ccff", 15);
          soundEngine.explosion();
        } else {
          gs.health -= 20;
          setHealth(gs.health);
          soundEngine.hit();
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#ffcc00", 8);
          if (gs.health <= 0) {
            gs.gameOver = true;
            setGameOver(true);
            soundEngine.gameOver();
            soundEngine.stopMusic();
          }
        }
        return false;
      }

      if (e.y > CANVAS_HEIGHT) {
        if (gs.shield <= 0) {
          gs.health -= 5;
          setHealth(gs.health);
          if (gs.health <= 0) {
            gs.gameOver = true;
            setGameOver(true);
            soundEngine.gameOver();
            soundEngine.stopMusic();
          }
        }
        return false;
      }
      return true;
    });

    // Power-ups
    gs.powerUps = gs.powerUps.filter((pu) => {
      pu.y += pu.speed;
      // Draw
      ctx.save();
      const col = POWERUP_COLORS[pu.type];
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "14px serif";
      ctx.textAlign = "center";
      ctx.fillText(POWERUP_LABELS[pu.type], pu.x + pu.width / 2, pu.y + pu.height / 2 + 5);
      ctx.restore();

      // Collect
      if (p.x < pu.x + pu.width && p.x + p.width > pu.x && p.y < pu.y + pu.height && p.y + p.height > pu.y) {
        soundEngine.powerUp();
        spawnParticles(pu.x, pu.y, col, 8);
        switch (pu.type) {
          case "shield": gs.shield = 600; break; // 10 sec
          case "rapid": gs.rapidFire = 480; break; // 8 sec
          case "multi": gs.multiShot = 360; break; // 6 sec
          case "health": gs.health = Math.min(100, gs.health + 25); setHealth(gs.health); break;
        }
        return false;
      }
      return pu.y < CANVAS_HEIGHT + 20;
    });

    // Particles
    gs.particles = gs.particles.filter((pt) => {
      pt.x += pt.vx; pt.y += pt.vy; pt.life--;
      const alpha = pt.life / pt.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.restore();
      return pt.life > 0;
    });

    drawPlayer(ctx, p, gs.shield > 0);

    // HUD - Health
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 120, 16);
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 120, 16);
    const healthPct = Math.max(0, gs.health) / 100;
    ctx.fillStyle = healthPct > 0.5 ? "#00ff66" : healthPct > 0.25 ? "#ffcc00" : "#ff3333";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fillRect(12, 12, 116 * healthPct, 12);
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = "#00ffcc";
    ctx.shadowColor = "#00ffcc";
    ctx.shadowBlur = 5;
    ctx.font = "bold 20px Orbitron";
    ctx.textAlign = "right";
    ctx.fillText(`${gs.score}`, CANVAS_WIDTH - 15, 26);
    ctx.shadowBlur = 0;

    // Labels
    ctx.font = "10px Rajdhani";
    ctx.fillStyle = "rgba(0,255,200,0.5)";
    ctx.fillText("SCORE", CANVAS_WIDTH - 15, 38);
    ctx.textAlign = "left";
    ctx.fillText("SHIELD", 12, 38);

    // Active power-up indicators
    const indicators: string[] = [];
    if (gs.shield > 0) indicators.push("🛡️ SHIELD");
    if (gs.rapidFire > 0) indicators.push("⚡ RAPID");
    if (gs.multiShot > 0) indicators.push("🔥 MULTI");
    if (indicators.length > 0) {
      ctx.font = "11px Orbitron";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffcc00";
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 5;
      ctx.fillText(indicators.join("  "), CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
      ctx.shadowBlur = 0;
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = useCallback(() => {
    const gs = gameStateRef.current;
    gs.player = { x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT - 80, width: 40, height: 50, speed: 5 };
    gs.bullets = []; gs.enemies = []; gs.particles = []; gs.powerUps = [];
    gs.score = 0; gs.health = 100; gs.shield = 0; gs.rapidFire = 0; gs.multiShot = 0;
    gs.gameOver = false; gs.paused = false;
    gs.lastEnemySpawn = 0; gs.spawnInterval = 1500; gs.difficulty = 1; gs.frameCount = 0; gs.lastShot = 0;
    gs.touchMove = { dx: 0, dy: 0 }; gs.touchFiring = false;
    setScore(0); setHealth(100); setGameOver(false); setPaused(false); setGameStarted(true);
    initStars();
    soundEngine.startMusic();
  }, [initStars]);

  const handleTouchMove = useCallback((dx: number, dy: number) => {
    gameStateRef.current.touchMove = { dx, dy };
  }, []);

  const handleTouchFire = useCallback((firing: boolean) => {
    gameStateRef.current.touchFiring = firing;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "w", "a", "s", "d"].includes(e.key)) e.preventDefault();
      gameStateRef.current.keys[e.key] = true;
      if (e.key === "p" || e.key === "Escape") {
        gameStateRef.current.paused = !gameStateRef.current.paused;
        setPaused(gameStateRef.current.paused);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { gameStateRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, []);

  useEffect(() => {
    if (gameStarted) { animFrameRef.current = requestAnimationFrame(gameLoop); }
    return () => { cancelAnimationFrame(animFrameRef.current); };
  }, [gameStarted, gameLoop]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center w-full">
      <div style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="rounded-lg neon-border box-glow-cyan"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      {/* Mute toggle */}
      {gameStarted && (
        <button onClick={toggleMute} className="absolute top-2 right-2 z-20 p-2 text-muted-foreground hover:text-primary transition-colors">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <h2 className="font-display text-3xl text-glow-cyan mb-4 text-primary">READY?</h2>
          <p className="text-muted-foreground mb-2 text-sm font-body">Arrow keys to move • Space to shoot</p>
          <p className="text-muted-foreground mb-6 text-xs font-body">P to pause • Collect power-ups!</p>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-primary text-primary-foreground font-display text-lg rounded-lg box-glow-cyan hover:scale-105 transition-transform"
          >
            START GAME
          </button>
        </div>
      )}

      {paused && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <h2 className="font-display text-3xl text-glow-cyan text-primary animate-pulse-neon">PAUSED</h2>
          <p className="text-muted-foreground mt-3 text-sm">Press P or Escape to resume</p>
        </div>
      )}

      {gameOver && <GameOverModal score={score} onRestart={startGame} />}

      {/* Touch controls for mobile */}
      {gameStarted && !gameOver && !paused && (
        <TouchControls onMove={handleTouchMove} onFire={handleTouchFire} />
      )}
    </div>
  );
};

export default GameCanvas;
