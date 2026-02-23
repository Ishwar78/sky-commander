export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "daily" | "weekly";
  target: number;
  stat: "kills" | "score" | "wave" | "combo" | "no_damage_kills" | "boss_kills" | "bossrush_wave";
  reward: number; // coins
}

export interface ChallengeProgress {
  challengeId: string;
  current: number;
  completed: boolean;
  claimedAt?: string;
}

export interface ChallengeState {
  daily: { challenges: string[]; generatedAt: string; progress: Record<string, ChallengeProgress> };
  weekly: { challenges: string[]; generatedAt: string; progress: Record<string, ChallengeProgress> };
}

const DAILY_POOL: Challenge[] = [
  { id: "d_kill_30", name: "Eliminator", description: "Kill 30 enemies in a single game", icon: "💀", type: "daily", target: 30, stat: "kills", reward: 25 },
  { id: "d_score_500", name: "Score Hunter", description: "Reach a score of 500", icon: "🎯", type: "daily", target: 500, stat: "score", reward: 30 },
  { id: "d_wave_5", name: "Survivor", description: "Reach wave 5", icon: "🌊", type: "daily", target: 5, stat: "wave", reward: 20 },
  { id: "d_combo_10", name: "Combo Starter", description: "Get a 10x combo", icon: "🔥", type: "daily", target: 10, stat: "combo", reward: 20 },
  { id: "d_no_dmg_20", name: "Untouchable", description: "Kill 20 enemies without taking damage", icon: "🛡️", type: "daily", target: 20, stat: "no_damage_kills", reward: 40 },
  { id: "d_boss_1", name: "Boss Slayer", description: "Defeat a boss", icon: "👹", type: "daily", target: 1, stat: "boss_kills", reward: 35 },
  { id: "d_kill_50", name: "Rampage", description: "Kill 50 enemies in a single game", icon: "⚔️", type: "daily", target: 50, stat: "kills", reward: 40 },
  { id: "d_score_1000", name: "High Roller", description: "Reach a score of 1000", icon: "💎", type: "daily", target: 1000, stat: "score", reward: 50 },
];

const WEEKLY_POOL: Challenge[] = [
  { id: "w_kill_200", name: "Mass Destruction", description: "Kill 200 enemies total", icon: "💥", type: "weekly", target: 200, stat: "kills", reward: 100 },
  { id: "w_score_3000", name: "Legend", description: "Score 3000 points in one game", icon: "🏆", type: "weekly", target: 3000, stat: "score", reward: 150 },
  { id: "w_wave_15", name: "Marathon", description: "Reach wave 15", icon: "🏅", type: "weekly", target: 15, stat: "wave", reward: 120 },
  { id: "w_combo_25", name: "Combo Master", description: "Get a 25x combo", icon: "⚡", type: "weekly", target: 25, stat: "combo", reward: 100 },
  { id: "w_no_dmg_50", name: "Ghost Pilot", description: "Kill 50 enemies without taking damage", icon: "👻", type: "weekly", target: 50, stat: "no_damage_kills", reward: 200 },
  { id: "w_boss_5", name: "Boss Hunter", description: "Defeat 5 bosses", icon: "🐉", type: "weekly", target: 5, stat: "boss_kills", reward: 180 },
  { id: "w_bossrush_5", name: "Rush King", description: "Reach wave 5 in Boss Rush", icon: "👑", type: "weekly", target: 5, stat: "bossrush_wave", reward: 200 },
];

const CHALLENGES_KEY = "skyfire-challenges";

const pickRandom = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const isSameDay = (d1: string, d2: Date): boolean => {
  const a = new Date(d1);
  return a.getFullYear() === d2.getFullYear() && a.getMonth() === d2.getMonth() && a.getDate() === d2.getDate();
};

const isSameWeek = (d1: string, d2: Date): boolean => {
  const a = new Date(d1);
  const getWeek = (d: Date) => {
    const start = new Date(d.getFullYear(), 0, 1);
    return Math.floor((d.getTime() - start.getTime()) / (7 * 86400000));
  };
  return a.getFullYear() === d2.getFullYear() && getWeek(a) === getWeek(d2);
};

export const getChallenges = (): ChallengeState => {
  const raw = localStorage.getItem(CHALLENGES_KEY);
  const now = new Date();
  let state: ChallengeState = raw ? JSON.parse(raw) : null;

  const needsNew = !state;
  const needsDaily = needsNew || !isSameDay(state!.daily.generatedAt, now);
  const needsWeekly = needsNew || !isSameWeek(state!.weekly.generatedAt, now);

  if (needsNew) {
    state = {
      daily: { challenges: [], generatedAt: "", progress: {} },
      weekly: { challenges: [], generatedAt: "", progress: {} },
    };
  }

  if (needsDaily) {
    const picked = pickRandom(DAILY_POOL, 3);
    state!.daily = {
      challenges: picked.map((c) => c.id),
      generatedAt: now.toISOString(),
      progress: {},
    };
  }

  if (needsWeekly) {
    const picked = pickRandom(WEEKLY_POOL, 3);
    state!.weekly = {
      challenges: picked.map((c) => c.id),
      generatedAt: now.toISOString(),
      progress: {},
    };
  }

  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(state));
  return state!;
};

export const getAllChallenges = (): Challenge[] => [...DAILY_POOL, ...WEEKLY_POOL];

export const getChallengeById = (id: string): Challenge | undefined =>
  [...DAILY_POOL, ...WEEKLY_POOL].find((c) => c.id === id);

export const updateChallengeProgress = (stat: Challenge["stat"], value: number): string[] => {
  const state = getChallenges();
  const completed: string[] = [];

  const update = (section: "daily" | "weekly") => {
    state[section].challenges.forEach((cId) => {
      const def = getChallengeById(cId);
      if (!def || def.stat !== stat) return;
      const prog = state[section].progress[cId] || { challengeId: cId, current: 0, completed: false };
      if (prog.completed) return;
      prog.current = Math.max(prog.current, value);
      if (prog.current >= def.target) {
        prog.completed = true;
        completed.push(cId);
      }
      state[section].progress[cId] = prog;
    });
  };

  update("daily");
  update("weekly");
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(state));
  return completed;
};

export const claimChallengeReward = (challengeId: string): number => {
  const state = getChallenges();
  const section = challengeId.startsWith("d_") ? "daily" : "weekly";
  const prog = state[section].progress[challengeId];
  if (!prog || !prog.completed || prog.claimedAt) return 0;
  const def = getChallengeById(challengeId);
  if (!def) return 0;
  prog.claimedAt = new Date().toISOString();
  localStorage.setItem(CHALLENGES_KEY, JSON.stringify(state));
  return def.reward;
};
