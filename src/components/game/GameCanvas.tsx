import { useRef, useEffect, useCallback, useState } from "react";
import GameOverModal from "./GameOverModal";
import TouchControls from "./TouchControls";
import { soundEngine } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSkin, type ShipSkin } from "@/lib/skins";
import { getSettings, DIFFICULTY_MULTIPLIERS } from "@/lib/settings";

interface Player { x: number; y: number; width: number; height: number; speed: number; }
interface Bullet { x: number; y: number; width: number; height: number; speed: number; }
interface Enemy {
  x: number; y: number; width: number; height: number; speed: number; health: number; maxHealth: number;
  type: "normal" | "fast" | "tank" | "boss";
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface Star { x: number; y: number; speed: number; size: number; brightness: number; }
interface PowerUp {
  x: number; y: number; width: number; height: number; speed: number;
  type: "shield" | "rapid" | "multi" | "health";
}
interface TrailParticle { x: number; y: number; life: number; maxLife: number; size: number; }

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 700;

const POWERUP_COLORS: Record<string, string> = {
  shield: "#00ccff", rapid: "#ffcc00", multi: "#ff66ff", health: "#00ff66",
};
const POWERUP_LABELS: Record<string, string> = {
  shield: "🛡️", rapid: "⚡", multi: "🔥", health: "💚",
};
const ENEMY_COLORS: Record<string, string> = {
  normal: "#ff3366", fast: "#ffaa00", tank: "#6644ff", boss: "#ff0000",
};

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skinRef = useRef<ShipSkin>(getSkin("default"));

  const gameStateRef = useRef({
    player: { x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT - 80, width: 40, height: 50, speed: 5 } as Player,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    stars: [] as Star[],
    powerUps: [] as PowerUp[],
    trailParticles: [] as TrailParticle[],
    score: 0, health: 100, shield: 0, rapidFire: 0, multiShot: 0,
    gameOver: false, paused: false,
    keys: {} as Record<string, boolean>,
    touchMove: { dx: 0, dy: 0 }, touchFiring: false,
    lastEnemySpawn: 0, spawnInterval: 1500, difficulty: 1,
    frameCount: 0, lastShot: 0, shotInterval: 150,
    wave: 1, waveKills: 0, waveThreshold: 10, bossActive: false,
    // Wave transition
    waveTransition: false, waveTransitionTimer: 0,
    // Screen shake
    shakeIntensity: 0, shakeDecay: 0.9,
    // Settings
    difficultyMult: DIFFICULTY_MULTIPLIERS["normal"],
    keyBindings: getSettings().keyBindings,
  });
  const animFrameRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [wave, setWave] = useState(1);
  const [waveAnnounce, setWaveAnnounce] = useState(0);

  useEffect(() => {
    const user = getCurrentUser();
    skinRef.current = getSkin(user?.selectedSkin || "default");
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        setCanvasScale(Math.min(1, containerW / CANVAS_WIDTH));
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
    if (Math.random() > 0.2) return;
    const types: PowerUp["type"][] = ["shield", "rapid", "multi", "health"];
    gameStateRef.current.powerUps.push({ x, y, width: 20, height: 20, speed: 2, type: types[Math.floor(Math.random() * types.length)] });
  };

  const spawnEnemy = () => {
    const gs = gameStateRef.current;
    const dm = gs.difficultyMult;
    const r = Math.random();
    let type: Enemy["type"] = "normal";
    let w = 30 + Math.random() * 15;
    let h = 35;
    let speed = (1.5 + gs.difficulty * 0.3 + Math.random()) * dm.speed;
    let hp = 1;

    if (r < 0.2) {
      type = "fast"; w = 22; h = 28; speed = (3 + gs.difficulty * 0.4) * dm.speed; hp = 1;
    } else if (r < 0.35) {
      type = "tank"; w = 45; h = 45; speed = (0.8 + gs.difficulty * 0.15) * dm.speed; hp = Math.round((4 + Math.floor(gs.difficulty)) * dm.health);
    }

    gs.enemies.push({ x: Math.random() * (CANVAS_WIDTH - w), y: -h - 10, width: w, height: h, speed, health: hp, maxHealth: hp, type });
  };

  const spawnBoss = () => {
    const gs = gameStateRef.current;
    const hp = Math.round((30 + gs.wave * 10) * gs.difficultyMult.health);
    gs.enemies.push({ x: CANVAS_WIDTH / 2 - 50, y: -100, width: 100, height: 80, speed: 0.5, health: hp, maxHealth: hp, type: "boss" });
    gs.bossActive = true;
  };

  const triggerShake = (intensity: number) => {
    gameStateRef.current.shakeIntensity = intensity;
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, p: Player, shielded: boolean) => {
    const skin = skinRef.current;
    ctx.save();
    ctx.fillStyle = skin.bodyColor;
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(p.x + p.width / 2, p.y);
    ctx.lineTo(p.x + p.width, p.y + p.height);
    ctx.lineTo(p.x + p.width / 2, p.y + p.height - 10);
    ctx.lineTo(p.x, p.y + p.height);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.wingColor;
    ctx.beginPath(); ctx.moveTo(p.x + p.width / 2, p.y + 15); ctx.lineTo(p.x - 10, p.y + p.height - 5); ctx.lineTo(p.x + 5, p.y + p.height - 5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(p.x + p.width / 2, p.y + 15); ctx.lineTo(p.x + p.width + 10, p.y + p.height - 5); ctx.lineTo(p.x + p.width - 5, p.y + p.height - 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = skin.engineColor;
    ctx.shadowColor = skin.engineColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(p.x + p.width / 2, p.y + p.height + 3, 5, 8 + Math.random() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (shielded) {
      ctx.strokeStyle = "rgba(0, 200, 255, 0.5)";
      ctx.lineWidth = 2; ctx.shadowColor = "#00ccff"; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 35, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    const color = ENEMY_COLORS[e.type];
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = e.type === "boss" ? 20 : 10;

    if (e.type === "boss") {
      const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + Math.cos(angle) * (e.width / 2);
        const py = cy + Math.sin(angle) * (e.height / 2);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(e.x, e.y - 12, e.width, 6);
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(e.x, e.y - 12, e.width * (e.health / e.maxHealth), 6);
      ctx.fillStyle = "#ffcc00";
      ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 8;
      ctx.fillRect(cx - 15, cy - 5, 8, 8);
      ctx.fillRect(cx + 7, cy - 5, 8, 8);
    } else if (e.type === "fast") {
      ctx.beginPath();
      ctx.moveTo(e.x + e.width / 2, e.y + e.height);
      ctx.lineTo(e.x + e.width, e.y);
      ctx.lineTo(e.x, e.y);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === "tank") {
      ctx.fillRect(e.x, e.y, e.width, e.height);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, e.height - 8);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(e.x, e.y - 8, e.width, 4);
      ctx.fillStyle = "#6644ff";
      ctx.fillRect(e.x, e.y - 8, e.width * (e.health / e.maxHealth), 4);
    } else {
      ctx.beginPath();
      ctx.moveTo(e.x + e.width / 2, e.y + e.height);
      ctx.lineTo(e.x + e.width, e.y);
      ctx.lineTo(e.x + e.width / 2, e.y + 10);
      ctx.lineTo(e.x, e.y);
      ctx.closePath();
      ctx.fill();
    }
    if (e.type !== "boss") {
      ctx.fillStyle = "#ffcc00";
      ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 5;
      ctx.fillRect(e.x + e.width / 2 - 6, e.y + e.height / 2, 3, 3);
      ctx.fillRect(e.x + e.width / 2 + 3, e.y + e.height / 2, 3, 3);
    }
    ctx.restore();
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gs = gameStateRef.current;
    const skin = skinRef.current;
    const kb = gs.keyBindings;

    if (gs.gameOver || gs.paused) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Wave transition pause
    if (gs.waveTransition) {
      gs.waveTransitionTimer--;
      if (gs.waveTransitionTimer <= 0) {
        gs.waveTransition = false;
      }
      // Still draw background during transition
      ctx.fillStyle = "#080c14";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      gs.stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > CANVAS_HEIGHT) { s.y = 0; s.x = Math.random() * CANVAS_WIDTH; }
        ctx.fillStyle = `rgba(180, 230, 255, ${s.brightness})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      drawPlayer(ctx, gs.player, gs.shield > 0);
      // Wave text drawn via React overlay
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    gs.frameCount++;
    if (gs.shield > 0) gs.shield--;
    if (gs.rapidFire > 0) gs.rapidFire--;
    if (gs.multiShot > 0) gs.multiShot--;

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (gs.shakeIntensity > 0.5) {
      shakeX = (Math.random() - 0.5) * gs.shakeIntensity;
      shakeY = (Math.random() - 0.5) * gs.shakeIntensity;
      gs.shakeIntensity *= gs.shakeDecay;
    } else {
      gs.shakeIntensity = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

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

    // Player movement
    const p = gs.player;
    const spd = p.speed;
    if (gs.keys[kb.left] || gs.keys["a"]) p.x -= spd;
    if (gs.keys[kb.right] || gs.keys["d"]) p.x += spd;
    if (gs.keys[kb.up] || gs.keys["w"]) p.y -= spd;
    if (gs.keys[kb.down] || gs.keys["s"]) p.y += spd;
    p.x += gs.touchMove.dx * spd;
    p.y += gs.touchMove.dy * spd;
    p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
    p.y = Math.max(0, Math.min(CANVAS_HEIGHT - p.height, p.y));

    // Engine trail particles
    if (gs.frameCount % 2 === 0) {
      gs.trailParticles.push({
        x: p.x + p.width / 2 + (Math.random() - 0.5) * 6,
        y: p.y + p.height + 5,
        life: 15 + Math.random() * 10,
        maxLife: 25,
        size: 1.5 + Math.random() * 2,
      });
    }

    // Shooting
    const now = Date.now();
    const interval = gs.rapidFire > 0 ? 80 : gs.shotInterval;
    const firing = gs.keys[kb.shoot] || gs.touchFiring;
    if (firing && now - gs.lastShot > interval) {
      if (gs.multiShot > 0) {
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
      ctx.fillStyle = gs.multiShot > 0 ? "#ff66ff" : gs.rapidFire > 0 ? "#ffcc00" : skin.bulletColor;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.restore();
      return b.y > -b.height;
    });

    // Enemy spawn
    const spawnInt = gs.spawnInterval * gs.difficultyMult.spawnRate;
    if (now - gs.lastEnemySpawn > spawnInt && !gs.bossActive) {
      spawnEnemy();
      gs.lastEnemySpawn = now;
    }

    // Wave / boss logic
    if (gs.waveKills >= gs.waveThreshold && !gs.bossActive) {
      gs.wave++;
      setWave(gs.wave);
      setWaveAnnounce(gs.wave);
      gs.waveTransition = true;
      gs.waveTransitionTimer = 90; // ~1.5 seconds at 60fps
      setTimeout(() => setWaveAnnounce(0), 2000);
      if (gs.wave % 10 === 0) {
        spawnBoss();
      }
      gs.waveKills = 0;
      gs.waveThreshold = 10 + gs.wave * 2;
    }

    // Difficulty
    if (gs.frameCount % 1200 === 0) {
      gs.difficulty += 0.5;
      gs.spawnInterval = Math.max(400, gs.spawnInterval - 100);
    }

    // Enemies
    gs.enemies = gs.enemies.filter((e) => {
      if (e.type === "boss") {
        e.y = Math.min(60, e.y + e.speed);
        e.x += Math.sin(gs.frameCount * 0.02) * 1.5;
        e.x = Math.max(0, Math.min(CANVAS_WIDTH - e.width, e.x));
      } else {
        e.y += e.speed;
      }
      drawEnemy(ctx, e);

      for (let i = gs.bullets.length - 1; i >= 0; i--) {
        const b = gs.bullets[i];
        if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          gs.bullets.splice(i, 1);
          e.health--;
          if (e.health <= 0) {
            const pts = e.type === "boss" ? 200 : e.type === "tank" ? 30 : e.type === "fast" ? 15 : 10;
            gs.score += pts;
            setScore(gs.score);
            gs.waveKills++;
            const eColor = ENEMY_COLORS[e.type];
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, eColor, e.type === "boss" ? 30 : 12);
            soundEngine.explosion();
            spawnPowerUp(e.x + e.width / 2, e.y + e.height / 2);
            if (e.type === "boss") {
              gs.bossActive = false;
              triggerShake(20);
              spawnPowerUp(e.x + 20, e.y + 20);
              spawnPowerUp(e.x + e.width - 20, e.y + 20);
            }
            return false;
          }
          spawnParticles(b.x, b.y, "#ffffff", 3);
          if (e.type === "boss") triggerShake(6);
        }
      }

      // Player collision
      if (p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) {
        if (gs.shield > 0) {
          gs.shield = 0;
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#00ccff", 15);
          soundEngine.explosion();
        } else {
          const dmg = e.type === "boss" ? 40 : e.type === "tank" ? 30 : 20;
          gs.health -= dmg;
          setHealth(gs.health);
          soundEngine.hit();
          triggerShake(10);
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#ffcc00", 8);
          if (gs.health <= 0) {
            gs.gameOver = true;
            setGameOver(true);
            soundEngine.gameOver();
            soundEngine.stopMusic();
          }
        }
        if (e.type !== "boss") return false;
      }

      if (e.y > CANVAS_HEIGHT && e.type !== "boss") {
        if (gs.shield <= 0) {
          gs.health -= 5;
          setHealth(gs.health);
          if (gs.health <= 0) {
            gs.gameOver = true; setGameOver(true);
            soundEngine.gameOver(); soundEngine.stopMusic();
          }
        }
        return false;
      }
      return true;
    });

    // Power-ups
    gs.powerUps = gs.powerUps.filter((pu) => {
      pu.y += pu.speed;
      ctx.save();
      const col = POWERUP_COLORS[pu.type];
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, 12, 0, Math.PI * 2); ctx.fill();
      ctx.font = "14px serif"; ctx.textAlign = "center";
      ctx.fillText(POWERUP_LABELS[pu.type], pu.x + pu.width / 2, pu.y + pu.height / 2 + 5);
      ctx.restore();

      if (p.x < pu.x + pu.width && p.x + p.width > pu.x && p.y < pu.y + pu.height && p.y + p.height > pu.y) {
        soundEngine.powerUp();
        spawnParticles(pu.x, pu.y, col, 8);
        switch (pu.type) {
          case "shield": gs.shield = 600; break;
          case "rapid": gs.rapidFire = 480; break;
          case "multi": gs.multiShot = 360; break;
          case "health": gs.health = Math.min(100, gs.health + 25); setHealth(gs.health); break;
        }
        return false;
      }
      return pu.y < CANVAS_HEIGHT + 20;
    });

    // Explosion particles
    gs.particles = gs.particles.filter((pt) => {
      pt.x += pt.vx; pt.y += pt.vy; pt.life--;
      const alpha = pt.life / pt.maxLife;
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = pt.color; ctx.shadowColor = pt.color; ctx.shadowBlur = 5;
      ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      ctx.restore();
      return pt.life > 0;
    });

    // Engine trail particles
    gs.trailParticles = gs.trailParticles.filter((tp) => {
      tp.life--;
      const alpha = tp.life / tp.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = skin.engineColor;
      ctx.shadowColor = skin.engineColor;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y + (tp.maxLife - tp.life) * 0.5, tp.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return tp.life > 0;
    });

    drawPlayer(ctx, p, gs.shield > 0);

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(10, 10, 120, 16);
    ctx.strokeStyle = skin.glowColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 120, 16);
    const healthPct = Math.max(0, gs.health) / 100;
    ctx.fillStyle = healthPct > 0.5 ? "#00ff66" : healthPct > 0.25 ? "#ffcc00" : "#ff3333";
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
    ctx.fillRect(12, 12, 116 * healthPct, 12);
    ctx.shadowBlur = 0;

    ctx.fillStyle = skin.glowColor;
    ctx.shadowColor = skin.glowColor; ctx.shadowBlur = 5;
    ctx.font = "bold 20px Orbitron"; ctx.textAlign = "right";
    ctx.fillText(`${gs.score}`, CANVAS_WIDTH - 15, 26);
    ctx.shadowBlur = 0;

    ctx.font = "10px Rajdhani";
    ctx.fillStyle = `${skin.glowColor}80`;
    ctx.fillText("SCORE", CANVAS_WIDTH - 15, 38);
    ctx.textAlign = "left";
    ctx.fillText("SHIELD", 12, 38);

    ctx.textAlign = "center";
    ctx.font = "10px Orbitron";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(`WAVE ${gs.wave}`, CANVAS_WIDTH / 2, 20);

    const indicators: string[] = [];
    if (gs.shield > 0) indicators.push("🛡️ SHIELD");
    if (gs.rapidFire > 0) indicators.push("⚡ RAPID");
    if (gs.multiShot > 0) indicators.push("🔥 MULTI");
    if (indicators.length > 0) {
      ctx.font = "11px Orbitron"; ctx.textAlign = "center";
      ctx.fillStyle = "#ffcc00"; ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 5;
      ctx.fillText(indicators.join("  "), CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
      ctx.shadowBlur = 0;
    }

    if (gs.bossActive) {
      ctx.font = "12px Orbitron"; ctx.textAlign = "center";
      ctx.fillStyle = "#ff0000"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 10;
      ctx.fillText("⚠ BOSS FIGHT ⚠", CANVAS_WIDTH / 2, 50);
      ctx.shadowBlur = 0;
    }

    ctx.restore(); // end shake transform

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = useCallback(() => {
    const gs = gameStateRef.current;
    const user = getCurrentUser();
    const settings = getSettings();
    skinRef.current = getSkin(user?.selectedSkin || "default");
    gs.difficultyMult = DIFFICULTY_MULTIPLIERS[settings.difficulty];
    gs.keyBindings = settings.keyBindings;
    soundEngine.setVolume(settings.volume / 100);

    gs.player = { x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT - 80, width: 40, height: 50, speed: 5 };
    gs.bullets = []; gs.enemies = []; gs.particles = []; gs.powerUps = []; gs.trailParticles = [];
    gs.score = 0; gs.health = 100; gs.shield = 0; gs.rapidFire = 0; gs.multiShot = 0;
    gs.gameOver = false; gs.paused = false;
    gs.lastEnemySpawn = 0; gs.spawnInterval = 1500; gs.difficulty = 1; gs.frameCount = 0; gs.lastShot = 0;
    gs.touchMove = { dx: 0, dy: 0 }; gs.touchFiring = false;
    gs.wave = 1; gs.waveKills = 0; gs.waveThreshold = 10; gs.bossActive = false;
    gs.waveTransition = false; gs.waveTransitionTimer = 0;
    gs.shakeIntensity = 0;
    setScore(0); setHealth(100); setGameOver(false); setPaused(false); setGameStarted(true); setWave(1); setWaveAnnounce(0);
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
      const kb = gameStateRef.current.keyBindings;
      const gameKeys = [kb.up, kb.down, kb.left, kb.right, kb.shoot, "w", "a", "s", "d"];
      if (gameKeys.includes(e.key)) e.preventDefault();
      gameStateRef.current.keys[e.key] = true;
      if (e.key === kb.pause || e.key === "Escape") {
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
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="rounded-lg neon-border box-glow-cyan" style={{ imageRendering: "pixelated" }} />
      </div>

      {gameStarted && (
        <button onClick={toggleMute} className="absolute top-2 right-2 z-20 p-2 text-muted-foreground hover:text-primary transition-colors">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Wave announcement overlay */}
      {waveAnnounce > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <div className="text-center animate-fade-in">
            <p className="font-display text-sm text-muted-foreground tracking-widest mb-1">INCOMING</p>
            <h2 className="font-display text-4xl text-primary text-glow-cyan animate-pulse">WAVE {waveAnnounce}</h2>
            {waveAnnounce % 10 === 0 && (
              <p className="font-display text-lg text-destructive mt-2 animate-pulse">⚠ BOSS INCOMING ⚠</p>
            )}
          </div>
        </div>
      )}

      {!gameStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <h2 className="font-display text-3xl text-glow-cyan mb-4 text-primary">READY?</h2>
          <p className="text-muted-foreground mb-2 text-sm font-body">Arrow keys to move • Space to shoot</p>
          <p className="text-muted-foreground mb-6 text-xs font-body">P to pause • Boss every 10 waves!</p>
          <button onClick={startGame} className="px-8 py-3 bg-primary text-primary-foreground font-display text-lg rounded-lg box-glow-cyan hover:scale-105 transition-transform">
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

      {gameStarted && !gameOver && !paused && (
        <TouchControls onMove={handleTouchMove} onFire={handleTouchFire} />
      )}
    </div>
  );
};

export default GameCanvas;
