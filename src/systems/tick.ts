// Ventana de daño por enemigo para fuentes de tick (orbes, hoguera) — puro.

/** ¿Puede `source` volver a dañar si su último tick fue en `lastAt`? */
export function canTick(lastAt: number, now: number, window: number): boolean {
  if (lastAt < 0) return true;
  return now - lastAt + 1e-9 >= window;
}
