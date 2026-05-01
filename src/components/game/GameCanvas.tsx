import { useRef, useEffect, useCallback, useState } from "react";
import GameOverModal from "./GameOverModal";
import TouchControls from "./TouchControls";
import { soundEngine } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getSkin, type ShipSkin } from "@/lib/skins";
import { getSettings, DIFFICULTY_MULTIPLIERS } from "@/lib/settings";
import { getUpgrades, getStatBonuses, WEAPONS, type WeaponType } from "@/lib/upgrades";
import { checkGameAchievements, ACHIEVEMENTS } from "@/lib/achievements";
import { getCosmetics, getCosmeticById } from "@/lib/cosmetics";
import { updateChallengeProgress } from "@/lib/challenges";
import { updateLifetimeStats } from "@/lib/stats";
import { calculateGameXP, addXP } from "@/lib/xp";
import { getActiveBoosts, clearActiveBoosts, POWER_UP_BOOSTS } from "@/pages/PowerUpShop";
import Tutorial, { hasTutorialBeenSeen } from "./Tutorial";

interface Player { x: number; y: number; width: number; height: number; speed: number; }
interface Bullet { x: number; y: number; width: number; height: number; speed: number; damage: number; angle?: number; homing?: boolean; targetId?: number; }
interface EnemyBullet { x: number; y: number; width: number; height: number; speed: number; angle: number; }
interface Enemy {
  x: number; y: number; width: number; height: number; speed: number; health: number; maxHealth: number;
  type: "normal" | "fast" | "tank" | "boss" | "shield" | "stealth" | "splitter" | "mini";
  lastShot: number;
  id: number;
  shieldFacing?: "front";
  stealthAlpha?: number;
  stealthPhase?: number;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface Star { x: number; y: number; speed: number; size: number; brightness: number; }
interface PowerUp {
  x: number; y: number; width: number; height: number; speed: number;
  type: "shield" | "rapid" | "multi" | "health" | "speed" | "double";
}
interface TrailParticle { x: number; y: number; life: number; maxLife: number; size: number; }

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 700;

const POWERUP_COLORS: Record<string, string> = {
  shield: "#00ccff", rapid: "#ffcc00", multi: "#ff66ff", health: "#00ff66", speed: "#ff8800", double: "#ff3399",
};
const POWERUP_LABELS: Record<string, string> = {
  shield: "🛡️", rapid: "⚡", multi: "🔥", health: "💚", speed: "🚀", double: "💥",
};
const ENEMY_COLORS: Record<string, string> = {
  normal: "#ff3366", fast: "#ffaa00", tank: "#6644ff", boss: "#ff0000", shield: "#00aaff", stealth: "#88ffbb", splitter: "#ff88cc", mini: "#ff88cc",
};
const WEAPON_COLORS: Record<WeaponType, string> = {
  laser: "#00ffcc", spread: "#ff66ff", homing: "#ffaa00", triple: "#66ffff", beam: "#ff4444",
};

const ENEMY_SHOOT_INTERVALS: Record<string, number> = {
  normal: 3000, fast: 4000, tank: 2000, boss: 800, shield: 2500, stealth: 3500, splitter: 3000, mini: 5000,
};

let enemyIdCounter = 0;

interface GameCanvasProps {
  mode?: "normal" | "bossrush";
}

const GameCanvas = ({ mode = "normal" }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skinRef = useRef<ShipSkin>(getSkin("default"));

  const gameStateRef = useRef({
    player: { x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT - 80, width: 40, height: 50, speed: 5 } as Player,
    bullets: [] as Bullet[],
    enemyBullets: [] as EnemyBullet[],
    enemies: [] as Enemy[],
    particles: [] as Particle[],
    stars: [] as Star[],
    powerUps: [] as PowerUp[],
    trailParticles: [] as TrailParticle[],
    score: 0, health: 100, maxHealth: 100, shield: 0, rapidFire: 0, multiShot: 0,
    gameOver: false, paused: false,
    keys: {} as Record<string, boolean>,
    touchMove: { dx: 0, dy: 0 }, touchFiring: false,
    lastEnemySpawn: 0, spawnInterval: 1500, difficulty: 1,
    frameCount: 0, lastShot: 0, shotInterval: 150,
    wave: 1, waveKills: 0, waveThreshold: 10, bossActive: false,
    waveTransition: false, waveTransitionTimer: 0,
    shakeIntensity: 0, shakeDecay: 0.9, hitFlash: 0,
    difficultyMult: DIFFICULTY_MULTIPLIERS["normal"],
    keyBindings: getSettings().keyBindings,
    combo: 0, comboTimer: 0, maxCombo: 0, comboMultiplier: 1,
    currentWeapon: "laser" as WeaponType,
    unlockedWeapons: ["laser"] as WeaponType[],
    weaponFireRate: 150,
    weaponDamage: 1,
    speedBonus: 0, fireRateMult: 1, damageBonus: 0, shieldDurBonus: 0, beamHeatMax: 120,
    bossKilledThisGame: false,
    noDamageKills: 0,
    totalKills: 0,
    bossKills: 0,
    cosmeticExplosionColor: null as string | null,
    cosmeticExplosionColor2: null as string | null,
    cosmeticTrailColor: null as string | null,
    cosmeticTrailColor2: null as string | null,
    cosmeticBulletColor: null as string | null,
    cosmeticBulletColor2: null as string | null,
    doubleScoreTimer: 0,
    armorTimer: 0,
    magnetActive: false,
    speedBoostTimer: 0,
    doubleBulletTimer: 0,
    beamActive: false,
    beamCharge: 0, // 0-180 frames (3 seconds to full charge)
    beamHeat: 0, // 0-120 frames at full charge before overheat
    beamOverheated: false, // forced cooldown state
    beamCooldown: 0, // cooldown frames remaining (90 = 1.5s)
    tapRipples: [] as { x: number; y: number; life: number; maxLife: number }[],
    aimTarget: null as { x: number; y: number } | null,
    holdFiring: false,
  });
  const animFrameRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [muted, setMuted] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [wave, setWave] = useState(1);
  const [waveAnnounce, setWaveAnnounce] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [maxMultiplier, setMaxMultiplier] = useState(1);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>("laser");
  const [achievementPopup, setAchievementPopup] = useState<string | null>(null);
  const [xpGained, setXpGained] = useState<{ xp: number; levelsGained: number; newRewards: { level: number; label: string; icon: string }[] } | null>(null);

  useEffect(() => {
    if (!hasTutorialBeenSeen()) setShowTutorial(true);
  }, []);

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

  const showAchievementPopup = (id: string) => {
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (def) {
      soundEngine.achievementUnlock();
      setAchievementPopup(`${def.icon} ${def.name}`);
      setTimeout(() => setAchievementPopup(null), 3000);
    }
  };

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
    const dropChance = gameStateRef.current.magnetActive ? 0.4 : 0.2;
    if (Math.random() > dropChance) return;
    const types: PowerUp["type"][] = ["shield", "rapid", "multi", "health", "speed", "double"];
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

    if (r < 0.08) {
      type = "splitter"; w = 38; h = 38; speed = (1.3 + gs.difficulty * 0.2) * dm.speed; hp = Math.round((2 + Math.floor(gs.difficulty * 0.3)) * dm.health);
    } else if (r < 0.18) {
      type = "stealth"; w = 28; h = 32; speed = (1.8 + gs.difficulty * 0.25) * dm.speed; hp = 2;
    } else if (r < 0.27) {
      type = "shield"; w = 35; h = 40; speed = (1.2 + gs.difficulty * 0.2) * dm.speed; hp = Math.round((3 + Math.floor(gs.difficulty * 0.5)) * dm.health);
    } else if (r < 0.42) {
      type = "fast"; w = 22; h = 28; speed = (3 + gs.difficulty * 0.4) * dm.speed; hp = 1;
    } else if (r < 0.52) {
      type = "tank"; w = 45; h = 45; speed = (0.8 + gs.difficulty * 0.15) * dm.speed; hp = Math.round((4 + Math.floor(gs.difficulty)) * dm.health);
    }

    const enemy: Enemy = { x: Math.random() * (CANVAS_WIDTH - w), y: -h - 10, width: w, height: h, speed, health: hp, maxHealth: hp, type, lastShot: Date.now(), id: enemyIdCounter++ };
    if (type === "shield") enemy.shieldFacing = "front";
    if (type === "stealth") { enemy.stealthAlpha = 0; enemy.stealthPhase = Math.random() * Math.PI * 2; }
    gs.enemies.push(enemy);
  };

  const spawnBoss = () => {
    const gs = gameStateRef.current;
    const hp = Math.round((30 + gs.wave * 10) * gs.difficultyMult.health);
    gs.enemies.push({ x: CANVAS_WIDTH / 2 - 50, y: -100, width: 100, height: 80, speed: 0.5, health: hp, maxHealth: hp, type: "boss", lastShot: Date.now(), id: enemyIdCounter++ });
    gs.bossActive = true;
  };

  const triggerShake = (intensity: number) => {
    gameStateRef.current.shakeIntensity = intensity;
    gameStateRef.current.hitFlash = 8;
  };

  const shootEnemyBullet = (e: Enemy) => {
    const gs = gameStateRef.current;
    const p = gs.player;
    const cx = e.x + e.width / 2;
    const cy = e.y + e.height;
    const dx = (p.x + p.width / 2) - cx;
    const dy = (p.y + p.height / 2) - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const angle = Math.atan2(dy, dx);
    const speed = e.type === "boss" ? 4 : 3;

    if (e.type === "boss") {
      for (let i = -1; i <= 1; i++) {
        gs.enemyBullets.push({ x: cx - 3, y: cy, width: 6, height: 6, speed, angle: angle + i * 0.3 });
      }
    } else {
      gs.enemyBullets.push({ x: cx - 2, y: cy, width: 4, height: 4, speed, angle });
    }
  };

  const switchWeapon = useCallback((weapon: WeaponType) => {
    const gs = gameStateRef.current;
    if (!gs.unlockedWeapons.includes(weapon)) return;
    if (gs.currentWeapon !== weapon) soundEngine.weaponSwitch();
    gs.currentWeapon = weapon;
    const def = WEAPONS.find(w => w.id === weapon)!;
    gs.weaponFireRate = def.fireRate;
    gs.weaponDamage = def.damage;
    setCurrentWeapon(weapon);
  }, []);

  const shootWeapon = () => {
    const gs = gameStateRef.current;
    const p = gs.player;
    const dmgBonus = gs.damageBonus;
    const cx = p.x + p.width / 2;
    const cy = p.y;

    // Aim-assist: find nearest enemy and calc slight angle toward it
    let aimAngle = 0;
    if (gs.enemies.length > 0) {
      let nearest: Enemy | null = null;
      let minDist = Infinity;
      gs.enemies.forEach(e => {
        const d = Math.sqrt((e.x + e.width / 2 - cx) ** 2 + (e.y + e.height / 2 - cy) ** 2);
        if (d < minDist) { minDist = d; nearest = e; }
      });
      if (nearest && minDist < 400) {
        const ex = (nearest as Enemy).x + (nearest as Enemy).width / 2;
        const ey = (nearest as Enemy).y + (nearest as Enemy).height / 2;
        aimAngle = Math.atan2(ex - cx, cy - ey) * 0.4; // 40% aim-assist strength
        gs.aimTarget = { x: ex, y: ey };
      } else {
        gs.aimTarget = null;
      }
    } else {
      gs.aimTarget = null;
    }

    switch (gs.currentWeapon) {
      case "laser":
        gs.bullets.push({ x: cx - 2, y: p.y, width: 4, height: 12, speed: 8, damage: 1 + dmgBonus, angle: aimAngle });
        break;
      case "spread":
        for (let i = -1; i <= 1; i++) {
          gs.bullets.push({ x: cx - 2 + i * 10, y: p.y + Math.abs(i) * 5, width: 4, height: 10, speed: 7, damage: 1 + dmgBonus, angle: i * 0.15 + aimAngle * 0.5 });
        }
        break;
      case "homing": {
        let nearest: Enemy | null = null;
        let minDist = Infinity;
        gs.enemies.forEach(e => {
          const d = Math.sqrt((e.x + e.width / 2 - cx) ** 2 + (e.y + e.height / 2 - p.y) ** 2);
          if (d < minDist) { minDist = d; nearest = e; }
        });
        gs.bullets.push({ x: cx - 3, y: p.y, width: 6, height: 10, speed: 6, damage: 2 + dmgBonus, homing: true, targetId: nearest?.id });
        break;
      }
      case "triple":
        for (let i = -1; i <= 1; i++) {
          gs.bullets.push({ x: cx - 2 + i * 8, y: p.y + Math.abs(i) * 3, width: 4, height: 10, speed: 8, damage: 1 + dmgBonus, angle: i * 0.05 + aimAngle * 0.6 });
        }
        break;
      case "beam":
        // Beam doesn't fire bullets — it's handled in the game loop
        gs.beamActive = true;
        break;
    }
    gs.lastShot = Date.now();
    soundEngine.shoot();
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
    // Beam heat warning: red glow + smoke particles when heat > 80%
    const gs = gameStateRef.current;
    if (gs.currentWeapon === "beam" && gs.beamHeat > gs.beamHeatMax * 0.8) {
      const heatRatio = gs.beamHeat / gs.beamHeatMax;
      const intensity = (heatRatio - 0.8) / 0.2; // 0 to 1
      // Pulsing red glow around ship
      const glowAlpha = 0.3 + intensity * 0.5 + Math.sin(gs.frameCount * 0.5) * 0.15;
      ctx.shadowColor = `rgba(255, ${Math.floor(60 - intensity * 60)}, 0, 1)`;
      ctx.shadowBlur = 25 + intensity * 25;
      ctx.fillStyle = `rgba(255, ${Math.floor(80 - intensity * 80)}, 0, ${glowAlpha})`;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 28 + intensity * 8, 0, Math.PI * 2);
      ctx.fill();
      // Smoke particles rising from ship
      if (gs.frameCount % (3 - Math.floor(intensity * 2)) === 0) {
        const smokeX = p.x + p.width / 2 + (Math.random() - 0.5) * 20;
        const smokeY = p.y + p.height * 0.6;
        spawnParticles(smokeX, smokeY, gs.beamOverheated ? "#ff2200" : "#ff880088", 1);
      }
    }
    // Cooldown timer overlay during overheat lockout
    if (gs.currentWeapon === "beam" && gs.beamOverheated && gs.beamCooldown > 0) {
      const cooldownProgress = 1 - gs.beamCooldown / 90; // 0 → 1 as cooldown completes
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height / 2;
      const radius = 22;
      // Background ring (dark)
      ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      // Progress arc (cyan → green)
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + cooldownProgress * Math.PI * 2;
      ctx.strokeStyle = cooldownProgress < 0.5
        ? `rgba(0, 200, 255, ${0.6 + cooldownProgress * 0.4})`
        : `rgba(0, 255, ${Math.floor(100 + cooldownProgress * 155)}, ${0.7 + cooldownProgress * 0.3})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.stroke();
      // Percentage text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.floor(cooldownProgress * 100)}%`, cx, cy);
    }
    ctx.restore();
  };

  const drawEnemy = (ctx: CanvasRenderingContext2D, e: Enemy) => {
    const color = ENEMY_COLORS[e.type];
    ctx.save();

    // Stealth: apply alpha
    if (e.type === "stealth") {
      ctx.globalAlpha = e.stealthAlpha ?? 1;
    }

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
    } else if (e.type === "shield") {
      // Diamond body
      const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
      ctx.beginPath();
      ctx.moveTo(cx, e.y);
      ctx.lineTo(e.x + e.width, cy);
      ctx.lineTo(cx, e.y + e.height);
      ctx.lineTo(e.x, cy);
      ctx.closePath();
      ctx.fill();
      // Front shield bar
      ctx.fillStyle = "rgba(0, 170, 255, 0.7)";
      ctx.shadowColor = "#00aaff"; ctx.shadowBlur = 12;
      ctx.fillRect(e.x - 2, e.y + e.height - 6, e.width + 4, 6);
      // Health bar
      if (e.health < e.maxHealth) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(e.x, e.y - 8, e.width, 4);
        ctx.fillStyle = "#00aaff";
        ctx.fillRect(e.x, e.y - 8, e.width * (e.health / e.maxHealth), 4);
      }
    } else if (e.type === "stealth") {
      // Ghost-like shape
      const cx = e.x + e.width / 2;
      ctx.beginPath();
      ctx.arc(cx, e.y + e.height / 3, e.width / 2, Math.PI, 0);
      ctx.lineTo(e.x + e.width, e.y + e.height);
      // Wavy bottom
      for (let i = e.width; i >= 0; i -= e.width / 4) {
        const waveY = e.y + e.height - (i % (e.width / 2) === 0 ? 0 : 8);
        ctx.lineTo(e.x + i, waveY);
      }
      ctx.closePath();
      ctx.fill();
    } else if (e.type === "splitter" || e.type === "mini") {
      // Hexagon shape
      const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
      const r = e.width / 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (e.type === "splitter") {
        // Inner split line
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, e.y); ctx.lineTo(cx, e.y + e.height); ctx.stroke();
      }
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
    if (e.type !== "boss" && e.type !== "stealth") {
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

    if (gs.waveTransition) {
      gs.waveTransitionTimer--;
      if (gs.waveTransitionTimer <= 0) gs.waveTransition = false;
      ctx.fillStyle = "#080c14";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      gs.stars.forEach((s) => {
        s.y += s.speed;
        if (s.y > CANVAS_HEIGHT) { s.y = 0; s.x = Math.random() * CANVAS_WIDTH; }
        ctx.fillStyle = `rgba(180, 230, 255, ${s.brightness})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      drawPlayer(ctx, gs.player, gs.shield > 0);
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    gs.frameCount++;
    if (gs.hitFlash > 0) gs.hitFlash--;
    if (gs.shield > 0) gs.shield--;
    if (gs.rapidFire > 0) gs.rapidFire--;
    if (gs.multiShot > 0) gs.multiShot--;
    if (gs.doubleScoreTimer > 0) gs.doubleScoreTimer--;
    if (gs.armorTimer > 0) gs.armorTimer--;
    if (gs.speedBoostTimer > 0) gs.speedBoostTimer--;
    if (gs.doubleBulletTimer > 0) gs.doubleBulletTimer--;

    if (gs.comboTimer > 0) {
      gs.comboTimer--;
      if (gs.comboTimer <= 0) { gs.combo = 0; gs.comboMultiplier = 1; }
    }

    let shakeX = 0, shakeY = 0;
    if (gs.shakeIntensity > 0.5) {
      shakeX = (Math.random() - 0.5) * gs.shakeIntensity;
      shakeY = (Math.random() - 0.5) * gs.shakeIntensity;
      gs.shakeIntensity *= gs.shakeDecay;
    } else { gs.shakeIntensity = 0; }

    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    gs.stars.forEach((s) => {
      s.y += s.speed;
      if (s.y > CANVAS_HEIGHT) { s.y = 0; s.x = Math.random() * CANVAS_WIDTH; }
      ctx.fillStyle = `rgba(180, 230, 255, ${s.brightness})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    ctx.strokeStyle = "rgba(0, 255, 200, 0.03)"; ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke(); }

    const p = gs.player;
    const spd = (p.speed + gs.speedBonus) * (gs.speedBoostTimer > 0 ? 1.5 : 1);
    if (gs.keys[kb.left] || gs.keys["a"]) p.x -= spd;
    if (gs.keys[kb.right] || gs.keys["d"]) p.x += spd;
    if (gs.keys[kb.up] || gs.keys["w"]) p.y -= spd;
    if (gs.keys[kb.down] || gs.keys["s"]) p.y += spd;
    p.x += gs.touchMove.dx * spd; p.y += gs.touchMove.dy * spd;
    p.x = Math.max(0, Math.min(CANVAS_WIDTH - p.width, p.x));
    p.y = Math.max(0, Math.min(CANVAS_HEIGHT - p.height, p.y));

    if (gs.frameCount % 2 === 0) {
      gs.trailParticles.push({ x: p.x + p.width / 2 + (Math.random() - 0.5) * 6, y: p.y + p.height + 5, life: 15 + Math.random() * 10, maxLife: 25, size: 1.5 + Math.random() * 2 });
    }

    const now = Date.now();
    const baseInterval = gs.rapidFire > 0 ? 80 : gs.weaponFireRate;
    const interval = baseInterval * gs.fireRateMult;
    const firing = gs.keys[kb.shoot] || gs.touchFiring;
    if (firing && now - gs.lastShot > interval) {
      if (gs.multiShot > 0) {
        const dmg = 1 + gs.damageBonus;
        gs.bullets.push({ x: p.x + p.width / 2 - 2, y: p.y, width: 4, height: 12, speed: 8, damage: dmg });
        gs.bullets.push({ x: p.x + p.width / 2 - 12, y: p.y + 5, width: 4, height: 12, speed: 8, damage: dmg });
        gs.bullets.push({ x: p.x + p.width / 2 + 8, y: p.y + 5, width: 4, height: 12, speed: 8, damage: dmg });
        gs.lastShot = now; soundEngine.shoot();
      } else {
        shootWeapon();
        // Double bullet: fire a second bullet slightly offset
        if (gs.doubleBulletTimer > 0) {
          setTimeout(() => shootWeapon(), 50);
        }
      }
    }

    // Beam weapon: charge-up mechanic
    if (gs.currentWeapon === "beam") {
      // Handle overheat cooldown
      if (gs.beamOverheated) {
        gs.beamActive = false;
        gs.beamCooldown = Math.max(0, gs.beamCooldown - 1);
        gs.beamCharge = Math.max(0, gs.beamCharge - 3);
        gs.beamHeat = Math.max(0, gs.beamHeat - 2);
        if (gs.beamCooldown <= 0) {
          gs.beamOverheated = false;
          gs.beamHeat = 0;
        }
      } else if (firing) {
        gs.beamActive = true;
        const wasFull = gs.beamCharge >= 180;
        gs.beamCharge = Math.min(180, gs.beamCharge + 1);
        // Shake on reaching full charge
        if (!wasFull && gs.beamCharge >= 180) {
          gs.shakeIntensity = 6;
        }
        // Continuous subtle shake at full charge
        if (gs.beamCharge >= 180 && gs.shakeIntensity < 1.5) {
          gs.shakeIntensity = 1.5;
        }
        // Accumulate heat at full charge
        if (gs.beamCharge >= 180) {
          gs.beamHeat = Math.min(gs.beamHeatMax, gs.beamHeat + 1);
          // Sizzle warning sound every 20 frames when heat > 80%
          if (gs.beamHeat > gs.beamHeatMax * 0.8 && gs.beamHeat < gs.beamHeatMax && gs.frameCount % 20 === 0) {
            soundEngine.beamHeatWarning();
          }
          if (gs.beamHeat >= gs.beamHeatMax) {
            gs.beamOverheated = true;
            gs.beamCooldown = 90; // 1.5s cooldown
            gs.shakeIntensity = 8; // big shake on overheat
            soundEngine.beamOverheat();
          }
        } else {
          gs.beamHeat = Math.max(0, gs.beamHeat - 1); // slow heat decay when not full
        }
      } else {
        gs.beamActive = false;
        gs.beamCharge = Math.max(0, gs.beamCharge - 4);
        gs.beamHeat = Math.max(0, gs.beamHeat - 2); // heat dissipates when not firing
      }
    }

    // Beam weapon: render beam and deal damage
    if (gs.beamActive && gs.currentWeapon === "beam") {
      const charge = gs.beamCharge / 180; // 0 to 1
      const bx = p.x + p.width / 2;
      const baseWidth = 4 + charge * 20; // 4px → 24px
      const beamWidth = baseWidth + Math.sin(gs.frameCount * 0.3) * (1 + charge * 2);
      const beamColor = gs.cosmeticBulletColor || "#ff4444";
      ctx.save();
      // Outer glow scales with charge
      ctx.shadowColor = beamColor;
      ctx.shadowBlur = 8 + charge * 25;
      const grad = ctx.createLinearGradient(bx, p.y, bx, 0);
      grad.addColorStop(0, beamColor);
      grad.addColorStop(0.4, beamColor + (charge > 0.5 ? "ee" : "aa"));
      grad.addColorStop(1, beamColor + "33");
      ctx.fillStyle = grad;
      ctx.fillRect(bx - beamWidth / 2, 0, beamWidth, p.y);
      // Inner core gets brighter with charge
      const coreAlpha = Math.floor(0x66 + charge * 0x99).toString(16);
      ctx.fillStyle = `#ffffff${coreAlpha}`;
      ctx.fillRect(bx - (0.5 + charge * 1.5), 0, 1 + charge * 3, p.y);
      // Charge indicator ring at ship
      if (charge < 1) {
        ctx.strokeStyle = beamColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, p.y, 12 + charge * 6, -Math.PI / 2, -Math.PI / 2 + charge * Math.PI * 2);
        ctx.stroke();
      } else {
        // Full charge pulse
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 + Math.sin(gs.frameCount * 0.2) * 1;
        ctx.beginPath();
        ctx.arc(bx, p.y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      // Damage scales: 0.15 at start → 0.6 at full charge
      const beamDmg = (0.15 + charge * 0.45 + gs.damageBonus * 0.15);
      gs.enemies.forEach(e => {
        if (e.type === "stealth" && (e.stealthAlpha ?? 1) < 0.3) return;
        const ex = e.x, ew = e.width;
        if (bx + beamWidth / 2 > ex && bx - beamWidth / 2 < ex + ew && e.y + e.height > 0 && e.y < p.y) {
          e.health -= beamDmg;
          if (gs.frameCount % (charge > 0.7 ? 2 : 4) === 0) {
            spawnParticles(bx + (Math.random() - 0.5) * beamWidth, e.y + e.height / 2, beamColor, 1 + Math.floor(charge * 3));
          }
        }
      });
    }

    gs.bullets = gs.bullets.filter((b) => {
      if (b.homing && b.targetId !== undefined) {
        const target = gs.enemies.find(e => e.id === b.targetId);
        if (target) { const tx = target.x + target.width / 2 - b.x; const ty = target.y + target.height / 2 - b.y; const a = Math.atan2(ty, tx); b.x += Math.cos(a) * b.speed; b.y += Math.sin(a) * b.speed; }
        else { b.y -= b.speed; }
      } else if (b.angle) { b.x += Math.sin(b.angle) * b.speed; b.y -= Math.cos(b.angle) * b.speed * 0.95; }
      else { b.y -= b.speed; }
      ctx.save();
      const wColor = gs.multiShot > 0 ? "#ff66ff" : gs.rapidFire > 0 ? "#ffcc00" : (gs.cosmeticBulletColor || WEAPON_COLORS[gs.currentWeapon]);
      ctx.fillStyle = wColor; ctx.shadowColor = wColor; ctx.shadowBlur = 8;
      if (b.homing) { ctx.beginPath(); ctx.arc(b.x + b.width / 2, b.y + b.height / 2, 4, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillRect(b.x, b.y, b.width, b.height); }
      ctx.restore();
      return b.y > -b.height && b.y < CANVAS_HEIGHT + 10 && b.x > -20 && b.x < CANVAS_WIDTH + 20;
    });

    const spawnInt = gs.spawnInterval * gs.difficultyMult.spawnRate;
    if (mode === "bossrush") {
      // Boss rush: spawn support enemies slower, boss per wave
      if (now - gs.lastEnemySpawn > spawnInt * 2 && !gs.bossActive) { spawnEnemy(); gs.lastEnemySpawn = now; }
      if (!gs.bossActive && gs.enemies.filter(e => e.type === "boss").length === 0) {
        gs.wave++; setWave(gs.wave); setWaveAnnounce(gs.wave);
        setTimeout(() => setWaveAnnounce(0), 2000);
        gs.difficulty += 0.3;
        spawnBoss();
      }
    } else {
      if (now - gs.lastEnemySpawn > spawnInt && !gs.bossActive) { spawnEnemy(); gs.lastEnemySpawn = now; }
      if (gs.waveKills >= gs.waveThreshold && !gs.bossActive) {
        gs.wave++; setWave(gs.wave); setWaveAnnounce(gs.wave);
        gs.waveTransition = true; gs.waveTransitionTimer = 90;
        setTimeout(() => setWaveAnnounce(0), 2000);
        if (gs.wave % 10 === 0) spawnBoss();
        gs.waveKills = 0; gs.waveThreshold = 10 + gs.wave * 2;
      }
    }

    if (gs.frameCount % 1200 === 0) { gs.difficulty += 0.5; gs.spawnInterval = Math.max(400, gs.spawnInterval - 100); }

    gs.enemies = gs.enemies.filter((e) => {
      if (e.type === "boss") { e.y = Math.min(60, e.y + e.speed); e.x += Math.sin(gs.frameCount * 0.02) * 1.5; e.x = Math.max(0, Math.min(CANVAS_WIDTH - e.width, e.x)); }
      else { e.y += e.speed; }

      // Stealth: cycle alpha
      if (e.type === "stealth") {
        e.stealthPhase = (e.stealthPhase || 0) + 0.03;
        e.stealthAlpha = 0.15 + Math.abs(Math.sin(e.stealthPhase)) * 0.85;
      }

      drawEnemy(ctx, e);

      if (e.y > 0 && e.y < CANVAS_HEIGHT - 100) {
        // Stealth enemies only shoot when visible
        const canShoot = e.type !== "stealth" || (e.stealthAlpha ?? 1) > 0.5;
        const shootInterval = ENEMY_SHOOT_INTERVALS[e.type] / gs.difficultyMult.speed;
        if (canShoot && now - e.lastShot > shootInterval) { shootEnemyBullet(e); e.lastShot = now; }
      }

      for (let i = gs.bullets.length - 1; i >= 0; i--) {
        const b = gs.bullets[i];
        if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
          // Stealth: can't be hit when nearly invisible
          if (e.type === "stealth" && (e.stealthAlpha ?? 1) < 0.3) {
            continue;
          }
          // Shield: blocks bullets coming from below (player shoots upward)
          if (e.type === "shield" && e.shieldFacing === "front" && b.y + b.height > e.y + e.height * 0.5 && !b.homing) {
            gs.bullets.splice(i, 1);
            spawnParticles(b.x, b.y, "#00aaff", 4);
            continue;
          }
          gs.bullets.splice(i, 1);
          e.health -= b.damage;
          if (e.health <= 0) {
            gs.combo++; gs.comboTimer = 120; gs.comboMultiplier = 1 + Math.floor(gs.combo / 3) * 0.5;
            soundEngine.comboKill(gs.combo);
            if (gs.combo > gs.maxCombo) { gs.maxCombo = gs.combo; setMaxCombo(gs.maxCombo); }
            // UNSTOPPABLE flash + burst at combo 15
            if (gs.combo === 15) {
              gs.hitFlash = 15;
              for (let k = 0; k < 40; k++) {
                const angle = (Math.PI * 2 / 40) * k;
                gs.particles.push({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, vx: Math.cos(angle) * (3 + Math.random() * 4), vy: Math.sin(angle) * (3 + Math.random() * 4), life: 30 + Math.random() * 20, maxLife: 50, color: ["#ff3333", "#ff66ff", "#ffcc00", "#00ffcc"][k % 4], size: 2 + Math.random() * 3 });
              }
            }
            if (gs.comboMultiplier > maxMultiplier) { setMaxMultiplier(gs.comboMultiplier); }
            const basePts = e.type === "boss" ? 200 : e.type === "tank" ? 30 : e.type === "shield" ? 25 : e.type === "splitter" ? 20 : e.type === "stealth" ? 20 : e.type === "fast" ? 15 : e.type === "mini" ? 5 : 10;
            const scoreMult = gs.doubleScoreTimer > 0 ? 2 : 1;
            gs.score += Math.round(basePts * gs.comboMultiplier * scoreMult); setScore(gs.score);
            gs.waveKills++;
            const explosionColor = gs.cosmeticExplosionColor || ENEMY_COLORS[e.type];
            spawnParticles(e.x + e.width / 2, e.y + e.height / 2, explosionColor, e.type === "boss" ? 30 : 12);
            soundEngine.explosion();
            gs.totalKills++;
            gs.noDamageKills++;
            spawnPowerUp(e.x + e.width / 2, e.y + e.height / 2);
            // Splitter: spawn 2 mini enemies
            if (e.type === "splitter") {
              for (let s = -1; s <= 1; s += 2) {
                gs.enemies.push({
                  x: e.x + e.width / 2 + s * 20, y: e.y, width: 18, height: 18,
                  speed: e.speed * 1.5, health: 1, maxHealth: 1, type: "mini",
                  lastShot: Date.now(), id: enemyIdCounter++,
                });
              }
            }
            if (e.type === "boss") {
              gs.bossActive = false; gs.bossKilledThisGame = true; gs.bossKills++;
              triggerShake(20);
              spawnPowerUp(e.x + 20, e.y + 20); spawnPowerUp(e.x + e.width - 20, e.y + 20);
            }
            return false;
          }
          spawnParticles(b.x, b.y, "#ffffff", 3);
          if (e.type === "boss") triggerShake(6);
        }
      }

      if (p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) {
        if (gs.shield > 0) { gs.shield = 0; spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#00ccff", 15); soundEngine.explosion(); }
        else {
          const dmg = e.type === "boss" ? 40 : e.type === "tank" ? 30 : 20;
          const actualDmg = gs.armorTimer > 0 ? Math.round(dmg * 0.5) : dmg;
          gs.health -= actualDmg; setHealth(gs.health); soundEngine.hit(); triggerShake(10);
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, "#ffcc00", 8);
          gs.combo = 0; gs.comboMultiplier = 1; gs.comboTimer = 0; gs.noDamageKills = 0;
          if (gs.health <= 0) { gs.gameOver = true; setGameOver(true); soundEngine.gameOver(); soundEngine.stopMusic(); }
        }
        if (e.type !== "boss") return false;
      }

      if (e.y > CANVAS_HEIGHT && e.type !== "boss") {
        if (gs.shield <= 0) { gs.health -= 5; setHealth(gs.health); if (gs.health <= 0) { gs.gameOver = true; setGameOver(true); soundEngine.gameOver(); soundEngine.stopMusic(); } }
        return false;
      }
      return true;
    });

    gs.enemyBullets = gs.enemyBullets.filter((eb) => {
      eb.x += Math.cos(eb.angle) * eb.speed; eb.y += Math.sin(eb.angle) * eb.speed;
      ctx.save(); ctx.fillStyle = "#ff4444"; ctx.shadowColor = "#ff4444"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(eb.x + eb.width / 2, eb.y + eb.height / 2, eb.width / 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (eb.x < p.x + p.width && eb.x + eb.width > p.x && eb.y < p.y + p.height && eb.y + eb.height > p.y) {
        if (gs.shield > 0) { gs.shield = Math.max(0, gs.shield - 60); spawnParticles(eb.x, eb.y, "#00ccff", 5); }
        else { const bulletDmg = gs.armorTimer > 0 ? 5 : 10; gs.health -= bulletDmg; setHealth(gs.health); soundEngine.hit(); triggerShake(4); gs.combo = 0; gs.comboMultiplier = 1; gs.comboTimer = 0; gs.noDamageKills = 0; spawnParticles(eb.x, eb.y, "#ff4444", 5); if (gs.health <= 0) { gs.gameOver = true; setGameOver(true); soundEngine.gameOver(); soundEngine.stopMusic(); } }
        return false;
      }
      return eb.x > -10 && eb.x < CANVAS_WIDTH + 10 && eb.y > -10 && eb.y < CANVAS_HEIGHT + 10;
    });

    gs.powerUps = gs.powerUps.filter((pu) => {
      pu.y += pu.speed;
      ctx.save(); const col = POWERUP_COLORS[pu.type]; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, 12, 0, Math.PI * 2); ctx.fill();
      ctx.font = "14px serif"; ctx.textAlign = "center"; ctx.fillText(POWERUP_LABELS[pu.type], pu.x + pu.width / 2, pu.y + pu.height / 2 + 5); ctx.restore();
      if (p.x < pu.x + pu.width && p.x + p.width > pu.x && p.y < pu.y + pu.height && p.y + p.height > pu.y) {
        soundEngine.powerUp(); spawnParticles(pu.x, pu.y, col, 8);
        switch (pu.type) { case "shield": gs.shield = 600 + gs.shieldDurBonus; break; case "rapid": gs.rapidFire = 480; break; case "multi": gs.multiShot = 360; break; case "health": gs.health = Math.min(gs.maxHealth, gs.health + 25); setHealth(gs.health); break; case "speed": gs.speedBoostTimer = 1800; break; case "double": gs.doubleBulletTimer = 1800; break; }
        return false;
      }
      return pu.y < CANVAS_HEIGHT + 20;
    });

    gs.particles = gs.particles.filter((pt) => { pt.x += pt.vx; pt.y += pt.vy; pt.life--; const alpha = pt.life / pt.maxLife; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = pt.color; ctx.shadowColor = pt.color; ctx.shadowBlur = 5; ctx.fillRect(pt.x, pt.y, pt.size, pt.size); ctx.restore(); return pt.life > 0; });
    gs.trailParticles = gs.trailParticles.filter((tp) => { tp.life--; const alpha = tp.life / tp.maxLife; ctx.save(); ctx.globalAlpha = Math.max(0, alpha * 0.6); const trailCol = gs.cosmeticTrailColor || skin.engineColor; ctx.fillStyle = trailCol; ctx.shadowColor = trailCol; ctx.shadowBlur = 4; ctx.beginPath(); ctx.arc(tp.x, tp.y + (tp.maxLife - tp.life) * 0.5, Math.max(0.1, tp.size * alpha), 0, Math.PI * 2); ctx.fill(); ctx.restore(); return tp.life > 0; });

    // Tap ripple indicators
    gs.tapRipples = gs.tapRipples.filter((r) => {
      r.life--;
      const progress = 1 - r.life / r.maxLife;
      const radius = 8 + progress * 28;
      const alpha = (1 - progress) * 0.7;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#00ffcc";
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2 - progress * 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      // Inner dot
      if (progress < 0.3) {
        ctx.fillStyle = "#00ffcc";
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return r.life > 0;
    });

    // Aim-assist indicator line
    if (gs.aimTarget && gs.holdFiring) {
      const p2 = gs.player;
      const px = p2.x + p2.width / 2;
      const py = p2.y;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#00ffcc";
      ctx.shadowColor = "#00ffcc";
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(gs.aimTarget.x, gs.aimTarget.y);
      ctx.stroke();
      // Target reticle
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(gs.aimTarget.x, gs.aimTarget.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gs.aimTarget.x - 8, gs.aimTarget.y);
      ctx.lineTo(gs.aimTarget.x + 8, gs.aimTarget.y);
      ctx.moveTo(gs.aimTarget.x, gs.aimTarget.y - 8);
      ctx.lineTo(gs.aimTarget.x, gs.aimTarget.y + 8);
      ctx.stroke();
      ctx.restore();
    }

    drawPlayer(ctx, p, gs.shield > 0);

    // HUD
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(10, 10, 120, 16);
    ctx.strokeStyle = skin.glowColor; ctx.lineWidth = 1; ctx.strokeRect(10, 10, 120, 16);
    const healthPct = Math.max(0, gs.health) / gs.maxHealth;
    ctx.fillStyle = healthPct > 0.5 ? "#00ff66" : healthPct > 0.25 ? "#ffcc00" : "#ff3333";
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8; ctx.fillRect(12, 12, 116 * healthPct, 12); ctx.shadowBlur = 0;

    ctx.fillStyle = skin.glowColor; ctx.shadowColor = skin.glowColor; ctx.shadowBlur = 5;
    ctx.fillRect(12, 12, 116 * healthPct, 12); ctx.shadowBlur = 0;

    // Beam charge bar (only when beam weapon equipped)
    if (gs.currentWeapon === "beam") {
      const charge = gs.beamCharge / 180;
      const heat = gs.beamHeat / gs.beamHeatMax;
      const overheated = gs.beamOverheated;

      // Charge bar
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(10, 30, 120, 8);
      ctx.strokeStyle = overheated ? "#ff8800" : "#ff4444"; ctx.lineWidth = 1; ctx.strokeRect(10, 30, 120, 8);
      const chargeColor = overheated ? "#ff6600" : charge >= 1 ? "#ffffff" : charge > 0.6 ? "#ff6666" : "#ff4444";
      ctx.fillStyle = chargeColor; ctx.shadowColor = chargeColor; ctx.shadowBlur = charge * 12;
      ctx.fillRect(12, 32, 116 * charge, 4); ctx.shadowBlur = 0;

      // Heat bar (below charge bar)
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(10, 42, 120, 6);
      ctx.strokeStyle = heat > 0.8 ? "#ff4400" : "#ff8800"; ctx.lineWidth = 1; ctx.strokeRect(10, 42, 120, 6);
      const heatColor = overheated ? "#ff2200" : heat > 0.8 ? `rgb(255, ${Math.floor(68 - heat * 68)}, 0)` : "#ff8800";
      ctx.fillStyle = heatColor;
      if (heat > 0.8 && !overheated) { ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 8 + Math.sin(gs.frameCount * 0.4) * 4; }
      ctx.fillRect(12, 44, 116 * heat, 2); ctx.shadowBlur = 0;

      ctx.font = "7px Rajdhani"; ctx.textAlign = "left";
      if (overheated) {
        ctx.fillStyle = gs.frameCount % 20 < 10 ? "#ff4400" : "#ff8800";
        ctx.fillText("OVERHEAT!", 12, 58);
      } else {
        ctx.fillStyle = "#ff8888";
        ctx.fillText(`CHARGE ${Math.floor(charge * 100)}%`, 12, 58);
      }
    }
    ctx.font = "bold 20px Orbitron"; ctx.textAlign = "right"; ctx.fillText(`${gs.score}`, CANVAS_WIDTH - 15, 26); ctx.shadowBlur = 0;
    ctx.font = "10px Rajdhani"; ctx.fillStyle = `${skin.glowColor}80`; ctx.fillText("SCORE", CANVAS_WIDTH - 15, 38);
    ctx.textAlign = "left"; ctx.fillText("SHIELD", 12, 38);
    ctx.textAlign = "center"; ctx.font = "10px Orbitron"; ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillText(`WAVE ${gs.wave}`, CANVAS_WIDTH / 2, 20);

    const weaponDef = WEAPONS.find(w => w.id === gs.currentWeapon)!;
    ctx.font = "9px Orbitron"; ctx.fillStyle = WEAPON_COLORS[gs.currentWeapon]; ctx.shadowColor = WEAPON_COLORS[gs.currentWeapon]; ctx.shadowBlur = 5;
    const weaponLabelY = gs.currentWeapon === "beam" ? 68 : 52;
    ctx.textAlign = "left"; ctx.fillText(`${weaponDef.icon} ${weaponDef.name}`, 12, weaponLabelY); ctx.shadowBlur = 0;

    if (gs.combo >= 2) {
      const comboAlpha = Math.min(1, gs.comboTimer / 30);
      const comboColor = gs.comboMultiplier >= 3 ? `rgba(255, 50, 50, ${comboAlpha})` : gs.comboMultiplier >= 2.5 ? `rgba(255, 100, 255, ${comboAlpha})` : gs.comboMultiplier >= 1.5 ? `rgba(255, 204, 0, ${comboAlpha})` : `rgba(0, 255, 200, ${comboAlpha})`;

      // Combo streak background bar
      ctx.save();
      ctx.globalAlpha = comboAlpha * 0.15;
      const barWidth = Math.min(gs.combo * 12, CANVAS_WIDTH - 40);
      ctx.fillStyle = comboColor;
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 15;
      ctx.fillRect(CANVAS_WIDTH / 2 - barWidth / 2, 56, barWidth, 22);
      ctx.restore();

      // Combo text with pulse effect
      const pulse = 1 + Math.sin(gs.frameCount * 0.15) * 0.08 * Math.min(gs.combo / 5, 1);
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 2, 70);
      ctx.scale(pulse, pulse);
      ctx.font = `bold ${Math.min(14 + gs.combo, 22)}px Orbitron`;
      ctx.textAlign = "center";
      ctx.fillStyle = comboColor;
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 12;
      ctx.fillText(`🔥 ${gs.combo}x COMBO • ${gs.comboMultiplier.toFixed(1)}x`, 0, 0);
      ctx.shadowBlur = 0;

      // Streak tier label
      if (gs.combo >= 15) {
        ctx.font = "bold 9px Orbitron";
        ctx.fillStyle = `rgba(255, 50, 50, ${comboAlpha})`;
        ctx.fillText("★ UNSTOPPABLE ★", 0, 14);
      } else if (gs.combo >= 10) {
        ctx.font = "bold 9px Orbitron";
        ctx.fillStyle = `rgba(255, 100, 255, ${comboAlpha})`;
        ctx.fillText("★ ON FIRE ★", 0, 14);
      } else if (gs.combo >= 5) {
        ctx.font = "bold 9px Orbitron";
        ctx.fillStyle = `rgba(255, 204, 0, ${comboAlpha})`;
        ctx.fillText("★ STREAK ★", 0, 14);
      }
      ctx.restore();
    }

    const indicators: string[] = [];
    if (gs.shield > 0) indicators.push("🛡️ SHIELD");
    if (gs.rapidFire > 0) indicators.push("⚡ RAPID");
    if (gs.multiShot > 0) indicators.push("🔥 MULTI");
    if (gs.speedBoostTimer > 0) indicators.push("🚀 SPEED");
    if (gs.doubleBulletTimer > 0) indicators.push("💥 DOUBLE");
    if (indicators.length > 0) { ctx.font = "11px Orbitron"; ctx.textAlign = "center"; ctx.fillStyle = "#ffcc00"; ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 5; ctx.fillText(indicators.join("  "), CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10); ctx.shadowBlur = 0; }

    if (gs.bossActive) { ctx.font = "12px Orbitron"; ctx.textAlign = "center"; ctx.fillStyle = "#ff0000"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 10; ctx.fillText("⚠ BOSS FIGHT ⚠", CANVAS_WIDTH / 2, 50); ctx.shadowBlur = 0; }

    // Radar
    const radarW = 70, radarH = 100;
    const radarX = CANVAS_WIDTH - radarW - 10, radarY = CANVAS_HEIGHT - radarH - 28;
    const scaleX = radarW / CANVAS_WIDTH, scaleY = radarH / CANVAS_HEIGHT;
    ctx.fillStyle = "rgba(0, 10, 20, 0.7)"; ctx.fillRect(radarX, radarY, radarW, radarH);
    ctx.strokeStyle = "rgba(0, 255, 200, 0.2)"; ctx.lineWidth = 1; ctx.strokeRect(radarX, radarY, radarW, radarH);
    ctx.fillStyle = "#00ffcc"; ctx.fillRect(radarX + p.x * scaleX, radarY + p.y * scaleY, 3, 3);
    gs.enemies.forEach((e) => { ctx.fillStyle = ENEMY_COLORS[e.type]; const sz = e.type === "boss" ? 4 : 2; ctx.fillRect(radarX + e.x * scaleX, radarY + e.y * scaleY, sz, sz); });
    gs.enemyBullets.forEach((eb) => { ctx.fillStyle = "rgba(255, 68, 68, 0.6)"; ctx.fillRect(radarX + eb.x * scaleX, radarY + eb.y * scaleY, 1, 1); });
    ctx.font = "7px Orbitron"; ctx.fillStyle = "rgba(0, 255, 200, 0.4)"; ctx.textAlign = "center"; ctx.fillText("RADAR", radarX + radarW / 2, radarY + radarH + 8);

    // Hit flash overlay
    if (gs.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 50, 50, ${gs.hitFlash * 0.04})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Low-health vignette effect
    const healthRatio = Math.max(0, gs.health) / gs.maxHealth;
    if (healthRatio < 0.4) {
      const intensity = 1 - healthRatio / 0.4; // 0→1 as health drops from 40%→0%
      const pulse = 1 + Math.sin(gs.frameCount * 0.08) * 0.15 * intensity;
      const alpha = intensity * 0.6 * pulse;
      const gradient = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.25,
        CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.75
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.6, `rgba(80, 0, 0, ${alpha * 0.3})`);
      gradient.addColorStop(1, `rgba(180, 0, 0, ${alpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Heartbeat sound synced with pulse peaks — rate increases with intensity
      const beatInterval = Math.max(25, Math.floor(60 - intensity * 35)); // frames between beats
      if (gs.frameCount % beatInterval === 0) {
        soundEngine.heartbeat(intensity);
      }
    }

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  const startGame = useCallback(() => {
    const gs = gameStateRef.current;
    const user = getCurrentUser();
    const settings = getSettings();
    const upgData = getUpgrades();
    const bonuses = getStatBonuses();
    skinRef.current = getSkin(user?.selectedSkin || "default");
    gs.difficultyMult = DIFFICULTY_MULTIPLIERS[settings.difficulty];
    gs.keyBindings = settings.keyBindings;
    soundEngine.setVolume(settings.volume / 100);

    gs.maxHealth = bonuses.maxHealth; gs.speedBonus = bonuses.speedBonus;
    gs.fireRateMult = bonuses.fireRateMult; gs.damageBonus = bonuses.damageBonus;
    gs.shieldDurBonus = bonuses.shieldDurBonus; gs.beamHeatMax = bonuses.beamHeatMax;
    gs.unlockedWeapons = upgData.unlockedWeapons;
    gs.currentWeapon = upgData.equippedWeapon;
    const weaponDef = WEAPONS.find(w => w.id === gs.currentWeapon)!;
    gs.weaponFireRate = weaponDef.fireRate; gs.weaponDamage = weaponDef.damage;
    setCurrentWeapon(gs.currentWeapon);

    gs.player = { x: CANVAS_WIDTH / 2 - 20, y: CANVAS_HEIGHT - 80, width: 40, height: 50, speed: 5 };
    gs.bullets = []; gs.enemyBullets = []; gs.enemies = []; gs.particles = []; gs.powerUps = []; gs.trailParticles = [];
    gs.score = 0; gs.health = gs.maxHealth; gs.shield = 0; gs.rapidFire = 0; gs.multiShot = 0;
    gs.gameOver = false; gs.paused = false;
    gs.lastEnemySpawn = 0; gs.spawnInterval = 1500; gs.difficulty = 1; gs.frameCount = 0; gs.lastShot = 0;
    gs.touchMove = { dx: 0, dy: 0 }; gs.touchFiring = false;
    gs.wave = 1; gs.waveKills = 0; gs.waveThreshold = 10; gs.bossActive = false;
    gs.waveTransition = false; gs.waveTransitionTimer = 0; gs.shakeIntensity = 0; gs.hitFlash = 0;
    gs.combo = 0; gs.comboTimer = 0; gs.maxCombo = 0; gs.comboMultiplier = 1;
    gs.bossKilledThisGame = false; gs.noDamageKills = 0; gs.totalKills = 0; gs.bossKills = 0;

    // Load cosmetics
    const cosState = getCosmetics();
    if (cosState.equipped.explosion) {
      const c = getCosmeticById(cosState.equipped.explosion);
      if (c) { gs.cosmeticExplosionColor = c.color; gs.cosmeticExplosionColor2 = c.preview; }
    } else { gs.cosmeticExplosionColor = null; gs.cosmeticExplosionColor2 = null; }
    if (cosState.equipped.trail) {
      const c = getCosmeticById(cosState.equipped.trail);
      if (c) { gs.cosmeticTrailColor = c.color; gs.cosmeticTrailColor2 = c.preview; }
    } else { gs.cosmeticTrailColor = null; gs.cosmeticTrailColor2 = null; }
    if (cosState.equipped.bullet) {
      const c = getCosmeticById(cosState.equipped.bullet);
      if (c) { gs.cosmeticBulletColor = c.color; gs.cosmeticBulletColor2 = c.preview; }
    } else { gs.cosmeticBulletColor = null; gs.cosmeticBulletColor2 = null; }

    // Apply power-up boosts
    const boosts = getActiveBoosts();
    gs.doubleScoreTimer = 0; gs.armorTimer = 0; gs.magnetActive = false; gs.speedBoostTimer = 0; gs.doubleBulletTimer = 0;
    if (boosts.includes("boost_shield")) gs.shield = 600 + gs.shieldDurBonus;
    if (boosts.includes("boost_rapid")) gs.rapidFire = 600;
    if (boosts.includes("boost_health")) { gs.health += 50; gs.maxHealth += 50; }
    if (boosts.includes("boost_double")) gs.doubleScoreTimer = 3600; // ~60s at 60fps
    if (boosts.includes("boost_magnet")) gs.magnetActive = true;
    if (boosts.includes("boost_armor")) gs.armorTimer = 1800; // ~30s
    if (boosts.includes("boost_speed")) gs.speedBoostTimer = 1800; // ~30s
    if (boosts.includes("boost_doublebullet")) gs.doubleBulletTimer = 1800; // ~30s
    clearActiveBoosts();

    setScore(0); setHealth(gs.maxHealth); setGameOver(false); setPaused(false); setGameStarted(true); setWave(1); setWaveAnnounce(0); setMaxCombo(0); setMaxMultiplier(1);
    initStars();
    soundEngine.startMusic();
    // Boss rush: spawn first boss immediately
    if (mode === "bossrush") {
      setTimeout(() => { spawnBoss(); setWaveAnnounce(1); setTimeout(() => setWaveAnnounce(0), 2000); }, 500);
    }
  }, [initStars, mode]);

  const handleGameOver = useCallback(() => {
    const gs = gameStateRef.current;

    // Update challenge progress
    updateChallengeProgress("kills", gs.totalKills);
    updateChallengeProgress("score", gs.score);
    updateChallengeProgress("wave", gs.wave);
    updateChallengeProgress("combo", gs.maxCombo);
    updateChallengeProgress("no_damage_kills", gs.noDamageKills);
    updateChallengeProgress("boss_kills", gs.bossKills);
    if (mode === "bossrush") updateChallengeProgress("bossrush_wave", gs.wave);

    // Update lifetime stats
    updateLifetimeStats({ kills: gs.totalKills, score: gs.score, maxCombo: gs.maxCombo, wave: gs.wave });

    // Award XP
    const xpEarned = calculateGameXP({ score: gs.score, kills: gs.totalKills, wave: gs.wave, maxCombo: gs.maxCombo });
    const xpResult = addXP(xpEarned);
    setXpGained({ xp: xpEarned, levelsGained: xpResult.levelsGained, newRewards: xpResult.newRewards });
    if (xpResult.levelsGained > 0) {
      soundEngine.levelUp();
    }

    const unlocked = checkGameAchievements({
      score: gs.score, wave: gs.wave, maxCombo: gs.maxCombo,
      maxMultiplier: gs.comboMultiplier > 1 ? gs.comboMultiplier : maxMultiplier,
      bossKilled: gs.bossKilledThisGame,
    });
    if (unlocked.length > 0) {
      showAchievementPopup(unlocked[0]);
    }
  }, [maxMultiplier]);

  // Trigger achievement check when gameOver changes
  useEffect(() => {
    if (gameOver) handleGameOver();
  }, [gameOver, handleGameOver]);

  const handleTouchMove = useCallback((dx: number, dy: number) => { gameStateRef.current.touchMove = { dx, dy }; }, []);
  const handleTouchFire = useCallback((firing: boolean) => { gameStateRef.current.touchFiring = firing; }, []);

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
      const gs = gameStateRef.current;
      if (e.key === "1" && gs.unlockedWeapons.includes("laser")) switchWeapon("laser");
      if (e.key === "2" && gs.unlockedWeapons.includes("spread")) switchWeapon("spread");
      if (e.key === "3" && gs.unlockedWeapons.includes("homing")) switchWeapon("homing");
    };
    const handleKeyUp = (e: KeyboardEvent) => { gameStateRef.current.keys[e.key] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [switchWeapon]);

  useEffect(() => {
    if (gameStarted) { animFrameRef.current = requestAnimationFrame(gameLoop); }
    return () => { cancelAnimationFrame(animFrameRef.current); };
  }, [gameStarted, gameLoop]);

  // Auto-pause when the app/tab is backgrounded (incoming call, lock screen,
  // tab switch). Resume only requires the player to tap Play / press P.
  useEffect(() => {
    const autoPause = () => {
      const gs = gameStateRef.current;
      if (!gameStarted || gs.gameOver || gs.paused) return;
      gs.paused = true;
      setPaused(true);
      // Release any held inputs so the ship doesn't drift on resume.
      gs.touchMove = { dx: 0, dy: 0 };
      gs.touchFiring = false;
      gs.holdFiring = false;
      gs.keys = {};
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") autoPause();
    };
    window.addEventListener("blur", autoPause);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", autoPause);
    return () => {
      window.removeEventListener("blur", autoPause);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", autoPause);
    };
  }, [gameStarted]);

  const toggleMute = () => { const next = !muted; setMuted(next); soundEngine.setMuted(next); };

  const unlockedWeapons = gameStateRef.current.unlockedWeapons;

  const holdFireRef = useRef<number>(0);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const gs = gameStateRef.current;
    if (!gameStarted || gs.gameOver || gs.paused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    // First shot + ripple
    shootWeapon();
    gs.tapRipples.push({ x: clickX, y: clickY, life: 20, maxLife: 20 });
    // Start hold-to-rapid-fire
    gs.holdFiring = true;
    const fireLoop = () => {
      if (!gs.holdFiring || gs.gameOver || gs.paused) return;
      const now = Date.now();
      const interval = gs.rapidFire > 0 ? gs.weaponFireRate * 0.4 * gs.fireRateMult : gs.weaponFireRate * gs.fireRateMult;
      if (now - gs.lastShot >= interval) {
        shootWeapon();
      }
      holdFireRef.current = requestAnimationFrame(fireLoop);
    };
    holdFireRef.current = requestAnimationFrame(fireLoop);
  }, [gameStarted, shootWeapon]);

  const handleCanvasMouseUp = useCallback(() => {
    gameStateRef.current.holdFiring = false;
    cancelAnimationFrame(holdFireRef.current);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col items-center w-full">
      <div style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onMouseDown={handleCanvasMouseDown} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp} className="rounded-lg neon-border box-glow-cyan cursor-crosshair" style={{ imageRendering: "pixelated" }} />
      </div>

      {gameStarted && (
        <button onClick={toggleMute} className="absolute top-2 right-2 z-20 p-2 text-muted-foreground hover:text-primary transition-colors">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Achievement popup */}
      {achievementPopup && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-card/90 backdrop-blur-md rounded-lg border border-[hsl(var(--neon-yellow))]/40 px-4 py-2 animate-fade-in" style={{ boxShadow: "0 0 20px hsl(50 100% 55% / 0.3)" }}>
          <p className="font-display text-xs text-[hsl(var(--neon-yellow))]">🏆 ACHIEVEMENT UNLOCKED</p>
          <p className="font-display text-sm text-foreground">{achievementPopup}</p>
        </div>
      )}

      {waveAnnounce > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <div className="text-center animate-fade-in">
            <p className="font-display text-sm text-muted-foreground tracking-widest mb-1">INCOMING</p>
            <h2 className="font-display text-4xl text-primary text-glow-cyan animate-pulse">WAVE {waveAnnounce}</h2>
            {waveAnnounce % 10 === 0 && <p className="font-display text-lg text-destructive mt-2 animate-pulse">⚠ BOSS INCOMING ⚠</p>}
          </div>
        </div>
      )}

      {showTutorial && (
        <div className="absolute inset-0 z-50" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <Tutorial onComplete={() => setShowTutorial(false)} />
        </div>
      )}

      {!gameStarted && !showTutorial && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <h2 className="font-display text-3xl text-glow-cyan mb-2 text-primary">
            {mode === "bossrush" ? "BOSS RUSH" : "READY?"}
          </h2>
          {mode === "bossrush" ? (
            <>
              <p className="text-destructive mb-2 text-sm font-display">⚠ CONSECUTIVE BOSSES ⚠</p>
              <p className="text-muted-foreground mb-6 text-xs font-body">Each boss is tougher. How far can you go?</p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-2 text-sm font-body">Arrow keys to move • Space to shoot</p>
              <p className="text-muted-foreground mb-2 text-xs font-body">P to pause • 1/2/3 to switch weapons</p>
              <p className="text-muted-foreground mb-6 text-xs font-body">Chain kills for combo multiplier!</p>
            </>
          )}
          <div className="flex flex-col items-center gap-3">
            <button onClick={startGame} className="px-8 py-3 bg-primary text-primary-foreground font-display text-lg rounded-lg box-glow-cyan hover:scale-105 transition-transform">
              {mode === "bossrush" ? "FIGHT!" : "START GAME"}
            </button>
            <button onClick={() => setShowTutorial(true)} className="text-muted-foreground hover:text-primary font-body text-xs transition-colors">
              📖 How to Play
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MENU with weapon selection */}
      {paused && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md rounded-lg z-40" style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center" }}>
          <h2 className="font-display text-3xl text-glow-cyan text-primary mb-6">PAUSED</h2>

          {/* Weapon selector */}
          <div className="w-full max-w-[280px] mb-6">
            <p className="font-display text-xs text-muted-foreground tracking-wider mb-2 text-center">SELECT WEAPON</p>
            <div className="space-y-2">
              {WEAPONS.map((w) => {
                const owned = unlockedWeapons.includes(w.id);
                const active = currentWeapon === w.id;
                if (!owned) return null;
                return (
                  <button
                    key={w.id}
                    onClick={() => switchWeapon(w.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      active ? "border-primary bg-primary/15 box-glow-cyan" : "border-border/30 bg-muted/20 hover:border-primary/40"
                    }`}
                  >
                    <span className="text-lg">{w.icon}</span>
                    <div className="flex-1">
                      <span className="font-display text-xs block" style={{ color: WEAPON_COLORS[w.id] }}>{w.name}</span>
                      <span className="font-body text-[10px] text-muted-foreground">{w.desc}</span>
                    </div>
                    {active && <span className="font-display text-[9px] text-primary">ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-muted-foreground text-xs font-body">Press P or Escape to resume</p>
        </div>
      )}

      {gameOver && <GameOverModal score={score} maxCombo={maxCombo} maxMultiplier={maxMultiplier} wave={wave} onRestart={startGame} xpGained={xpGained} />}

      {gameStarted && !gameOver && !paused && (
        <TouchControls onMove={handleTouchMove} onFire={handleTouchFire} />
      )}
    </div>
  );
};

export default GameCanvas;
