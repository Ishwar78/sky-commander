// Game settings stored in localStorage

export interface GameSettings {
  volume: number; // 0-100
  difficulty: "easy" | "normal" | "hard" | "insane";
  keyBindings: {
    up: string;
    down: string;
    left: string;
    right: string;
    shoot: string;
    pause: string;
  };
}

const SETTINGS_KEY = "skyfire-settings";

const DEFAULT_SETTINGS: GameSettings = {
  volume: 70,
  difficulty: "normal",
  keyBindings: {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
    shoot: " ",
    pause: "p",
  },
};

export const DIFFICULTY_MULTIPLIERS: Record<GameSettings["difficulty"], { speed: number; spawnRate: number; health: number }> = {
  easy: { speed: 0.7, spawnRate: 1.3, health: 0.7 },
  normal: { speed: 1, spawnRate: 1, health: 1 },
  hard: { speed: 1.3, spawnRate: 0.7, health: 1.3 },
  insane: { speed: 1.6, spawnRate: 0.5, health: 1.6 },
};

export const getSettings = (): GameSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
};

export const saveSettings = (settings: GameSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getKeyLabel = (key: string): string => {
  if (key === " ") return "Space";
  if (key === "ArrowUp") return "↑";
  if (key === "ArrowDown") return "↓";
  if (key === "ArrowLeft") return "←";
  if (key === "ArrowRight") return "→";
  if (key === "Escape") return "Esc";
  return key.toUpperCase();
};

export const resetSettings = (): GameSettings => {
  const s = { ...DEFAULT_SETTINGS };
  saveSettings(s);
  return s;
};
