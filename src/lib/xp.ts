const XP_KEY = "skyfire_xp_data";

export interface XPData {
  level: number;
  currentXP: number;
  totalXP: number;
}

export interface LevelReward {
  level: number;
  label: string;
  icon: string;
  description: string;
  type: "weapon" | "skin" | "mode" | "cosmetic" | "boost" | "perk";
}

// XP needed to reach next level = 100 + (level * 50)
export function xpForLevel(level: number): number {
  return 100 + level * 50;
}

export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

export const MAX_LEVEL = 30;

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 2, label: "Spread Weapon", icon: "🔫", description: "Unlock spread shot weapon", type: "weapon" },
  { level: 3, label: "Trail: Flame", icon: "🔥", description: "Fire trail cosmetic", type: "cosmetic" },
  { level: 4, label: "Boss Rush Mode", icon: "💀", description: "Access Boss Rush mode", type: "mode" },
  { level: 5, label: "+10 Max HP", icon: "❤️", description: "Permanent +10 health", type: "perk" },
  { level: 6, label: "Homing Weapon", icon: "🎯", description: "Unlock homing missiles", type: "weapon" },
  { level: 7, label: "Ship Skin: Ghost", icon: "👻", description: "Ghost ship skin", type: "skin" },
  { level: 8, label: "Double XP Boost", icon: "⚡", description: "Earn 2x XP for 3 games", type: "boost" },
  { level: 9, label: "Explosion: Nova", icon: "💥", description: "Nova explosion effect", type: "cosmetic" },
  { level: 10, label: "+15% Fire Rate", icon: "🔥", description: "Permanent fire rate boost", type: "perk" },
  { level: 12, label: "PvP Mode", icon: "⚔️", description: "Unlock PvP battles", type: "mode" },
  { level: 14, label: "Ship Skin: Neon", icon: "✨", description: "Neon glow ship skin", type: "skin" },
  { level: 16, label: "+20 Max HP", icon: "💖", description: "Permanent +20 health", type: "perk" },
  { level: 18, label: "Trail: Electric", icon: "⚡", description: "Electric trail cosmetic", type: "cosmetic" },
  { level: 20, label: "Master Title", icon: "👑", description: "\"Master\" title unlocked", type: "perk" },
  { level: 22, label: "+25% Damage", icon: "💪", description: "Permanent damage boost", type: "perk" },
  { level: 25, label: "Ship Skin: Dragon", icon: "🐉", description: "Dragon ship skin", type: "skin" },
  { level: 28, label: "Bullet: Plasma", icon: "🟣", description: "Plasma bullet cosmetic", type: "cosmetic" },
  { level: 30, label: "Legend Title", icon: "🏆", description: "\"Legend\" title & golden border", type: "perk" },
];

export function getXPData(): XPData {
  try {
    const raw = localStorage.getItem(XP_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { level: 1, currentXP: 0, totalXP: 0 };
}

function saveXPData(data: XPData) {
  localStorage.setItem(XP_KEY, JSON.stringify(data));
}

export function calculateGameXP(stats: {
  score: number;
  kills: number;
  wave: number;
  maxCombo: number;
}): number {
  let xp = 0;
  xp += Math.floor(stats.score / 10); // 1 XP per 10 points
  xp += stats.kills * 2;              // 2 XP per kill
  xp += stats.wave * 5;               // 5 XP per wave survived
  xp += stats.maxCombo * 3;           // 3 XP per combo
  return Math.max(5, xp);             // minimum 5 XP
}

export function addXP(amount: number): { data: XPData; levelsGained: number; newRewards: LevelReward[] } {
  const data = getXPData();
  const oldLevel = data.level;
  data.currentXP += amount;
  data.totalXP += amount;

  // Level up loop
  while (data.level < MAX_LEVEL) {
    const needed = xpForLevel(data.level);
    if (data.currentXP >= needed) {
      data.currentXP -= needed;
      data.level++;
    } else {
      break;
    }
  }

  // Cap at max level
  if (data.level >= MAX_LEVEL) {
    data.level = MAX_LEVEL;
  }

  saveXPData(data);

  const levelsGained = data.level - oldLevel;
  const newRewards = LEVEL_REWARDS.filter(r => r.level > oldLevel && r.level <= data.level);

  return { data, levelsGained, newRewards };
}

export function getRewardsForLevel(level: number): LevelReward | undefined {
  return LEVEL_REWARDS.find(r => r.level === level);
}

export function getUnlockedRewards(): LevelReward[] {
  const data = getXPData();
  return LEVEL_REWARDS.filter(r => r.level <= data.level);
}

export function resetXPData() {
  localStorage.removeItem(XP_KEY);
}
