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

  // Small helper for haptic feedback on supported devices.
  const vibrate = (pattern: number | number[]) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      /* ignore — unsupported (e.g. iOS Safari) */
    }
  };

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
      vibrate(8);
    };
    const onMoveTouch = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const ox = touchOrigin.current.x;
      const oy = touchOrigin.current.y;
      let dx = touch.clientX - ox;
      let dy = touch.clientY - oy;
      // Larger travel area = finer control on iPhone-sized screens.
      const rect = joy.getBoundingClientRect();
      const maxDist = Math.max(40, rect.width * 0.45);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      // Normalize, apply deadzone + smooth (quadratic) response curve so
      // small touches don't overshoot the airplane.
      const nxRaw = dx / maxDist;
      const nyRaw = dy / maxDist;
      const mag = Math.min(1, Math.sqrt(nxRaw * nxRaw + nyRaw * nyRaw));
      const deadzone = 0.12;
      let scaled = 0;
      if (mag > deadzone) {
        const t = (mag - deadzone) / (1 - deadzone);
        // Ease-in (t^1.6) keeps slow taps gentle, full tilt still = 1.
        scaled = Math.pow(t, 1.6);
      }
      const factor = mag > 0 ? scaled / mag : 0;
      moveVec.current = { dx: nxRaw * factor, dy: nyRaw * factor };
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

    const onFireStart = (e: TouchEvent) => {
      e.preventDefault();
      onFire(true);
      vibrate(15);
    };
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
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-between items-end pointer-events-none z-50 md:hidden"
      style={{
        // Responsive padding — respect iPhone safe area + scale with viewport.
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Joystick */}
      <div
        ref={joystickRef}
        className="pointer-events-auto rounded-full bg-muted/20 border border-primary/30 flex items-center justify-center relative select-none"
        style={{
          touchAction: "none",
          // Scales between 88px (small iPhones) and 128px (larger phones).
          width: "clamp(5.5rem, 26vw, 8rem)",
          height: "clamp(5.5rem, 26vw, 8rem)",
        }}
      >
        <div
          ref={joystickKnobRef}
          className="rounded-full bg-primary/40 border border-primary/60 transition-none"
          style={{
            width: "clamp(2.5rem, 11vw, 3.5rem)",
            height: "clamp(2.5rem, 11vw, 3.5rem)",
          }}
        />
      </div>

      {/* Fire button */}
      <button
        ref={fireBtnRef}
        className="pointer-events-auto rounded-full bg-destructive/30 border-2 border-destructive/60 flex items-center justify-center font-display text-xs text-destructive-foreground active:scale-90 transition-transform select-none"
        style={{
          touchAction: "none",
          width: "clamp(4.5rem, 20vw, 6rem)",
          height: "clamp(4.5rem, 20vw, 6rem)",
        }}
      >
        FIRE
      </button>
    </div>
  );
};

export default TouchControls;
