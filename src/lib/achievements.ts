// Achievement / medals system

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: "combat" | "survival" | "mastery";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_kill", name: "FIRST BLOOD", desc: "Destroy your first enemy", icon: "💀", category: "combat" },
  { id: "boss_slayer", name: "BOSS SLAYER", desc: "Defeat a boss", icon: "👑", category: "combat" },
  { id: "boss_slayer_3", name: "BOSS HUNTER", desc: "Defeat 3 bosses total", icon: "🏆", category: "combat" },
  { id: "combo_10", name: "COMBO STARTER", desc: "Reach a 10-kill combo", icon: "🔥", category: "combat" },
  { id: "combo_25", name: "COMBO MASTER", desc: "Reach a 25-kill combo", icon: "⚡", category: "combat" },
  { id: "combo_50", name: "UNSTOPPABLE", desc: "Reach a 50-kill combo", icon: "💥", category: "combat" },
  { id: "score_500", name: "RISING STAR", desc: "Score 500 points in one game", icon: "⭐", category: "mastery" },
  { id: "score_2000", name: "ACE PILOT", desc: "Score 2000 points in one game", icon: "🌟", category: "mastery" },
  { id: "score_5000", name: "LEGEND", desc: "Score 5000 points in one game", icon: "✨", category: "mastery" },
  { id: "wave_5", name: "SURVIVOR", desc: "Reach wave 5", icon: "🛡️", category: "survival" },
  { id: "wave_10", name: "VETERAN", desc: "Reach wave 10", icon: "🎖️", category: "survival" },
  { id: "wave_20", name: "WAR HERO", desc: "Reach wave 20", icon: "🏅", category: "survival" },
  { id: "buy_weapon", name: "ARMED UP", desc: "Purchase a weapon", icon: "🔫", category: "mastery" },
  { id: "max_upgrade", name: "FULLY LOADED", desc: "Max out any upgrade", icon: "💎", category: "mastery" },
  { id: "coins_1000", name: "RICH PILOT", desc: "Earn 1000 total coins", icon: "🪙", category: "mastery" },
  { id: "multiplier_3", name: "MULTIPLIED", desc: "Reach 3.0x multiplier", icon: "🎯", category: "combat" },
];

const ACHIEVEMENTS_KEY = "skyfire-achievements";

export interface AchievementState {
  unlocked: Record<string, string>; // id -> ISO date unlocked
  bossesKilled: number;
  newlyUnlocked: string[]; // ids shown but not yet dismissed
}

const defaultState = (): AchievementState => ({
  unlocked: {},
  bossesKilled: 0,
  newlyUnlocked: [],
});

export const getAchievements = (): AchievementState => {
  const data = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (!data) return defaultState();
  return { ...defaultState(), ...JSON.parse(data) };
};

export const saveAchievements = (a: AchievementState) => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(a));
};

export const unlockAchievement = (id: string): boolean => {
  const a = getAchievements();
  if (a.unlocked[id]) return false;
  a.unlocked[id] = new Date().toISOString();
  a.newlyUnlocked.push(id);
  saveAchievements(a);
  return true;
};

export const dismissNewAchievements = () => {
  const a = getAchievements();
  a.newlyUnlocked = [];
  saveAchievements(a);
};

export const incrementBossKills = (): number => {
  const a = getAchievements();
  a.bossesKilled++;
  saveAchievements(a);
  return a.bossesKilled;
};

// Check achievements based on game state - call after game over or during game
export const checkGameAchievements = (stats: {
  score: number;
  wave: number;
  maxCombo: number;
  maxMultiplier: number;
  bossKilled?: boolean;
}): string[] => {
  const newUnlocks: string[] = [];
  const check = (id: string, condition: boolean) => {
    if (condition && unlockAchievement(id)) newUnlocks.push(id);
  };

  check("first_kill", stats.score > 0);
  check("combo_10", stats.maxCombo >= 10);
  check("combo_25", stats.maxCombo >= 25);
  check("combo_50", stats.maxCombo >= 50);
  check("score_500", stats.score >= 500);
  check("score_2000", stats.score >= 2000);
  check("score_5000", stats.score >= 5000);
  check("wave_5", stats.wave >= 5);
  check("wave_10", stats.wave >= 10);
  check("wave_20", stats.wave >= 20);
  check("multiplier_3", stats.maxMultiplier >= 3);

  if (stats.bossKilled) {
    check("boss_slayer", true);
    const kills = incrementBossKills();
    check("boss_slayer_3", kills >= 3);
  }

  return newUnlocks;
};

// For shop-related achievements
export const checkShopAchievements = (type: "buy_weapon" | "max_upgrade" | "coins_1000"): boolean => {
  return unlockAchievement(type);
};
