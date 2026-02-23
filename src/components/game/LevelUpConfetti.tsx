import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  shape: "square" | "circle" | "star";
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--neon-pink))",
  "hsl(var(--neon-yellow))",
  "hsl(var(--neon-green))",
  "#fff",
];

const SHAPES = ["square", "circle", "star"] as const;

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 30,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
    velocityX: (Math.random() - 0.5) * 80,
    velocityY: -30 + Math.random() * -60,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  }));
}

const LevelUpConfetti = ({ show, level }: { show: boolean; level: number }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      setParticles(createParticles(40));
    }
  }, [show]);

  if (!show || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Central burst text */}
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
        >
          <p className="font-display text-3xl text-accent text-glow-cyan">
            LEVEL UP!
          </p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-5xl text-primary text-glow-cyan mt-1"
          >
            {level}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Confetti particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            rotate: 0,
            scale: 0,
            opacity: 1,
          }}
          animate={{
            left: `${p.x + p.velocityX}%`,
            top: `${p.y - p.velocityY}%`,
            rotate: p.rotation + 360,
            scale: [0, p.scale, p.scale, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute"
          style={{ width: 8, height: 8 }}
        >
          {p.shape === "square" && (
            <div
              className="w-full h-full rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          )}
          {p.shape === "circle" && (
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: p.color }}
            />
          )}
          {p.shape === "star" && (
            <div
              className="font-body text-xs leading-none"
              style={{ color: p.color }}
            >
              ✦
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default LevelUpConfetti;
