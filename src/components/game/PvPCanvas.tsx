import { useRef, useEffect, useCallback, useState } from "react";
import { soundEngine } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

const PVP_WIDTH = 800;
const PVP_HEIGHT = 600;
const HALF_W = PVP_WIDTH / 2;
const DIVIDER = 2;

interface PvPPlayer {
  x: number; y: number; width: number; height: number; speed: number;
  health: number; maxHealth: number; score: number;
  bullets: PvPBullet[]; lastShot: number;
  color: string; name: string;
}
interface PvPBullet { x: number; y: number; vx: number; vy: number; width: number; height: number; kills: number; }
interface PvPEnemy {
  x: number; y: number; width: number; height: number; speed: number;
  health: number; maxHealth: number; type: string; side: 0 | 1; id: number;
}
interface PvPParticle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface PvPStar { x: number; y: number; speed: number; size: number; brightness: number; }

let pvpEnemyId = 0;

const ENEMY_TYPES = ["normal", "fast", "tank"] as const;
const ENEMY_CONFIG: Record<string, { w: number; h: number; speed: number; hp: number; color: string }> = {
  normal: { w: 28, h: 30, speed: 1.5, hp: 1, color: "#ff3366" },
  fast: { w: 20, h: 24, speed: 3, hp: 1, color: "#ffaa00" },
  tank: { w: 40, h: 40, speed: 0.8, hp: 3, color: "#6644ff" },
};

const PvPCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [scores, setScores] = useState([0, 0]);
  const animRef = useRef(0);

  const gsRef = useRef({
    players: [
      { x: HALF_W / 2 - 18, y: PVP_HEIGHT - 70, width: 36, height: 44, speed: 5, health: 100, maxHealth: 100, score: 0, bullets: [] as PvPBullet[], lastShot: 0, color: "#00ffcc", name: "P1" },
      { x: HALF_W + HALF_W / 2 - 18, y: PVP_HEIGHT - 70, width: 36, height: 44, speed: 5, health: 100, maxHealth: 100, score: 0, bullets: [] as PvPBullet[], lastShot: 0, color: "#ff66ff", name: "P2" },
    ] as PvPPlayer[],
    enemies: [] as PvPEnemy[],
    particles: [] as PvPParticle[],
    stars: [] as PvPStar[],
    keys: {} as Record<string, boolean>,
    frameCount: 0,
    lastSpawn: 0,
    spawnInterval: 1200,
    difficulty: 1,
    over: false,
  });

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setCanvasScale(Math.min(1, w / PVP_WIDTH));
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const initStars = useCallback(() => {
    const stars: PvPStar[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({ x: Math.random() * PVP_WIDTH, y: Math.random() * PVP_HEIGHT, speed: 0.3 + Math.random() * 1.5, size: Math.random() * 2, brightness: 0.2 + Math.random() * 0.6 });
    }
    gsRef.current.stars = stars;
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const gs = gsRef.current;
    for (let i = 0; i < count; i++) {
      gs.particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 20 + Math.random() * 15, maxLife: 35, color, size: 1 + Math.random() * 2.5 });
    }
  };

  const spawnEnemy = (side: 0 | 1) => {
    const gs = gsRef.current;
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const cfg = ENEMY_CONFIG[type];
    const areaX = side === 0 ? 0 : HALF_W + DIVIDER;
    const areaW = HALF_W - DIVIDER;
    const x = areaX + Math.random() * (areaW - cfg.w);
    const hp = Math.round(cfg.hp + Math.floor(gs.difficulty * 0.3));
    gs.enemies.push({ x, y: -cfg.h - 5, width: cfg.w, height: cfg.h, speed: cfg.speed + gs.difficulty * 0.1, health: hp, maxHealth: hp, type, side, id: pvpEnemyId++ });
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gs = gsRef.current;

    if (gs.over) { animRef.current = requestAnimationFrame(gameLoop); return; }

    gs.frameCount++;
    const now = Date.now();

    // Background
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, PVP_WIDTH, PVP_HEIGHT);

    // Stars
    gs.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > PVP_HEIGHT) { s.y = 0; s.x = Math.random() * PVP_WIDTH; }
      ctx.fillStyle = `rgba(180,230,255,${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Divider
    ctx.save();
    ctx.strokeStyle = "rgba(0,255,200,0.3)";
    ctx.lineWidth = DIVIDER;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(HALF_W, 0);
    ctx.lineTo(HALF_W, PVP_HEIGHT);
    ctx.stroke();
    ctx.restore();

    // P1 controls: WASD + F to shoot
    // P2 controls: Arrow keys + / to shoot
    const p1 = gs.players[0];
    const p2 = gs.players[1];

    // Movement
    if (gs.keys["w"]) p1.y -= p1.speed;
    if (gs.keys["s"]) p1.y += p1.speed;
    if (gs.keys["a"]) p1.x -= p1.speed;
    if (gs.keys["d"]) p1.x += p1.speed;
    p1.x = Math.max(0, Math.min(HALF_W - DIVIDER - p1.width, p1.x));
    p1.y = Math.max(0, Math.min(PVP_HEIGHT - p1.height, p1.y));

    if (gs.keys["ArrowUp"]) p2.y -= p2.speed;
    if (gs.keys["ArrowDown"]) p2.y += p2.speed;
    if (gs.keys["ArrowLeft"]) p2.x -= p2.speed;
    if (gs.keys["ArrowRight"]) p2.x += p2.speed;
    p2.x = Math.max(HALF_W + DIVIDER, Math.min(PVP_WIDTH - p2.width, p2.x));
    p2.y = Math.max(0, Math.min(PVP_HEIGHT - p2.height, p2.y));

    // Shooting
    if (gs.keys["f"] && now - p1.lastShot > 150) {
      p1.bullets.push({ x: p1.x + p1.width / 2 - 2, y: p1.y, width: 4, height: 10, vx: 0, vy: -8, kills: 0 });
      p1.lastShot = now;
      soundEngine.shoot();
    }
    if (gs.keys["/"] && now - p2.lastShot > 150) {
      p2.bullets.push({ x: p2.x + p2.width / 2 - 2, y: p2.y, width: 4, height: 10, vx: 0, vy: -8, kills: 0 });
      p2.lastShot = now;
      soundEngine.shoot();
    }

    // Spawn enemies
    if (now - gs.lastSpawn > gs.spawnInterval) {
      spawnEnemy(0);
      spawnEnemy(1);
      gs.lastSpawn = now;
    }
    if (gs.frameCount % 1200 === 0) {
      gs.difficulty += 0.5;
      gs.spawnInterval = Math.max(400, gs.spawnInterval - 80);
    }

    // Process each player
    gs.players.forEach((player, pi) => {
      const side = pi as 0 | 1;

      // Draw player ship
      ctx.save();
      ctx.fillStyle = player.color;
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y);
      ctx.lineTo(player.x + player.width, player.y + player.height);
      ctx.lineTo(player.x + player.width / 2, player.y + player.height - 8);
      ctx.lineTo(player.x, player.y + player.height);
      ctx.closePath();
      ctx.fill();
      // Engine
      ctx.fillStyle = pi === 0 ? "#00ffcc" : "#ff66ff";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(player.x + player.width / 2, player.y + player.height + 2, 4, 6 + Math.random() * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw & move bullets
      player.bullets = player.bullets.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        ctx.save();
        ctx.fillStyle = player.color;
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.restore();
        return b.y > -b.height && b.y < PVP_HEIGHT + 10;
      });

      // Health bar
      const barX = side === 0 ? 10 : HALF_W + DIVIDER + 10;
      const barW = HALF_W - DIVIDER - 20;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(barX, 10, barW, 12);
      ctx.strokeStyle = player.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, 10, barW, 12);
      const hpPct = Math.max(0, player.health / player.maxHealth);
      ctx.fillStyle = hpPct > 0.5 ? "#00ff66" : hpPct > 0.25 ? "#ffcc00" : "#ff3333";
      ctx.fillRect(barX + 1, 11, (barW - 2) * hpPct, 10);

      // Score
      ctx.save();
      ctx.font = "bold 16px Orbitron";
      ctx.fillStyle = player.color;
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 5;
      ctx.textAlign = side === 0 ? "left" : "right";
      ctx.fillText(`${player.score}`, side === 0 ? barX : barX + barW, 40);
      ctx.font = "9px Rajdhani";
      ctx.fillStyle = `${player.color}80`;
      ctx.fillText(player.name, side === 0 ? barX : barX + barW, 52);
      ctx.restore();
    });

    // Process enemies
    gs.enemies = gs.enemies.filter(e => {
      e.y += e.speed;
      const cfg = ENEMY_CONFIG[e.type] || ENEMY_CONFIG.normal;

      // Draw
      ctx.save();
      ctx.fillStyle = cfg.color;
      ctx.shadowColor = cfg.color;
      ctx.shadowBlur = 8;
      if (e.type === "fast") {
        ctx.beginPath();
        ctx.moveTo(e.x + e.width / 2, e.y + e.height);
        ctx.lineTo(e.x + e.width, e.y);
        ctx.lineTo(e.x, e.y);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === "tank") {
        ctx.fillRect(e.x, e.y, e.width, e.height);
        if (e.health < e.maxHealth) {
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(e.x, e.y - 6, e.width, 3);
          ctx.fillStyle = cfg.color;
          ctx.fillRect(e.x, e.y - 6, e.width * (e.health / e.maxHealth), 3);
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(e.x + e.width / 2, e.y + e.height);
        ctx.lineTo(e.x + e.width, e.y);
        ctx.lineTo(e.x + e.width / 2, e.y + 8);
        ctx.lineTo(e.x, e.y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Bullet collision
      const player = gs.players[e.side];
      for (let i = player.bullets.length - 1; i >= 0; i--) {
        const b = player.bullets[i];
        if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          e.health--;
          if (e.health <= 0) {
            // Bullet grows on kill instead of being removed
            b.kills++;
            b.width = 4 + b.kills * 3;
            b.height = 10 + b.kills * 4;
            b.x = b.x - 1.5; // re-center
            player.score += e.type === "tank" ? 30 : e.type === "fast" ? 15 : 10;
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, cfg.color, 12);
            // Score popup particle
            for (let j = 0; j < 3; j++) {
              gs.particles.push({ x: e.x + e.width / 2, y: e.y, vx: (Math.random() - 0.5) * 2, vy: -2 - Math.random() * 2, life: 30, maxLife: 30, color: "#ffdd00", size: 3 + Math.random() * 2 });
            }
            soundEngine.explosion();
            setScores([gs.players[0].score, gs.players[1].score]);
            return false;
          }
          spawnParticles(b.x, b.y, "#fff", 3);
        }
      }

      // Player collision
      if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
        player.health -= 20;
        spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#ffcc00", 8);
        soundEngine.hit();
        if (player.health <= 0) {
          player.health = 0;
          gs.over = true;
          const winnerIdx = e.side === 0 ? 1 : 0;
          setWinner(gs.players[winnerIdx].name);
          setGameOver(true);
          soundEngine.gameOver();
        }
        return false;
      }

      // Off screen = damage
      if (e.y > PVP_HEIGHT) {
        player.health -= 5;
        if (player.health <= 0) {
          player.health = 0;
          gs.over = true;
          const winnerIdx = e.side === 0 ? 1 : 0;
          setWinner(gs.players[winnerIdx].name);
          setGameOver(true);
          soundEngine.gameOver();
        }
        return false;
      }
      return true;
    });

    // Particles
    gs.particles = gs.particles.filter(pt => {
      pt.x += pt.vx; pt.y += pt.vy; pt.life--;
      const alpha = pt.life / pt.maxLife;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = pt.color; ctx.shadowColor = pt.color; ctx.shadowBlur = 4;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size); ctx.restore();
      return pt.life > 0;
    });

    animRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = useCallback(() => {
    const gs = gsRef.current;
    gs.players[0] = { x: HALF_W / 2 - 18, y: PVP_HEIGHT - 70, width: 36, height: 44, speed: 5, health: 100, maxHealth: 100, score: 0, bullets: [], lastShot: 0, color: "#00ffcc", name: "P1" };
    gs.players[1] = { x: HALF_W + HALF_W / 2 - 18, y: PVP_HEIGHT - 70, width: 36, height: 44, speed: 5, health: 100, maxHealth: 100, score: 0, bullets: [], lastShot: 0, color: "#ff66ff", name: "P2" };
    gs.enemies = []; gs.particles = []; gs.frameCount = 0; gs.lastSpawn = 0; gs.spawnInterval = 1200; gs.difficulty = 1; gs.over = false;
    setScores([0, 0]); setGameOver(false); setWinner(null); setGameStarted(true);
    initStars();
    soundEngine.startMusic();
  }, [initStars]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const pvpKeys = ["w", "a", "s", "d", "f", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "/"];
      if (pvpKeys.includes(e.key)) e.preventDefault();
      gsRef.current.keys[e.key] = true;
    };
    const up = (e: KeyboardEvent) => { gsRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    if (gameStarted) animRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameStarted, gameLoop]);

  const toggleMute = () => { const n = !muted; setMuted(n); soundEngine.setMuted(n); };

  return (
    <div ref={containerRef} className="relative flex flex-col items-center w-full">
      <div style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
        <canvas ref={canvasRef} width={PVP_WIDTH} height={PVP_HEIGHT} className="rounded-lg neon-border box-glow-cyan" style={{ imageRendering: "pixelated" }} />
      </div>

      {gameStarted && (
        <button onClick={toggleMute} className="absolute top-2 right-2 z-20 p-2 text-muted-foreground hover:text-primary transition-colors">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <h2 className="font-display text-3xl text-glow-cyan text-primary mb-2">PVP MODE</h2>
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="text-center">
              <p className="font-display text-sm text-[#00ffcc] mb-1">PLAYER 1</p>
              <p className="font-body text-xs text-muted-foreground">WASD — Move</p>
              <p className="font-body text-xs text-muted-foreground">F — Shoot</p>
            </div>
            <div className="text-center">
              <p className="font-display text-sm text-[#ff66ff] mb-1">PLAYER 2</p>
              <p className="font-body text-xs text-muted-foreground">Arrows — Move</p>
              <p className="font-body text-xs text-muted-foreground">/ — Shoot</p>
            </div>
          </div>
          <p className="font-body text-xs text-muted-foreground mb-4">Survive longer & score higher to win!</p>
          <button onClick={startGame} className="px-8 py-3 bg-primary text-primary-foreground font-display text-lg rounded-lg box-glow-cyan hover:scale-105 transition-transform">
            FIGHT!
          </button>
        </div>
      )}

      {gameOver && winner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md rounded-lg z-40"
          style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}
        >
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="text-center"
          >
            <h2 className="font-display text-4xl text-primary text-glow-cyan mb-2">
              🏆 {winner} WINS!
            </h2>
            <div className="flex gap-8 my-6">
              <div className="text-center">
                <p className="font-display text-xs text-[#00ffcc]">P1</p>
                <p className="font-display text-2xl text-[#00ffcc]">{scores[0]}</p>
              </div>
              <div className="font-display text-2xl text-muted-foreground self-center">VS</div>
              <div className="text-center">
                <p className="font-display text-xs text-[#ff66ff]">P2</p>
                <p className="font-display text-2xl text-[#ff66ff]">{scores[1]}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={startGame} className="px-6 py-3 bg-primary text-primary-foreground font-display rounded-lg box-glow-cyan hover:scale-105 transition-transform">
                REMATCH
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PvPCanvas;
