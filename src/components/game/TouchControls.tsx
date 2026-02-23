import { useRef, useCallback, useEffect } from "react";

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onFire: (firing: boolean) => void;
}

const TouchControls = ({ onMove, onFire }: TouchControlsProps) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const touchOrigin = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const moveVec = useRef({ dx: 0, dy: 0 });

  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    touchOrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const ox = touchOrigin.current.x;
    const oy = touchOrigin.current.y;
    let dx = touch.clientX - ox;
    let dy = touch.clientY - oy;
    const maxDist = 35;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    moveVec.current = { dx: dx / maxDist, dy: dy / maxDist };
    onMove(moveVec.current.dx, moveVec.current.dy);
  }, [onMove]);

  const handleJoystickEnd = useCallback(() => {
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = "translate(0,0)";
    }
    moveVec.current = { dx: 0, dy: 0 };
    onMove(0, 0);
  }, [onMove]);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-between items-end p-6 pb-8 pointer-events-none z-50 md:hidden">
      {/* Joystick */}
      <div
        ref={joystickRef}
        className="pointer-events-auto w-28 h-28 rounded-full bg-muted/20 border border-primary/30 flex items-center justify-center relative"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div
          ref={joystickKnobRef}
          className="w-12 h-12 rounded-full bg-primary/40 border border-primary/60 transition-none"
        />
      </div>

      {/* Fire button */}
      <button
        className="pointer-events-auto w-20 h-20 rounded-full bg-destructive/30 border-2 border-destructive/60 flex items-center justify-center font-display text-xs text-destructive-foreground active:scale-90 transition-transform"
        onTouchStart={(e) => { e.preventDefault(); onFire(true); }}
        onTouchEnd={(e) => { e.preventDefault(); onFire(false); }}
      >
        FIRE
      </button>
    </div>
  );
};

export default TouchControls;
