// Persistent upgrade & weapon system

export type WeaponType = "laser" | "spread" | "homing" | "triple" | "beam";

export interface WeaponDef {
  id: WeaponType;
  name: string;
  desc: string;
  icon: string;
  cost: number;
  fireRate: number; // ms between shots
  damage: number;
}

export const WEAPONS: WeaponDef[] = [
  { id: "laser", name: "LASER", desc: "Fast single shots", icon: "⚡", cost: 0, fireRate: 150, damage: 1 },
  { id: "spread", name: "SPREAD", desc: "3-bullet fan pattern", icon: "🔥", cost: 300, fireRate: 220, damage: 1 },
  { id: "homing", name: "HOMING", desc: "Tracks nearest enemy", icon: "🎯", cost: 500, fireRate: 350, damage: 2 },
  { id: "triple", name: "TRIPLE", desc: "3 tight parallel bullets", icon: "🔱", cost: 400, fireRate: 200, damage: 1 },
  { id: "beam", name: "BEAM", desc: "Continuous laser beam (hold)", icon: "🔦", cost: 600, fireRate: 50, damage: 0.3 },
];

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  maxLevel: number;
  baseCost: number;
  costScale: number; // multiplier per level
}

export const UPGRADES: UpgradeDef[] = [
  { id: "maxHealth", name: "MAX HEALTH", desc: "+20 HP per level", icon: "❤️", maxLevel: 5, baseCost: 100, costScale: 1.5 },
  { id: "speed", name: "SHIP SPEED", desc: "+0.5 speed per level", icon: "💨", maxLevel: 5, baseCost: 80, costScale: 1.4 },
  { id: "fireRate", name: "FIRE RATE", desc: "-10% cooldown per level", icon: "⚡", maxLevel: 5, baseCost: 120, costScale: 1.6 },
  { id: "damage", name: "DAMAGE", desc: "+1 bullet damage per level", icon: "💥", maxLevel: 5, baseCost: 150, costScale: 1.8 },
  { id: "shieldDur", name: "SHIELD TIME", desc: "+3s shield duration", icon: "🛡️", maxLevel: 3, baseCost: 200, costScale: 2.0 },
  { id: "heatSink", name: "HEAT SINK", desc: "+25% beam overheat threshold", icon: "🧊", maxLevel: 3, baseCost: 180, costScale: 1.7 },
];

export interface PlayerUpgrades {
  coins: number;
  totalCoinsEarned: number;
  unlockedWeapons: WeaponType[];
  equippedWeapon: WeaponType;
  levels: Record<string, number>;
  lastLoginBonus: string; // ISO date string
  loginStreak: number;
}

const UPGRADES_KEY = "skyfire-upgrades";

const defaultUpgrades = (): PlayerUpgrades => ({
  coins: 0,
  totalCoinsEarned: 0,
  unlockedWeapons: ["laser"],
  equippedWeapon: "laser",
  levels: {},
  lastLoginBonus: "",
  loginStreak: 0,
});

export const getUpgrades = (): PlayerUpgrades => {
  const data = localStorage.getItem(UPGRADES_KEY);
  if (!data) return defaultUpgrades();
  return { ...defaultUpgrades(), ...JSON.parse(data) };
};

export const saveUpgrades = (u: PlayerUpgrades) => {
  localStorage.setItem(UPGRADES_KEY, JSON.stringify(u));
};

export const addCoins = (amount: number): number => {
  const u = getUpgrades();
  u.coins += amount;
  u.totalCoinsEarned += amount;
  saveUpgrades(u);
  return u.coins;
};

export const getUpgradeLevel = (upgradeId: string): number => {
  return getUpgrades().levels[upgradeId] || 0;
};

export const getUpgradeCost = (def: UpgradeDef, currentLevel: number): number => {
  return Math.round(def.baseCost * Math.pow(def.costScale, currentLevel));
};

export const purchaseUpgrade = (upgradeId: string): boolean => {
  const u = getUpgrades();
  const def = UPGRADES.find((d) => d.id === upgradeId);
  if (!def) return false;
  const level = u.levels[upgradeId] || 0;
  if (level >= def.maxLevel) return false;
  const cost = getUpgradeCost(def, level);
  if (u.coins < cost) return false;
  u.coins -= cost;
  u.levels[upgradeId] = level + 1;
  saveUpgrades(u);
  return true;
};

export const purchaseWeapon = (weaponId: WeaponType): boolean => {
  const u = getUpgrades();
  if (u.unlockedWeapons.includes(weaponId)) return false;
  const def = WEAPONS.find((w) => w.id === weaponId);
  if (!def) return false;
  if (u.coins < def.cost) return false;
  u.coins -= def.cost;
  u.unlockedWeapons.push(weaponId);
  saveUpgrades(u);
  return true;
};

export const equipWeapon = (weaponId: WeaponType) => {
  const u = getUpgrades();
  if (!u.unlockedWeapons.includes(weaponId)) return;
  u.equippedWeapon = weaponId;
  saveUpgrades(u);
};

// Get applied stat bonuses
export const getStatBonuses = () => {
  const u = getUpgrades();
  const lvl = (id: string) => u.levels[id] || 0;
  return {
    maxHealth: 100 + lvl("maxHealth") * 20,
    speedBonus: lvl("speed") * 0.5,
    fireRateMult: Math.pow(0.9, lvl("fireRate")),
    damageBonus: lvl("damage"),
    shieldDurBonus: lvl("shieldDur") * 180,
    beamHeatMax: 120 + lvl("heatSink") * 30, // 120 base + 30 per level
  };
};

// Daily login bonus
const DAILY_BONUS_AMOUNTS = [10, 15, 20, 30, 40, 50, 75]; // 7-day cycle

export const claimDailyBonus = (): { claimed: boolean; amount: number; streak: number } => {
  const u = getUpgrades();
  const today = new Date().toISOString().split("T")[0];
  if (u.lastLoginBonus === today) return { claimed: false, amount: 0, streak: u.loginStreak };

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const streak = u.lastLoginBonus === yesterday ? Math.min(u.loginStreak + 1, 6) : 0;
  const amount = DAILY_BONUS_AMOUNTS[streak];

  u.lastLoginBonus = today;
  u.loginStreak = streak;
  u.coins += amount;
  u.totalCoinsEarned += amount;
  saveUpgrades(u);
  return { claimed: true, amount, streak };
};

export const getDailyBonusInfo = () => {
  const u = getUpgrades();
  const today = new Date().toISOString().split("T")[0];
  const canClaim = u.lastLoginBonus !== today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const nextStreak = u.lastLoginBonus === yesterday ? Math.min(u.loginStreak + 1, 6) : 0;
  const nextAmount = DAILY_BONUS_AMOUNTS[canClaim ? nextStreak : u.loginStreak];
  return { canClaim, streak: canClaim ? nextStreak : u.loginStreak, amount: nextAmount, allAmounts: DAILY_BONUS_AMOUNTS };
};
