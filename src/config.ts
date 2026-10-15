// Tuning data-driven — Etapa 1. Todo el balance vive aquí, no hard-codeado
// en las escenas.

export interface PlayerConfig {
  speed: number;
  maxHp: number;
  radius: number;
  invulnSeconds: number;
}

export interface SpawnerConfig {
  spawnInterval: number;
  maxEnemies: number;
  margin: number; // offset hacia dentro desde el borde de cámara
}

export interface WorldConfig {
  width: number;
  height: number;
}

export const PLAYER: PlayerConfig = {
  speed: 220,
  maxHp: 100,
  radius: 14,
  invulnSeconds: 0.6,
};

export const SPAWNER: SpawnerConfig = {
  spawnInterval: 1.2,
  maxEnemies: 80,
  margin: 40,
};

export interface SpawnerRamp {
  /** Intervalo mínimo (s) al final de la rampa. */
  minInterval: number;
  /** Segundos para ir del inicio al máximo de presión. */
  rampSeconds: number;
  /** Tope de enemigos al inicio. */
  startMax: number;
  /** Tope de enemigos al final de la rampa. */
  endMax: number;
}

export const SPAWNER_RAMP: SpawnerRamp = {
  minInterval: 0.35,
  rampSeconds: 300,
  startMax: 80,
  endMax: 300,
};

export interface XpGemConfig {
  value: number;
  collectRadius: number;
  magnetMinSpeed: number;
}

export const XP_GEM: XpGemConfig = {
  value: 10,
  collectRadius: 22,
  magnetMinSpeed: 160,
};

export interface XpCurve {
  base: number;
  growth: number;
}

export const XP_CURVE: XpCurve = {
  base: 30,
  growth: 1.35,
};

export interface GemsConfig {
  maxActive: number;
}

export const GEMS: GemsConfig = {
  maxActive: 400,
};

export type UpgradeId = 'dmg' | 'rate' | 'speed' | 'hp' | 'magnet';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  desc: string;
}

/** Daño/cadencia como factores; vida y radio como valores absolutos. */
export interface RunStats {
  dmgMul: number;
  rateMul: number;
  speedMul: number;
  maxHp: number;
  pickupRadius: number;
}

export function baseRunStats(): RunStats {
  return { dmgMul: 1, rateMul: 1, speedMul: 1, maxHp: PLAYER.maxHp, pickupRadius: 90 };
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'dmg', name: 'Filo', desc: 'Daño +15 %' },
  { id: 'rate', name: 'Cadencia', desc: 'Dispara +12 % más rápido' },
  { id: 'speed', name: 'Botas', desc: 'Velocidad +8 %' },
  { id: 'hp', name: 'Corazón', desc: 'Vida máx. +20 (y cura 20)' },
  { id: 'magnet', name: 'Imán', desc: 'Radio de recogida +30 %' },
];

export const WORLD: WorldConfig = {
  width: 2000,
  height: 2000,
};

export const GAME = {
  width: 1280,
  height: 720,
} as const;

export interface SpriteConfig {
  key: string;
  /** Escala entera con filtro NEAREST para pixel-art nítido. */
  scale: number;
  /** Radio del cuerpo circular (equivale al balance de la Etapa 1). */
  bodyRadius: number;
}

export const SPRITES: { player: SpriteConfig; enemy: SpriteConfig } = {
  player: { key: 'player', scale: 3, bodyRadius: 14 },
  enemy: { key: 'e-slime', scale: 3, bodyRadius: 12 },
};

export interface WeightedTile {
  index: number;
  weight: number;
}

export interface TilesConfig {
  /** Tamaño de tile en px (el mapa es WORLD / size tiles por lado). */
  size: number;
  ground: WeightedTile[];
  decorChance: number;
  decor: WeightedTile[];
  wall: number;
}

export const TILES: TilesConfig = {
  size: 16,
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
};
