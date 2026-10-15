// Lógica pura de movimiento — sin Phaser, testeable con vitest.

export interface Vec2 {
  x: number;
  y: number;
}

/** Normaliza un vector de input (-1..1 por eje) a magnitud <= 1. */
export function normalizeMoveVector(x: number, y: number): Vec2 {
  const len = Math.hypot(x, y);
  if (len <= 0) return { x: 0, y: 0 };
  if (len <= 1) return { x, y };
  return { x: x / len, y: y / len };
}

/** Limita una posición al interior del mundo (teniendo en cuenta el radio). */
export function clampToWorld(pos: Vec2, worldW: number, worldH: number, radius: number): Vec2 {
  return {
    x: Math.min(Math.max(pos.x, radius), worldW - radius),
    y: Math.min(Math.max(pos.y, radius), worldH - radius),
  };
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
