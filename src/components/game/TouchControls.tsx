import { useRef, useCallback, useEffect } from "react";

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onFire: (firing: boolean) => void;
}

const TouchControls = ({ onMove, onFire }: TouchControlsProps) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const fireBtnRef = useRef<HTMLButtonElement>(null);
  const touchOrigin = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const moveVec = useRef({ dx: 0, dy: 0 });

  // Attach NON-passive native touch listeners so preventDefault actually
  // stops iOS Safari from scrolling/bouncing the page while playing.
  useEffect(() => {
    const joy = joystickRef.current;
    const fire = fireBtnRef.current;
    if (!joy || !fire) return;

    const onStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = joy.getBoundingClientRect();
      touchOrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const onMoveTouch = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
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
    };
    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = "translate(0,0)";
      }
      moveVec.current = { dx: 0, dy: 0 };
      onMove(0, 0);
    };

    const onFireStart = (e: TouchEvent) => { e.preventDefault(); onFire(true); };
    const onFireEnd = (e: TouchEvent) => { e.preventDefault(); onFire(false); };

    joy.addEventListener("touchstart", onStart, { passive: false });
    joy.addEventListener("touchmove", onMoveTouch, { passive: false });
    joy.addEventListener("touchend", onEnd, { passive: false });
    joy.addEventListener("touchcancel", onEnd, { passive: false });

    fire.addEventListener("touchstart", onFireStart, { passive: false });
    fire.addEventListener("touchend", onFireEnd, { passive: false });
    fire.addEventListener("touchcancel", onFireEnd, { passive: false });

    return () => {
      joy.removeEventListener("touchstart", onStart);
      joy.removeEventListener("touchmove", onMoveTouch);
      joy.removeEventListener("touchend", onEnd);
      joy.removeEventListener("touchcancel", onEnd);
      fire.removeEventListener("touchstart", onFireStart);
      fire.removeEventListener("touchend", onFireEnd);
      fire.removeEventListener("touchcancel", onFireEnd);
    };
  }, [onMove, onFire]);

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-between items-end p-6 pb-8 pointer-events-none z-50 md:hidden">
      {/* Joystick */}
      <div
        ref={joystickRef}
        className="pointer-events-auto w-28 h-28 rounded-full bg-muted/20 border border-primary/30 flex items-center justify-center relative select-none"
        style={{ touchAction: "none" }}
      >
        <div
          ref={joystickKnobRef}
          className="w-12 h-12 rounded-full bg-primary/40 border border-primary/60 transition-none"
        />
      </div>

      {/* Fire button */}
      <button
        ref={fireBtnRef}
        className="pointer-events-auto w-20 h-20 rounded-full bg-destructive/30 border-2 border-destructive/60 flex items-center justify-center font-display text-xs text-destructive-foreground active:scale-90 transition-transform select-none"
        style={{ touchAction: "none" }}
      >
        FIRE
      </button>
    </div>
  );
};

export default TouchControls;
