export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "explosion" | "trail" | "bullet";
  cost: number;
  color: string;
  preview: string; // secondary color or effect label
}

export const COSMETICS: CosmeticItem[] = [
  // Explosion colors
  { id: "exp_fire", name: "Inferno Blast", description: "Fiery orange-red explosions", icon: "🔥", category: "explosion", cost: 80, color: "#ff4400", preview: "#ffaa00" },
  { id: "exp_ice", name: "Frost Nova", description: "Icy blue-white explosions", icon: "❄️", category: "explosion", cost: 80, color: "#44ccff", preview: "#aaeeff" },
  { id: "exp_toxic", name: "Toxic Burst", description: "Toxic green explosions", icon: "☢️", category: "explosion", cost: 100, color: "#44ff00", preview: "#aaff44" },
  { id: "exp_void", name: "Void Collapse", description: "Purple-pink implosion effect", icon: "🌀", category: "explosion", cost: 120, color: "#cc44ff", preview: "#ff66ff" },
  { id: "exp_gold", name: "Golden Shower", description: "Sparkling gold particles", icon: "✨", category: "explosion", cost: 150, color: "#ffcc00", preview: "#ffee66" },

  // Trail effects
  { id: "trail_fire", name: "Fire Trail", description: "Leave a blazing trail behind", icon: "🔥", category: "trail", cost: 100, color: "#ff4400", preview: "#ff8800" },
  { id: "trail_ice", name: "Ice Trail", description: "Crystalline frost trail", icon: "❄️", category: "trail", cost: 100, color: "#44ccff", preview: "#88eeff" },
  { id: "trail_rainbow", name: "Rainbow Trail", description: "Dazzling rainbow wake", icon: "🌈", category: "trail", cost: 200, color: "#ff0066", preview: "#00ff66" },
  { id: "trail_shadow", name: "Shadow Trail", description: "Dark ghostly afterimage", icon: "👤", category: "trail", cost: 120, color: "#555555", preview: "#999999" },
  { id: "trail_spark", name: "Spark Trail", description: "Electric sparks behind you", icon: "⚡", category: "trail", cost: 150, color: "#ffee00", preview: "#ffffff" },

  // Bullet skins
  { id: "bul_plasma", name: "Plasma Rounds", description: "Glowing plasma projectiles", icon: "🟣", category: "bullet", cost: 90, color: "#cc44ff", preview: "#ee88ff" },
  { id: "bul_fire", name: "Fire Bolts", description: "Flaming projectiles", icon: "🔴", category: "bullet", cost: 90, color: "#ff4400", preview: "#ffaa00" },
  { id: "bul_ice", name: "Ice Shards", description: "Frozen crystal bullets", icon: "🔵", category: "bullet", cost: 90, color: "#44ccff", preview: "#aaeeff" },
  { id: "bul_gold", name: "Gold Rounds", description: "Premium golden projectiles", icon: "🟡", category: "bullet", cost: 120, color: "#ffcc00", preview: "#ffee44" },
  { id: "bul_toxic", name: "Acid Shots", description: "Corrosive green rounds", icon: "🟢", category: "bullet", cost: 100, color: "#44ff00", preview: "#88ff44" },
];

export interface CosmeticState {
  owned: string[];
  equipped: { explosion?: string; trail?: string; bullet?: string };
}

const COSMETICS_KEY = "skyfire-cosmetics";

export const getCosmetics = (): CosmeticState => {
  return JSON.parse(localStorage.getItem(COSMETICS_KEY) || '{"owned":[],"equipped":{}}');
};

export const saveCosmetics = (state: CosmeticState) => {
  localStorage.setItem(COSMETICS_KEY, JSON.stringify(state));
};

export const purchaseCosmetic = (id: string): boolean => {
  const item = COSMETICS.find((c) => c.id === id);
  if (!item) return false;
  const state = getCosmetics();
  if (state.owned.includes(id)) return false;
  const raw = JSON.parse(localStorage.getItem("skyfire-upgrades") || '{"coins":0}');
  if ((raw.coins || 0) < item.cost) return false;
  raw.coins -= item.cost;
  localStorage.setItem("skyfire-upgrades", JSON.stringify(raw));
  state.owned.push(id);
  saveCosmetics(state);
  return true;
};

export const equipCosmetic = (id: string) => {
  const item = COSMETICS.find((c) => c.id === id);
  if (!item) return;
  const state = getCosmetics();
  if (!state.owned.includes(id)) return;
  state.equipped[item.category] = id;
  saveCosmetics(state);
};

export const unequipCosmetic = (category: CosmeticItem["category"]) => {
  const state = getCosmetics();
  delete state.equipped[category];
  saveCosmetics(state);
};

export const getCosmeticById = (id: string): CosmeticItem | undefined =>
  COSMETICS.find((c) => c.id === id);
