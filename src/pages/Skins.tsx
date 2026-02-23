import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Gamepad2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { SHIP_SKINS, ShipSkin } from "@/lib/skins";
import { getCurrentUser, updateUserSkin } from "@/lib/auth";

const ShipPreview = ({ skin, selected }: { skin: ShipSkin; selected: boolean }) => (
  <svg viewBox="0 0 80 100" className="w-full h-full">
    {/* Engine glow */}
    <ellipse cx="40" cy="88" rx="8" ry="12" fill={skin.engineColor} opacity="0.6">
      <animate attributeName="ry" values="10;14;10" dur="0.5s" repeatCount="indefinite" />
    </ellipse>
    {/* Wings */}
    <polygon points="40,30 10,85 20,85" fill={skin.wingColor} />
    <polygon points="40,30 70,85 60,85" fill={skin.wingColor} />
    {/* Body */}
    <polygon points="40,10 60,80 40,70 20,80" fill={skin.bodyColor} />
    {/* Cockpit */}
    <ellipse cx="40" cy="40" rx="6" ry="10" fill={skin.glowColor} opacity="0.5" />
    {selected && <circle cx="40" cy="50" r="35" fill="none" stroke={skin.glowColor} strokeWidth="2" opacity="0.6" />}
  </svg>
);

const Skins = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [selected, setSelected] = useState(user?.selectedSkin || "default");

  const handleSelect = (id: string) => {
    setSelected(id);
    updateUserSkin(id);
  };

  return (
    <div className="min-h-screen bg-background arcade-grid p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="font-display text-xl text-primary text-glow-cyan tracking-wider">SELECT SHIP</h1>
          <Link to="/play" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-body text-sm">
            <Gamepad2 className="w-4 h-4" />
            Play
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SHIP_SKINS.map((skin, i) => (
            <motion.button
              key={skin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleSelect(skin.id)}
              className={`relative p-4 rounded-xl neon-border bg-card/40 backdrop-blur-sm transition-all hover:scale-105 ${
                selected === skin.id ? "box-glow-cyan ring-2 ring-primary/50" : "hover:bg-card/60"
              }`}
            >
              {selected === skin.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className="w-20 h-24 mx-auto mb-3">
                <ShipPreview skin={skin} selected={selected === skin.id} />
              </div>
              <p className="font-display text-xs text-foreground tracking-wide">{skin.name}</p>
              <div className="flex gap-1 justify-center mt-2">
                {[skin.bodyColor, skin.wingColor, skin.engineColor].map((c, j) => (
                  <span key={j} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/play")}
            className="px-8 py-3 bg-primary text-primary-foreground font-display text-sm rounded-lg box-glow-cyan hover:scale-105 transition-transform"
          >
            PLAY WITH {SHIP_SKINS.find((s) => s.id === selected)?.name.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Skins;
