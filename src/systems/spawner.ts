// Lógica pura del spawner — sin Phaser, testeable con vitest.
import { SPAWNER, SPAWNER_RAMP } from '../config';

export interface Rect {
  x: number; // borde izquierdo visible
  y: number; // borde superior visible
  w: number; // ancho visible
  h: number; // alto visible
}

export type SpawnEdge = 'top' | 'bottom' | 'left' | 'right';

export interface SpawnPoint {
  x: number;
  y: number;
  edge: SpawnEdge;
}

/**
 * Calcula un punto de spawn en un borde aleatorio de la vista de cámara,
 * con `margin` hacia dentro, y lo limita al interior del mundo.
 * `rand` se inyecta para tests deterministas (por defecto Math.random).
 */
export function nextSpawnPoint(
  view: Rect,
  worldW: number,
  worldH: number,
  margin: number,
  rand: () => number = Math.random,
): SpawnPoint {
  const edgeIdx = Math.floor(rand() * 4);
  const edge: SpawnEdge = (['top', 'bottom', 'left', 'right'] as const)[edgeIdx];
  let x = 0;
  let y = 0;
  switch (edge) {
    case 'top':
      x = view.x + rand() * view.w;
      y = view.y + margin;
      break;
    case 'bottom':
      x = view.x + rand() * view.w;
      y = view.y + view.h - margin;
      break;
    case 'left':
      x = view.x + margin;
      y = view.y + rand() * view.h;
      break;
    case 'right':
      x = view.x + view.w - margin;
      y = view.y + rand() * view.h;
      break;
  }
  x = Math.min(Math.max(x, margin), worldW - margin);
  y = Math.min(Math.max(y, margin), worldH - margin);
  return { x, y, edge };
}

export interface SpawnParams {
  interval: number;
  max: number;
}

/**
 * Rampa de presión lineal con el tiempo de partida: del intervalo/tope base
 * al mínimo/máximo en `rampSeconds`. Después se mantiene constante.
 */
export function spawnParams(elapsed: number): SpawnParams {
  const t = Math.min(Math.max(elapsed / SPAWNER_RAMP.rampSeconds, 0), 1);
  return {
    interval: SPAWNER.spawnInterval + (SPAWNER_RAMP.minInterval - SPAWNER.spawnInterval) * t,
    max: Math.round(SPAWNER_RAMP.startMax + (SPAWNER_RAMP.endMax - SPAWNER_RAMP.startMax) * t),
  };
}
