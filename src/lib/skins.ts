export interface ShipSkin {
  id: string;
  name: string;
  bodyColor: string;
  wingColor: string;
  engineColor: string;
  glowColor: string;
  bulletColor: string;
  preview: string; // emoji or label
}

export const SHIP_SKINS: ShipSkin[] = [
  {
    id: "default",
    name: "Neon Striker",
    bodyColor: "#00ffcc",
    wingColor: "#00cc99",
    engineColor: "#00ff66",
    glowColor: "#00ffcc",
    bulletColor: "#00ffcc",
    preview: "🟢",
  },
  {
    id: "fire",
    name: "Inferno",
    bodyColor: "#ff4400",
    wingColor: "#cc3300",
    engineColor: "#ffaa00",
    glowColor: "#ff6600",
    bulletColor: "#ff6600",
    preview: "🔴",
  },
  {
    id: "ice",
    name: "Frost Wing",
    bodyColor: "#44ccff",
    wingColor: "#2299dd",
    engineColor: "#88eeff",
    glowColor: "#44ccff",
    bulletColor: "#88eeff",
    preview: "🔵",
  },
  {
    id: "purple",
    name: "Void Phantom",
    bodyColor: "#cc44ff",
    wingColor: "#9933cc",
    engineColor: "#ff66ff",
    glowColor: "#cc44ff",
    bulletColor: "#ff66ff",
    preview: "🟣",
  },
  {
    id: "gold",
    name: "Solar Ace",
    bodyColor: "#ffcc00",
    wingColor: "#cc9900",
    engineColor: "#ffee44",
    glowColor: "#ffcc00",
    bulletColor: "#ffee44",
    preview: "🟡",
  },
  {
    id: "stealth",
    name: "Shadow Blade",
    bodyColor: "#888888",
    wingColor: "#555555",
    engineColor: "#aaaaaa",
    glowColor: "#666666",
    bulletColor: "#cccccc",
    preview: "⚫",
  },
];

export const getSkin = (id: string): ShipSkin => {
  return SHIP_SKINS.find((s) => s.id === id) || SHIP_SKINS[0];
};
