const STATS_KEY = "skyfire_lifetime_stats";

export interface LifetimeStats {
  totalKills: number;
  bestCombo: number;
  gamesPlayed: number;
  totalScore: number;
  highestWave: number;
}

const DEFAULT_STATS: LifetimeStats = {
  totalKills: 0,
  bestCombo: 0,
  gamesPlayed: 0,
  totalScore: 0,
  highestWave: 0,
};

export function getLifetimeStats(): LifetimeStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_STATS };
}

export function updateLifetimeStats(gameStats: {
  kills: number;
  score: number;
  maxCombo: number;
  wave: number;
}) {
  const stats = getLifetimeStats();
  stats.totalKills += gameStats.kills;
  stats.totalScore += gameStats.score;
  stats.gamesPlayed += 1;
  if (gameStats.maxCombo > stats.bestCombo) stats.bestCombo = gameStats.maxCombo;
  if (gameStats.wave > stats.highestWave) stats.highestWave = gameStats.wave;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

export function resetLifetimeStats() {
  localStorage.removeItem(STATS_KEY);
  return { ...DEFAULT_STATS };
}
