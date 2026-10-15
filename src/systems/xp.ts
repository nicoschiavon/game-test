// Sistema de XP/niveles — puro, sin Phaser, testeable con vitest.

import { XP_CURVE } from '../config';

/** XP necesaria para pasar del nivel `level` al siguiente. */
export function xpForLevel(level: number): number {
  return Math.floor(XP_CURVE.base * Math.pow(XP_CURVE.growth, level - 1));
}

export interface XpState {
  level: number;
  xp: number; // progreso hacia el siguiente nivel
}

/**
 * Suma XP conservando el exceso y encadenando subidas.
 * Devuelve cuántos niveles se han ganado con esta entrega.
 */
export function grantXp(state: XpState, amount: number): number {
  let gained = 0;
  state.xp += amount;
  for (let guard = 0; guard < 1000; guard++) {
    const need = xpForLevel(state.level);
    if (state.xp < need) break;
    state.xp -= need;
    state.level += 1;
    gained += 1;
  }
  return gained;
}
