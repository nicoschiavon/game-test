// Lógica pura de combate — sin Phaser, testeable con vitest.

export interface CombatPoint {
  x: number;
  y: number;
  hp: number;
}

function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/** Devuelve el índice del enemigo vivo más cercano dentro de rango, o -1. */
export function findNearestEnemyIndex(
  px: number,
  py: number,
  enemies: CombatPoint[],
  range: number,
): number {
  let best = -1;
  let bestD = range * range;
  let found = false;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.hp <= 0) continue;
    const d = dist2(px, py, e.x, e.y);
    if (d <= bestD && (!found || d < bestD)) {
      best = i;
      bestD = d;
      found = true;
    }
  }
  return found ? best : -1;
}

/** Aplica daño y devuelve el HP restante (mínimo 0). */
export function applyDamage(hp: number, damage: number): number {
  return Math.max(0, hp - damage);
}

/**
 * Indica si puede recibir daño según i-frames.
 * `now` y `lastDamageAt` en segundos. Si nunca recibió daño, lastDamageAt < 0.
 */
export function shouldTakeDamage(now: number, lastDamageAt: number, invulnSeconds: number): boolean {
  if (lastDamageAt < 0) return true;
  return now - lastDamageAt + 1e-9 >= invulnSeconds;
}
