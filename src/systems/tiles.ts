// Selección de tiles del suelo — puro, sin Phaser, testeable con vitest.
// Los pesos viven en config.ts (TILES); aquí solo el muestreo con RNG inyectable.

import { TILES, WeightedTile } from '../config';

/** Elige un índice según pesos (pesos no necesariamente normalizados). */
export function pickWeighted(options: WeightedTile[], rand: () => number): number {
  let total = 0;
  for (const o of options) total += o.weight;
  let r = rand() * total;
  for (const o of options) {
    r -= o.weight;
    if (r < 0) return o.index;
  }
  return options[options.length - 1].index;
}

/** Variante de suelo para una celda (respeta los pesos de TILES.ground). */
export function pickGroundVariant(rand: () => number = Math.random): number {
  return pickWeighted(TILES.ground, rand);
}

/** Variante de suelo con tabla explícita (mapas de la Etapa 6). */
export function pickGroundFrom(ground: WeightedTile[], rand: () => number = Math.random): number {
  return pickWeighted(ground, rand);
}

/** ¿Esta celda lleva decoración? (probabilidad TILES.decorChance). */
export function shouldPlaceDecor(rand: () => number = Math.random): boolean {
  return shouldPlaceDecorChance(TILES.decorChance, rand);
}

/** ¿Decoración con probabilidad explícita? (mapas de la Etapa 6). */
export function shouldPlaceDecorChance(chance: number, rand: () => number = Math.random): boolean {
  return rand() < chance;
}

/** Tile de decoración para una celda (respeta los pesos de TILES.decor). */
export function pickDecorTile(rand: () => number = Math.random): number {
  return pickWeighted(TILES.decor, rand);
}

/** Decoración con tabla explícita (mapas de la Etapa 6). */
export function pickDecorFrom(decor: WeightedTile[], rand: () => number = Math.random): number {
  return pickWeighted(decor, rand);
}
