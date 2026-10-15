// Mapas — DATOS puros (mismo tileset, distintos índices y reglas).

import { WeightedTile } from '../config';

export interface MapMods {
  /** Multiplica el intervalo de spawn (< 1 = más presión). */
  spawnIntervalMul: number;
  /** Multiplica el HP enemigo. */
  enemyHpMul: number;
  /** Multiplica el XP de gemas. */
  xpMul: number;
}

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  ground: WeightedTile[];
  decorChance: number;
  decor: WeightedTile[];
  wall: number;
  mods: MapMods;
}

export const MAPS: MapDef[] = [
  {
    id: 'arena',
    name: 'Arena',
    desc: 'Campo abierto. Sin modificadores.',
    ground: [
      { index: 48, weight: 0.6 },
      { index: 49, weight: 0.1 },
      { index: 50, weight: 0.1 },
      { index: 51, weight: 0.1 },
      { index: 52, weight: 0.05 },
      { index: 53, weight: 0.05 },
    ],
    decorChance: 0.04,
    decor: [
      { index: 62, weight: 0.25 },
      { index: 73, weight: 0.3 },
      { index: 101, weight: 0.3 },
      { index: 124, weight: 0.15 },
    ],
    wall: 40,
    mods: { spawnIntervalMul: 1, enemyHpMul: 1, xpMul: 1 },
  },
  {
    id: 'mazmorra',
    name: 'Mazmorra',
    desc: 'Ladrillo oscuro. +15 % HP enemiga, +25 % XP, +15 % presión.',
    ground: [
      { index: 40, weight: 0.6 },
      { index: 57, weight: 0.15 },
      { index: 58, weight: 0.1 },
      { index: 59, weight: 0.15 },
    ],
    decorChance: 0.05,
    decor: [
      { index: 124, weight: 0.2 },
      { index: 101, weight: 0.25 },
      { index: 125, weight: 0.25 },
      { index: 126, weight: 0.1 },
      { index: 62, weight: 0.2 },
    ],
    wall: 28,
    mods: { spawnIntervalMul: 0.87, enemyHpMul: 1.15, xpMul: 1.25 },
  },
];

export function mapDef(id: string): MapDef {
  const def = MAPS.find((m) => m.id === id);
  if (!def) throw new Error(`Mapa desconocido: ${id}`);
  return def;
}
