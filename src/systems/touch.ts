// Joystick virtual flotante — puro y testeable. La escena aporta los eventos.

export interface StickVec {
  mx: number;
  my: number;
}

export const STICK_RADIUS = 56;
const STICK_DEAD = 8;

/** Vector -1..1 desde el origen del stick, con clamp al radio y deadzone. */
export function stickVector(ox: number, oy: number, x: number, y: number): StickVec {
  const dx = x - ox;
  const dy = y - oy;
  const d = Math.hypot(dx, dy);
  if (d < STICK_DEAD) return { mx: 0, my: 0 };
  const cl = Math.min(d, STICK_RADIUS);
  return { mx: (dx / d) * (cl / STICK_RADIUS), my: (dy / d) * (cl / STICK_RADIUS) };
}
