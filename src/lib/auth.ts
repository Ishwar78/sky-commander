// Simple localStorage-based auth system

export interface User {
  id: string;
  username: string;
  password: string; // In real app, hash this
  role: "player" | "admin";
  createdAt: string;
  selectedSkin: string;
}

export interface ScoreEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  date: string;
  skin: string;
}

const USERS_KEY = "skyfire-users";
const CURRENT_USER_KEY = "skyfire-current-user";
const SCORES_KEY = "skyfire-scores";

// Initialize admin account if not exists
const initAdmin = () => {
  const users = getUsers();
  if (!users.find((u) => u.role === "admin")) {
    users.push({
      id: "admin-001",
      username: "admin",
      password: "admin123",
      role: "admin",
      createdAt: new Date().toISOString(),
      selectedSkin: "default",
    });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
};

export const getUsers = (): User[] => {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
};

export const register = (username: string, password: string): { success: boolean; error?: string } => {
  if (username.length < 3) return { success: false, error: "Username must be at least 3 characters" };
  if (password.length < 4) return { success: false, error: "Password must be at least 4 characters" };
  
  const users = getUsers();
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: "Username already taken" };
  }

  const user: User = {
    id: `user-${Date.now()}`,
    username,
    password,
    role: "player",
    createdAt: new Date().toISOString(),
    selectedSkin: "default",
  };
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true };
};

export const login = (username: string, password: string): { success: boolean; error?: string } => {
  initAdmin();
  const users = getUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return { success: false, error: "Invalid username or password" };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return { success: true };
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "admin";
};

export const updateUserSkin = (skinId: string) => {
  const user = getCurrentUser();
  if (!user) return;
  user.selectedSkin = skinId;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) { users[idx].selectedSkin = skinId; localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
};

export const saveScore = (score: number) => {
  const user = getCurrentUser();
  const entry: ScoreEntry = {
    id: `score-${Date.now()}`,
    userId: user?.id || "guest",
    username: user?.username || "Guest",
    score,
    date: new Date().toISOString(),
    skin: user?.selectedSkin || "default",
  };
  const scores: ScoreEntry[] = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores.slice(0, 100)));
};

export const getScores = (): ScoreEntry[] => {
  return JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
};

export const getAnalytics = () => {
  const users = getUsers().filter((u) => u.role !== "admin");
  const scores = getScores();
  const totalGames = scores.length;
  const avgScore = totalGames > 0 ? Math.round(scores.reduce((a, s) => a + s.score, 0) / totalGames) : 0;
  const topScore = scores.length > 0 ? scores[0].score : 0;

  // Daily games (last 7 days)
  const now = Date.now();
  const dailyGames: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const dayStr = d.toLocaleDateString("en", { weekday: "short" });
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + 86400000;
    const count = scores.filter((s) => { const t = new Date(s.date).getTime(); return t >= dayStart && t < dayEnd; }).length;
    dailyGames.push({ day: dayStr, count });
  }

  return { totalUsers: users.length, totalGames, avgScore, topScore, dailyGames, recentScores: scores.slice(0, 20) };
};

// Init admin on import
initAdmin();
